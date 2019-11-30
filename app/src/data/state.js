import connection from "./connect";

class LocalState {

    fetch(topic, callback) {
        connection.fetch(topic, callback);
    }

    watch(topic, callback) {
        connection.watch(topic, callback);
        // [].concat(topics).forEach((topic) => {
        // });
    }
}

export default new LocalState();
