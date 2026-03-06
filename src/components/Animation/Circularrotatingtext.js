//环形旋转文字
import React, { useEffect, useRef } from 'react';
import './Circularrotatingtext.css';

const Circularrotatingtext = ({ userHeadImage }) => {
    const textRef = useRef(null);

    useEffect(() => {
        const text = textRef.current;
        if (text) {
            const chars = text.textContent.split("");
            text.innerHTML = '';
            chars.forEach((char, i) => {
                const span = document.createElement('span');
                span.style.transform = `rotate(${i * 12.8}deg)`;
                span.textContent = char;
                text.appendChild(span);
            });
        }
    }, []);

    return (
        <div className="circularrotatingtext-box">
            <div
                className="circularrotatingtext-logo"
                style={{ backgroundImage: `url(${userHeadImage})` }} // 动态设置背景图片
            ></div>
            <div className="circularrotatingtext-text" ref={textRef}>
                请开始选择好友开始聊天吧
            </div>
        </div>
    );
};

export default Circularrotatingtext;