import { Socket, Presence } from "phoenix";
import SimplePeer from "simple-peer";
import isFunction from "lodash.isfunction";
import values from "lodash.values";
import keys from "lodash.keys";
import {
	toBase64,
	fromBase64,
} from "./encoding";
import {
	getPublicKey,
	generateKeyPair,
	storeKeys,
	ready,
} from "./crypto";
import {
	errOut,
	notStrings,
	validTopic,
	officialTopic,
} from "./helpers";
import {
	encrypt,
	decrypt,
} from "./crypto";

const { isArray } = Array;

class SocketConnection {
	connectedPeers = {};
	presenceState = {};
	socket = null;
	peerKey = null;
	listeners = {};
	topics = {};
	fetchStack = [];
	watchStack = [];
	presence = null;

	start(url) {
		const socket = this.socket = new Socket(url);

		// removes itself when a valid `connect` event is received
		const firstResponseHandler = ({ payload }) => {
			if (payload.public_key) {
				// Make trusted.
				this.peerKey = fromBase64(payload.public_key);

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
		socket.onOpen(() => ready(() => {
			let pubKey = getPublicKey();
			if (!pubKey) {
				storeKeys(generateKeyPair());
				pubKey = getPublicKey();
			}
			socket.noneChannel = this._newChannel(officialTopic("none"));
			socket.soloChannel = this._newChannel(officialTopic({ publicKey: toBase64(getPublicKey()) }));
			socket.soloChannel.on("message", (msg) => {
				console.log("message", msg);
			});
			socket.soloChannel.on("webrtc_offer", ({ payload, sender }) => {
				this.connectedPeers[sender] = p2pConnect(payload, (answer) => {
					socket.soloChannel.push("forward", {
						message: "webrtc_answer",
						payload: answer,
						recipients: [sender],
						sender: toBase64(getPublicKey()),
					});
				});
			});
			socket.soloChannel.on("webrtc_answer", ({ payload, sender }) => {
				this.connectedPeers[sender].signal(payload);
			})
		}));
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

	decrypt(ciphertext) {
		if (!this.peerKey) throw new Error("decrypt() called but peerKey unavailable.");
		if (ciphertext && ciphertext.length) {
			try {
				return decrypt(ciphertext, this.peerKey);
			} catch (err) {
				console.error("error decrypting response:", ciphertext);
			}
		} else {
			console.error("decrypt received invalid ciphertext:", ciphertext);
		}
		return null;
	}

	fetch(topic, callback) {
		errOut(!validTopic(topic), "connection.fetch() received invalid topic");
		errOut(typeof callback !== "function", "connection.fetch() arg 2 must be type Function");

		// If there's no public key for this connection, push to a queue to run later.
		if (!this.peerKey) {
			this.fetchStack.push([topic, callback]);
			return;
		}

		this._emptyFetchStack();
		return this._fetch(topic, callback);
	}

	_fetch(topic, callback) {
		errOut(!validTopic(topic), "connection._fetch() received invalid topic");
		this.useTopic(topic).then((channel) => {
			const ref = channel.on("fetch response", (response) => {
				if (response && response.ct && response.ct.length) {
					const [_, subject, predicate] = channel.topic.match(/^sp:([^:]+):([^:]+)/);
					callback({
						subject,
						predicate,
						object: this.decrypt(response.ct),
					});
				} else {
					console.error("received invalid payload for 'fetch response':", response);
				}
				channel.off("fetch response", ref);
			});
			channel.push("fetch");
		});
	}

	watch(topic, callback) {
		errOut(!validTopic(topic), "connection.watch() received invalid topic");
		errOut(!isFunction(callback), "connection.on() arg 2 type must be Function");

		// If there's no public key for this connection, push to a queue to run later.
		if (!this.peerKey) {
			this.watchStack.push([topic, callback]);
		} else {
			this._watch(topic, callback);
		}
	}

	_watch(topic, callback) {
		errOut(!validTopic(topic), "connection._watch() received invalid topic");
		this.useTopic(topic).then((chan) => chan.on("value", callback));
		this.listeners[topic.value] = callback;
	}

	off(sub, predicates) {
		errOut(notStrings(predicates), "connection.off() arg 1 type must be either String or Array<String>");

		(isArray(predicates) ? predicates : [predicates]).forEach((pre) => {
			const topic = officialTopic({ subject: sub, predicate: pre });
			this.listeners[topic.value].off("value");
			delete this.listeners[topic.value];
		});
	}

	clear() {
		values(this.listeners).forEach((chan) => {
			chan.off("value");
		});
		this.listeners = {};
	}

	write(topic, value) {
		errOut(!validTopic(topic), "connection.write() received invalid topic");
		if (!this.socket || !this.peerKey) {
			console.log(this.socket);
			console.error("Connection has closed");
			return;
		}
		this.useTopic(topic).then((chan) => {
			chan.push("write", { ct: this.encrypt(value) });
		});
	}

	useTopic(topic) {
		errOut(!validTopic(topic), "connection.useTopic() received invalid topic");

		if (this.topics[topic.value]) {
			return new Promise((res) => res(this.topics[topic.value]));
		}

		return new Promise((res, rej) => {
			this.topics[topic.value] = this._newChannel(topic, res, rej);
		});
	}

	/**
	 *
	 * @param {import('./helpers').officialTopic} topic
	 * @param {Function} successHandler
	 * @param {Function} failureHandler
	 */
	_newChannel(topic, successHandler, failureHandler) {
		errOut(!validTopic(topic), "newChannel() received invalid topic");
		errOut(!["function", "undefined"].includes(typeof successHandler), "newChannel() received invalid success handler");
		errOut(!["function", "undefined"].includes(typeof failureHandler), "newChannel() received invalid failure handler");
		errOut(!this.socket, "socket not initialized");

		const public_key = toBase64(getPublicKey());

		let channel;
		if (/^solo:/.test(topic.value)) {
			channel = this.socket.channel(topic.value);
		} else {
			channel = this.socket.channel(topic.value, { public_key });
		}
		if (/^sp:/.test(topic.value)) {
			this.usePresence(channel);
		}

		channel.join()
			.receive("ok", () => {
				console.log(`success, joined topic '${topic.value}'`);
				isFunction(successHandler) && successHandler(channel);
			})
			.receive("error", () => {
				console.log(`failed to join topic '${topic.value}'`);
				isFunction(failureHandler) && failureHandler(channel);
			});

		return channel;
	}

	usePresence(channel) {
		new Presence(channel);
		const ourKey = toBase64(getPublicKey());

		channel.on("presence_state", (state) => {
			const newState = Presence.syncState(this.presenceState, state);
			const updatedPeers = keys(newState);
			const knownPeers = keys(this.presenceState);
			const newPeers = updatedPeers.filter((peerKey) => {
				return peerKey !== ourKey && !knownPeers.includes(peerKey);
			});
			this.presenceState = newState;

			if (newPeers.length < 1) return;

			newPeers.forEach((key) => this.startP2P(key));
		});
	}

	startP2P(peerKey) {
		this.connectedPeers[peerKey] = p2pConnect((offer) => {
			this.socket.soloChannel.push("forward", {
				message: "webrtc_offer",
				payload: offer,
				recipients: [peerKey],
				sender: toBase64(getPublicKey()),
			});
		});
	}
}

function p2pConnect(arg1, arg2) {
	const [offer, callback, initiator] = isFunction(arg1)
		? [null, arg1, true]
		: [arg1, arg2, false];

	const webrtc = new SimplePeer({ initiator, trickle: false });
	webrtc.on("error", (err) => {
		console.log("error", err);
	});

	// When other peers connect after accepting our offer
	webrtc.on("connect", () => {
		console.log("peer connected!");
		webrtc.send("Hello peer");
	});

	// When other peers send us data
	webrtc.on("data", (data) => {
		console.log("data:", data);
	});

	if (offer) {
		webrtc.signal(offer);
	}
	webrtc.on("signal", (packet) => {
		console.log("WebRTC packet:", packet);
		callback(packet);
	});

	return webrtc;
}

export default new SocketConnection();
