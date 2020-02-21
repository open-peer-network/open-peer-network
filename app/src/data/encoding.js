import sodium from "libsodium-wrappers";
import get from "lodash.get";

export const fromBase64 = (thing) => {
	switch (true) {
		case /^base64:/.test(thing):
			return sodium.from_base64(thing.replace(/^base64:/, ""), sodium.base64_variants.ORIGINAL);
		case get(thing, "constructor.name") === "Uint8Array":
			return thing;
		default:
			console.error("cannot base64 decode thing:", thing);
			throw new Error("cannot base64 decode");
	}
};

export const toBase64 = (thing) => {
	switch (true) {
		case /^base64:/.test(thing):
			return thing;
		case get(thing, "constructor.name") === "Uint8Array":
			return `base64:${sodium.to_base64(thing, sodium.base64_variants.ORIGINAL)}`;
		default:
			console.error("cannot base64 encode thing:", thing);
			throw new Error("cannot base64 encode");
	}
};
