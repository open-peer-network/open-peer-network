import { Socket } from "phoenix";
import uuid from "uuid/v1";
import pick from "lodash.pick";

const { isArray } = Array;
const backend = process.env.REACT_APP_HOST_DOMAIN;
const uid = process.env.REACT_APP_TEST_UUID;

const topicFromPredicate = (p) => (
  (!p || p === 'none') ? 'topic:none' : `topic:${uid}:${p}`
);

class API {
  mainChannel = null;
	channels = {};
	socket = null;
	listeners = {};

	constructor() {
    if (!uid) {
      throw new Error('uuid not valid');
    }
    this.socket = new Socket(`${backend}/socket`, {});

    const mainChan = topicFromPredicate();
    this._newTopic(mainChan);
    this.mainChannel = this.channels[mainChan];
  }

  start() {
    this.socket.connect();
    this.topics();
  }

  _newTopic(topicString) {
    console.log(`New topic: ${topicString}`);
    const channel = this.socket.channel(topicString, {});
    channel.join()
      .receive("ok", () => console.log(`success, joined topic '${topicString}'`))
      .receive("error", () => console.log(`failed to join topic '${topicString}`));

    this.channels[topicString] = channel;
  }

	on(predicates, callback) {
    if (typeof predicates !== "string" && !isArray(predicates)) {
      throw new Error("graph.on() arg 1 must be either string or string[]");
    }
    if (typeof callback !== "function") {
      throw new Error("graph.on() callback must be a function");
    }

		const preds = isArray(predicates) ? predicates : [predicates];

    const channels = this.topics(...preds);

    Object.values(channels).forEach((chan) => {
      chan.on("value", callback);
    });

    Object.assign(this.listeners, channels);
  }

  off(predicates) {
    if (!isArray(predicates)) {
      return new Error("graph.off() takes only string[]");
    }
    predicates.forEach((pred) => {
      const topic = topicFromPredicate(pred);
      this.listeners[topic].off("value");
      delete this.listeners[topic];
    });
  }

  clear() {
    Object.values(this.listeners).forEach((chan) => {
      chan.off("value");
    });
    this.listeners = {};
  }

	read(predicates, callback) {
    if (typeof callback !== "function") {
      throw new Error("graph.on() callback must be a function");
    }

    const payload = {
      s: uid,
      p: [].concat(predicates),
    };
    const requestId = `read:${uuid()}`;

		this.mainChannel.on(requestId, (resp) => {
      callback(resp);
      this.mainChannel.off(requestId);
    });
		this.mainChannel.push(requestId, payload);
  }

  write(pred, obj) {
    if (typeof pred !== "string" || typeof obj !== "string") {
      throw new Error("graph.write() takes two strings");
    }
    this.topic(pred).push("write", {
      s: uid,
      p: pred,
      o: obj,
    });
  }

  topic(predicate) {
    if (typeof predicate !== "string") {
      throw new Error("graph.topic() takes only a string");
    }
    const topic = topicFromPredicate(predicate);

    if (this.channels[topic]) {
      return this.channels[topic];
    }
    return this.topics(predicate)[topic];
  }

	topics(...predicates) {
    // Loop over provided topics, initialize any that are new.
		predicates.forEach((predicate) => {
      const topic = topicFromPredicate(predicate);

      // If it exists then skip it
      if (this.channels[topic]) return;

      this._newTopic(topic);
		});

		if (predicates.length < 1) {
			return this.mainChannel;
    }
    return pick(this.channels, predicates.map(topicFromPredicate));
	};
};

const api = new API();

export default api;
