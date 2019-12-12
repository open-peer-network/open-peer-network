import buffer from "scrypt-js/thirdparty/buffer";
import * as sodium from "libsodium-wrappers";
import { syncScrypt } from "scrypt-js";
import { toBase64, fromBase64 } from "./encoding";
// import base62 from "base62/lib/ascii";
// import ab2str from "arraybuffer-to-string";
// export { ab2str };

let SESSION_KEYS = {};

export const ready = async (callback) => {
	sodium.ready.then(callback);
};
sodium.ready.then(() => {
	SESSION_KEYS = generateKeyPair();
});


export const getNonce = () => sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

// Just a temporary hack while we migrate to a better way.
export const storeKeys = (keys) => {
	SESSION_KEYS = keys;
};

export function generateKeyPair() {
	return sodium.crypto_box_keypair();
};

export const getSecretKey = (type = Uint8Array) => {
	switch(type) {
		case Uint8Array: return SESSION_KEYS.privateKey;
		case 'base64': return toBase64(SESSION_KEYS.privateKey);
		default: return toBase64(SESSION_KEYS.privateKey);
	}
};

export const getPublicKey = (type = Uint8Array) => {
	switch(type) {
		case Uint8Array: return SESSION_KEYS.publicKey;
		case 'base64': return toBase64(SESSION_KEYS.publicKey);
		default: return toBase64(SESSION_KEYS.publicKey);
	}
};

export const keyFromPassword = (passwordString) => {
	if (typeof passwordString !== "string") {
		throw new Error(`keyFromPassword() requires a valid string, received type ${typeof passwordString}`);
	}
	const passwd = new buffer.SlowBuffer(passwordString.normalize('NFKC'));
	const salt = new buffer.SlowBuffer("qwertyuiop".normalize('NFKC'));
	const secretKey = syncScrypt(passwd, salt, 1024, 8, 1, 32);

	return sodium.crypto_kdf_derive_from_key(32, 1, 'context', secretKey);
};

export const concatUint8 = (...args) => {
	const res = new Uint8Array(args.reduce((total, arr) => total + arr.length, 0));
	let offset = 0;
	args.forEach((arr) => {
		res.set(arr, offset);
		offset += arr.length;
	});
	return res;
};

export const encrypt = (plaintext, publicKey) => {
	const nonce = getNonce();
	return toBase64(concatUint8(nonce, sodium.crypto_box_easy(plaintext, nonce, publicKey, getSecretKey())));
};

export const decrypt = (byteArray, publicKey) => {
	byteArray = fromBase64(byteArray);
	if (byteArray.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
		throw new Error("Can't decrypt invalid message, length too short");
	}
	const nonce = byteArray.slice(0, sodium.crypto_secretbox_NONCEBYTES);
	const ciphertext = byteArray.slice(sodium.crypto_secretbox_NONCEBYTES);
	const plaintext = sodium.crypto_box_open_easy(ciphertext, nonce, publicKey, getSecretKey());

	return sodium.to_string(plaintext);
};
