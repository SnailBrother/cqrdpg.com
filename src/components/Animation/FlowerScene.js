import React, { useRef, useEffect } from 'react';
import './FlowerScene.css';

const FlowerScene = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio;

        const PI = Math.PI;
        const TAU = PI * 2;
        const GOLDEN = (Math.sqrt(5) + 1) / 2;

        let tick = 320;
        let width, height, hwidth, hheight;

        // 花朵配置数组，每朵花有不同的参数
        const flowers = [
            { 
                scale: 1.0, 
                xOffset: 0, 
                yOffset: 0, 
                speed: 0.5, 
                hueOffset: 0,
                moveSpeed: 0.3,
                moveAngle: Math.random() * TAU,
                moveRadius: 150
            },
            { 
                scale: 0.7, 
                xOffset: -150, 
                yOffset: 100, 
                speed: 0.3, 
                hueOffset: 120,
                moveSpeed: 0.5,
                moveAngle: Math.random() * TAU,
                moveRadius: 200
            },
            { 
                scale: 1.3, 
                xOffset: 150, 
                yOffset: -80, 
                speed: 0.7, 
                hueOffset: 240,
                moveSpeed: 0.2,
                moveAngle: Math.random() * TAU,
                moveRadius: 250
            }
        ];

        const reset = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            hwidth = width * 0.5;
            hheight = height * 0.5;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            ctx.translate(~~hwidth, ~~hheight);
            ctx.globalCompositeOperation = 'lighter';
            tick = 320;
            
            // 重置花朵位置
            flowers.forEach(flower => {
                flower.moveAngle = Math.random() * TAU;
            });
        };

        const updateFlowerPositions = () => {
            const boundaryMargin = 100;
            
            flowers.forEach(flower => {
                // 更新移动角度（轻微随机变化）
                flower.moveAngle += (Math.random() - 0.5) * 0.1;
                
                // 计算新位置
                flower.xOffset += Math.cos(flower.moveAngle) * flower.moveSpeed;
                flower.yOffset += Math.sin(flower.moveAngle) * flower.moveSpeed;
                
                // 边界检测 - 如果接近边缘则改变方向
                if (Math.abs(flower.xOffset) > hwidth - boundaryMargin) {
                    flower.moveAngle = PI - flower.moveAngle;
                    flower.xOffset = Math.sign(flower.xOffset) * (hwidth - boundaryMargin);
                }
                
                if (Math.abs(flower.yOffset) > hheight - boundaryMargin) {
                    flower.moveAngle = -flower.moveAngle;
                    flower.yOffset = Math.sign(flower.yOffset) * (hheight - boundaryMargin);
                }
                
                // 偶尔随机改变方向
                if (Math.random() < 0.005) {
                    flower.moveAngle += (Math.random() - 0.5) * PI * 0.5;
                }
            });
        };

        const drawFlower = (flowerConfig) => {
            const count = 150;
            let angle = tick * -0.0005 * flowerConfig.speed;
            let amp = 0;
            
            for (let i = 0; i < count; i++) {
                angle += GOLDEN * TAU + Math.sin(tick * 0.01 * flowerConfig.speed) * 0.001;
                amp += (i - count / 2) * 0.01 + Math.cos(tick * 0.0075 * flowerConfig.speed) * 1;
                
                // 添加一些随机摆动
                const wiggleX = Math.sin(tick * 0.002 + i) * 5;
                const wiggleY = Math.cos(tick * 0.002 + i) * 5;
                
                const x = Math.cos(angle) * amp * flowerConfig.scale + 
                         Math.cos(tick * 0.00375 * flowerConfig.speed) * (count - i) * 0.3 + 
                         flowerConfig.xOffset + wiggleX;
                
                const y = Math.sin(angle) * amp * flowerConfig.scale + 
                         Math.sin(tick * 0.00375 * flowerConfig.speed) * (count - i) * 0.3 + 
                         flowerConfig.yOffset + wiggleY;
                
                const radius = (0.1 + i * 0.02) * flowerConfig.scale;
                const scale = (0.1 + amp * 0.1) * flowerConfig.scale;
                const hue = (tick * flowerConfig.speed + angle / TAU * 0.4 + 60 + flowerConfig.hueOffset) % 360;
                const saturation = 90;
                const lightness = 60;
                const alpha = 0.7 + Math.cos(tick * 0.015 * flowerConfig.speed + i) * 0.3;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.scale(scale, 1);
                ctx.rotate(PI * 0.25);
                ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
                ctx.restore();

                ctx.beginPath();
                ctx.arc(x, y, radius * 12, 0, TAU);
                ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.05})`;
                ctx.fill();
            }
        };

        const loop = () => {
            requestAnimationFrame(loop);
            tick += 0.5;
            ctx.clearRect(-hwidth, -hheight, width, height);
            
            // 更新花朵位置
            updateFlowerPositions();
            
            // 绘制所有花朵
            flowers.forEach(drawFlower);
        };

        reset();
        window.addEventListener('resize', reset);
        loop();

        return () => {
            window.removeEventListener('resize', reset);
        };
    }, []);

    return <canvas ref={canvasRef} className="flower-scene-canvas" />;
};

export default FlowerScene;