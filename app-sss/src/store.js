import { Store } from 'simple-shared-state';

export default new Store({
	squareColors: new Array(2 * 2).fill([0,0,0])
}, () => ({
	changeGridSize: (gridSize) => ({
		gridSize,
		squareColors: new Array(gridSize * gridSize).fill([0,0,0])
	}),
	changeColors: (squareColors) => ({ squareColors }),
}));
