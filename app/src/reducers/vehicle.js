import randomRGB from '../lib/randomRGB';

const initialState = {
  color: [255, 255, 255]
};

function reducer(state = initialState, action) {
  switch(action.type) {
    case 'CHANGE_COLOR':
      return {
        color: randomRGB()
      };

    default:
      return initialState;
  }
}

export default reducer;
