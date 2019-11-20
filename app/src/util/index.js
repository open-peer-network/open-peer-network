import { Socket } from "phoenix";
import shajs from "sha.js";
import nacl from "tweetnacl";
import util from "tweetnacl-util";


const { isArray } = Array;
let SESSION_KEYS = null;
let socket;

export const start = () => {
    socket = new Socket(`${backend}/socket`);

    // removes itself when a valid `connect` event is received
    const firstResponseHandler = ({ payload }) => {
        if (payload.public_key) {
            // Make trusted.
            socket.peerKey = payload.public_key;
            console.log("Received publicKey:", socket.peerKey);
            // Remove this listener.
            const idx = socket.stateChangeCallbacks.message.indexOf(firstResponseHandler);
            socket.stateChangeCallbacks.message.splice(idx, 1);
        }
    };
    socket.onMessage(firstResponseHandler);

    socket.onOpen(() => {
        const public_key = myPublicKey();
        socket.noneChannel = socket.channel("none", { public_key });
        socket.noneChannel.join();
    });

    socket.onClose(() => {
        delete socket.publicKey;
    });

    socket.connect();

    return socket;
};

export const doSwitch = (type, cases) => {
    const switchErr = () => {
        throw new Error(`fetch() received unknown message: '${type}'`);
    };
    return (cases[type] || switchErr)();
};

export const SPO = (s, p, o) => ({ s, p, o });

export const predicateAsTopic = (s, p) => `${s}:${p}`;

export const SHA = (msg) => shajs("sha256").update(msg).digest("hex");

export const isNotStringOrStringArray = (thing) => (
    typeof thing !== "string" && isArray(thing) && thing.some((p) => typeof p !== "string")
);

export const keyPair = () => {
    const { publicKey, secretKey } = nacl.box.keyPair();
    return {
        publicKey: util.encodeBase64(publicKey),
        secretKey: util.encodeBase64(secretKey),
    };
};

export const myPublicKey = () => {
    if (!SESSION_KEYS || !SESSION_KEYS.publicKey) {
        SESSION_KEYS = keyPair();
    }
    return SESSION_KEYS.publicKey;
};

const mySecretKey = () => {
    if (!SESSION_KEYS || !SESSION_KEYS.secretKey) {
        SESSION_KEYS = keyPair();
    }
    return SESSION_KEYS.secretKey;
};

export const encrypt = (message) => {
    const nonce = nacl.randomBytes(24);

    // me encrypts message for them
    const box = nacl.box(
        util.decodeUTF8(message),
        // our nonce
        nonce,
        // the key of who we're talking to
        util.decodeBase64(socket.peerKey),
        // our secret key, so we can encrypt
        util.decodeBase64(mySecretKey()),
    );

    // somehow send this message to them
    return { box, nonce };
};

const backend = process.env.REACT_APP_HOST_DOMAIN;

export function makeTopic(topicString, socket) {
    if (!socket) {
        throw new Error("socket not initialized");
    }
    console.log(`New topic: ${topicString}`);
    const public_key = myPublicKey();
    const channel = socket.channel(topicString, { public_key });
    channel.join()
        .receive("ok", () => console.log(`success, joined topic '${topicString}'`))
        .receive("error", () => console.log(`failed to join topic '${topicString}'`));

    return channel;
}
