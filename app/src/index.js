import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app';
// import uuid from 'uuid/v1';
import * as serviceWorker from './serviceWorker';
import {
    Channels
} from './channels';

const state = {};

const [mainChan] = Channels("main");

mainChan.on("auth:success", ({ data: uid }) => {
    console.log("auth success", uid);
    state[uid] = {};
    // mainChan.push("watch", { s: uid, p: ["firstName", "lastName"] });

    const payload = {
        s: uid,
        p: ["firstName", "lastName"],
    };
    mainChan.read(payload, ({ subject, data }) => {
        state[subject] = {
            ...state[subject],
            ...data,
        };
        console.log(state);
    });
});

mainChan.push("login", ["user1", "password"]);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
