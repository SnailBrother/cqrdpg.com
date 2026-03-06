import React, { useEffect } from 'react';
import './VariableFontAnimation.css';

const VariableFontAnimation = () => {
  const text = "期待我们有更多的旅行";
  
  useEffect(() => {
    const letters = document.querySelectorAll('.variablefontanimation-letter');
    const totalLetters = letters.length;
    const delayIncrement = 100;

    function easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    }

    function animateLetters(forward = true) {
      letters.forEach((letter, index) => {
        const normalizedIndex = Math.max(index, totalLetters - 1 - index) / (totalLetters - 1);
        const easedDelay = easeInOutQuart(normalizedIndex);
        const delay = easedDelay * (totalLetters - 1) * delayIncrement;

        setTimeout(() => {
          letter.style.setProperty("--wght", forward ? 700 : 100);
          letter.style.setProperty("--wdth", forward ? 300 : 150);
          letter.style.setProperty("--opacity", forward ? 1 : 0.25);
          letter.style.setProperty("--letter-spacing", forward ? "0.05em" : "0em");
        }, delay);
      });

      setTimeout(() => {
        animateLetters(!forward);
      }, 4000);
    }

    animateLetters();
  }, []);

  return (
    <div className="variablefontanimation-container">
      <div className="variablefontanimation-text">
        {text.split("").map((char, index) => (
          <span key={index} className="variablefontanimation-letter">
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default VariableFontAnimation;