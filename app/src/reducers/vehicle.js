const initialState = {
  gridSize: 6,
  squareColors: new Array(36).fill([0,0,0])
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
        gridSize: action.gridSize,
        squareColors: new Array(action.gridSize*action.gridSize).fill([0,0,0])
      }

    default:
      return initialState;
  }
}

export default reducer;
