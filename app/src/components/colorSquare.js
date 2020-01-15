import React from 'react';
import { useSelector } from 'react-redux';

const ColorSquare = () => {
  const color = useSelector(state => state.color);

  return (
    <div className="ColorSquare">
      <div 
        style={{
          width: '100px',
          height: '100px',
          background: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
        }}
      >
      </div>
    </div>
  )
}

export default ColorSquare;
