//打字特效
import React, { useState, useEffect } from 'react';
import './TypingAnimation.css';

const TypingAnimation = ({ text = "下一站更精彩！", fontSize = "30px" }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const charCount = text.length;

  useEffect(() => {
    let timer;
    
    if (isTyping) {
      // 打字效果
      let currentLength = displayText.length;
      if (currentLength < charCount) {
        timer = setTimeout(() => {
          setDisplayText(text.substring(0, currentLength + 1));
        }, 1800 / charCount); // 根据字符数量分配时间
      } else {
        // 打字完成后等待1秒，然后开始删除
        timer = setTimeout(() => {
          setIsTyping(false);
        }, 1000);
      }
    } else {
      // 删除效果
      let currentLength = displayText.length;
      if (currentLength > 0) {
        timer = setTimeout(() => {
          setDisplayText(text.substring(0, currentLength - 1));
        }, 1000 / charCount); // 删除速度比打字快
      } else {
        // 删除完成后等待0.5秒，然后重新开始打字
        timer = setTimeout(() => {
          setIsTyping(true);
        }, 500);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isTyping, text, charCount]);

  return (
    <div className="typinganimation-container">
      <div 
        className="typinganimation-text"
        style={{ 
          fontSize: fontSize,
          '--char-width': `${parseInt(fontSize) * 0.8}px`
        }}
      >
        {displayText}
        {/* 只在打字时显示光标 */}
        {isTyping && <span className="typinganimation-cursor">|</span>}
      </div>
    </div>
  );
};

export default TypingAnimation;