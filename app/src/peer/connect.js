import SimplePeer from "simple-peer";

export function p2pConnect(initiator, offer, callback) {
	const conn = new SimplePeer({ initiator, trickle: false });

	conn.on("error", (err) => console.log("error", err));

	if (initiator) {
		conn.on("signal", (initialOffer) => {
			callback(JSON.stringify(initialOffer));
		});
	} else {
		conn.signal(JSON.parse(offer));
	}

	conn.on("connect", () => {
		console.log("peer connected!");
		conn.send("Hello peer");
	});

	conn.on("data", (data) => {
		console.log("data: ", data);
	});
}
