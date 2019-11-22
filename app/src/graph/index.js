import getUUID from "uuid/v4";
import merge from "lodash.merge";
import values from "lodash.values";
import {
	isNotStringOrStringArray,
	triple,
	double,
} from "../util/helpers";
import {
	connect,
	predicateAsTopic,
	newChannel,
} from "../util";
import {
	encrypt,
	decrypt,
} from "../util/crypto";


const { isArray } = Array;

const backend = process.env.REACT_APP_HOST_DOMAIN;
const socket = connect(`${backend}/socket`);

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
		if (isNotStringOrStringArray(predicates)) {
			throw new Error("node.read() arg 1 type must be either String or Array<String>");
		}
		if (typeof callback !== "function") {
			throw new Error("node.read() arg 2 type must be Function");
		}

		const requestId = `read:${getUUID()}`;

		socket.noneChannel.on(requestId, (resp) => {
			if (!resp.box || !resp.nonce) {
				return console.error("Invalid response:", resp);
			}

			const { data, subject } = decrypt(resp.box, resp.nonce, socket.publicKey);
			callback(data, subject);
			socket.noneChannel.off(requestId);
		});

		const packet = encrypt(double(this.uuid, [].concat(predicates)), socket.publicKey);
		socket.noneChannel.push(requestId, packet);
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
		if (!this.socket || !this.socket.publicKey) {
			console.log(this.socket);
			console.error("Connection has closed");
			return;
		}

		const packet = triple(this.uuid, predicate, object);
		this.useTopic(predicate).push("write", encrypt(packet, this.socket.publicKey));
	}

	useTopic(predicate) {
		if (typeof predicate !== "string") {
			throw new Error("node.useTopic() arg 1 must be of type String");
		}
		const topicString = predicateAsTopic(this.uuid, predicate);

		if (this.topics[topicString]) {
			return this.topics[topicString];
		}

		const newTopic = newChannel(topicString);
		this.topics[topicString] = newTopic;

		return newTopic;
	}
}
