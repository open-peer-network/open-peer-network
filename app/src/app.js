import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ColorSquareGrid from './components/squareGrid';
import randomRGB from './lib/randomRGB';

const App = () => {
  const dispatch = useDispatch();
  const gridSize = useSelector(state => state.gridSize);

  // This is a hacky solution to updating a single element in
  // in the squareColors array stored in state
  // TODO: find a better way to update the color of a single square
  const currentColors = useSelector(state => state.squareColors);

  const handleClick = () => {
    for(let i=0; i < gridSize*gridSize; i++) {
      var newColors = currentColors;
      newColors[i] = randomRGB();
      dispatch({
        type: 'CHANGE_COLOR',
        newColors: newColors 
      });
    }
  }

  return (
    <div className="App">
      <div style={{border: '1px solid'}}>
        <ColorSquareGrid gridSize={gridSize} />
      </div>
      <br />
      <button onClick={handleClick}>
        Change Color
      </button>
    </div>
  )
}

export default App;
