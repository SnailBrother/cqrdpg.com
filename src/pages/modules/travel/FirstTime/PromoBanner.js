import React from 'react';
import { Link } from 'react-router-dom';
import './PromoBanner.css';

const TravelPromoBanner = () => {
  return (
    <div className="travel-promo-banner">
      <div className="travel-promo-content">
        <div className="travel-promo-text">
          <h2 className="travel-promo-title">
            <span className="travel-promo-title-main">我们的旅行足迹</span>
            <span className="travel-promo-title-sub">记录每一段美好旅程</span>
          </h2>
          <p className="travel-promo-description">
            这里珍藏着我们共同走过的风景，未来还有更多目的地等待探索...
          </p>
          <Link 
            to="/detailshomecontainer" 
            className="travel-promo-button"
          >
            查看旅行相册
            <span className="travel-icon">📸</span>
          </Link>
        </div>
        <div className="travel-promo-decoration">
          <div className="compass-icon">🌍</div>
          <div className="suitcase-icon">📅</div>
          <div className="map-icon">❤️</div>
        </div>
      </div>
    </div>
  );
};

export default TravelPromoBanner;