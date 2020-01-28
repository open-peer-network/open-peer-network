import React from 'react';
import store from '../store';
import useSharedState from 'use-simple-shared-state';
import styled from 'styled-components';

const ColorSquareContainer = styled.div.attrs(({ size }) => ({
  style: {
    height: `${size}px`,
    width: `${size}px`,
  }
}))`
  display: flex;
`;

const ColorSquare = (props) => {
  const [[r,g,b]] = useSharedState(store, [s => s.squareColors[props.squareIndex]]);

  return (
    <ColorSquareContainer
      size={props.size}
      style={{ background: `rgb(${r}, ${g}, ${b})` }}
    />
  )
}

export default ColorSquare;
