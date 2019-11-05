import React from 'react';
import { Channels } from "./channels";
import "./index.css";

const [
  channelCounter,
  channelGraph,
] = Channels("counter", "graph");

const submitRead = () => {
  channelGraph.push("query", {
    s: "cf9b3364304cd98118c7deb4f3efe70ff713a70ac47a4e4120864efee19f6e1a",
  });
};

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
