import React, { useState } from 'react';
import './DoubleChromosphere.css';

const DoubleChromosphere = () => {
    const [redBalls, setRedBalls] = useState(Array(6).fill(null));
    const [blueBall, setBlueBall] = useState(null);
    const [history, setHistory] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [nextIndex, setNextIndex] = useState(1); // 用于生成序号
    
    // 生成随机红球（1-33，不重复）
    const generateRedBalls = () => {
        const balls = [];
        while (balls.length < 6) {
            const ball = Math.floor(Math.random() * 33) + 1;
            if (!balls.includes(ball)) {
                balls.push(ball);
            }
        }
        return balls.sort((a, b) => a - b);
    };
    
    // 生成随机蓝球（1-16）
    const generateBlueBall = () => {
        return Math.floor(Math.random() * 16) + 1;
    };
    
    // 生成一组双色球号码
    const generateNumbers = () => {
        if (isGenerating) return;
        
        setIsGenerating(true);
        
        // 清空当前显示的球
        setRedBalls(Array(6).fill(null));
        setBlueBall(null);
        
        // 生成新的号码
        const newRedBalls = generateRedBalls();
        const newBlueBall = generateBlueBall();
        
        // 逐个显示红球的动画效果
        const delays = [300, 600, 900, 1200, 1500, 1800];
        
        delays.forEach((delay, index) => {
            setTimeout(() => {
                setRedBalls(prev => {
                    const updated = [...prev];
                    updated[index] = newRedBalls[index];
                    return updated;
                });
                
                // 最后一个红球显示后显示蓝球
                if (index === 5) {
                    setTimeout(() => {
                        setBlueBall(newBlueBall);
                        setIsGenerating(false);
                        
                        // 添加到历史记录，使用当前序号
                        const newHistoryItem = {
                            redBalls: [...newRedBalls],
                            blueBall: newBlueBall,
                            time: new Date().toLocaleTimeString(),
                            index: nextIndex // 使用当前序号
                        };
                        
                        setNextIndex(prev => prev + 1); // 序号递增
                        setHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]); // 只保留最近5条记录
                    }, 500);
                }
            }, delay);
        });
    };
    
    // 格式化号码显示（两位数）
    const formatNumber = (num) => {
        return num !== null ? num.toString().padStart(2, '0') : '?';
    };
    
    // 清空历史记录
    const clearHistory = () => {
        setHistory([]);
        setNextIndex(1); // 清空时重置序号
    };
    
    return (
        <div className="chromosphere-container">
            <h2 className="chromosphere-title">双色球选号</h2>
            
            {/* 当前选号显示区域 */}
            <div className="chromosphere-current">
                <div className="chromosphere-balls-container">
                    {/* 红球 */}
                    {redBalls.map((ball, index) => (
                        <div 
                            key={index} 
                            className={`chromosphere-ball ${ball ? 'chromosphere-ball-red chromosphere-animation' : 'chromosphere-ball-empty'}`}
                        >
                            {formatNumber(ball)}
                        </div>
                    ))}
                    
                    {/* 蓝球 */}
                    <div className={`chromosphere-ball ${blueBall ? 'chromosphere-ball-blue chromosphere-animation' : 'chromosphere-ball-empty'}`}>
                        {formatNumber(blueBall)}
                    </div>
                </div>
            </div>
            
            {/* 控制按钮 */}
            <div className="chromosphere-controls">
                <button 
                    className="chromosphere-button" 
                    onClick={generateNumbers}
                    disabled={isGenerating}
                >
                    {isGenerating ? '生成中...' : '选号'}
                </button>
                {history.length > 0 && (
                    <button 
                        className="chromosphere-button chromosphere-clear-button" 
                        onClick={clearHistory}
                    >
                        清空
                    </button>
                )}
            </div>
            
            {/* 历史记录 */}
            {history.length > 0 && (
                <div className="chromosphere-history">
                    <div className="chromosphere-history-title">记录：</div>
                    {history.map((item) => (
                        <div key={item.index} className="chromosphere-history-item">
                            <div className="chromosphere-history-index">{item.index}、</div>
                            <div className="chromosphere-history-balls">
                                {item.redBalls.map((ball, ballIndex) => (
                                    <div key={ballIndex} className="chromosphere-history-ball chromosphere-ball-red">
                                        {formatNumber(ball)}
                                    </div>
                                ))}
                                <div className="chromosphere-history-ball chromosphere-ball-blue">
                                    {formatNumber(item.blueBall)}
                                </div>
                            </div>
                            <div className="chromosphere-history-time">{item.time}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoubleChromosphere;