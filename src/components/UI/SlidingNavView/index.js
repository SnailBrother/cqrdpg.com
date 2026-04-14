// SlidingNavView.jsx
import React, { useState, useRef } from 'react';
import styles from './SlidingNavView.module.css';

const SlidingNavView = ({
    // 页面配置
    pages = [], // 页面组件数组 [{ component: Component, props: {} }]
    
    // 导航配置
    navType = 'dots', // 'dots' 或 'text'
    navPosition = 'floating', // 'floating' 或 'inline'
    
    // 文字导航配置
    labels = [], // 导航文字标签数组
    activeColor = '#05f024',
    inactiveColor = 'rgba(206, 205, 205, 0.527)',
    
    // 自定义样式
    containerStyle = {},
    contentStyle = {},
    navStyle = {},
    
    // 初始页面索引
    defaultIndex = 0,
    
    // 回调函数
    onPageChange = () => {},
    
    // 是否显示页面指示器
    // showIndicator = true,
    
    // 自定义渲染导航
    renderNav,
   // renderIndicator,
    
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
                            style={{
                                '--active-color': activeColor,
                                '--inactive-color': inactiveColor
                            }}
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
                            style={{
                                '--active-color': activeColor,
                                '--inactive-color': 'rgba(255, 255, 255, 0.7)'
                            }}
                        >
                            <span>{label}</span>
                            <div className={styles.activeLine}></div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // 渲染页面指示器
    // const renderPageIndicator = () => {
    //     if (!showIndicator) return null;
        
    //     return (
    //         <div className={styles.pageIndicator}>
    //             {pages.map((_, index) => (
    //                 <div
    //                     key={index}
    //                     className={`${styles.indicatorDot} ${index === activeIndex ? styles.active : ''}`}
    //                     onClick={() => handlePageChange(index)}
    //                     style={{
    //                         '--active-color': activeColor
    //                     }}
    //                 />
    //             ))}
    //         </div>
    //     );
    // };

    return (
        <div 
            className={`${styles.slidingNavView} ${className}`}
            style={containerStyle}
        >
            {/* 导航栏 */}
            {navPosition === 'inline' && (
                <div className={styles.inlineNav} style={navStyle}>
                    {renderNav ? renderNav(activeIndex, handlePageChange) : (
                        navType === 'dots' ? renderDotsNav() : renderTextNav()
                    )}
                </div>
            )}

            {/* 全屏内容区域 - 支持滑动 */}
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

            {/* 悬浮导航栏 */}
            {navPosition === 'floating' && (
                <div className={styles.floatingNav} style={navStyle}>
                    {renderNav ? renderNav(activeIndex, handlePageChange) : (
                        navType === 'dots' ? renderDotsNav() : renderTextNav()
                    )}
                </div>
            )}

            {/* 页面指示器 */}
            {/* {renderIndicator ? renderIndicator(activeIndex, handlePageChange) : renderPageIndicator()} */}
        </div>
    );
};

export default SlidingNavView;