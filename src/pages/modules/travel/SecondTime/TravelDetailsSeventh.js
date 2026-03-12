import React from 'react';
import './TravelDetailsSeventh.css';

const TravelDetailsSeventh = () => {
  const handleNext = () => {
    const items = document.querySelectorAll('.traveldetailsseventh-item');
    document.querySelector('.traveldetailsseventh-slide').appendChild(items[0]);
  };

  const handlePrev = () => {
    const items = document.querySelectorAll('.traveldetailsseventh-item');
    document.querySelector('.traveldetailsseventh-slide').prepend(items[items.length - 1]);
  };

  // 手写的左右箭头SVG图标
  const ArrowLeft = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );

  const ArrowRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="traveldetailsseventh-container">
      <div className="traveldetailsseventh-slide">
        {/* 第一个项目 */}
        <div 
          className="traveldetailsseventh-item" 
          style={{ backgroundImage: `url(http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSeventh/1.jpg)` }}
        >
          <div className="traveldetailsseventh-content">
            <div className="traveldetailsseventh-name">山村</div>
            <div className="traveldetailsseventh-des">云雾缭绕的世外桃源，聆听大地的呼吸</div>
            <button>See More</button>
          </div>
        </div>
        
        {/* 第二个项目 */}
        <div 
          className="traveldetailsseventh-item" 
          style={{ backgroundImage: `url(http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSeventh/2.jpg)` }}
        >
          <div className="traveldetailsseventh-content">
            <div className="traveldetailsseventh-name">电竞房</div>
            <div className="traveldetailsseventh-des">未来科技感空间，唤醒你的竞技之魂</div>
            <button>See More</button>
          </div>
        </div>
        
        {/* 第三个项目 */}
        <div 
          className="traveldetailsseventh-item" 
          style={{ backgroundImage: `url(http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSeventh/3.jpg)` }}
        >
          <div className="traveldetailsseventh-content">
            <div className="traveldetailsseventh-name">灯笼</div>
            <div className="traveldetailsseventh-des">万家灯火处，最是人间温暖时</div>
            <button>See More</button>
          </div>
        </div>
        
        {/* 第四个项目 */}
        <div 
          className="traveldetailsseventh-item" 
          style={{ backgroundImage: `url(http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSeventh/4.jpg)` }}
        >
          <div className="traveldetailsseventh-content">
            <div className="traveldetailsseventh-name">展览馆</div>
            <div className="traveldetailsseventh-des">艺术与时空的对话，灵感在此碰撞</div>
            <button>See More</button>
          </div>
        </div>
        
        {/* 第五个项目 */}
        <div 
          className="traveldetailsseventh-item" 
          style={{ backgroundImage: `url(http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSeventh/5.jpg)` }}
        >
          <div className="traveldetailsseventh-content">
            <div className="traveldetailsseventh-name">古镇</div>
            <div className="traveldetailsseventh-des">青石板路尽头，藏着千年的故事</div>
            <button>See More</button>
          </div>
        </div>
        
        {/* 第六个项目 */}
        <div 
          className="traveldetailsseventh-item" 
          style={{ backgroundImage: `url(http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSeventh/6.jpg)` }}
        >
          <div className="traveldetailsseventh-content">
            <div className="traveldetailsseventh-name">温泉</div>
            <div className="traveldetailsseventh-des">大地馈赠的温暖，涤尽一身疲惫</div>
            <button>See More</button>
          </div>
        </div>
      </div>

      <div className="traveldetailsseventh-button">
        <button className="traveldetailsseventh-prev" onClick={handlePrev}>
          <ArrowLeft />
        </button>
        <button className="traveldetailsseventh-next" onClick={handleNext}>
          <ArrowRight />
        </button>
      </div>
    </div>
  );
};

export default TravelDetailsSeventh;