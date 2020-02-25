import connection from "./connect";
import {
	err,
	errOut,
	notStrings,
	validateCredentials,
	officialTopic,
	validTopic,
} from "./helpers";
import {
	keyFromPassword,
	KeyContainer,
} from "./crypto";

export class PublicNode {
	subject = false;
	listeners = [];
	topicValues = {};

	constructor(subject) {
		this.subject = subject;
	}

	topic(predicate) {
		return this.subject ? officialTopic({ subject: this.subject, predicate }) : false;
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
		connection.fetch(topic, callback);
	}

	watch(predicates, callback) {
		notStrings(predicates, ".watch() arg 1 type must be either String or Array<String>");
		errOut(typeof callback !== "function", ".watch() arg 2 type must be Function");

		if (this.subject) {
			[].concat(predicates).forEach((pred) => {
				connection.watch(this.topic(pred), callback);
			});
		}
	}

	fetchAndWatch(predicates, callback) {
		notStrings(predicates, ".fetchAndWatch() arg 1 type must be either String or Array<String>");
		errOut(typeof callback !== "function", ".fetchAndWatch() arg 2 type must be Function");

		if (this.subject) {
			this.fetch(predicates, callback);
			this.watch(predicates, callback);
		}
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
			connection.write(this.topic(prop), value);
		} else {
			err("node.write() called but no UUID found");
		}
	}
}


export class PrivateNode extends PublicNode {
	keys = new KeyContainer();
	
	constructor(email, passphrase) {
		super(undefined);
		this.setSecret(email, passphrase);
	}

	setSecret(email, password) {
		if (this.keys.getPublicKey(true) === undefined) err("user.login() called while already logged in");
		validateCredentials(email, password);

		this.keys.set(keyFromPassword(email + password));
		this.subject = this.keys.getPublicKey(true);
	}

	encrypt(plaintext) {
		return this.keys.encryptPrivate(plaintext);
	}

	decrypt(ciphertext) {
		return this.keys.decryptPrivate(ciphertext);
	}

	write(predicate, plaintextObject) {
		PublicNode.prototype.write.call(this, predicate, this.encrypt(plaintextObject));
	}
}
