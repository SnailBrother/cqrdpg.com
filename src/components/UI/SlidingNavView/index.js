// SlidingNavView.jsx
import React, { useState, useRef } from 'react';
import styles from './SlidingNavView.module.css';

const SlidingNavView = ({
    // 页面配置
    pages = [], // 页面组件数组 [{ component: Component, props: {} }]
    
    // 导航配置
    navType = 'dots', // 'dots' 或 'text'
    
    // 文字导航配置
    labels = [], // 导航文字标签数组
    
    // 自定义样式
    containerStyle = {},
    contentStyle = {},
    
    // 初始页面索引
    defaultIndex = 0,
    
    // 回调函数
    onPageChange = () => {},
    
    // 自定义渲染导航
    renderNav,
    
    // 滑动灵敏度
    swipeThreshold = 50,
    
    // 其他配置
    animationDuration = 0.3,
    className = '',
}) => {
    const [activeIndex, setActiveIndex] = useState(defaultIndex);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const contentRef = useRef(null);

    // 处理页面切换
    const handlePageChange = (index) => {
        if (index >= 0 && index < pages.length) {
            setActiveIndex(index);
            onPageChange(index);
        }
    };

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
        const isLeftSwipe = distance > swipeThreshold;
        const isRightSwipe = distance < -swipeThreshold;

        if (isLeftSwipe && activeIndex < pages.length - 1) {
            handlePageChange(activeIndex + 1);
        } else if (isRightSwipe && activeIndex > 0) {
            handlePageChange(activeIndex - 1);
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    // 获取内容容器的变换样式
    const getContentTransform = () => {
        return `translateX(-${activeIndex * 100}%)`;
    };

    // 渲染页面内容
    const renderPages = () => {
        return (
            <div 
                className={styles.sliderContainer}
                style={{ 
                    transform: getContentTransform(),
                    transition: `transform ${animationDuration}s ease-out`
                }}
            >
                {pages.map((page, index) => {
                    const PageComponent = page.component;
                    return (
                        <div key={index} className={styles.slidePage}>
                            <PageComponent {...page.props} />
                        </div>
                    );
                })}
            </div>
        );
    };

    // 渲染点状导航
    const renderDotsNav = () => {
        return (
            <div className={styles.dotsNav}>
                <div className={styles.navBar}>
                    {pages.map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.navButton} ${activeIndex === index ? styles.active : ''}`}
                            onClick={() => handlePageChange(index)}
                        >
                            <div className={styles.line}></div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // 渲染文字导航
    const renderTextNav = () => {
        const navLabels = labels.length === pages.length ? labels : pages.map((_, i) => `页面${i + 1}`);
        
        return (
            <div className={styles.textNav}>
                <div className={styles.textNavBar}>
                    {navLabels.map((label, index) => (
                        <button
                            key={index}
                            className={`${styles.textNavButton} ${activeIndex === index ? styles.active : ''}`}
                            onClick={() => handlePageChange(index)}
                        >
                            <span>{label}</span>
                            <div className={styles.activeLine}></div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div 
            className={`${styles.slidingNavView} ${className}`}
            style={containerStyle}
        >
            {/* 导航栏 */}
            <div className={styles.navWrapper}>
                {renderNav ? renderNav(activeIndex, handlePageChange) : (
                    navType === 'dots' ? renderDotsNav() : renderTextNav()
                )}
            </div>

            {/* 内容区域 - 支持滑动 */}
            <div 
                className={styles.fullscreenContent}
                ref={contentRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={contentStyle}
            >
                {renderPages()}
            </div>
        </div>
    );
};

export default SlidingNavView;