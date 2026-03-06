import React, { useEffect, useRef } from "react";
import "./OurHomePageBackground.css";

const OurHomePageBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createBubble = () => {
      const bubble = document.createElement("div");
      bubble.className = "ohpbackground-bubble";
      
      // Random properties
      const size = Math.random() * 30 + 20;
      const left = Math.random() * 100;
      const duration = Math.random() * 10 + 10;
      const curve = Math.random() * 100 - 50;
      
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${left}%`;
      bubble.style.bottom = `-${size}px`;
      bubble.style.animationDuration = `${duration}s`;
      
      // Create curved animation
      const keyframes = `
        @keyframes float {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100vh) translateX(${curve}px); opacity: 0; }
        }
      `;
      
      const style = document.createElement("style");
      style.innerHTML = keyframes;
      document.head.appendChild(style);
      
      bubble.style.animationName = "float";
      container.appendChild(bubble);
      
      // Remove bubble and style after animation completes
      setTimeout(() => {
        bubble.remove();
        style.remove();
      }, duration * 1000);
    };

    // Create initial bubbles
    for (let i = 0; i < 15; i++) {
      createBubble();
    }

    // Create new bubbles periodically
    const interval = setInterval(createBubble, 2000);

    return () => clearInterval(interval);
  }, []);

  return <div ref={containerRef} className="ohpbackground-container" />;
};

export default OurHomePageBackground;