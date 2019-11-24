import isString from "lodash.isstring";

const { isArray } = Array;

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

export const err = (str) => {
    throw new Error(str);
};
