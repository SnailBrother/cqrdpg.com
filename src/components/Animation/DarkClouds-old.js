import React from 'react';
import './DarkClouds.css';

const DarkClouds = ({ quote = ["你是个鬼魂，驾驶着一具用星尘做成的肉骨架。", "... 你在害怕什么？"] }) => {
  return (
    <div className="darkclouds-container">
      <h1 className="darkclouds-quote">
        {quote.map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </h1>

      <div className="darkclouds-clouds">
        <div className="darkclouds-clouds-1"></div>
        <div className="darkclouds-clouds-2"></div>
        <div className="darkclouds-clouds-3"></div>
      </div>
    </div>
  );
};

export default DarkClouds;