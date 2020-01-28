const initialState = {
  gridSize: 1,
  squareColors: [[0,0,0]]
};

function reducer(state = initialState, action) {
  switch(action.type) {
    case 'CHANGE_COLOR':
      return {
        ...state,
        squareColors: action.newColors
      };
    
    // I think calling new Array here might be considered a side effect
    // TODO: Think of a better way to change grid size via state
    case 'CHANGE_GRID_SIZE':
      return {
        ...state,
        gridSize: action.newSize,
        squareColors: new Array(action.newSize*action.newSize).fill([0,0,0])
      }

    default:
      return initialState;
  }
}

export default reducer;
