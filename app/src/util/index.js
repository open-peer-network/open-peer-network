import shajs from "sha.js";
import nacl from "tweetnacl";
import util from "tweetnacl-util";

const { isArray } = Array;

export const doSwitch = (type, cases) => {
    const switchErr = () => {
        throw new Error(`fetch() received unknown message: '${type}'`);
    };
    return (cases[type] || switchErr)();
};

export const spo = (s, p, o) => ({ s, p, o });

export const predicateAsTopic = (s, p) => `${s}:${p}`;

export const sha = (msg) => shajs("sha256").update(msg).digest("hex");

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

export const encypt = (keypair, publicKey) => {
    const me = nacl.box.keyPair.fromSecretKey(util.decodeBase64(keypair.secretKey));
    const them = { publicKey };

    const nonce = nacl.randomBytes(24);
    const message = "Hello, them";

    // me encrypts message for them
    const box = nacl.box(
        nacl.util.decodeUTF8(message),
        nonce,
        them.publicKey,
        me.secretKey,
    );

    // somehow send this message to them
    return { box, nonce };
};
