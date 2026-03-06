//灵动文字特效import React from 'react';
import React from 'react';
import './DynamicTextAnimation.css';

const DynamicTextAnimation = () => {
  const text = "宝宝你来啦";
  const circles = 3; // Number of animated circles
  
  return (
    <div className="dynamictextanimation-container">
      <div className="dynamictextanimation-loader">
        {text.split("").map((char, index) => (
          <span 
            key={`char-${index}`}
            className="dynamictextanimation-char"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            {char}
          </span>
        ))}
        {[...Array(circles)].map((_, index) => (
          <span 
            key={`circle-${index}`}
            className="dynamictextanimation-circle"
            style={{ 
              animationDelay: `${(text.length + index) * 0.2}s`,
              backgroundColor: ['#eccc68', '#7bed9f', '#ff6b81'][index]
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default DynamicTextAnimation;