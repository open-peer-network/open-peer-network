import React from "react";
import "./index.css";
import { ready } from "./data/crypto";
import store from "./store";
import useSharedState from "use-simple-shared-state";

const backend = process.env.REACT_APP_HOST_DOMAIN;
const password = process.env.REACT_APP_PASSWORD;
const email = process.env.REACT_APP_USER_EMAIL;

window.store = store;

const {
	setFirstName,
	setLastName,
	setEmail,
	setValue1,
	setValue2,
} = store.actions;

ready(() => {
	store.setSecret(email, password);
	store.connection.start(`${backend}/socket`);
});

const useDefault = () => {
	store.setSecret(email, password);
};
const useUser1 = () => {
	store.setSecret(email+"1", password+"1");
};
const useUser2 = () => {
	store.setSecret(email+"2", password+"2");
};
const useNonUser = () => {
	store.setSubject("global_id_1");
};

const App = () => {
	const [first_name, last_name, email, value1, value2] = useSharedState(store, [
		s => s.first_name,
		s => s.last_name,
		s => s.email,
		s => s.value1,
		s => s.value2,
	]);

	return (
		<div className="App">
			<div>
				<label htmlFor="pubkey">Public Key: </label>
				<input name="pubkey" className="monospace" value={store.getSubject() || ""} readOnly />
			</div>
			<div>
				<label htmlFor="first_name">First Name: </label>
				<input name="first_name" onChange={setFirstName} value={first_name} />
			</div>
			<div>
				<label htmlFor="last_name">Last Name: </label>
				<input name="last_name" onChange={setLastName} value={last_name} />
			</div>
			<div>
				<label htmlFor="email">Email: </label>
				<input name="email" onChange={setEmail} value={email} />
			</div>
			<div>
				<label htmlFor="value1">Value1: </label>
				<input name="value1" onChange={setValue1} value={value1} />
			</div>
			<div>
				<label htmlFor="value2">Value2: </label>
				<input name="value2" onChange={setValue2} value={value2} />
			</div>
			<div>
				<label htmlFor="value2">Value1 + Value2 = </label>
				<input name="value2" readOnly value={value1 + value2} />
			</div>
			<button onClick={useDefault}>Default User</button>
			<button onClick={useUser1}>User 1</button>
			<button onClick={useUser2}>User 2</button>
			<button onClick={useNonUser}>Use Non-User</button>
		</div>
	);
}

export default App;
