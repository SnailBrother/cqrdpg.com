// WaterWave.js
import React, { useRef, useEffect } from 'react';
import styles from './Waterwave.module.css';

const Waterwave = ({
  // --- 基础配置 ---
  width = "100dvw",
  height = 100,
  verticalOffset = 0.65,

  // --- 第一层波浪配置 (底层) ---
  amplitude = 20,
  frequency = 0.008,
  speed = 0.01,
  color = '#e7eff169',
  colorStop = '#f9fdfd',

  // --- 第二层波浪配置 (顶层) ---
  amplitude2 = 15,
  frequency2 = 0.012,
  speed2 = 0.015,
  color2 = '#fafcfdc0',
  colorStop2 = '#fcfefe91'
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const phaseRef = useRef(0);
  const phaseRef2 = useRef(0);
  const floatPhaseRef = useRef(0);
  
  // 存储当前画布尺寸
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // 防抖函数 - 放在 useEffect 外面
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // 计算画布尺寸的函数
  const getCanvasSize = () => {
    let w, h;
    
    if (typeof width === 'string') {
      const viewportWidth = window.innerWidth;
      if (width.includes('dvw')) {
        w = viewportWidth * (parseFloat(width) / 100);
      } else {
        w = parseFloat(width);
      }
    } else {
      w = width;
    }

    if (typeof height === 'string') {
      if (height.includes('dvh')) {
        h = window.innerHeight * (parseFloat(height) / 100);
      } else {
        h = parseFloat(height);
      }
    } else {
      h = height;
    }
    
    return { width: w, height: h };
  };

  // 调整画布尺寸
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { width: w, height: h } = getCanvasSize();
    dimensionsRef.current = { width: w, height: h };
    
    canvas.width = w;
    canvas.height = h;
  };

  // 绘图函数
  const drawWave = (ctx, currentPhase, amp, freq, baseColor, stopColor, yOffset, w, h) => {
    ctx.beginPath();
    ctx.moveTo(0, h);

    for (let x = 0; x <= w; x += 1) {
      const sinValue = Math.sin(x * freq + currentPhase);
      const waveHeight = sinValue * amp;
      const y = (h * verticalOffset) + waveHeight + yOffset;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, stopColor);
    gradient.addColorStop(1, baseColor);
    
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // 初始化尺寸
    resizeCanvas();

    // 创建防抖版本的 resize 函数
    const debouncedResize = debounce(() => {
      resizeCanvas();
    }, 100); // 100ms 延迟

    // 监听窗口大小变化（使用防抖）
    window.addEventListener('resize', debouncedResize);

    const animate = () => {
      if (!canvas || !ctx) return;
      
      const { width: w, height: h } = dimensionsRef.current;
      if (w === 0 || h === 0) return;

      // 更新相位
      phaseRef.current += speed;
      phaseRef2.current += speed2;
      floatPhaseRef.current += 0.01;

      // 整体浮动偏移
      const floatOffset = Math.sin(floatPhaseRef.current) * 10;

      // 清空画布
      ctx.clearRect(0, 0, w, h);

      // 绘制第一层
      drawWave(ctx, phaseRef.current, amplitude, frequency, color, colorStop, floatOffset, w, h);

      // 绘制第二层
      drawWave(ctx, phaseRef2.current, amplitude2, frequency2, color2, colorStop2, floatOffset, w, h);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // 清理时移除监听器
      window.removeEventListener('resize', debouncedResize);
    };
  }, [
    amplitude, frequency, speed, color, colorStop, 
    amplitude2, frequency2, speed2, color2, colorStop2, 
    verticalOffset, width, height
  ]);

  return (
    <div className={styles.Container}>
      <div className={styles.waveone}>
        <canvas ref={canvasRef} className={styles.waveCanvas} />
      </div>
    </div>
  );
};

export default Waterwave;