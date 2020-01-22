import React from 'react';
import store from '../store';
import useSharedState from 'use-simple-shared-state';
import styled from 'styled-components';

const ColorSquareContainer = styled.div`
  display: flex;
`

const ColorSquare = (props) => {
  const [color] = useSharedState(store, [s => s.squareColors[props.squareIndex]]);

  return (
    <ColorSquareContainer>
      <div
        style={{
        height: props.size,
        width: props.size,
        background: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
        }}
      >
      </div>
    </ColorSquareContainer>
  )
}

export default ColorSquare;
