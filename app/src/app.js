import React from 'react';
import { useDispatch } from 'react-redux';
import ColorSquare from './components/colorSquare';

const App = () => {
  const dispatch = useDispatch();

  return (
    <div className="App">
      <ColorSquare/>&nbsp;&nbsp;&nbsp;
      <button
        onClick={() => dispatch({type: 'CHANGE_COLOR'})}
      >
        Change Color
      </button>
    </div>
  )
}

export default App;
