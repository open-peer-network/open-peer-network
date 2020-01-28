import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

const ColorSquareContainer = styled.div`
  display: flex;
`

const ColorSquare = (props) => {
  const color = useSelector(state => state.squareColors[props.squareIndex]);

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
