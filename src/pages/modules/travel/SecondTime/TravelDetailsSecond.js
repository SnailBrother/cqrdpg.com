import React from 'react';
import './TravelDetailsSecond.css';

const TravelDetailsSecond = () => {
  const items = [
    {
      id: 1,
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSecond/1.jpg',
      title: '南天湖'
    },
    {
      id: 2,
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSecond/2.jpg',
      title: '山城步道'
    },
    {
      id: 3,
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSecond/3.jpg',
      title: '瑜伽'
    },
    {
      id: 4,
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSecond/4.jpg',
      title: '南滨路'
    },
    {
      id: 5,
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsSecond/5.jpg',
      title: '矿山公园'
    }
  ];

  return (
    <div className="traveldsecond-container">
      <div className="traveldsecond-box">
        <ul className="traveldsecond-list">
          {items.map((item) => (
            <li key={item.id} className="traveldsecond-item">
              <img src={item.image} alt={item.title} className="traveldsecond-image" />
              <p className="traveldsecond-title">{item.title}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TravelDetailsSecond;