import React, { useState, useEffect, useRef } from 'react';
import './FunGames.css';

const FunGames = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pixelsRef = useRef([]);
  const runRef = useRef(true);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const startTimeRef = useRef(null);

  // 初始化画布和游戏
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;

    const handleMouseMove = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;
      
      if (x >= 0 && x <= 600 && y >= 0 && y <= 400) {
        mouseRef.current = { x, y };
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // 计时器
    startTimeRef.current = Date.now();
    const timerInterval = setInterval(() => {
      if (runRef.current) {
        setTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    // 生成新粒子
    const pixelInterval = setInterval(() => {
      if (runRef.current) {
        pixelsRef.current.push({
          sx: 599,
          sy: 399,
          vx: (0.5 - Math.random()) * 2,
          vy: (0.5 - Math.random()) * 2
        });
        setScore(prev => prev + 1);
      }
    }, 1000);

    // 游戏主循环
    const gameLoop = () => {
      if (!runRef.current) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制分数和时间
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "#1e90ff";
      ctx.fillText(`时间: ${time}秒`, 5, 20);
      ctx.fillText(`粒子: ${score}`, 5, 45);
      
      // 绘制鼠标指针
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制并更新所有粒子
      ctx.fillStyle = "white";
      const mouse = mouseRef.current;
      
      pixelsRef.current = pixelsRef.current.map(pixel => {
        // 更新位置
        let newSx = pixel.sx + pixel.vx;
        let newSy = pixel.sy + pixel.vy;
        let newVx = pixel.vx;
        let newVy = pixel.vy;
        
        // 边界碰撞检测
        if (newSx < 0 || newSx > 600) newVx = -newVx;
        if (newSy < 0 || newSy > 400) newVy = -newVy;
        
        // 绘制粒子
        ctx.beginPath();
        ctx.arc(pixel.sx, pixel.sy, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // 碰撞检测
        if (Math.abs(newSx - mouse.x) < 7 && Math.abs(newSy - mouse.y) < 7) {
          runRef.current = false;
          setGameOver(true);
        }
        
        return {
          ...pixel,
          sx: newSx,
          sy: newSy,
          vx: newVx,
          vy: newVy
        };
      });
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      clearInterval(pixelInterval);
      clearInterval(timerInterval);
      cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [time]); // 注意这里添加了time依赖

  // 游戏结束处理
  useEffect(() => {
    if (gameOver) {
      const restart = window.confirm(`游戏结束，您一共坚持了${time}秒,\n碰到${score}个粒子,\n按[确定]重新开始。`);
      if (restart) {
        pixelsRef.current = [];
        runRef.current = true;
        setScore(0);
        setTime(0);
        setGameOver(false);
        startTimeRef.current = Date.now();
        animationRef.current = requestAnimationFrame(() => {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        });
      }
    }
  }, [gameOver, score, time]);

  return (
    <div className="fgames-container">
      <canvas 
        ref={canvasRef} 
        className="fgames-canvas"
      />
    </div>
  );
};

export default FunGames;