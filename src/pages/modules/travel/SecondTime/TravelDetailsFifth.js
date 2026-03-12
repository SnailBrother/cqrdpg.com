import React, { useState } from 'react';
import './TravelDetailsFifth.css';

const TravelDetailsFifth = () => {
  const images = [
    { id: 0, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFifth/1.jpg', alt: 'Image 0' },
    { id: 1, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFifth/2.jpg', alt: 'Image 1' },
    { id: 2, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFifth/3.jpg', alt: 'Image 2' },
    { id: 3, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFifth/4.jpg', alt: 'Image 3' },
    { id: 4, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFifth/5.jpg', alt: 'Image 4' },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="traveldetailsfifth-container">
      {/* 第一行：大图展示 */}
      <div className="traveldetailsfifth-main-image">
        <img 
          src={images[activeIndex].src} 
          alt={images[activeIndex].alt}
        />
      </div>

      {/* 第二行：小图预览区域 */}
      <div className="traveldetailsfifth-preview-wrapper">
        <div className="traveldetailsfifth-preview-container">
          {/* 三角指示器 - 现在精确居中 */}
          <div 
            className="traveldetailsfifth-indicator"
            style={{ left: `calc(${activeIndex * 20}% + 10%)` }}
          ></div>
          
          {/* 小图列表 */}
          <div className="traveldetailsfifth-preview-list">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`traveldetailsfifth-preview-item ${index === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
              >
                <img 
                  src={image.src} 
                  alt={image.alt}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelDetailsFifth;