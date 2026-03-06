// src/components/UI/Button/index.js
// src/components/UI/Button/index.js
import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant, // 按钮变体（样式类型）
  size,    // 不设置默认值
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`${styles.button} ${
        variant ? styles[variant] : ''
      } ${
        size ? styles[size] : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
export default Button;