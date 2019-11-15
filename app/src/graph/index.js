import { Socket } from "phoenix";
import uuid from "uuid/v4";
import merge from "lodash.merge";
import values from "lodash.values";

const { isArray } = Array;
const backend = process.env.REACT_APP_HOST_DOMAIN;
const socket = new Socket(`${backend}/socket`, {});
socket.connect();

const isNotStringOrStringArray = (thing) => (
  typeof thing !== "string" && isArray(thing) && thing.some((p) => typeof p !== "string")
);

const makeTopic = (topicString) => {
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

const topicForPredicate = (uid, p) => `topic:${uid}:${p}`;

const noneChannel = makeTopic("topic:none");

class Node {
	socket = null;
	topics = {};
  listeners = {};
  uuid = null;

	constructor() {
    this.uuid = uuid();
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
      return new Error("node.off() arg 1 type must be either String or Array<String>");
    }
    [].concat(predicates).forEach((predicate) => {
      const topic = topicForPredicate(this.uuid, predicate);
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

	read(predicates, callback) {
    if (isNotStringOrStringArray(predicates)) {
      return new Error("node.read() arg 1 type must be either String or Array<String>");
    }
    if (typeof callback !== "function") {
      throw new Error("node.read() arg 2 type must be Function");
    }

    const payload = {
      s: this.uuid,
      p: [].concat(predicates),
    };
    const requestId = `read:${uuid()}`;

		noneChannel.on(requestId, (resp) => {
      callback(resp);
      noneChannel.off(requestId);
    });
		noneChannel.push(requestId, payload);
  }

  write(predicate, object) {
    if (typeof predicate !== "string" || typeof object !== "string") {
      throw new Error("node.write() arg 1 and 2 must be of type String");
    }
    this.useTopic(predicate).push("write", {
      s: this.uuid,
      p: predicate,
      o: object,
    });
  }

  useTopic(predicate) {
    if (typeof predicate !== "string") {
      throw new Error("node.useTopic() arg 1 must be of type String");
    }
    const topicString = topicForPredicate(this.uuid, predicate);

    if (this.topics[topicString]) {
      return this.topics[topicString];
    }

    const newTopic = makeTopic(topicString);
    this.topics[topicString] = newTopic;

    return newTopic;
  }
}

export default Node;
