import React from 'react';
import './CarouselTypeFourth.css';

const CarouselTypeFourth = () => {
  const items = [
    {
      title: '南坪万达',
      desc: '布鲁牛排海鲜自助',
      staticDesc: '陈宝宝在吃饭打喷嚏',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFourth/1.jpg`,
      position: 'top-left'
    },
    {
      title: '渝北园博园',
      desc: '山顶',
      staticDesc: '陈宝宝在(*^_^*)',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFourth/2.jpg`,
      position: 'top-right'
    },
    {
      title: '家天下',
      desc: '躺在床上还不起来',
      staticDesc: '陈宝宝在睡懒觉',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeFourth/3.jpg`,
      position: 'bottom-center'
    }
  ];

  return (
    <div className="carouseltypefourth-container">
      <div className="carouseltypefourth-header">
        <div className="carouseltypefourth-title-container">
          <h2 className="carouseltypefourth-title">
            <span className="carouseltypefourth-title-text">时光长廊</span>
          </h2>
          <div className="carouseltypefourth-decoration">
            <div className="carouseltypefourth-decoration-line"></div>
            <div className="carouseltypefourth-decoration-dot"></div>
            <div className="carouseltypefourth-decoration-line"></div>
          </div>
        </div>
      </div>

      <div className="carouseltypefourth-grid">
        {items.map((item, index) => (
          <div
            key={index}
            className={`carouseltypefourth-item carouseltypefourth-${item.position}`}
          >
            <img
              src={item.src}
              alt={item.title}
              className="carouseltypefourth-image"
            />
            {/* 新增的常驻显示介绍 */}
            <div className="carouseltypefourth-static-desc">
              <p>{item.staticDesc}</p>
            </div>
            <div className="carouseltypefourth-overlay">
              <h3 className="carouseltypefourth-title">{item.title}</h3>
              <p className="carouseltypefourth-desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarouselTypeFourth;  