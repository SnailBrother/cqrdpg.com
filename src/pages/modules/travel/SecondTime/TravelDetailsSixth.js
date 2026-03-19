//3D盒子动画
import React, { useState } from 'react';
import './TravelDetailsSixth.css';

const TravelDetailsSixth = () => {
  const [isHovered, setIsHovered] = useState(false);
  const images = [
    'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSixth/1.jpg',
    'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSixth/2.jpg',
    'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSixth/3.jpg',
    'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSixth/4.jpg',
    'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSixth/5.jpg',
    'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSixth/6.jpg'
  ];

  return (
    <div className="traveldetailssixth-container">
      <div 
        className={`traveldetailssixth-cube ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {images.map((src, index) => (
          <div 
            key={index} 
            className={`traveldetailssixth-face traveldetailssixth-face-${index + 1}`}
          >
            <img src={src} alt={`Image ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelDetailsSixth;