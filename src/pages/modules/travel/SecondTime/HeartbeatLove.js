import React from 'react';
import './HeartbeatLove.css';

const HeartbeatLove = () => {
  return (
    <div className="heartbeatlove-container">
      <ul className="heartbeatlove-list">
        {[...Array(9)].map((_, index) => (
          <li 
            key={index} 
            className={`heartbeatlove-item heartbeatlove-item-${index + 1}`}
          ></li>
        ))}
      </ul>
    </div>
  );
};

export default HeartbeatLove;