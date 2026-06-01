// src/components/UI/PendingBox/index.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './index.module.css';

const PendingBox = ({
  visible,
  message = '操作成功，你有一条新消息。',
  duration = 5,
  type = 'success',
  onClose,
}) => {
  const [countdown, setCountdown] = useState(duration);
  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      setCountdown(duration);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            onCloseRef.current();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, duration]);

  const handleConfirm = useCallback(() => {
    setTimeout(() => {
      onCloseRef.current();
    }, 0);
  }, []);

  if (!visible) return null;

  const getIconContent = () => {
    if (type === 'success') {
      return <span className={styles.iconInner}>✓</span>;
    }
    return <span className={styles.iconInner}>!</span>;
  };

  const getIconStyle = () => {
    if (type === 'success') {
      return `${styles.infoIcon} ${styles.successIcon}`;
    }
    return `${styles.infoIcon} ${styles.errorIcon}`;
  };

  // 使用 Portal 将弹窗渲染到 body
  const modalContent = (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>
            {type === 'success' ? '提示' : '错误'}
          </span>
          <button className={styles.closeBtn} onClick={handleConfirm}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.iconWrap}>
            <div className={getIconStyle()}>
              {getIconContent()}
            </div>
          </div>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.footer}>
          <button 
            className={`${styles.confirmBtn} ${type === 'success' ? styles.successBtn : styles.errorBtn}`} 
            onClick={handleConfirm}
          >
            确定 ({countdown}s)
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PendingBox;