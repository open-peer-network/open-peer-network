import React, { useState, useCallback, useRef } from "react";
import "./index.css";
import graph from "./graph";

graph.start();
graph.on("firstName", (value) => console.log("first name:", value));
graph.on("lastName", (value) => console.log("last name:", value));

const submitWrite = (predicate, value) => graph.write(predicate, value);

const App = () => {
	const [fname, setFirstName] = useState("");
	const [lname, setLastName] = useState("");

	const fnameRef = useRef(null);
	const lnameRef = useRef(null);

	fnameRef.current = fname || "";
	lnameRef.current = lname || "";

	const submit = useCallback(() => {
		submitWrite("firstName", fnameRef.current);
		submitWrite("lastName", lnameRef.current);
	}, []);
	const typingFirstName = useCallback(({ target }) => setFirstName(target.value), []);
	const typingLastName = useCallback(({ target }) => setLastName(target.value), []);
	const doRead = useCallback(() => {
		graph.read("firstName", ({ data }) => setFirstName(data.firstName));
		graph.read("lastName", ({ data }) => setLastName(data.lastName));
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
