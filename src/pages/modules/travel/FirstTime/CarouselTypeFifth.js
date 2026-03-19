import React, { useState } from 'react';
import './CarouselTypeFifth.css';

const CarouselTypeFifth = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const items = [
    {
      title: '武陵山大裂谷',
      subtitle: '夏天',
      description: '那年我们一起去峡谷探险',
      images: [
        { src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFifth/1.jpg`, desc: '陈宝宝下车在和妈妈打电话' },
        { src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFifth/2.jpg`, desc: '陈宝宝刚出洞口' }
      ],
      bgColor: '#4a6fa5'
    },
    {
      title: '丰都蓝天湖',
      subtitle: '冬天',
      description: '那年我们一起去滑雪',
      images: [
        { src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFifth/3.jpg`, desc: '羞涩的陈宝宝' },
        { src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFifth/4.jpg`, desc: '可爱的陈宝宝' }
      ],
      bgColor: '#c45c4a'
    },
    {
      title: '江津四面山',
      subtitle: '夏天',
      description: '那年我们一起去爬山',
      images: [
        { src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFifth/5.jpg`, desc: '好大的瀑布' },
        { src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFifth/6.jpg`, desc: '陈宝宝被冷风吹' }
      ],
      bgColor: '#5a8f69'
    }
  ];

  const toggleItem = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className="carouseltypefifth-container">

      <div className="carouseltypefifth-header-titcontainer">
        <div className="carouseltypefifth-title-container">
          <div className="carouseltypefifth-title-bg"></div>
          <h2 className="carouseltypefifth-title">
            <span className="carouseltypefifth-title-text">我们的旅行</span>
            <span className="carouseltypefifth-title-stroke">我们的旅行</span>
          </h2>
          <div className="carouseltypefifth-decoration">
            <div className="carouseltypefifth-decoration-path"></div>
            <div className="carouseltypefifth-decoration-icon">✈</div>
          </div>
        </div>
      </div>


      <div className="carouseltypefifth-accordion">
        {items.map((item, index) => (
          <div
            key={index}
            className={`carouseltypefifth-item ${index === activeIndex ? 'active' : ''}`}
            onClick={() => toggleItem(index)}
            style={{ backgroundColor: item.bgColor }}
          >
            <div className="carouseltypefifth-header">
              <div className="carouseltypefifth-title-wrapper">
                {item.title.split('').map((char, i) => (
                  <span key={i} className="carouseltypefifth-char">{char}</span>
                ))}
                <p className="carouseltypefifth-subtitle">{item.subtitle}</p>
              </div>
            </div>

            <div className="carouseltypefifth-content">
              <div className="carouseltypefifth-description">
                {item.description}
              </div>
              <div className="carouseltypefifth-images">
                {item.images.map((image, imgIndex) => (
                  <div key={imgIndex} className="carouseltypefifth-image-container">
                    <img
                      src={image.src}
                      alt={image.desc}
                      className="carouseltypefifth-image"
                    />
                    <p className="carouseltypefifth-image-desc">{image.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarouselTypeFifth;