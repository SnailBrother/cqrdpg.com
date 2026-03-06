//加载指示器组件
// src/components/LoadingSpinner.js
import React from 'react';
//import './LoadingSpinner.css';

const LoadingSpinner = () => {
    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>数据加载中...</p>
        </div>
    );
};

export default LoadingSpinner;