//通知
import React, { useState, useEffect } from 'react';
import './Notification.css';

const Notification = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!visible) return null;

    return (
        <div className={`notification notification-${type}`}>
            <div className="notification-content">{message}</div>
            <button className="notification-close" onClick={() => {
                setVisible(false);
                onClose();
            }}>×</button>
        </div>
    );
};

export default Notification;