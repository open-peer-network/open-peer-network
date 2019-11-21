
const { isArray } = Array;

export const isNotStringOrStringArray = (thing) => (
    typeof thing !== "string" && isArray(thing) && thing.some((p) => typeof p !== "string")
);
