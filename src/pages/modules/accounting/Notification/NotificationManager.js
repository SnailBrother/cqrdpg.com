//通知管理器
import React, { useState } from 'react';
import Notification from './Notification';

const NotificationManager = React.forwardRef((props, ref) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);

        return () => removeNotification(id);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    React.useImperativeHandle(ref, () => ({
        addNotification
    }));

    return (
        <div className="notification-container">
            {notifications.map(notification => (
                <Notification
                    key={notification.id}
                    message={notification.message}
                    type={notification.type}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
});

export default NotificationManager;