//文字框动画
// TextBoxAnimation.js
import React from 'react';
import './TextBoxAnimation.css';

const TextBoxAnimation = ({ 
  staticText = "Baby,", 
  dynamicTexts = [
    "my world!",
    "my sweetheart!",
    "my everything!",
    "my life!"
  ],
  fontSize = "40px",
  bracketColor = "#a04d16",
  textColor = "#a04d16",
  className = ""
}) => {
  // 计算容器高度，考虑下行线字符
  const containerHeight = parseInt(fontSize) * 1.5; // 增加50%的高度空间
  
  return (
    <div className={`textboxanimation-content ${className}`} style={{ '--bracket-color': bracketColor, color: textColor }}>
      <div className="textboxanimation-content_container" style={{ fontSize, height: `${containerHeight}px`, lineHeight: `${containerHeight}px` }}>
        <p className="textboxanimation-content_container_text">
          {staticText}
        </p>

        <ul className="textboxanimation-content_container_list">
          {dynamicTexts.map((text, index) => (
            <li key={index} className="textboxanimation-content_container_list_item">
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TextBoxAnimation;