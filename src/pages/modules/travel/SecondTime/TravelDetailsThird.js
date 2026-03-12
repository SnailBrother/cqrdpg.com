import React, { useState } from 'react';
import './TravelDetailsThird.css';

const TravelDetailsThird = () => {
  const [items, setItems] = useState([
    {
      title: '丰都',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsThird/1.jpg',
      pos: '0'
    },
    {
      title: '万州',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsThird/2.jpg',
      pos: '1'
    },
    {
      title: '解放碑',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsThird/3.jpg',
      pos: '2'
    },
    {
      title: '石笋河',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsThird/4.jpg',
      pos: '3'
    },
    {
      title: '南川',
      image: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsThird/5.jpg',
      pos: '4'
    }
  ]);

  const handleClick = (clickedPos) => {
    if (clickedPos === '0') return;
    
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.pos === '0') return { ...item, pos: clickedPos };
        if (item.pos === clickedPos) return { ...item, pos: '0' };
        return item;
      });
    });
  };

  return (
    <div className="traveldetailsthird-container">
      <div className="traveldetailsthird-gallery">
        {items.map((item) => (
          <div 
            key={item.title}
            className={`traveldetailsthird-item traveldetailsthird-pos-${item.pos}`}
            data-pos={item.pos}
            onClick={() => handleClick(item.pos)}
          >
            <img src={item.image} alt={item.title} />
            <div className="traveldetailsthird-title">{item.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelDetailsThird;