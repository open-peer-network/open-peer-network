import nacl from "tweetnacl";
import util from "tweetnacl-util";
import shajs from "sha.js";
import { bytesToBase64 } from "./encoding";


let SESSION_KEYS = null;

// Just a temporary hack while we migrate to a better way.
export const storeKeys = (keys) => {
	SESSION_KEYS = keys;
};

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

export const keyFromPassword = (passwordString) => {
	const input = (new TextEncoder()).encode(passwordString);
	const secretKey = new Uint8Array(32);
	nacl.lowlevel.crypto_hash(secretKey, input, input.length);

	const keys = nacl.box.keyPair.fromSecretKey(secretKey);

	return {
		secretKey: bytesToBase64(keys.secretKey),
		publicKey: bytesToBase64(keys.publicKey),
	};
};

export const encrypt = (json, publicKey) => {
	const message = JSON.stringify(json);
	// NaCl requires this.
	const nonce = nacl.randomBytes(24);

	// This is where the encryption happens.
	// Returns Uint8Array.
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
	// Returns Uint8Array.
	const packet = nacl.box.open(
		util.decodeBase64(box),
		util.decodeBase64(nonce),
		util.decodeBase64(publicKey),
		util.decodeBase64(secretKey()),
	);
	// Convert that to utf-8.
	const json = new TextDecoder().decode(packet);

	return JSON.parse(json);
};

export const SHA256 = (msg) => (
	shajs("sha256").update(msg).digest("hex")
);
