import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Computer.module.css';
import Music from './page/Music/CarouselTypeThird'; 
import HomePage from './page/Music/HomePage'; 
import GalleryPage from './page/Music/GalleryPage'; 
import ProfilePage from './page/Music/ProfilePage'; 

const HomeOptions = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  
  // 导航项 - 对应每个页面
  const navItems = ['音乐', '记账', '办公', '聊天', '旅游', '系统', '穿搭', '小工具'];
  const totalPages = 8; // 总共8个页面
  
  // 翻页到指定页面
  const goToPage = useCallback((pageIndex) => {
    if (isAnimating || pageIndex === currentPage) return;
    
    setIsAnimating(true);
    setCurrentPage(pageIndex);
    
    // 平滑滚动效果
    if (containerRef.current) {
      containerRef.current.style.transform = `translateY(-${pageIndex * 100}vh)`;
    }
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  }, [currentPage, isAnimating]);
  
  // 下一页
  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);
  
  // 上一页
  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);
  
  // 鼠标滚轮事件
  useEffect(() => {
    const handleWheel = (e) => {
      if (isAnimating) return;
      
      e.preventDefault();
      
      if (e.deltaY > 0) {
        nextPage();
      } else if (e.deltaY < 0) {
        prevPage();
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [nextPage, prevPage, isAnimating]);
  
  // 触摸事件
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e) => {
      if (isAnimating) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY.current - touchEndY;
      
      if (deltaY > 50) {
        nextPage();
      } else if (deltaY < -50) {
        prevPage();
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [nextPage, prevPage, isAnimating]);
  
  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnimating) return;
      
      switch(e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prevPage();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextPage, prevPage, isAnimating]);
  
  return (
    <div className={styles.container}>
      {/* 页面容器 */}
      <div 
        ref={containerRef} 
        className={styles.pageContainer}
        style={{ transform: `translateY(-${currentPage * 100}vh)` }}
      >
        {/* 第1页 - 主页（包含导航栏） */}
        <div className={styles.page}>
          {/* 只在第一页显示的导航栏 */}
          <nav className={styles.navBar}>
            <div className={styles.navContent}>
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`${styles.navButton} ${currentPage === index ? styles.navActive : ''}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </nav>
          <div className={`${styles.pageContent} ${styles.page1}`}>
            <ProfilePage/>
            {/* 在这里添加音乐页面内容 */}
         
          </div>
        </div>
        
        {/* 第2页 - 记账 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page2}`}>
            {/* <h2>记账</h2> */}
            <HomePage/>
          </div>
        </div>
        
        {/* 第3页 - 办公 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page3}`}>
            {/* <h2>办公</h2> */}
           <Music/>  
          </div>
        </div>
        
        {/* 第4页 - 聊天 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page4}`}>
            {/* <h2>聊天</h2> */}
             <GalleryPage/>
          </div>
        </div>
        
        {/* 第5页 - 旅游 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page5}`}>
            <h2>旅游</h2>
            {/* 在这里添加旅游页面内容 */}
          </div>
        </div>
        
        {/* 第6页 - 系统 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page6}`}>
            <h2>系统</h2>
            {/* 在这里添加系统页面内容 */}
          </div>
        </div>
        
        {/* 第7页 - 穿搭 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page7}`}>
            <h2>穿搭</h2>
            {/* 在这里添加穿搭页面内容 */}
          </div>
        </div>
        
        {/* 第8页 - 小工具 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page8}`}>
            <h2>小工具</h2>
            {/* 在这里添加小工具页面内容 */}
          </div>
        </div>
      </div>
      
      {/* 页面指示器 */}
      <div className={styles.indicators}>
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${currentPage === index ? styles.active : ''}`}
            onClick={() => goToPage(index)}
          />
        ))}
      </div>
      
      {/* 翻页箭头 */}
      {currentPage > 0 && (
        <button 
          className={styles.prevButton}
          onClick={prevPage}
        >
          ↑
        </button>
      )}
      {currentPage < totalPages - 1 && (
        <button 
          className={styles.nextButton}
          onClick={nextPage}
        >
          ↓
        </button>
      )}
    </div>
  );
};

export default HomeOptions;