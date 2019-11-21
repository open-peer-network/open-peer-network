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
            socket.publicKey = payload.public_key;
            console.log("Received publicKey:", socket.publicKey);
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

export const encrypt = (json) => {
    const message = JSON.stringify(json);
    // NaCl requires this.
    const nonce = nacl.randomBytes(24);

    // This is where the encryption happens.
    const box = nacl.box(
        util.decodeUTF8(message),
        nonce,
        util.decodeBase64(socket.publicKey),
        util.decodeBase64(mySecretKey()),
    );

    return {
        box: bytesToBase64(box),
        nonce: bytesToBase64(nonce),
    };
};

export const decrypt = (box, nonce) => {
    const packet = nacl.box.open(
        util.decodeBase64(box),
        util.decodeBase64(nonce),
        util.decodeBase64(socket.publicKey),
        util.decodeBase64(mySecretKey()),
    );
    const json = new TextDecoder("utf-8").decode(packet);

    return JSON.parse(json);
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

// How we generated this is included below.
// Source: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
const base64abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

// const base64abc = (() => {
//     let abc = [],
//         A = "A".charCodeAt(0),
//         a = "a".charCodeAt(0),
//         n = "0".charCodeAt(0);
//     for (let i = 0; i < 26; ++i) {
//         abc.push(String.fromCharCode(A + i));
//     }
//     for (let i = 0; i < 26; ++i) {
//         abc.push(String.fromCharCode(a + i));
//     }
//     for (let i = 0; i < 10; ++i) {
//         abc.push(String.fromCharCode(n + i));
//     }
//     abc.push("+");
//     abc.push("/");
//     return abc;
// })();

function bytesToBase64(bytes) {
    let result = '',
        i, l = bytes.length;
    for (i = 2; i < l; i += 3) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
        result += base64abc[bytes[i] & 0x3F];
    }
    if (i === l + 1) { // 1 octet missing
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[(bytes[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) { // 2 octets missing
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[(bytes[i - 1] & 0x0F) << 2];
        result += "=";
    }
    return result;
}

const utf8encoder = new TextEncoder();

// All solutions at MDN only provide a way to encode a native JS string to UTF-16 base64 string.
// Here, you can apply any encoding supported by TextEncoder.
export function base64utf8encode(str) {
    return bytesToBase64(utf8encoder.encode(str));
}
