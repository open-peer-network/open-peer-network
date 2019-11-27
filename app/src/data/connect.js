import { Socket, Presence } from "phoenix";
import SimplePeer from "simple-peer";
// import getUUID from "uuid/v4";
import values from "lodash.values";
import isString from "lodash.isstring";
import {
	publicKey,
} from "./crypto";
import {
	err,
	errOut,
	notStrings,
} from "./helpers";
import {
	encrypt,
	decrypt,
} from "./crypto";

const { isArray } = Array;
const predicateAsTopic = (s, p) => `${s}:${p}`;


class SocketConnection {
	socket = null;
	peerKey = null;
	listeners = {};
	topics = {};
	fetchStack = [];
	watchStack = [];
	presences = {};

	start(url) {
		const socket = this.socket = new Socket(url);

		// removes itself when a valid `connect` event is received
		const firstResponseHandler = ({ payload }) => {
			if (payload.public_key) {
				// Make trusted.
				this.peerKey = payload.public_key;
				console.log("Received public key for peer:", this.peerKey);
				// Remove this listener.
				const idx = socket.stateChangeCallbacks.message.indexOf(firstResponseHandler);
				if (idx !== -1) {
					socket.stateChangeCallbacks.message.splice(idx, 1);
				}

				this._emptyWatchStack();
				this._emptyFetchStack();
			}
		};
		socket.onMessage(firstResponseHandler);
		socket.onOpen(() => {
			socket.noneChannel = this.newChannel("none");
		});
		socket.onClose(() => delete this.peerKey);
		socket.connect();
	}

	_emptyWatchStack() {
		while (this.watchStack.length) {
			this._watch.apply(this, this.watchStack.shift());
		}
	}

	_emptyFetchStack() {
		while (this.fetchStack.length) {
			this._fetch.apply(this, this.fetchStack.shift());
		}
	}

	encrypt(string) {
		if (!this.peerKey) throw new Error("encrypt() called but peerKey unavailable.");
		return encrypt(string, this.peerKey);
	}

	decrypt(responce) {
		if (!this.peerKey) throw new Error("decrypt() called but peerKey unavailable.");
		return decrypt(responce.box, responce.nonce, this.peerKey);
	}

	fetch(topicString, callback) {
		if (typeof topicString !== "string") {
			console.log("topic:", topicString);
			console.error("connection.fetch() received topic");
		}
		errOut(typeof callback !== "function", "connection.fetch() arg 2 must be type Function");

		// If there's no public key for this connection, push to a queue to run later.
		if (!this.peerKey) {
			this.fetchStack.push([topicString, callback]);
			return;
		}

		while (this.fetchStack.length) {
			this._fetch.apply(this, this.fetchStack.shift());
		}
		return this._fetch(topicString, callback);
	}

	_fetch(topicString, callback) {
		this.useTopic(topicString).then((channel) => {
			const ref = channel.on("fetch response", (data) => {
				callback(this.decrypt(data));
				channel.off("fetch response", ref);
			});
			channel.push("fetch");
		});
	}

	watch(topicString, callback) {
		if (!isString(topicString)) err("connection.watch() received invalid topic string");
		errOut(typeof callback !== "function", "connection.on() arg 2 type must be Function");

		// If there's no public key for this connection, push to a queue to run later.
		if (!this.peerKey) {
			this.watchStack.push([topicString, callback]);
		} else {
			this._watch(topicString, callback);
		}
	}

	_watch(topicString, callback) {
		this.useTopic(topicString).then((chan) => chan.on("value", callback));
		this.listeners[topicString] = callback;
	}

	off(sub, predicates) {
		errOut(notStrings(predicates), "connection.off() arg 1 type must be either String or Array<String>");

		(isArray(predicates) ? predicates : [predicates]).forEach((pre) => {
			const topicString = predicateAsTopic(sub, pre);
			this.listeners[topicString].off("value");
			delete this.listeners[topicString];
		});
	}

	clear() {
		values(this.listeners).forEach((chan) => {
			chan.off("value");
		});
		this.listeners = {};
	}

	write(topic, value) {
		if (!this.socket || !this.peerKey) {
			console.log(this.socket);
			console.error("Connection has closed");
			return;
		}
		this.useTopic(topic).then((chan) => chan.push("write", this.encrypt(value)));
	}

	useTopic(topicString) {
		errOut(typeof topicString !== "string", "connection.useTopic() arg 1 must be of type String");
		if (!topicString.match(/^[^:]+:[^:]+$/)) {
			err(`connection.useTopic() received invalid topic string: ${topicString}`);
		}

		if (this.topics[topicString]) {
			return new Promise((res) => res(this.topics[topicString]));
		}

		return new Promise((res, rej) => {
			this.topics[topicString] = this.newChannel(topicString, res, rej);
		});
	}

	newChannel(topicString, successHandler, failureHandler) {
		errOut(!["function", "undefined"].includes(typeof successHandler), "newChannel() received invalid success handler");
		errOut(!["function", "undefined"].includes(typeof failureHandler), "newChannel() received invalid failure handler");
		errOut(!this.socket, "socket not initialized");

		const channel = this.socket.channel(topicString, {
			public_key: publicKey(),
		});

		const presence = new Presence(channel);
		presence.onSync(() => p2pConnect(presence.state, null, channel));

		// channel.on("presence_state", (state) => {
		// 	this.presences = Presence.syncState(this.presences, state);
		// 	// p2pConnect(this.presences, null, channel);
		// });

		// channel.on("presence_diff", (diff) => {
		// 	this.presences = Presence.syncDiff(this.presences, diff);
		// 	// p2pConnect(this.presences, null, channel);
		// });

		channel.join()
			.receive("ok", successHandler ? () => successHandler(channel) : () => {
				console.log(`success, joined topic '${topicString}'`);
			})
			.receive("error", failureHandler ? () => failureHandler(channel) : () => {
				console.log(`failed to join topic '${topicString}'`);
			});

		return channel;
	}
}

function p2pConnect(peerState, offer, _channel) {
	// const peersList = values(peers);
	// const initiator = peersList[0] === publicKey();

	return console.log("peer state", peerState);

	const initiator = false;
	const conn = new SimplePeer({
		initiator,
		trickle: false,
	});

	conn.on("error", (err) => console.log("error", err));

	if (initiator) {

		console.log("MAKE AN OFFER");
		// If `initiator = true`, this will fire, giving us the offer,
		// so we invoke the callback which sends the offer to the server.
		// peersList.slice(1).forEach((peerId) => {
		// 	conn.on("signal", (initialOffer) => channel.push(`offer:${peerId}`, initialOffer));
		// });
	} else if (offer) {
		// Fires when `initiator = false`, offer will come to use from
		// the server, so we can pass it to conn.signal().
		console.log("GOT OFFER:", offer);
		// conn.signal(JSON.parse(offer));
	}

	// conn.on("connect", () => {
	// 	console.log("peer connected!");
	// 	conn.send("Hello peer");
	// });

	// conn.on("data", (data) => {
	// 	console.log("data: ", data);
	// });
}

export default new SocketConnection();
