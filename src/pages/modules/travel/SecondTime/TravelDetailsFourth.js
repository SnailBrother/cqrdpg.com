import React from 'react';
import './TravelDetailsFourth.css';

const TravelDetailsFourth = () => {
  const images = [
    {
      title: '南坪',
      src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFourth/1.jpg'
    },
    {
      title: '武隆',
      src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFourth/2.jpg'
    },
    {
      title: '弹子石',
      src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFourth/3.jpg'
    }
  ];

  return (
    <div className="traveldetailsfourth-container-out"> 
    <div className="traveldetailsfourth-container">
      <div className="traveldetailsfourth-card-box">
        {images.map((image, index) => (
          <div 
            key={index}
            className={`traveldetailsfourth-card traveldetailsfourth-card-${index + 1}`}
          >
            <img src={image.src} alt={image.title} />
            <div className="traveldetailsfourth-title">{image.title}</div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default TravelDetailsFourth;