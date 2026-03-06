//确认对话框
import React from 'react';
import './ConfirmationDialog.css';

const ConfirmationDialog = ({
    isOpen,
    message,
    onConfirm,
    onCancel,
    confirmText = "确定",
    cancelText = "取消"
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirmation-dialog-overlay">
            <div className="confirmation-dialog">
                <div className="confirmation-dialog-content">
                    <p>{message}</p>
                </div>
                <div className="confirmation-dialog-actions">
                    <button
                        className="confirmation-dialog-button confirmation-dialog-cancel"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="confirmation-dialog-button confirmation-dialog-confirm"
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