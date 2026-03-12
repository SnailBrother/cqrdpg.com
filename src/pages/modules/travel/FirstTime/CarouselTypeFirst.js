// CarouselTypeFirst.js
import React, { useState, useEffect, useRef } from'react';
import './CarouselTypeFirst.css';

const images = [
  { id: 0, src: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFirst/1.jpg', alt: 'Image 0' },
  { id: 1, src: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFirst/2.jpg', alt: 'Image 1' },
  { id: 2, src: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFirst/3.jpg', alt: 'Image 2' },
  { id: 3, src: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFirst/4.jpg', alt: 'Image 3' },
  { id: 4, src: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFirst/5.jpg', alt: 'Image 4' },
];

const CarouselTypeFirst = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  const startAutoPlay = () => {
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3000);
  };

  const stopAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleThumbnailHover = (index) => {
    stopAutoPlay();
    setCurrentIndex(index);
    startAutoPlay();
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, []);

  return (
    <div className="carouseltypefirst-wrapper">
       <div className="carouseltypefirst-header-box">
        <h2 className="carouseltypefirst-title">忆・之旅</h2>
      </div>
      <div className="carouseltypefirst-container">
        {/* 主图区域 */}
        <div 
          className="carouseltypefirst-big-box"
          style={{ backgroundImage: `url(${images[currentIndex].src})` }}
        />
        {/* 缩略图区域 */}
        <div className="carouseltypefirst-small-box">
          {images.map((img, index) => (
            <div 
              key={img.id}
              className={`carouseltypefirst-img ${index === currentIndex? 'carouseltypefirst-active' : ''}`}
              onMouseEnter={() => handleThumbnailHover(index)}
            >
              <img src={img.src} alt={img.alt} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselTypeFirst;