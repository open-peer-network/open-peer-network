import { Socket } from "phoenix";
import { publicKey } from "./crypto";


let socket;
export const connect = (url) => {
	socket = new Socket(url);

	// removes itself when a valid `connect` event is received
	const firstResponseHandler = ({ payload }) => {
		if (payload.public_key) {
			// Make trusted.
			socket.publicKey = payload.public_key;
			console.log("Received publicKey:", socket.publicKey);
			// Remove this listener.
			const idx = socket.stateChangeCallbacks.message.indexOf(firstResponseHandler);
			if (idx !== -1) {
				socket.stateChangeCallbacks.message.splice(idx, 1);
			}
		}
	};
	socket.onMessage(firstResponseHandler);

	socket.onOpen(() => {
		if (socket.noneChannel) return;
		socket.noneChannel = newChannel("none");
	});

	socket.onClose(() => {
		delete socket.publicKey;
	});

	socket.connect();

	return socket;
};

export const predicateAsTopic = (s, p) => `${s}:${p}`;

export function newChannel(topicString, successHandler, failureHandler) {
	if (!["function", "undefined"].includes(typeof successHandler)) {
		throw new Error("newChannel() received invalid success handler");
	}
	if (!["function", "undefined"].includes(typeof failureHandler)) {
		throw new Error("newChannel() received invalid failure handler");
	}
	if (!socket) {
		throw new Error("socket not initialized");
	}
	const channel = socket.channel(topicString, {
		public_key: publicKey(),
	});

	channel.join()
	.receive("ok", successHandler || function() {
		console.log(`success, joined topic '${topicString}'`);
	})
	.receive("error", failureHandler || function() {
		console.log(`failed to join topic '${topicString}'`);
	});

	return channel;
}

export const triple = (s, p, o) => ({ s, p, o });
export const double = (s, p) => ({ s, p });
export const single = (s) => ({ s });
