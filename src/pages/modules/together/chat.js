import React, { useState, useRef, useEffect } from 'react';
import styles from './chat.module.css';
import Chat from '../chat/Chat';


const MusicMenu = () => {
    const [activeTab, setActiveTab] = useState('lyrics'); // 'lyrics', 'review', 'playlist'
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const contentRef = useRef(null);

    // 标签页顺序
    const tabs = ['lyrics', 'review', 'playlist'];
    const tabIndex = tabs.indexOf(activeTab);

    // 处理滑动切换
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && tabIndex < tabs.length - 1) {
            setActiveTab(tabs[tabIndex + 1]);
        } else if (isRightSwipe && tabIndex > 0) {
            setActiveTab(tabs[tabIndex - 1]);
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    // 获取内容组件的索引
    const getContentTransform = () => {
        return `translateX(-${tabIndex * 100}%)`;
    };

    const renderContent = () => {
        return (
            <div 
                className={styles.sliderContainer}
                style={{ transform: getContentTransform() }}
            >
                <div className={styles.slidePage}>
                    <Chat />
                </div>
                
            </div>
        );
    };

    return (
        <div className={styles.musicMenu}>
            {/* 全屏内容区域 - 支持滑动 */}
            <div 
                className={styles.fullscreenContent}
                ref={contentRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {renderContent()}
            </div>

            {/* 悬浮导航栏 - 横线样式 */}
            <div className={styles.floatingNav}>
                <div className={styles.navBar}>
                    <button
                        className={`${styles.navButton} ${activeTab === 'lyrics' ? styles.active : ''}`}
                        onClick={() => setActiveTab('lyrics')}
                    >
                        <div className={styles.line}></div>
                        {/* <span>歌词</span> */}
                    </button>
                    <button
                        className={`${styles.navButton} ${activeTab === 'review' ? styles.active : ''}`}
                        onClick={() => setActiveTab('review')}
                    >
                        <div className={styles.line}></div>
                        {/* <span>乐评</span> */}
                    </button>
                    <button
                        className={`${styles.navButton} ${activeTab === 'playlist' ? styles.active : ''}`}
                        onClick={() => setActiveTab('playlist')}
                    >
                        <div className={styles.line}></div>
                        {/* <span>歌单</span> */}
                    </button>
                </div>
            </div>

            {/* 页面指示器 */}
            <div className={styles.pageIndicator}>
                {tabs.map((_, index) => (
                    <div
                        key={index}
                        className={`${styles.indicatorDot} ${index === tabIndex ? styles.active : ''}`}
                        onClick={() => setActiveTab(tabs[index])}
                    />
                ))}
            </div>
        </div>
    );
};

export default MusicMenu;