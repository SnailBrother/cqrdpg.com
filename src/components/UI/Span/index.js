// src/components/UI/Span/index.js
import React from 'react';
import styles from './Span.module.css';

const Span = ({
  children,
  variant, // 文本变体：primary, secondary, success, warning, danger, muted
  size, // 尺寸：small, medium, large
  weight, // 字重：normal, medium, bold
  color, // 自定义颜色
  className = '',
  ...props
}) => { 
  return (
    <span
      className={`${styles.span} ${
        variant ? styles[variant] : ''
      } ${
        size ? styles[size] : ''
      } ${
        weight ? styles[weight] : ''
      } ${className}`}
      style={color ? { color } : {}}
      {...props}
    >
      {children}
    </span>
  );
};

export { Span };
export default Span;