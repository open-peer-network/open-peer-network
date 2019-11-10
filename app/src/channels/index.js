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

const successHandler = (topic, resp) => {
    console.log(`successfully joined topic '${topic}'`, resp);
};
const failureHandler = (topic, resp) => {
    console.log(`failed to join topic '${topic}'`, resp);
};

export const Channels = (...topics) => (
    topics.map((topic) => {

        if (_channels[topic]) return _channels[topic];

        const channel = socket.channel(`topic:${topic}`, {});
        _channels[topic] = channel;

        channel.join()
        .receive("ok", (resp) => successHandler(topic, resp))
        .receive("error", (resp) => failureHandler(topic, resp))

        channel.read = (payload, cb) => {
            const requestId = `read:${uuid()}`;
            channel.on(requestId, cb);
            channel.push(requestId, payload);
        };

        return channel;
    })
);
