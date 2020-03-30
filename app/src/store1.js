import { SyncStore } from "./data/db-adapter";

const initialState = {
	first_name: "",
	last_name: "",
	email: "",
	value1: 0,
	value2: 0,
};
const store = new SyncStore(initialState, () => ({
	setFirstName: ({ target }) => ({ first_name: target.value }),
	setLastName: ({ target }) => ({ last_name: target.value }),
	setEmail: ({ target }) => ({ email: target.value }),
	setValue1: ({ target }) => {
		const value = parseInt(target.value, 10);
		if (!isNaN(value)) {
			return { value1: +target.value };
		} else {
			return { value1: "" };
		}
	},
	setValue2: ({ target }) => {
		const value = parseInt(target.value, 10);
		if (!isNaN(value)) {
			return { value2: +target.value };
		} else {
			return { value2: "" };
		}
	},
}));

export default store;
