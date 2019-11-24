import React, { useReducer, useCallback, useRef, useEffect } from "react";
// import connection from "./data/connect";
import "./index.css";
import { publicKey } from "./data/crypto";
import user from "./data/graph";

const password = process.env.REACT_APP_PASSWORD;
const email = process.env.REACT_APP_USER_EMAIL;
user.login(email, password);

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

	const typingFirstName = useCallback(({ target }) => user.write("first_name", target.value), []);
	const typingLastName = useCallback(({ target }) => user.write("last_name", target.value), []);
	const typingEmail = useCallback(({ target }) => user.write("email", target.value), []);

	useEffect(() => {
		user.fetchAndWatch([
			"first_name",
			"last_name",
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
