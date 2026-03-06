//等待加载动画
import React from 'react';
import './WordReportGeneratorLoader.css';

const WordReportGeneratorLoader = () => {
    return (
        <div className="wordreportgeneratorloader-overlay">
            <div className="wordreportgeneratorloader-loader"></div>
        </div>
    );
};

export default WordReportGeneratorLoader;