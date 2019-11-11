import React from "react";
import mainChan from "./channels/main";
import "./index.css";


const submitWrite = (predicate, name) => mainChan.push("write", {
	s: "06ab7fe0-0039-11ea-9024-45e6b6f0fb4c",
	p: predicate,
	o: name,
});

const App = () => {
	const [fname, setFirstName] = React.useState("");
	const [lname, setLastName] = React.useState("");

	const fnameRef = React.useRef(null);
	const lnameRef = React.useRef(null);

	fnameRef.current = fname;
	lnameRef.current = lname;

	const submit = React.useCallback(() => {
		submitWrite("firstName", fnameRef.current);
		submitWrite("lastName", lnameRef.current);
	}, []);
	const typingFirstName = React.useCallback(({ target }) => setFirstName(target.value), []);
	const typingLastName = React.useCallback(({ target }) => setLastName(target.value), []);

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
		</div>
	);
}

export default App;
