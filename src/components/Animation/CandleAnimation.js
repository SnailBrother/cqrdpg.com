//蜡烛吹灭动画
import React from 'react';
import './CandleAnimation.css';

const CandleAnimation = () => {
    return (
       <div className="candle-container">
            <div className="candle-wrapper">
                <div className="candle-candles">
                    <div className="candle-light-wave"></div>

                    {/* 蜡烛1 */}
                    <div className="candle-1">
                        <div className="candle-1-body">
                            <div className="candle-1-eyes">
                                <span className="candle-1-eyes-left"></span>
                                <span className="candle-1-eyes-right"></span>
                            </div>
                            <div className="candle-1-mouth"></div>
                        </div>
                        <div className="candle-1-stick"></div>
                    </div>

                    {/* 蜡烛2 */}
                    <div className="candle-2">
                        <div className="candle-2-body">
                            <div className="candle-2-eyes">
                                <span className="candle-2-eyes-left"></span>
                                <span className="candle-2-eyes-right"></span>
                            </div>
                        </div>
                        <div className="candle-2-stick"></div>
                    </div>

                    <div className="candle-2-fire"></div>
                    <div className="candle-sparkle-1"></div>
                    <div className="candle-sparkle-2"></div>
                    <div className="candle-smoke-1"></div>
                    <div className="candle-smoke-2"></div>
                </div>

                <div className="candle-floor"></div>
            </div>
      </div>
    );
};

export default CandleAnimation;