
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

export function bytesToBase64(bytes) {
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
