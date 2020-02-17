import { Store } from "simple-shared-state";
import { PublicNode, PrivateNode } from "./graph";
import connection from "./connect";

export class SyncStore extends Store {

    connection = connection;

    constructor(initialState, actions, devtool) {
        super(initialState, actions, devtool);
        let clear;
        let node;

        const init = () => {
            const props = Object.keys(this.stateTree);
            const watching = new Set();

            props.forEach((key) => {
                const unwatch = this.watch(s => s[key], (value) => {
                    node.write(key, value);
                }, false);
                watching.add(unwatch);
            });
            node.fetchAndWatch(props, (data) => {
                const { predicate, object } = data;
                if (predicate) this.dispatch({ [predicate]: object });
            });

            clear = () => {
                watching.forEach((fn) => {
                    fn();
                    watching.delete(fn);
                });
                node.clear();
                node = undefined;
            };
        };

        this.getPublicKey = () => {
            return node
                && node.keys
                && node.keys.getPublicKey
                && node.keys.getPublicKey(true);
        }

        this.setSecret = (email, passphrase) => {
            if (node) clear();
            node = new PrivateNode(email, passphrase);
            init();
        };

        this.setGlobalId = (globalId) => {
            if (node) clear();
            node = new PublicNode(globalId);
            init();
        };
    }
};
