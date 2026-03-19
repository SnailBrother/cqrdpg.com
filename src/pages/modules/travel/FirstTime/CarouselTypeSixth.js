import React from 'react';
import './CarouselTypeSixth.css';

const CarouselTypeSixth = () => {
  const items = [
    {
      title: '园博园',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSixth/1.jpg`
    },
    {
      title: '地心谷',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSixth/2.jpg`
    },
    {
      title: '双凤村',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSixth/3.jpg`
    },
    {
      title: '习水',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSixth/4.jpg`
    },
    {
      title: '女儿城',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSixth/5.jpg`
    },
    {
      title: '丹霞谷',
      src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSixth/6.jpg`
    }
  ];

  return (
    <div className="carouseltypesixth-container">

      <div class="carouseltypesixth-header-titcontainer">
        <div class="carouseltypesixth-title-container">
          <div class="carouseltypesixth-title-bg"></div>
          <div class="carouseltypesixth-title-wrapper">
            <div class="carouseltypesixth-decoration-balloon left">🎈</div>
            <h2 class="carouseltypesixth-title">
              <span class="carouseltypesixth-title-text">快乐之旅</span>
              <span class="carouseltypesixth-title-3d">快乐之旅</span>
            </h2>
            <div class="carouseltypesixth-decoration-balloon right">🎈</div>
          </div>
        </div>
      </div>

      <div className="carouseltypesixth-grid">
        {/* First row - split into 2 columns */}
        <div className="carouseltypesixth-row">
          {/* First column - single item */}
          <div className="carouseltypesixth-item carouseltypesixth-large">
            <img src={items[0].src} alt={items[0].title} />
            <div className="carouseltypesixth-overlay">
              <h3>{items[0].title}</h3>
            </div>
          </div>

          {/* Second column - split into 2 rows */}
          <div className="carouseltypesixth-col">
            <div className="carouseltypesixth-item">
              <img src={items[1].src} alt={items[1].title} />
              <div className="carouseltypesixth-overlay">
                <h3>{items[1].title}</h3>
              </div>
            </div>
            <div className="carouseltypesixth-item">
              <img src={items[2].src} alt={items[2].title} />
              <div className="carouseltypesixth-overlay">
                <h3>{items[2].title}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Second row - 3 columns */}
        <div className="carouseltypesixth-row">
          <div className="carouseltypesixth-item">
            <img src={items[3].src} alt={items[3].title} />
            <div className="carouseltypesixth-overlay">
              <h3>{items[3].title}</h3>
            </div>
          </div>
          <div className="carouseltypesixth-item">
            <img src={items[4].src} alt={items[4].title} />
            <div className="carouseltypesixth-overlay">
              <h3>{items[4].title}</h3>
            </div>
          </div>
          <div className="carouseltypesixth-item">
            <img src={items[5].src} alt={items[5].title} />
            <div className="carouseltypesixth-overlay">
              <h3>{items[5].title}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselTypeSixth;