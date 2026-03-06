import React, { useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';

const ConfirmationDialogManager = ({ children }) => {
    const [dialog, setDialog] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => { },
        onCancel: () => { },
        confirmText: '确定',
        cancelText: '取消'
    });

    const confirm = (message, options = {}) => {
        return new Promise((resolve) => {
            setDialog({
                isOpen: true,
                message,
                onConfirm: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                },
                confirmText: options.confirmText || '确定',
                cancelText: options.cancelText || '取消'
            });
        });
    };

    return (
        <>
            {children(confirm)}
            <ConfirmationDialog
                isOpen={dialog.isOpen}
                message={dialog.message}
                onConfirm={dialog.onConfirm}
                onCancel={dialog.onCancel}
                confirmText={dialog.confirmText}
                cancelText={dialog.cancelText}
            />
        </>
    );
};

export default ConfirmationDialogManager;