import connection from "./connect";

class LocalState {

    fetch(topic, callback) {
        connection.fetch(topic, callback);
    }

    watch(topic, callback) {
        connection.watch(topic, callback);
    }

    write(topic, object) {
        connection.write(topic, object);
    }
}

export default new LocalState();
