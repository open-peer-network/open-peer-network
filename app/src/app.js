import React, { useReducer, useCallback, useRef, useEffect } from "react";
// import connection from "./data/connect";
import "./index.css";
import { publicKey } from "./data/crypto";
import user, { Node } from "./data/graph";

const password = process.env.REACT_APP_PASSWORD;
const email = process.env.REACT_APP_USER_EMAIL;
// eslint-disable-next-line no-restricted-globals
user.login(email, password + (location.hash ? location.hash : ''));

const node = new Node('node1');

const reducer = (oldState, newState) => {
	return {
		...oldState,
		...newState,
	};
};
const initialState = {
	first_name: "",
	last_name: "",
	email: "",
};

const App = () => {
	const [state, dispatch] = useReducer(reducer, initialState);
	const stateRef = useRef(initialState);
	stateRef.current = state || initialState;

	const typingFirstName = useCallback(({ target }) => node.write("first_name", target.value), []);
	const typingLastName = useCallback(({ target }) => node.write("last_name", target.value), []);
	const typingEmail = useCallback(({ target }) => node.write("email", target.value), []);

	useEffect(() => {
		node.fetchAndWatch([
			"first_name",
			"last_name",
			"email",
		], ({ data }) => {
			console.log("fetch watch", data);
			dispatch(data);
		});
	}, []);

	return (
		<div className="App">
			<div>
				<label htmlFor="pubkey">Public Key: </label>
				<input name="pubkey" className="monospace" value={publicKey() || ""} readOnly />
			</div>
			<div>
				<label htmlFor="first_name">First Name: </label>
				<input name="first_name" onChange={typingFirstName} value={stateRef.current.first_name || ""} />
			</div>
			<div>
				<label htmlFor="last_name">Last Name: </label>
				<input name="last_name" onChange={typingLastName} value={stateRef.current.last_name || ""} />
			</div>
			<div>
				<label htmlFor="email">Email: </label>
				<input name="email" onChange={typingEmail} value={stateRef.current.email || ""} />
			</div>
		</div>
	);
}

export default App;
