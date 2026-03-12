import React, { useState } from 'react';
import './CarouselTypeEighth.css';

const CarouselTypeEighth = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);
  
  const items = [
    {
      title: '白帝城',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeEighth/1.jpg`
    },
    {
      title: '刘备托孤',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeEighth/2.jpg`
    },
    {
      title: '山王坪',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeEighth/3.jpg`
    },
    {
      title: '习水',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeEighth/4.jpg`
    },
    {
      title: '园博园',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeEighth/5.jpg`
    },
    {
      title: '龚滩古镇',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeEighth/6.jpg`
    }
  ];

  return (
    <div className="carouseltypeeighth-container">
      <div className="carouseltypeeighth-header">
        <h2 className="carouseltypeeighth-title">岁月静好</h2>
        
      </div>
      
      {/* Main display area */}
      <div className="carouseltypeeighth-display">
        <img 
          src={items[activeIndex].src} 
          alt={items[activeIndex].title}
          className="carouseltypeeighth-main-image"
        />
      </div>
      
      {/* Navigation items */}
      <div className="carouseltypeeighth-nav">
        {items.map((item, index) => (
          <div 
            key={index}
            className={`carouseltypeeighth-nav-item ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div className="carouseltypeeighth-nav-disc">
              <div className="carouseltypeeighth-nav-disc-inner">
                <img 
                  src={item.src} 
                  alt={item.title} 
                  className={`carouseltypeeighth-nav-image ${hoverIndex === index ? 'rotate' : ''}`}
                />
              </div>
              <span className="carouseltypeeighth-nav-title">{item.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarouselTypeEighth;