// src/components/Layout/BottomNavLayout.js
 
import React from 'react';
import styles from './BottomNavLayout.module.css';

// 底部导航组件 - 现在只负责 UI 渲染
const BottomNav = ({ menuItems, activeKey, onMenuClick }) => {
  return (
    <div className={styles.bottomNav}>
      {menuItems.map(item => (
        <div
          key={item.key}
          className={`${styles.bottomNavItem} ${activeKey === item.key ? styles.active : ''}`}
          onClick={() => onMenuClick(item)}
        >
          <span className={styles.bottomNavIcon}>
            <svg className={styles.bottomNavSvgIcon} aria-hidden="true">
              <use xlinkHref={item.icon}></use>
            </svg>
          </span>
          <div className={styles.bottomNavLabel}>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default BottomNav;