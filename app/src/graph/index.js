import getUUID from "uuid/v4";
import merge from "lodash.merge";
import values from "lodash.values";
import {
  start,
  isNotStringOrStringArray,
  makeTopic,
  predicateAsTopic,
  SPO,
  encrypt,
} from "../util";

const { isArray } = Array;
const socket = start();


const read = (predicates, uuid, callback) => {
  if (isNotStringOrStringArray(predicates)) {
    throw new Error("node.read() arg 1 type must be either String or Array<String>");
  }
  if (typeof callback !== "function") {
    throw new Error("node.read() arg 2 type must be Function");
  }

  const payload = {
    s: uuid,
    p: [].concat(predicates),
  };
  const requestId = `read:${getUUID()}`;

  socket.noneChannel.on(requestId, (resp) => {
    callback(resp);
    socket.noneChannel.off(requestId);
  });
  socket.noneChannel.push(requestId, payload);
};

export class Node {
	socket = null;
  uuid = null;
  listeners = {};
	topics = {};

	constructor(namespace) {
    if (!socket) {
      throw new Error("connection not initialized");
    }
    if (typeof namespace !== "string") {
      throw new Error("Node() requires a namespace String");
    }
    this.socket = socket;
    this.uuid = namespace;
  }

  read(predicates, callback) {
    read(predicates, this.uuid, callback);
  }

  lock() {}

  unlock() {}

	on(predicates, callback) {
    if (isNotStringOrStringArray(predicates)) {
      throw new Error("node.on() arg 1 type must be either String or Array<String>");
    }
    if (typeof callback !== "function") {
      throw new Error("node.on() arg 2 type must be Function");
    }

		const preds = isArray(predicates) ? predicates : [predicates];
    const topics = preds.map((pred) => this.useTopic(pred));

    topics.forEach((oneTopic) => {
      oneTopic.on("value", callback);
    });

    merge(this.listeners, topics);
  }

  off(predicates) {
    if (isNotStringOrStringArray(predicates)) {
      throw new Error("node.off() arg 1 type must be either String or Array<String>");
    }
    (isArray(predicates) ? predicates : [predicates]).forEach((predicate) => {
      const topic = predicateAsTopic(this.uuid, predicate);
      this.listeners[topic].off("value");
      delete this.listeners[topic];
    });
  }

  clear() {
    values(this.listeners).forEach((chan) => {
      chan.off("value");
    });
    this.listeners = {};
  }

  write(predicate, object) {
    if (typeof predicate !== "string" || typeof object !== "string") {
      throw new Error("node.write() arg 1 and 2 must be of type String");
    }
    if (!this.socket || !this.socket.peerKey) {
      console.log(this.socket);
      console.error("Connection has closed");
      return;
    }
    const packet = encrypt(
      JSON.stringify(SPO(this.uuid, predicate, object))
    );
    this.useTopic(predicate).push("write", packet);
  }

  useTopic(predicate) {
    if (typeof predicate !== "string") {
      throw new Error("node.useTopic() arg 1 must be of type String");
    }
    const topicString = predicateAsTopic(this.uuid, predicate);

    if (this.topics[topicString]) {
      return this.topics[topicString];
    }

    const newTopic = makeTopic(topicString, this.socket);
    this.topics[topicString] = newTopic;

    return newTopic;
  }
}

// const fetch = (msg, params, callback) => {
//   if (typeof msg !== "string") {
//     throw new Error(`fetch() arg 1 must be type String, received type '${typeof msg}'`);
//   }
//   doSwitch(msg, {
//     vault: () => {
//       const requestId = `vault:${getUUID()}`;

//       socket.noneChannel.on(requestId, (resp) => {
//         callback(resp);
//         socket.noneChannel.off(requestId);
//       });
//       socket.noneChannel.push(requestId, params);
//     }
//   });
// };

// export class Vault {
//   authStatus = false;

//   on(name, callback) {
//     //
//   }

//   login(name, password) {
//     return new Promise((res, rej) => {
//       /*
//       NOT A REAL IMPLEMENTATION
//       */
//       fetch("vault", {
//         s: SHA(name),
//         p: ["password"],
//         password: SHA(password),
//       }, (data) => {
//         if (data.status === "success") res(data);
//         else rej(data);
//       });
//     });
//   }
// }
