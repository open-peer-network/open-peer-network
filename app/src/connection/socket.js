import { Socket } from "phoenix";
import getUUID from "uuid/v4";
import merge from "lodash.merge";
import values from "lodash.values";
import {
    publicKey,
} from "../util/crypto";
import {
    isNotStringOrStringArray,
    triple,
} from "../util/helpers";
import {
    encrypt,
    decrypt,
} from "../util/crypto";

const { isArray } = Array;
const predicateAsTopic = (s, p) => `${s}:${p}`;

export class SocketConnection {
    socket = null;
    uuid = null;
    listeners = {};
    topics = {};

    constructor(url) {
        const socket = new Socket(url);
        this.socket = socket;

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
            socket.noneChannel = this.newChannel("none");
        });

        socket.onClose(() => {
            delete socket.publicKey;
        });

        socket.connect();
    }

    encrypt(string) {
        return encrypt(string, this.socket.publicKey);
    }

    decrypt(responce) {
        return decrypt(responce.box, responce.nonce, this.socket.publicKey);
    }

    read(queryObject, callback) {
        if (typeof queryObject.s !== "string" || isNotStringOrStringArray(queryObject.p)) {
            throw new Error("connection.read() received invalid query");
        }
        if (typeof callback !== "function") {
            throw new Error("connection.read() arg 2 type must be Function");
        }

        const requestId = `read:${getUUID()}`;

        this.socket.noneChannel.on(requestId, (resp) => {
            if (!resp.box || !resp.nonce) {
                return console.error("Invalid response:", resp);
            }

            const { data, subject } = this.decrypt(resp);
            callback(data, subject);
            this.socket.noneChannel.off(requestId);
        });

        this.socket.noneChannel.push(requestId, this.encrypt(queryObject));
    }

    on(predicates, callback) {
        if (isNotStringOrStringArray(predicates)) {
            throw new Error("connection.on() arg 1 type must be either String or Array<String>");
        }
        if (typeof callback !== "function") {
            throw new Error("connection.on() arg 2 type must be Function");
        }

        const preds = isArray(predicates) ? predicates : [predicates];
        const topics = preds.map((pred) => this.useTopic(pred));

        topics.forEach((oneTopic) => {
            oneTopic.on("value", callback);
        });

        merge(this.listeners, topics);
    }

    off(sub, predicates) {
        if (isNotStringOrStringArray(predicates)) {
            throw new Error("connection.off() arg 1 type must be either String or Array<String>");
        }
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

    write(sub, pre, obj) {
        if (!this.socket || !this.socket.publicKey) {
            console.log(this.socket);
            console.error("Connection has closed");
            return;
        }
        this.useTopic(pre).push(
            "write",
            this.encrypt(triple(sub, pre, obj)),
        );
    }

    useTopic(pre) {
        if (typeof pre !== "string") {
            throw new Error("connection.useTopic() arg 1 must be of type String");
        }
        const topicString = predicateAsTopic(this.uuid, pre);

        if (this.topics[topicString]) {
            return this.topics[topicString];
        }

        const newTopic = this.newChannel(topicString);
        this.topics[topicString] = newTopic;

        return newTopic;
    }

    newChannel(topicString, successHandler, failureHandler) {
        if (!["function", "undefined"].includes(typeof successHandler)) {
            throw new Error("newChannel() received invalid success handler");
        }
        if (!["function", "undefined"].includes(typeof failureHandler)) {
            throw new Error("newChannel() received invalid failure handler");
        }
        if (!this.socket) {
            throw new Error("socket not initialized");
        }
        const channel = this.socket.channel(topicString, {
            public_key: publicKey(),
        });

        channel.join()
            .receive("ok", successHandler || function () {
                console.log(`success, joined topic '${topicString}'`);
            })
            .receive("error", failureHandler || function () {
                console.log(`failed to join topic '${topicString}'`);
            });

        return channel;
    }
}
