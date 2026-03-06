//自定义确认对话框组件：
 
import React from 'react';
import styles from './ConfirmationDialog.module.css';

const ConfirmationDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "确定",
  cancelText = "取消" 
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={styles.buttons}>
          <button 
            className={styles.cancelButton} 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={styles.confirmButton} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;