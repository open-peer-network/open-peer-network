import React from 'react';
import { Channels } from "./channels";
import "./index.css";

const [
  channelCounter,
  channelGraph,
] = Channels("counter", "graph");

const submitRead = () => {
  channelGraph.push("query", { s: "uuid:1", p: ["firstName", "lastName"] })
}

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
