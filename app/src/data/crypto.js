import buffer from "scrypt-js/thirdparty/buffer";
import * as sodium from "libsodium-wrappers";
import { syncScrypt } from "scrypt-js";
import { toBase64, fromBase64 } from "./encoding";

let SESSION_KEYS;
sodium.ready.then(() => {
	SESSION_KEYS = generateKeyPair();
});

export const ready = async (callback) => {
	sodium.ready.then(callback);
};

export class KeyContainer {
	constructor(id) {
		this.keys = SESSION_KEYS || {};
		if (id) this.set(id);
	}
	set(keypair) {
		this.keys = keypair;
	}
	getSecretKey(isBase64) {
		if (isBase64) return this.keys.privateKey && toBase64(this.keys.privateKey);
		else return this.keys.privateKey;
	}
	getPublicKey(isBase64) {
		if (isBase64) return this.keys.publicKey && toBase64(this.keys.publicKey);
		else return this.keys.publicKey;
	}
	encrypt(plaintext, publicKey) {
		const nonce = getNonce();
		const box = sodium.crypto_box_easy(plaintext, nonce, publicKey, this.keys.privateKey);
		return toBase64(concatUint8(nonce, box));
	}
	encryptPrivate(plaintext) {
		const nonce = getNonce();
		const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, this.keys.privateKey);
		const bytes = concatUint8(nonce, ciphertext);
		const box = toBase64(bytes);

		return box;
	}
	decryptPrivate(box) {
		const boxBytesArray = fromBase64(box);
		if (boxBytesArray.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
			throw new Error("invalid ciphertext, too short");
		}
		const nonce = boxBytesArray.slice(0, sodium.crypto_secretbox_NONCEBYTES);
		const ciphertext = boxBytesArray.slice(sodium.crypto_secretbox_NONCEBYTES);
		const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, this.keys.privateKey);

		return sodium.to_string(plaintext);
	}
	decrypt(box, publicKey) {
		const boxBytesArray = fromBase64(box);
		if (boxBytesArray.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
			throw new Error("Can't decrypt invalid message, length too short");
		}
		const nonce = boxBytesArray.slice(0, sodium.crypto_secretbox_NONCEBYTES);
		const ciphertext = boxBytesArray.slice(sodium.crypto_secretbox_NONCEBYTES);
		const plaintext = sodium.crypto_box_open_easy(ciphertext, nonce, publicKey, this.keys.privateKey);

		return sodium.to_string(plaintext);
	}
}

export const getNonce = () => sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

export function generateKeyPair() {
	return sodium.crypto_box_keypair();
};

export const keyFromPassword = (passwordString) => {
	if (typeof passwordString !== "string") {
		throw new Error(`keyFromPassword() requires a valid string, received type ${typeof passwordString}`);
	}
	const passwd = new buffer.SlowBuffer(passwordString.normalize("NFKC"));
	const salt = new buffer.SlowBuffer("qwertyuiop".normalize("NFKC"));
	const privateKey = syncScrypt(passwd, salt, 1024, 8, 1, 32);

	return {
		privateKey,
		publicKey: sodium.crypto_kdf_derive_from_key(32, 1, "context", privateKey),
		keyType: "x25519",
	};
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
