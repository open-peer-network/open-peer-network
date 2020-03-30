import { Store } from "simple-shared-state";
import { listen, set } from "./flat-sync-store";
import { keyFromPassword } from "./crypto";

export class SyncStore extends Store {

    connection = connection;

    constructor(initialState, actions, devtool) {
        super(initialState, actions, devtool);
        let clear;
        let isPrivate = false;
        let subject;

        const init = () => {
            const props = Object.keys(this.stateTree);
            const watching = new Set();

            props.forEach((key) => {

                const unwatch = this.watch(s => s[key], (value) => {
                    set(subject, key, value);
                }, false);

                watching.add(unwatch);

                const unlisten = listen(subject, key, () => {
                    this.dispatch({ [predicate]: object })
                });

                watching.add(unlisten);
            });

            clear = () => {
                watching.forEach((fn) => {
                    fn();
                    watching.delete(fn);
                });
                isPrivate = false;
            };
        };

        this.unsetSubject = () => {
            clear();
        };

        this.setSecret = (email, passphrase) => {
            clear();
            isPrivate = true;
            subject = keyFromPassword(email, passphrase);
            init();
        };

        this.getSubject = () => {
            return subject;
        };

        this.setSubject = (newSubect) => {
            clear();
            subject = newSubect;
            init();
        };
    }
};
