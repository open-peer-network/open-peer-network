import React from "react";
import {
  Channels
} from "./channels";
import "./index.css";

const [counterChan] = Channels("counter");

const submitRead = () => {
  // channelSys.push("listen", {
  //   s: "06ab7fe0-0039-11ea-9024-45e6b6f0fb4c",
  //   p: ["firstName", "lastName"],
  // });
};

const App = () => {
  const [count, setCount] = React.useState(0);
  const countRef = React.useRef(null);
  countRef.current = count;

  React.useEffect(() => {
    counterChan.on("count", ({
      value
    }) => setCount(value))
  }, []);

  return (
    <div className="App">
      <input readOnly value={countRef.current} />
      <button onClick={submitRead}>Read</button>
    </div>
  );
}

export default App;
