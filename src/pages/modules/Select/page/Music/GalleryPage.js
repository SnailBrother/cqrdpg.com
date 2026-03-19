import React, { useState, useEffect, useCallback } from 'react';
import styles from './GalleryPage.module.css';

const GalleryPage = () => {
  // 图片数据
  const images = [
    'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/主题自定义.jpg',
    'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/特备提示.jpg',
    'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/聊天.jpg',
    'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/朋友圈.jpg',
    'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/消息发布.jpg',
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayInterval = 3000; // 3秒自动切换

  // 下一张图片
  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }, [images.length, isAnimating]);

  // 上一张图片
  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }, [images.length, isAnimating]);

  // 跳转到指定图片
  const goToSlide = (index) => {
    if (isAnimating || index === currentIndex) return;
    
    setIsAnimating(true);
    setCurrentIndex(index);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  // 自动轮播
  useEffect(() => {
    let intervalId;
    
    if (isAutoPlaying) {
      intervalId = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoPlaying, nextSlide]);

  // 鼠标悬停时暂停自动轮播
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnimating) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [prevSlide, nextSlide, isAnimating]);

  return (
    <div className={styles.container}>
      {/* 轮播容器 */}
      <div 
        className={styles.carouselContainer}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 图片列表 */}
        <div 
          className={styles.carouselTrack}
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isAnimating ? 'transform 0.5s ease-in-out' : 'none'
          }}
        >
          {images.map((img, index) => (
            <div 
              key={index} 
              className={styles.slide}
            >
              <img 
                src={img} 
                alt={`照片 ${index + 1}`}
                className={styles.slideImage}
                loading="lazy"
              />
              <div className={styles.slideNumber}>
                {index + 1} / {images.length}
              </div>
            </div>
          ))}
        </div>

        {/* 左侧切换按钮 */}
        <button 
          className={`${styles.navButton} ${styles.prevButton}`}
          onClick={prevSlide}
          aria-label="上一张"
          disabled={isAnimating}
        >
          <span className={styles.arrow}>‹</span>
        </button>

        {/* 右侧切换按钮 */}
        <button 
          className={`${styles.navButton} ${styles.nextButton}`}
          onClick={nextSlide}
          aria-label="下一张"
          disabled={isAnimating}
        >
          <span className={styles.arrow}>›</span>
        </button>

        {/* 轮播指示器 */}
        <div className={styles.indicators}>
          {images.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${currentIndex === index ? styles.active : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`跳转到第${index + 1}张图片`}
            />
          ))}
        </div>

        {/* 自动播放控制 */}
        <div className={styles.controls}>
          <button
            className={styles.controlButton}
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            aria-label={isAutoPlaying ? "暂停轮播" : "开始轮播"}
          >
            {isAutoPlaying ? "⏸️" : "▶️"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;