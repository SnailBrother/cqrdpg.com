import React, { useState, useEffect } from 'react';
import './CarouselTypeSecond.css';

const images = [
  { id: 1, src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSecond/1.jpg`, alt: 'Image 1' },
  { id: 2, src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSecond/2.jpg`, alt: 'Image 2' },
  { id: 3, src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSecond/3.jpg`, alt: 'Image 3' },
  { id: 4, src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSecond/4.jpg`, alt: 'Image 4' },
];

const CarouselTypeSecond = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  // 自动轮播
  const startAutoPlay = () => {
    clearInterval(timer);
    const newTimer = setInterval(() => {
      if (!isHovering) {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }
    }, 2000);
    setTimer(newTimer);
  };

  // 手动切换
  const handleSwitch = (index) => {
    clearInterval(timer);
    setCurrentIndex(index);
    startAutoPlay();
  };

  // 上一张
  const prevSlide = () => {
    clearInterval(timer);
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    startAutoPlay();
  };

  // 下一张
  const nextSlide = () => {
    clearInterval(timer);
    setCurrentIndex(prev => (prev + 1) % images.length);
    startAutoPlay();
  };

  // 处理鼠标悬停
  const handleMouseEnter = () => {
    setIsHovering(true);
    clearInterval(timer);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    startAutoPlay();
  };

  // 初始化自动轮播
  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(timer);
  }, [isHovering]);

  return (
    <div className="carouseltypesecond-box" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="carouseltypesecond-header">
        <div className="carouseltypesecond-title-container">
          <h2 className="carouseltypesecond-title">忆路渝行</h2>
        </div>
      </div>
      {/* 轮播图片区域 */}
      <ul className="carouseltypesecond-ul1">
        {images.map((img, index) => (
          <li
            key={img.id}
            className={`carouseltypesecond-slide ${
              index === currentIndex ? 'carouseltypesecond-active' : 
              index === (currentIndex - 1 + images.length) % images.length ? 'carouseltypesecond-prev' : 
              index === (currentIndex + 1) % images.length ? 'carouseltypesecond-next' : ''
            }`}
          >
            <img src={img.src} alt={img.alt} className="carouseltypesecond-img" />
          </li>
        ))}
      </ul>

      {/* 左右按钮 */}
      <div
        className="carouseltypesecond-left-button carouseltypesecond-indexs"
        onClick={prevSlide}
      >
        &lt;
      </div>
      <div
        className="carouseltypesecond-right-button carouseltypesecond-indexs"
        onClick={nextSlide}
      >
        &gt;
      </div>

      {/* 指示器 */}
      <ul className="carouseltypesecond-ul2 carouseltypesecond-indexs">
        {images.map((_, index) => (
          <li
            key={index}
            className={`carouseltypesecond-indicator ${index === currentIndex ? 'carouseltypesecond-active-indicator' : ''}`}
            onClick={() => handleSwitch(index)}
          >
            {index + 1}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CarouselTypeSecond;