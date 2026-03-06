// src/components/UI/LoadingAnimation/LoadingAnimation.js
import React from 'react';
import styles from './LoadingAnimation.module.css';

const LoadingAnimation = ({ message = '加载中...' }) => {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingContainer}>
        {/* 主加载动画 */}
        <div className={styles.spinner}>
          <div className={styles.spinnerCircle}></div>
          <div className={styles.spinnerCircle}></div>
          <div className={styles.spinnerCircle}></div>
          <div className={styles.spinnerCircle}></div>
        </div>
        
        {/* 加载文字 */}
        <div className={styles.loadingText}>
          <span className={styles.message}>{message}</span>
          <div className={styles.dots}>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;