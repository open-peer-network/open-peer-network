import React from 'react';
import styled from 'styled-components';
import ColorSquare from './colorSquare';


const gridContainerSize = 800;

const GridContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-content: space-between;
  height: ${gridContainerSize}px;
  width: ${gridContainerSize}px;
  padding: 2px;
  margin: 5px;
`

const SquareContainer = styled.div`
  display: flex;
`

const ColorSquareGrid = function(props) {
  const squareSize = Math.max(
    Math.floor((gridContainerSize/props.gridSize)-5), 1);

  // Creating this array so there is something to map over
  // TODO: Seems like there must be a better way to do this
  const squaresList = [];
  for (let i=0; i < props.gridSize*props.gridSize; i++) {
    squaresList.push(i);
  }

  return (
    <GridContainer>
      {squaresList.map((index) => (
          <SquareContainer key={index} style={{
              height: `${squareSize}px`,
              width: `${squareSize}px`
          }}>
            <ColorSquare size={squareSize} squareIndex={index}/>
          </SquareContainer>
        )
      )}
    </GridContainer>
  )
}

export default ColorSquareGrid;
