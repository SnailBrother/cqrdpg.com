import React from 'react';
import './TravelDetailsFirst.css';

const TravelDetailsFirst = () => {
  const images = [
    { id: 0, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFirst/1.jpg', alt: 'Image 0' },
    { id: 1, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFirst/2.jpg', alt: 'Image 1' },
    { id: 2, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFirst/3.jpg', alt: 'Image 2' },
    { id: 3, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFirst/4.jpg', alt: 'Image 3' },
    { id: 4, src: 'http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsFirst/5.jpg', alt: 'Image 4' }
  ];

  return (
    <div className="traveldfirst-container-out">
      <div className="traveldfirst-container">
        <section className="traveldfirst-carousel">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`traveldfirst-carousel-item traveldfirst-item-${index + 1}`}
            >
              <img src={image.src} alt={image.alt} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default TravelDetailsFirst;