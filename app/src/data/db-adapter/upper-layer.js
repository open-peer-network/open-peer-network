import { Store } from "simple-shared-state";
import connection from "../connect";
import { v4 as uuid } from "uuid";
import { asGUID, hash } from "../helpers";
import { KeyContainer } from "../crypto";
import { LowerLayer } from "./lower-layer";


const stores = {};

const getStore = (id, encrypted = false, creds) => {
	let realId;
	if (encrypted) {
		realId = asGUID(new KeyContainer(id).getPublicKey(true));
	} else {
		realId = asGUID(id);
	}
	if (stores.hasOwnProperty(realId)) return stores[realId];

	const store = new LowerLayer({});
	if (encrypted && creds && creds.length === 2) {
		store.setSecret(creds[0], creds[1]);
	} else {
		store.setSubject(realId);
	}
	stores[realId] = store;

	return store;
};

export class SyncStore extends Store {
	connection = connection;
	encrypted = false;
	creds = [];

	constructor(state, actions) {
		super(state, actions);
		this.id = `i:<${hash(uuid())}>`;

		this.typedDispatch = (_str, branch) => {
			console.log("@??@@?@?");
			this.dispatch(branch);
		};

		this.dispatchTyped = (_str, obj) => {
			if (typeof this.id !== "string") {
				return console.error("Invalid ID on SyncStore");
			}
			console.log(stores);

			const result = {};
			Object.keys(obj).forEach((key) => {
				if (typeof obj[key] !== "object") {
					result[key] = obj[key];
				} else {
					const newKey = `i:<${hash(`${this.id}:${key}`)}>`;
					result[key] = newKey;
	
					const store = getStore(newKey, this.encrypted, this.creds);
					console.log('!?');
					console.log(obj[key]);
					store.dispatch(obj[key]);
					store.linkParent((newState) => {
						this.dispatch({ [key]: newState });
					});
				}
			});
			Store.prototype.dispatchTyped.call(this, "unknown", result);
		};
	}

	getSubject() {
		return this.id;
	}

	setSubject(id) {
		this.id = asGUID(id);
		this.encrypted = false;
		this.dispatch(this.stateTree);
	}

	setSecret(email, secret) {
		this.id = asGUID(secret);
		this.encrypted = true;
		this.creds = [email, secret];
		this.dispatch(this.stateTree);
	}
}


// export const listen = (id: string, predicate: string, callback: Function, runNow = false) => {
// 	const store = getStore(id);
// 	return store.watch((s: { [k: string]: any }) => s[predicate], callback, runNow);
// };

// export const set = (id: string, predicate: string, value: Primitive) => {
// 	const store = getStore(id);

// 	store.dispatch({ [predicate]: value });
// };

// export const write = (id: string, obj: { [k: string]: any }, encrypted = false) => {
// 	const store = getStore(id, encrypted);

// 	Object.keys(obj).forEach((key) => {
// 		if (typeof obj[key] !== "object") {
// 			store.write(key, obj[key]);
// 		} else {
// 			const newKey = `i:<${new sha256().update(`${id}:${key}`).digest("base64")}>`;
// 			store.write(key, newKey);

// 			write(newKey, obj[key]);
// 		}
// 	});
// };

// export const fetch = (id: string, encrypted = false): { [k: string]: any } => {
// 	const store = getStore(id, encrypted);

// 	const result: { [k: string]: any } = store.getState();

// 	Object.keys(result).forEach((key) => {
// 		const value = result[key];
// 		if (isString(value) && /^<[\w\d]+>$/.test(value)) {
// 			result[key] = fetch(value);
// 		}
// 	});
// 	return result;
// };
