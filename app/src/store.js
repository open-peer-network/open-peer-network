import { SyncStore } from "./data/sync-store";

const initialState = {
	first_name: "",
	last_name: "",
	email: "",
};
const store = new SyncStore(initialState, () => ({
	setFirstName: ({ target }) => ({ first_name: target.value }),
	setLastName: ({ target }) => ({ last_name: target.value }),
	setEmail: ({ target }) => ({ email: target.value }),
}));

export default store;
