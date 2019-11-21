import nacl from "tweetnacl";
import util from "tweetnacl-util";
import shajs from "sha.js";
import { bytesToBase64 } from "./encoding";


let SESSION_KEYS = null;

const generateKeyPair = () => {
	const { publicKey, secretKey } = nacl.box.keyPair();
	return {
		publicKey: util.encodeBase64(publicKey),
		secretKey: util.encodeBase64(secretKey),
	};
};

const secretKey = () => {
	if (!SESSION_KEYS || !SESSION_KEYS.secretKey) {
		SESSION_KEYS = generateKeyPair();
	}
	return SESSION_KEYS.secretKey;
};

export const publicKey = () => {
	if (!SESSION_KEYS || !SESSION_KEYS.publicKey) {
		SESSION_KEYS = generateKeyPair();
	}
	return SESSION_KEYS.publicKey;
};

export const encrypt = (json, publicKey) => {
	const message = JSON.stringify(json);
	// NaCl requires this.
	const nonce = nacl.randomBytes(24);

	// This is where the encryption happens.
	const box = nacl.box(
		util.decodeUTF8(message),
		nonce,
		util.decodeBase64(publicKey),
		util.decodeBase64(secretKey()),
	);

	return {
		box: bytesToBase64(box),
		nonce: bytesToBase64(nonce),
	};
};

export const decrypt = (box, nonce, publicKey) => {
	const packet = nacl.box.open(
		util.decodeBase64(box),
		util.decodeBase64(nonce),
		util.decodeBase64(publicKey),
		util.decodeBase64(secretKey()),
	);
	const json = new TextDecoder("utf-8").decode(packet);

	return JSON.parse(json);
};

export const SHA = (msg) => (
	shajs("sha256").update(msg).digest("hex")
);
