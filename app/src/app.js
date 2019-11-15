import React, { useState, useCallback, useRef } from "react";
import "./index.css";
import Node from "./graph";

const node = new Node();
node.on(["first_name", "last_name"], (data) => {
	console.log("value:", data);
});

const submitWrite = (predicate, value) => node.write(predicate, value);

const App = () => {
	const [fname, setFirstName] = useState("");
	const [lname, setLastName] = useState("");

	const fnameRef = useRef("");
	const lnameRef = useRef("");

	fnameRef.current = fname || "";
	lnameRef.current = lname || "";

	const submit = useCallback(() => {
		submitWrite("first_name", fnameRef.current);
		submitWrite("last_name", lnameRef.current);
	}, []);
	const typingFirstName = useCallback(({ target }) => setFirstName(target.value), []);
	const typingLastName = useCallback(({ target }) => setLastName(target.value), []);
	const doRead = useCallback(() => {
		node.read("first_name", ({ data }) => setFirstName(data.first_name));
		node.read("last_name", ({ data }) => setLastName(data.last_name));
	}, []);

	return (
		<div className="App">
			<div>
				<label htmlFor="first_name">First Name</label>
				<input name="first_name" onChange={typingFirstName} value={fnameRef.current} />
			</div>
			<div>
				<label htmlFor="last_name">Last Name</label>
				<input name="last_name" onChange={typingLastName} value={lnameRef.current} />
			</div>
			<button onClick={submit}>Write</button>
			<button onClick={doRead}>Read</button>
		</div>
	);
}

export default App;
