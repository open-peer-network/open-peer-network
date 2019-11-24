import connection from "./connect";
// import merge from "lodash.merge";


// const listeners = new Map();

class LocalState {

    fetch(topicList, callback) {
        topicList.forEach((topic) => connection.fetch(topic, callback));
    }

    watch(topics, callback) {
        [].concat(topics).forEach((topic) => {
            connection.watch(topic, callback);
        });
    }
}

export default new LocalState();

// function addIfMissing(map, subject, predicates, callback) {
//     if (!map.has(subject)) {
//         map.set(subject, new Map());
//     }
//     predicates.forEach((pred) => {
//         map.get(subject).set(pred, callback);
//     });
// }
