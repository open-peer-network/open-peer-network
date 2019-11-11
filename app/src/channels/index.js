import { Socket } from "phoenix";
import uuid from "uuid/v1";

const _channels = {};
const backend = process.env.REACT_APP_HOST_DOMAIN;
const socket = new Socket(`${backend}/socket`, {
	params: {
		token: window.userToken
	}
});
socket.connect();

function read(payload, cb) {
	const requestId = `read:${uuid()}`;
	this.on(requestId, cb);
	this.push(requestId, payload);
}

export default (...topicsList) => {
	['main']
	.concat(topicsList)
	.forEach((subtopic) => {
		const topic = `trunk:${subtopic}`;
		if (_channels[topic]) return _channels[topic];

		console.log(`New topic: ${topic}`);

		const channel = socket.channel(topic, {});
		channel.join()
		.receive("ok", () => console.log(`success, joined topic '${topic}'`))
		.receive("error", () => console.log(`failed to join topic '${topic}`));

		channel.read = read.bind(channel);
		_channels[topic] = channel;

		return channel;
	});

	if (!topicsList.length) {
		return _channels['trunk:main'];
	}
	return topicsList.map((topic) => _channels[`trunk:${topic}`]);
};
