//文字融化消失
import React from 'react';
import './WordsMeltAway.css';

const WordsMeltAway = () => {
    const words = [
        "初见你时，心跳漏了半拍",
        "你的眼睛，藏着整个星空",
        "牵你的手，就是握住了永远",
        "余生很短，有你才叫时光"
    ];

    return (
        <div className="wordsmeltaway-container">
            {words.map((word, index) => (
                <div 
                    key={index}
                    className={`wordsmeltaway-word wordsmeltaway-word-${index + 1}`}
                    data-content={word}
                >
                    {/* {word} */}
                </div>
            ))}
        </div>
    );
};

export default WordsMeltAway;