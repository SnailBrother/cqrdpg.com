// GlowingTextEffect.js
import React from 'react';
import './GlowingTextEffect.css';

const GlowingTextEffect = () => {
  const text = "Welcome Baby Chen";
  
  return (
    <div className="glowingtexteffect-container">
      {text.split("").map((char, index) => (
        <span 
          key={index}
          className={`glowingtexteffect-char glowingtexteffect-char-${index + 1}`}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
};

export default GlowingTextEffect;