import React from 'react';
import { Socket } from "phoenix";
import "./index.css";

const backend = process.env.REACT_APP_HOST_DOMAIN;
if (!backend) throw new Error(`HOST_DOMAIN not found in .env`);

const socket = new Socket(`${backend}/socket`, {params: {token: window.userToken}})
socket.connect()
const channelCounter = socket.channel("topic:counter", {})
const channelGraph = socket.channel("topic:graph", {})

const submitRead = () => {
  channelGraph.push("topic:graph:read", { s: "uuid:1", p: ["firstName", "lastName"] })
}

channelCounter.join()
  .receive("ok", (resp) => { console.log("Joined successfully", resp) })
  .receive("error", (resp) => { console.log("Unable to join", resp) })
channelGraph.join()
  .receive("ok", (resp) => { console.log("Joined successfully", resp) })
  .receive("error", (resp) => { console.log("Unable to join", resp) })

const App = () => {
  const [count, setCount] = React.useState(0);
  const countRef = React.useRef(null);
  countRef.current = count;

  React.useEffect(() => {
    channelCounter.on("count", ({ value }) => setCount(value))
  }, []);

  return (
    <div className="App">
      <input readOnly value={countRef.current} />
      <button onClick={submitRead}>Read</button>
    </div>
  );
}

export default App;
