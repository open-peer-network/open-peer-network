import { SocketConnection } from "../connection/socket";
import {
	isNotStringOrStringArray,
	double,
} from "../util/helpers";
import {
	keyFromPassword,
	storeKeys,
	publicKey,
} from "../util/crypto";
import isString from "lodash.isstring";


const backend = process.env.REACT_APP_HOST_DOMAIN;
const socket = new SocketConnection(`${backend}/socket`);

export class Node {
	socket = null;
	uuid = null;
	listeners = {};
	topics = {};

	constructor() {
		if (!socket) throw new Error("connection not initialized");
		this.socket = socket;
	}

	read(predicates, callback) {
		if (isNotStringOrStringArray(predicates))
			throw new Error("node.read() arg 1 type must be either String or Array<String>");
		if (typeof callback !== "function")
			throw new Error("node.read() arg 2 type must be Function");
		socket.read(
			double(this.uuid, [].concat(predicates)),
			callback,
		);
	}

	on(predicates, callback) {
		if (isNotStringOrStringArray(predicates))
			throw new Error("node.on() arg 1 type must be either String or Array<String>");
		if (typeof callback !== "function")
			throw new Error("node.on() arg 2 type must be Function");
		socket.on(predicates, callback);
	}

	off(predicates) {
		if (isNotStringOrStringArray(predicates))
			throw new Error("node.off() arg 1 type must be either String or Array<String>");
		socket.off(predicates);
	}

	clear() {
		socket.clear();
	}

	write(prop, value) {
		if (typeof prop !== "string" || typeof value !== "string")
			throw new Error("node.write() arg 1 and 2 must be of type String");

		socket.write(this.uuid, prop, value);
	}
}

class User extends Node {
	keychain = {};
	node = null;

	credentials(email, password) {
		if (!isString(email) || !isString(password))
			throw new Error("login received invalid input");
		if (password.length < 12)
			throw new Error("password length must be at least 12 characters or longer");
	}

	login(email, password) {
		if (publicKey()) throw new Error("user.login() called while already logged in");
		this.credentials(email, password);

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
		this.credentials(email, password);

		storeKeys(keyFromPassword(email + password));
		this.uuid = publicKey();
	}
}

export default new User();
