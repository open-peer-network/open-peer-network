import { Store } from "simple-shared-state";
import { PublicNode, PrivateNode } from "./graph";
import connection from "./connect";
import { toStorage, fromStorage } from "./helpers";

export class SyncStore extends Store {

    connection = connection;

    constructor(initialState, actions, devtool) {
        super(initialState, actions, devtool);
        let clear;
        let node;
        let isPrivate = false;
        let subject;

        const init = () => {
            const props = Object.keys(this.stateTree);
            const watching = new Set();

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
            subject = node.keys.getPublicKey(true);
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
            subject = newSubect;
            init();
        };
    }
};
