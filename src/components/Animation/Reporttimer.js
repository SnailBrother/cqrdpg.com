//如果您需要更精确的后台计时，可以创建 Web Worker 创建 timer.worker.js
//59秒 → 1分钟：59s → 00:00:59 → 00:01:00

//9分钟59秒 → 10分钟：599s → 00:09:59 → 00:10:00

//59分钟59秒 → 1小时：3599s → 00:59:59 → 01:00:00

//1小时59分钟59秒 → 2小时：7199s → 01:59:59 → 02:00:00
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Reporttimer.css'; // 确保您的CSS样式文件路径正确

/**
 * Flipper 类：一个纯粹的动画控制器，不涉及React状态。
 * 它只负责接收指令，操作DOM来执行翻转动画。
 */
class Flipper {
  constructor(node) {
    this.isFlipping = false;
    this.duration = 600; // 动画时长 (ms)
    this.flipNode = node;
    this.frontNode = node.querySelector(".reporttimer-front");
    this.backNode = node.querySelector(".reporttimer-back");
  }

  // 设置初始数字，不带动画
  setNumber(number) {
    if (!this.frontNode || !this.backNode) return;
    this.frontNode.dataset.number = number;
    this.backNode.dataset.number = number;
  }

  // 执行向下翻转的动画
  flipDown(currentTime, nextTime) {
    if (this.isFlipping || !this.flipNode) {
      return;
    }

    this.isFlipping = true;
    this.frontNode.dataset.number = currentTime;
    this.backNode.dataset.number = nextTime;

    this.flipNode.classList.add("reporttimer-running");

    setTimeout(() => {
      this.flipNode.classList.remove("reporttimer-running");
      this.isFlipping = false;
      this.frontNode.dataset.number = nextTime; // 动画结束后，将前面的数字更新为最新值
    }, this.duration);
  }
}

const Reporttimer = ({ isRunning, onTimeUpdate, reset }) => {
  // DOM 节点的 refs
  const domRefs = useRef([]);
  // Flipper 实例的 refs，与React渲染分离
  const flipperRefs = useRef([]);
  // 计时器相关的 refs
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(0);
  
  // 唯一的时间状态源
  const [time, setTime] = useState(0);

  // 格式化时间的核心函数 (使用 useCallback 优化)
  const formatTime = useCallback((totalSeconds) => {
    const safeSeconds = Math.max(0, totalSeconds || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    return [
      Math.floor(hours / 10), hours % 10,
      Math.floor(minutes / 10), minutes % 10,
      Math.floor(seconds / 10), seconds % 10
    ];
  }, []);

  // --- 初始化 Flippers ---
  useEffect(() => {
    domRefs.current.forEach((node, i) => {
      if (node && !flipperRefs.current[i]) {
        flipperRefs.current[i] = new Flipper(node);
        flipperRefs.current[i].setNumber(0);
      }
    });
  }, []);

  // --- 核心计时器逻辑 ---
  useEffect(() => {
    let lastSecond = time;
    const tick = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsedMilliseconds = timestamp - startTimeRef.current;
      const currentTotalSeconds = Math.floor(elapsedMilliseconds / 1000);
      if (currentTotalSeconds !== lastSecond) {
        lastSecond = currentTotalSeconds;
        setTime(currentTotalSeconds);
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    if (isRunning) {
      startTimeRef.current = performance.now() - time * 1000;
      animationFrameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, time]);

  // --- 核心翻牌逻辑 ---
  useEffect(() => {
    // 初始加载或重置后，time为0时不执行翻转
    if (time === 0 && startTimeRef.current === 0) return;
    
    // 当time为0但计时器已启动过（非首次加载），说明是reset触发的，也需要计算翻转
    const prevSecond = (time === 0) ? 1 : time - 1;
    const prevTimeArr = formatTime(prevSecond);
    const currentTimeArr = formatTime(time);
    
    // 遍历所有数字位，如果发生变化，则触发对应 Flipper 的动画
    flipperRefs.current.forEach((flipper, i) => {
      if (flipper && prevTimeArr[i] !== currentTimeArr[i]) {
        flipper.flipDown(prevTimeArr[i], currentTimeArr[i]);
      }
    });
  }, [time, formatTime]);

  // --- 重置逻辑 ---
  useEffect(() => {
    if (reset) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setTime(0);
      startTimeRef.current = 0; // 标记计时器已重置
      
      // 直接命令 Flipper 实例重置到0，无需等待React渲染
      flipperRefs.current.forEach(flipper => {
        if (flipper) flipper.setNumber(0);
      });
    }
  }, [reset]);

  // --- 时间更新回调 ---
  useEffect(() => {
    if (onTimeUpdate) onTimeUpdate(time);
  }, [time, onTimeUpdate]);


  // --- JSX 渲染 ---
  return (
    <div className="reporttimer-container">
      <div className="reporttimer">
        {[...Array(6)].map((_, i) => (
          <React.Fragment key={i}>
            <div className="reporttimer-flip" ref={el => domRefs.current[i] = el}>
              <div className="reporttimer-digital reporttimer-front" data-number="0"></div>
              <div className="reporttimer-digital reporttimer-back" data-number="0"></div>
            </div>
            {(i === 1 || i === 3) && <div className="reporttimer-divider">:</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Reporttimer;