import { Socket } from "phoenix";
import getUUID from "uuid/v4";
import merge from "lodash.merge";
import values from "lodash.values";
import {
  spo,
  sha,
  doSwitch,
  predicateAsTopic,
  isNotStringOrStringArray,
} from "../util";

const { isArray } = Array;
const backend = process.env.REACT_APP_HOST_DOMAIN;
const socket = new Socket(`${backend}/socket`, {});
socket.connect();

const noneChannel = makeTopic("topic:none");

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

  noneChannel.on(requestId, (resp) => {
    callback(resp);
    noneChannel.off(requestId);
  });
  noneChannel.push(requestId, payload);
};

const fetch = (msg, params, callback) => {
  if (typeof msg !== "string") {
    throw new Error(`fetch() arg 1 must be type String, received type '${typeof msg}'`);
  }
  doSwitch(msg, {
    vault: () => {
      const requestId = `vault:${getUUID()}`;

      noneChannel.on(requestId, (resp) => {
        callback(resp);
        noneChannel.off(requestId);
      });
      noneChannel.push(requestId, params);
    }
  });
};

export class Node {
	socket = null;
  uuid = null;
  listeners = {};
	topics = {};

	constructor(namespace) {
    if (typeof namespace !== "string") {
      throw new Error("Node() requires a namespace String");
    }
    this.uuid = namespace;
  }

  read(predicates, callback) {
    read(predicates, this.uuid, callback);
  }

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
    this.useTopic(predicate).push("write", spo(this.uuid, predicate, object));
  }

  useTopic(predicate) {
    if (typeof predicate !== "string") {
      throw new Error("node.useTopic() arg 1 must be of type String");
    }
    const topicString = predicateAsTopic(this.uuid, predicate);

    if (this.topics[topicString]) {
      return this.topics[topicString];
    }

    const newTopic = makeTopic(topicString);
    this.topics[topicString] = newTopic;

    return newTopic;
  }
}

export class Vault {
  authStatus = false;

  on(name, callback) {
    //
  }

  login(name, password) {
    return new Promise((res, rej) => {
      /*
      NOT A REAL IMPLEMENTATION
      */
      fetch("vault", {
        s: sha(name),
        p: ["password"],
        password: sha(password),
      }, (data) => {
        if (data.status === "success") res(data);
        else rej(data);
      });
    });
  }
}

function makeTopic(topicString) {
  if (!socket) {
    throw new Error("socket not initialized, call graph.start() first");
  }
  console.log(`New topic: ${topicString}`);
  const channel = socket.channel(topicString, {});
  channel.join()
    .receive("ok", () => console.log(`success, joined topic '${topicString}'`))
    .receive("error", () => console.log(`failed to join topic '${topicString}'`));

  return channel;
}
