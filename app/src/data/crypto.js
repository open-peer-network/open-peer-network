import nacl from "tweetnacl";
import util from "tweetnacl-util";
import shajs from "sha.js";
import { syncScrypt } from "scrypt-js";
import buffer from "scrypt-js/thirdparty/buffer";
import { bytesToBase64 } from "./encoding";


let SESSION_KEYS = generateKeyPair();

// Just a temporary hack while we migrate to a better way.
export const storeKeys = (keys) => {
	SESSION_KEYS = keys;
};

export function generateKeyPair() {
	const { publicKey, secretKey } = nacl.box.keyPair();
	return {
		publicKey: util.encodeBase64(publicKey),
		secretKey: util.encodeBase64(secretKey),
	};
};

const getSecretKey = () => {
	return SESSION_KEYS.secretKey;
};

export const getPublicKey = () => {
	return SESSION_KEYS.publicKey;
};

export const keyFromPassword = (passwordString) => {
	if (typeof passwordString !== "string") {
		throw new Error(`keyFromPassword() requires a valid string, received type ${typeof passwordString}`);
	}
	const passwd = new buffer.SlowBuffer(passwordString.normalize('NFKC'));
	const salt = new buffer.SlowBuffer("qwertyuiop".normalize('NFKC'));
	const secretKey = syncScrypt(passwd, salt, 1024, 8, 1, 32);

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
		util.decodeBase64(getSecretKey()),
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
		util.decodeBase64(getSecretKey()),
	);
	// Convert to utf-8 and parse as JSON.
	return JSON.parse(new TextDecoder().decode(packet));
};

export const SHA256 = (msg) => (
	shajs("sha256").update(msg).digest("hex")
);
