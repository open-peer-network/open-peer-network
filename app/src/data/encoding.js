import sodium from "libsodium-wrappers";

export const fromBase64 = (str) => (
	sodium.from_base64(str, sodium.base64_variants.ORIGINAL)
);

export const toBase64 = (arr) => (
	sodium.to_base64(arr, sodium.base64_variants.ORIGINAL)
);
