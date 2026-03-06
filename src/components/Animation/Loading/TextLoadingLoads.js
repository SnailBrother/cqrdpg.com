//文字加载动画
import React from 'react';
import './TextLoadingLoads.css';

const TextLoadingLoads = () => {
  const letters = ['L', 'O', 'A', 'D', 'I', 'N', 'G'];
  const dots = [8, 9, 10]; // For the colored dots

  return (
    <div className="textloadingloads-container">
      <div className="textloadingloads-loader">
        {letters.map((letter, index) => (
          <span 
            key={`letter-${index}`} 
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            {letter}
          </span>
        ))}
        {dots.map((dot, index) => (
          <span 
            key={`dot-${index}`} 
            className={`textloadingloads-dot-${index}`}
            style={{ animationDelay: `${(letters.length + index) * 0.2}s` }}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default TextLoadingLoads;