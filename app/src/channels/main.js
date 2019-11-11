import topics from "./index";

const state = {};

const main = topics();

main.push("login", ["user1", "password"]);
main.on("auth:success", ({ data: uid }) => {
	console.log("auth success", uid);

	state[uid] = {};

	const [fname, lname] = topics(`${uid}:firstName`, `${uid}:lastName`);

	main.on("value", (value) => console.log("main chan, value:", value));
	fname.on("value", (value) => console.log("first name:", value));
	lname.on("value", (value) => console.log("last name:", value));

	main.push("watch", { s: uid, p: ["firstName", "lastName"] });
});

export default main;
