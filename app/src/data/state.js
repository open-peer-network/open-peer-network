import connection from "./connect";

class LocalState {

    fetch(topic, callback) {
        connection.fetch(topic, callback);
    }

    watch(topics, callback) {
        [].concat(topics).forEach((topic) => {
            connection.watch(topic, callback);
        });
    }
}

export default new LocalState();
