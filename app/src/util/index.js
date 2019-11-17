import shajs from "sha.js";

const { isArray } = Array;

export const doSwitch = (type, cases) => {
    const switchErr = () => {
        throw new Error(`fetch() received unknown message: '${type}'`);
    };
    return (cases[type] || switchErr)();
};

export const spo = (s, p, o) => ({ s, p, o });

export const predicateAsTopic = (s, p) => `topic:${s}:${p}`;

export const sha = (msg) => shajs("sha256").update(msg).digest("hex");

export const isNotStringOrStringArray = (thing) => (
    typeof thing !== "string" && isArray(thing) && thing.some((p) => typeof p !== "string")
);
