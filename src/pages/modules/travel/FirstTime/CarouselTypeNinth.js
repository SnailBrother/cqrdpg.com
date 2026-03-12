import React from 'react';
import './CarouselTypeNinth.css';

const CarouselTypeNinth = () => {
  const firstRowItems = [
    {
      title: '南山夜景',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeNinth/1.jpg'
    },
    {
      title: '巴南农家乐',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeNinth/6.jpg'
    }
  ];

  const mainItem = {
    title: '时光印记',
    subtitle: '记忆的碎片'
  };

  const secondRowItems = [
    {
      title: '赖床',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeNinth/2.jpg'
    },
    {
      title: '八喜',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeNinth/3.jpg'
    },
    {
      title: '葛优瘫',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeNinth/4.jpg'
    },
    {
      title: '胖丁',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeNinth/5.jpg'
    }
  ];

  return (
    <div className="carouseltypeninth-container">
      {/* First Row - Two Hexagons + Text Content */}
      <div className="carouseltypeninth-first-row">
        <div className="carouseltypeninth-first-row-images">
          {firstRowItems.map((item, index) => (
            <div key={index} className="carouseltypeninth-first-row-hexagon-item">
              <div 
                className="carouseltypeninth-first-row-hexagon" 
                style={{ backgroundImage: `url(${item.image})` }}
              >
                <div className="carouseltypeninth-first-row-hexagon-text">{item.title}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="carouseltypeninth-text-content">
          <h2 className="carouseltypeninth-main-title">{mainItem.title}</h2>
          <p className="carouseltypeninth-main-subtitle">{mainItem.subtitle}</p>
          <button className="carouseltypeninth-more-btn">查看更多 &gt;</button>
        </div>
      </div>

      {/* Second Row - Four Hexagon Items */}
      <div className="carouseltypeninth-second-row">
        {secondRowItems.map((item, index) => (
          <div key={index} className="carouseltypeninth-second-row-item">
            <div 
              className="carouseltypeninth-second-row-hexagon" 
              style={{ backgroundImage: `url(${item.image})` }}
            >
              <div className="carouseltypeninth-second-row-hexagon-text">{item.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarouselTypeNinth;