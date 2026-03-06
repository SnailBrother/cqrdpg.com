//一滴水滴滚动
import React, { useEffect, useRef } from 'react';
import './WaterDrop.css';

const WaterDrop = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const dropCount = 3; // 水滴数量
        
        // 清空容器
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // 创建主水滴
        const mainDrop = document.createElement('div');
        mainDrop.classList.add('waterdrop-main');
        container.appendChild(mainDrop);
        
        // 创建小水滴
        for (let i = 0; i < dropCount; i++) {
            const drop = document.createElement('div');
            drop.classList.add('waterdrop-child');
            
            // 随机属性
            const size = 10 + Math.random() * 30;
            const left = 20 + Math.random() * 60;
            const top = 20 + Math.random() * 60;
            const animationDuration = 4 + Math.random() * 4;
            
            drop.style.width = `${size}px`;
            drop.style.height = `${size}px`;
            drop.style.left = `${left}%`;
            drop.style.top = `${top}%`;
            drop.style.animationDuration = `${animationDuration}s`;
            drop.style.animationDelay = `${Math.random() * 2}s`;
            
            container.appendChild(drop);
        }
    }, []);

    return (
        <div className="waterdrop-container" ref={containerRef}></div>
    );
};

export default WaterDrop;