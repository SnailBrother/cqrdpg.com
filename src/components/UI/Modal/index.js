import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from '../Button';  // 改为默认导入
import styles from './Modal.module.css';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  footer,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  showFooter = true,
  className = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const modalContent = (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={`${styles.modal} ${styles[size]} ${className}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          {showCloseButton && (
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="关闭"
            >
              ×
            </button>
          )}
        </div>
        
        <div className={styles.modalBody}>{children}</div>
        
        {showFooter && (
          <div className={styles.modalFooter}>
            {footer || (
              <>
                <Button variant="outline" onClick={onClose}>
                  {cancelText}
                </Button>
                <Button variant="primary" onClick={onConfirm}>
                  {confirmText}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;