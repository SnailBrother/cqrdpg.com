// src/components/UI/IconButton/index.js
// src/components/UI/IconButton/index.js
import React from 'react';
import styles from './IconButton.module.css';

const IconButton = ({ 
  icon,           // 可以是字符串（SVG sprite）、React 组件、或 JSX
  onClick,
  disabled = false,
  size = 'medium',
  variant = 'ghost',
  title = '',
  className = '',
  ...props 
}) => {
  const renderIcon = () => {
    // 如果是字符串，认为是 SVG sprite
    if (typeof icon === 'string' && icon.startsWith('#icon-')) {
      return (
        <svg className={styles.icon} aria-hidden="true">
          <use xlinkHref={icon}></use>
        </svg>
      );
    }
    
    // 如果是 React 组件
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent className={styles.icon} />;
    }
    
    // 如果是 JSX（比如 <span>📱</span>）
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: `${styles.icon} ${icon.props.className || ''}`
      });
    }
    
    // 默认情况，直接渲染
    return icon;
  };

  return (
    <button
      className={`${styles.iconButton} ${styles[variant]} ${styles[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {renderIcon()}
    </button>
  );
};

export default IconButton;