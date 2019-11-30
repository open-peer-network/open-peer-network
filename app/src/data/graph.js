import connection from "./connect";
import localState from "./state";
import {
	err,
	errOut,
	triple,
	notStrings,
	validateCredentials,
	officialTopic,
	validTopic,
} from "./helpers";
import {
	keyFromPassword,
	storeKeys,
	getPublicKey,
} from "./crypto";


const backend = process.env.REACT_APP_HOST_DOMAIN;
connection.start(`${backend}/socket`);

export class Node {
	subject = false;
	listeners = [];
	fetchStack = [];
	watchStack = [];
	topicValues = {};

	constructor(subject) {
		this.subject = subject;
	}

	topic(predicate) {
		return this.subject ? officialTopic({ subject: this.subject, predicate }) : false;
	}

	_emptyFetchStack() {
		while (this.fetchStack.length) {
			const [pred, callback] = this.fetchStack.shift();
			this._fetch(this.topic(pred), callback);
		}
	}

	_emptyWatchStack() {
		while (this.watchStack.length) {
			const [pred, callback] = this.watchStack.shift();
			this._watch(this.topic(pred), callback);
		}
	}

	fetch(predicates, callback) {
		notStrings(predicates, "node.read() arg 1 type must be either String or Array<String>");
		errOut(typeof callback !== "function", "node.read() arg 2 type must be Function");

		if (!this.subject) {
			[].concat(predicates).forEach((pred) => {
				this.fetchStack.push([pred, callback]);
			});
		} else {
			[].concat(predicates).forEach((pred) => {
				this._fetch(this.topic(pred), callback);
			});
		}
	}

	_fetch(topic, callback) {
		errOut(!validTopic(topic), "node._fetch() received invalid topic");
		localState.fetch(topic, callback);
	}

	watch(predicates, callback) {
		notStrings(predicates, "node.on() arg 1 type must be either String or Array<String>");
		errOut(typeof callback !== "function", "node.on() arg 2 type must be Function");

		if (this.subject) {
			[].concat(predicates).forEach((predicate) => {
				localState.watch(this.topic(predicate), callback);
			});
		} else {
			[].concat(predicates).forEach((predicate) => {
				this.watchStack.push([predicate, callback]);
			});
		}
	}

	fetchAndWatch(predicates, callback) {
		if (this.subject) {
			this.fetch(predicates, callback);
			this.watch(predicates, callback);
		} else {
			[].concat(predicates).forEach((predicate) => {
				this.fetchStack.push([predicate, callback]);
				this.watchStack.push([predicate, callback]);
			});
		}
	}

	blobFetch(shape, callback) {
		//
	}

	blobFetchAndWatch(shape, callback) {
		//
	}

	off(predicates) {
		notStrings(predicates, "node.off() arg 1 type must be either String or Array<String>");
		connection.off(predicates);
	}

	clear() {
		connection.clear();
	}

	write(prop, value) {
		errOut(typeof prop !== "string" || typeof value !== "string",
			"node.write() arg 1 and 2 must be of type String");

		if (this.subject) {
			connection.write(this.topic(prop), triple(this.subject, prop, value));
		} else {
			err("node.write() called but no UUID found");
		}
	}
}


class User extends Node {
	node = null;
	keychain = {};
	readListeners = [];
	watchListeners = [];
	fetchAndWatchStack = [];

	login(email, password) {
		// if (getPublicKey()) throw new Error("user.login() called while already logged in");
		validateCredentials(email, password);

		storeKeys(keyFromPassword(email + password));
		this.subject = getPublicKey();
	}

	logout() {
		if (!getPublicKey()) throw new Error("user.logout() called while not logged in");

		storeKeys({});
		this.keychain = {};
		this.subject = null;
	}

	register(email, password) {
		if (getPublicKey()) throw new Error("user.register() called while already logged in");
		validateCredentials(email, password);

		storeKeys(keyFromPassword(email + password));
		this.subject = getPublicKey();
	}
}

export default new User();
