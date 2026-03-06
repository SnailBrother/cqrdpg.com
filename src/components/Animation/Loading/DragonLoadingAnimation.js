//游龙-无线循环加载动画
import React from 'react';
import './DragonLoadingAnimation.css';

const DragonLoadingAnimation = () => {
  return (
    <div className="drloading-container">
      {[...Array(10)].map((_, i) => (
        <div 
          key={i} 
          className="drloading-particle" 
          style={{ '--i': i + 1 }}
        ></div>
      ))}
    </div>
  );
};

export default DragonLoadingAnimation;