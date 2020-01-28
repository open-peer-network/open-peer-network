import { Store } from 'simple-shared-state';

const state = {
	gridSize: 1,
	squareColors: new Array(2 * 2).fill([0,0,0])
};

const actions = () => ({
	changeGridSize: (gridSize) => ({
		gridSize,
		squareColors: new Array(gridSize * gridSize).fill([0,0,0])
	}),
	changeColors: (squareColors) => ({ squareColors }),
});

export default new Store(state, actions);
