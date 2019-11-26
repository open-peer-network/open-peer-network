import connection from "./connect";
import localState from "./state";
import {
	err,
	errOut,
	triple,
	notStrings,
	validateCredentials,
} from "./helpers";
import {
	keyFromPassword,
	storeKeys,
	publicKey,
} from "./crypto";


const backend = process.env.REACT_APP_HOST_DOMAIN;
connection.start(`${backend}/socket`);

export class Node {
	uuid = false;
	listeners = [];
	fetchStack = [];
	watchStack = [];
	topicValues = {};

	topic(predicate) {
		return this.uuid ? `${this.uuid}:${predicate}` : false;
	}

	_emptyFetchStack() {
		while (this.fetchStack.length) {
			this._fetch.apply(this, this.fetchStack.shift());
		}
	}

	_emptyWatchStack() {
		while (this.watchStack.length) {
			this._watch.apply(this, this.watchStack.shift());
		}
	}

	fetch(predicates, callback) {
		notStrings(predicates, "node.read() arg 1 type must be either String or Array<String>");
		errOut(typeof callback !== "function", "node.read() arg 2 type must be Function");

		if (!this.uuid) {
			[].concat(predicates).forEach((pred) => {
				this.fetchStack.push([pred, callback]);
			});
		} else {
			[].concat(predicates).forEach((pred) => {
				this._fetch(pred, callback);
			});
		}
	}

	_fetch(predicate, callback) {
		localState.fetch(this.topic(predicate), callback);
	}

	watch(predicates, callback) {
		notStrings(predicates, "node.on() arg 1 type must be either String or Array<String>");
		errOut(typeof callback !== "function", "node.on() arg 2 type must be Function");

		if (this.uuid) {
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
		if (this.uuid) {
			[].concat(predicates).forEach((predicate) => {
				this.fetch(predicate, callback);
				this.watch(predicate, callback);
			});
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

		if (this.uuid) {
			connection.write(this.topic(prop), triple(this.uuid, prop, value));
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
		// if (publicKey()) throw new Error("user.login() called while already logged in");
		validateCredentials(email, password);

		storeKeys(keyFromPassword(email + password));
		this.uuid = publicKey();
	}

	logout() {
		if (!publicKey()) throw new Error("user.logout() called while not logged in");

		storeKeys({});
		this.keychain = {};
		this.uuid = null;
	}

	register(email, password) {
		if (publicKey()) throw new Error("user.register() called while already logged in");
		validateCredentials(email, password);

		storeKeys(keyFromPassword(email + password));
		this.uuid = publicKey();
	}
}

export default new User();
