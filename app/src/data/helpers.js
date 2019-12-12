import isString from "lodash.isstring";

const { isArray } = Array;
const STASH = {};

export const stashPut = (name, thing) => {
    if (!isString(name)) throw new Error("helpers.stash() requires a string for arg 1");
    STASH[name] = thing;
};
export const stashGet = (name) => {
    return STASH[name];
};

export const notStrings = (thing, errMessage) => {
    if (typeof thing !== "string" && isArray(thing) && thing.some((p) => typeof p !== "string")) {
        throw new Error(errMessage);
    }
};

export const errOut = (cond, errMessage) => {
    if (cond) throw new Error(errMessage);
};

export const triple = (s, p, o) => ({ s, p, o });
export const double = (s, p) => ({ s, p });
export const single = (s) => ({ s });

export const validateCredentials = (email, password) => {
    if (!isString(email) || !isString(password)) throw new Error("login received invalid input");
    if (password.length < 12) throw new Error("password length must be at least 12 characters or longer");
};

export const validTopic = (topic) => {
    if (!topic || !topic.value) return false;
    if (topic.toString() !== "[object Topic]") return false;
    return /(^none$|^sp:[^:]+:[^:]+$|^solo:.+$)/.test(topic.value);
};

export const err = (str) => {
    throw new Error(str);
};

export function officialTopic(opts) { debugger;
    const self = {
        [Symbol.toStringTag]: "Topic"
    };
    let pubKey;
    let none;
    let subj;
    let pred;

    if (opts === "none") {
        none = true;
    }
    self.set = (opts) => {
        const { subject, predicate, publicKey } = opts;
        if (subject && predicate) {
            subj = subject;
            pred = predicate;
            return;
        }
        if (publicKey) {
            subj = null;
            pred = null;
            pubKey = publicKey;
            return;
        }
        else {
            console.error("Invalid opts received for officialTopic()", opts);
            throw new Error("Invalid opts received for officialTopic()");
        }
    };
    if (!none) self.set(opts);

    Object.defineProperty(self, "value", {
        get: function() {
            if (none) return "none";
            if (pubKey) return `solo:${pubKey}`;
            if (subj && pred) return `sp:${subj}:${pred}`;
            throw new Error("could not determine a value for topic");
        }
    });

    return self;
}
