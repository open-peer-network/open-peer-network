
const { isArray } = Array;

export const isNotStringOrStringArray = (thing) => (
    typeof thing !== "string" && isArray(thing) && thing.some((p) => typeof p !== "string")
);

export const triple = (s, p, o) => ({ s, p, o });
export const double = (s, p) => ({ s, p });
export const single = (s) => ({ s });
