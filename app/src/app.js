import React, { useState, useCallback, useRef } from "react";
import "./index.css";
import { publicKey } from "./data/crypto";
import user from "./data/graph";

const password = process.env.REACT_APP_PASSWORD;
const email = process.env.REACT_APP_USER_EMAIL;

user.login(email, password);

const App = () => {
	const [fname, setFirstName] = useState("");
	const [lname, setLastName] = useState("");
	const [email, setEmail] = useState("");

	const fnameRef = useRef("");
	const lnameRef = useRef("");
	const emailRef = useRef("");

	fnameRef.current = fname || "";
	lnameRef.current = lname || "";
	emailRef.current = email || "";

	const submit = useCallback(() => {
		user.write("first_name", fnameRef.current);
		user.write("last_name", lnameRef.current);
	}, []);
	const typingFirstName = useCallback(({ target }) => setFirstName(target.value), []);
	const typingLastName = useCallback(({ target }) => setLastName(target.value), []);
	const typingEmail = useCallback(({ target }) => setEmail(target.value), []);

	const doRead = useCallback(() => {
		user.read("first_name", (data) => setFirstName(data.first_name));
		user.read("last_name", (data) => setLastName(data.last_name));
	}, []);

	return (
		<div className="App">
			<div>
				<label htmlFor="pubkey">Public Key: </label>
				<input name="pubkey" className="monospace" value={publicKey()} readOnly />
			</div>
			<div>
				<label htmlFor="first_name">First Name: </label>
				<input name="first_name" onChange={typingFirstName} value={fnameRef.current} />
			</div>
			<div>
				<label htmlFor="last_name">Last Name: </label>
				<input name="last_name" onChange={typingLastName} value={lnameRef.current} />
			</div>
			<div>
				<label htmlFor="email">Email: </label>
				<input name="email" onChange={typingEmail} value={emailRef.current} />
			</div>
			<button onClick={submit}>Write</button>
			<button onClick={doRead}>Read</button>
		</div>
	);
}

export default App;
