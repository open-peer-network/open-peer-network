import React from "react";
import { Channels } from "./channels";
// import uuid from "uuid/v1";
import "./index.css";

const [
  channelCounter,
  channelGraph,
] = Channels("counter", "graph");

const submitRead = () => {
  channelGraph.push("query", {
    s: "06ab7fe0-0039-11ea-9024-45e6b6f0fb4c",
    p: ["firstName", "lastName"],
  });
};

const App = () => {
  const [count, setCount] = React.useState(0);
  const countRef = React.useRef(null);
  countRef.current = count;

  React.useEffect(() => {
    channelCounter.on("count", ({ value }) => setCount(value))
    channelGraph.on("query_result", (data) => console.log(data))
  }, []);

  return (
    <div className="App">
      <input readOnly value={countRef.current} />
      <button onClick={submitRead}>Read</button>
    </div>
  );
}

export default App;
