//错误提示组件
// src/components/ErrorMessage.js
import React from 'react';
//import './ErrorMessage.css';

const ErrorMessage = ({ message, onRetry }) => {
    return (
        <div className="error-message-container">
            <div className="error-message">
                <span className="error-icon">⚠️</span>
                <p>{message}</p>
                <button onClick={onRetry} className="retry-button">重试</button>
            </div>
        </div>
    );
};

export default ErrorMessage;