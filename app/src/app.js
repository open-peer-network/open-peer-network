import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ColorSquareGrid from './components/squareGrid';
import randomRGB from './lib/randomRGB';


const App = () => {
  const dispatch = useDispatch();
  const gridSize = useSelector(state => state.gridSize);

  const currentColors = useSelector(state => state.squareColors);

  const handleClick = () => {
    const t1 = performance.now();
    for(let i=0; i < 1000000; i++) {
      var newColors = currentColors;
      newColors[i] = randomRGB();
      dispatch({
        type: 'CHANGE_COLOR',
        newColors: newColors
      });
    }
    const t2 = performance.now();
    console.log(t2-t1);
  }

  const handleChange = (e) => {
    stopColors();
    dispatch({
      type: 'CHANGE_GRID_SIZE',
      newSize: e.target.value
    })
  }

  const stopColors = () => {
    for (let i=0; i < 9999; i++) {
      clearInterval(i);
    }
  }

  return (
  <div className="App">
    <div>
      <ColorSquareGrid gridSize={gridSize} />
    </div>
    <br />

    <button onClick={handleClick}>
    Change Color
    </button>
    <br/>

    <button onClick={stopColors}>
      Stop
    </button>
    <br/>

    <input 
      type="range"
      min="1"
      max="11"
      step="1"
      defaultValue={gridSize}
      onChange={handleChange}
    />
  </div>
  )
}

export default App;
