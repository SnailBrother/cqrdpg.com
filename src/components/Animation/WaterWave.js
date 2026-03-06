//水滴满屏跑
import React, { useRef, useEffect } from 'react';
import './WaterWave.css';

const WaterWave = () => {
    const dropsRef = useRef(null);

    useEffect(() => {
        const drops = dropsRef.current.children;
        const TAU = Math.PI * 2;

        // 水滴配置数组，每个水滴有不同的参数
        const waterDrops = [
            {
                scale: 1.0,
                xOffset: 0,
                yOffset: 0,
                speed: 0.5,
                moveSpeed: 0.3,
                moveAngle: Math.random() * TAU,
                moveRadius: 150
            },
            {
                scale: 0.7,
                xOffset: -200,
                yOffset: 180,
                speed: 0.3,
                moveSpeed: 0.5,
                moveAngle: Math.random() * TAU,
                moveRadius: 200
            },
            {
                scale: 0.7,
                xOffset: 280,
                yOffset: 10,
                speed: 0.7,
                moveSpeed: 0.2,
                moveAngle: Math.random() * TAU,
                moveRadius: 250
            },
            {
                scale: 0.5,
                xOffset: 120,
                yOffset: -350,
                speed: 0.4,
                moveSpeed: 0.4,
                moveAngle: Math.random() * TAU,
                moveRadius: 220
            }
        ];

        const width = window.innerWidth;
        const height = window.innerHeight;
        const hwidth = width * 0.5;
        const hheight = height * 0.5;

        const boundaryMargin = 100;

        const updateDropPositions = () => {
            waterDrops.forEach((drop, index) => {
                // 更新移动角度（轻微随机变化）
                drop.moveAngle += (Math.random() - 0.5) * 0.1;

                // 计算新位置
                drop.xOffset += Math.cos(drop.moveAngle) * drop.moveSpeed;
                drop.yOffset += Math.sin(drop.moveAngle) * drop.moveSpeed;

                // 边界检测 - 如果接近边缘则改变方向
                if (Math.abs(drop.xOffset) > hwidth - boundaryMargin) {
                    drop.moveAngle = Math.PI - drop.moveAngle;
                    drop.xOffset = Math.sign(drop.xOffset) * (hwidth - boundaryMargin);
                }

                if (Math.abs(drop.yOffset) > hheight - boundaryMargin) {
                    drop.moveAngle = -drop.moveAngle;
                    drop.yOffset = Math.sign(drop.yOffset) * (hheight - boundaryMargin);
                }

                // 偶尔随机改变方向
                if (Math.random() < 0.005) {
                    drop.moveAngle += (Math.random() - 0.5) * Math.PI * 0.5;
                }

                // 更新 DOM 元素的位置
                drops[index].style.transform = `scale(${drop.scale}) translate(${drop.xOffset}px, ${drop.yOffset}px)`;
            });
        };

        const loop = () => {
            requestAnimationFrame(loop);
            updateDropPositions();
        };

        loop();

    }, []);

    return (
        <div className="waterwave-drops" ref={dropsRef}>
            <div className="waterwave-drop"></div>
            <div className="waterwave-drop"></div>
            <div className="waterwave-drop"></div>
            <div className="waterwave-drop"></div>
        </div>
    );
};

export default WaterWave;    