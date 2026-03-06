import React from 'react';
import './LoveTextEffects.css';

const LoveTextEffects = () => {
  const text = "i love you";
  
  return (
    <div className="lovetexteffects-container">
      <div className="lovetexteffects-text">
        {text.split('').map((char, index) => (
          char === ' ' ? 
            <span key={index}>&nbsp;</span> : 
            <span key={index} className="lovetexteffects-char">{char}</span>
        ))}
      </div>
    </div>
  );
};

export default LoveTextEffects;