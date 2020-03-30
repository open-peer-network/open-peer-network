import { Store } from "simple-shared-state";
import connection from "../connect";
import { PublicNode, PrivateNode } from "../graph";
import { toStorage, fromStorage, asGUID } from "../helpers";

const ObjectPrototype = Object.getPrototypeOf({});

export class LowerLayer extends Store {

	connection = connection;

	constructor(initialState, actions) {
		super(initialState, actions);
		let isPrivate = false;
		let subject;
		let clear;
		let node;
		let watching = new Set();
		let removeParentLink = () => {};

		const init = () => {
			const props = Object.keys(this.stateTree);

			props.forEach((key) => {
				const unwatch = this.watch(s => s[key], (value) => {
					if (typeof value !== "object") node.write(key, toStorage(value));
				}, false);
				watching.add(unwatch);
			});

			node.fetchAndWatch(props, ({ predicate, object, pubkey }) => {
				if (pubkey === connection.keys.getPublicKey(true)) return;

				if (isPrivate) {
					let plaintext;
					try {
						if (typeof object === "string" && /^base64:/.test(object)) {
							plaintext = node.decrypt(object);
						}
					} catch (err) {
						console.error(err);
					}
					if (predicate && plaintext) {
						this.dispatch({ [predicate]: fromStorage(plaintext) });
					}
				} else {
					if (predicate) this.dispatch({ [predicate]: fromStorage(object) });
				}
			});

			clear = () => {
				watching.forEach((fn) => {
					fn();
					watching.delete(fn);
				});
				node.clear();
				node = undefined;
				isPrivate = false;
			};
		};

		this.unsetSubject = () => {
			if (node) clear();
		};

		this.setSecret = (email, passphrase) => {
			if (node) clear();
			isPrivate = true;
			node = new PrivateNode(email, passphrase);
			subject = asGUID(node.keys.getPublicKey(true));
			init();
		};

		this.getSubject = () => {
			if (isPrivate) {
				return node.keys.getPublicKey(true);
			} else {
				return subject;
			}
		};

		this.setSubject = (newSubect) => {
			if (node) clear();
			node = new PublicNode(newSubect);
			subject = asGUID(newSubect);
			init();
		};

		this.linkParent = (callback) => {
			removeParentLink();
			removeParentLink = this.watch(s => s, callback);
		}
	}


	dispatch(obj) {
		if (Object.getPrototypeOf(obj) !== ObjectPrototype) throw new Error("dispatch called with invalid payload");

		// Filter all non-primitive values before dispatching to the store
		const result = {};
		Object.keys(obj).forEach((key) => {
			if (!["number", "string", "boolean"].includes(typeof obj[key])) {
				console.error("dispatch received payload containing invalid value");
			} else {
				result[key] = obj[key];
			}
		});

		Store.prototype.dispatch.call(this, result);
	}
};
