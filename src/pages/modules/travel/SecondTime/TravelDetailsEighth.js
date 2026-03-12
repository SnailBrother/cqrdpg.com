import React, { useState, useEffect, useRef } from 'react';
import './TravelDetailsEighth.css';

const images = [
  { id: 1, url: "http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsEighth/1.jpg" },
  { id: 2, url: "http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsEighth/2.jpg" },
  { id: 3, url: "http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsEighth/3.jpg" },
  { id: 4, url: "http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsEighth/4.jpg" },
  { id: 5, url: "http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsEighth/5.jpg" },
  { id: 6, url: "http://121.4.22.55:80/backend/images/OurHomePage/Details/TravelDetailsEighth/6.jpg" }
];

const TravelDetailsEighth = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  // Initialize carousel
  const initializeCarousel = () => {
    const lis = document.getElementsByClassName("traveldetailseighth-images");
    const indicators = document.getElementsByClassName("traveldetailseighth-indicators");

    resetStyles();
    normalDisplay();
    indicators[currentIndex].style.backgroundColor = "grey";

    if (currentIndex === 0) {
      handleIndexZero();
    } else if (currentIndex === images.length - 1) {
      handleIndexMax();
    } else {
      handleMiddleIndex();
    }
  };

  // Reset all styles
  const resetStyles = () => {
    const lis = document.getElementsByClassName("traveldetailseighth-images");
    const indicators = document.getElementsByClassName("traveldetailseighth-indicators");

    for (let i = 0; i < lis.length; i++) {
      lis[i].style.opacity = 0;
      lis[i].style.left = "0px";
      lis[i].style.right = "0px";
      lis[i].style.transform = "scale(1)";
      lis[i].style.zIndex = 0;
      lis[i].style.boxShadow = "";
      lis[i].style.top = "0px";
      indicators[i].style.backgroundColor = "white";
    }
  };

  // Current image normal display
  const normalDisplay = () => {
    const lis = document.getElementsByClassName("traveldetailseighth-images");
    lis[currentIndex].style.opacity = 1;
    lis[currentIndex].style.zIndex = 3;
    lis[currentIndex].style.left = "0px";
    lis[currentIndex].style.boxShadow = "0px 0px 20px black";
    lis[currentIndex].style.filter = "blur(0)";
    lis[currentIndex].style.transform = "scale(1.2)";
    lis[currentIndex].style.top = "50px";
  };

  // Handle index 0 case
  const handleIndexZero = () => {
    const lis = document.getElementsByClassName("traveldetailseighth-images");
    lis[images.length - 1].style.left = "-600px";
    lis[images.length - 1].style.opacity = 1;
    lis[images.length - 1].style.transform = "scale(0.4)";
    lis[images.length - 1].style.filter = "blur(15px)";
    lis[images.length - 1].style.top = "-50px";
    lis[currentIndex + 1].style.opacity = 1;
    lis[currentIndex + 1].style.right = "-700px";
    lis[currentIndex + 1].style.transform = "scale(0.4)";
    lis[currentIndex + 1].style.filter = "blur(15px)";
    lis[currentIndex + 1].style.top = "-200px";
  };

  // Handle max index case
  const handleIndexMax = () => {
    const lis = document.getElementsByClassName("traveldetailseighth-images");
    lis[0].style.opacity = 1;
    lis[0].style.right = "-600px";
    lis[0].style.transform = "scale(0.4)";
    lis[0].style.filter = "blur(15px)";
    lis[0].style.top = "-50px";
    lis[currentIndex - 1].style.left = "-700px";
    lis[currentIndex - 1].style.opacity = 1;
    lis[currentIndex - 1].style.transform = "scale(0.4)";
    lis[currentIndex - 1].style.filter = "blur(15px)";
    lis[currentIndex - 1].style.top = "-200px";
  };

  // Handle middle index
  const handleMiddleIndex = () => {
    const lis = document.getElementsByClassName("traveldetailseighth-images");
    lis[currentIndex - 1].style.left = "-700px";
    lis[currentIndex - 1].style.opacity = 1;
    lis[currentIndex - 1].style.transform = "scale(0.4)";
    lis[currentIndex - 1].style.filter = "blur(15px)";
    lis[currentIndex - 1].style.top = "-200px";
    lis[currentIndex + 1].style.opacity = 1;
    lis[currentIndex + 1].style.right = "-700px";
    lis[currentIndex + 1].style.transform = "scale(0.4)";
    lis[currentIndex + 1].style.filter = "blur(15px)";
    lis[currentIndex + 1].style.top = "-200px";
  };

  // Auto rotation
  const startInterval = () => {
    clearInterval(intervalRef.current);
    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 2000);
    }
  };

  // Handle button click
  const handleClick = (direction) => {
    clearInterval(intervalRef.current);
    if (direction === 'prev') {
      setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    } else {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }
    startInterval();
  };

  // Handle indicator click
  const handleIndicatorClick = (index) => {
    clearInterval(intervalRef.current);
    setCurrentIndex(index);
    startInterval();
  };

  useEffect(() => {
    initializeCarousel();
    startInterval();

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [currentIndex, isHovered]);

  return (
    <div
    className="traveldetailseighth-container"
    style={{ backgroundImage: `url(${images[currentIndex].url})` }}  // ← 使用 currentIndex
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
      <ul className="traveldetailseighth-list">
        {images.map((image, index) => (
          <li key={image.id} className="traveldetailseighth-images">
            <img src={image.url} alt={`carousel-${image.id}`} />
          </li>
        ))}
      </ul>
      <button
        className="traveldetailseighth-button traveldetailseighth-prev"
        onClick={() => handleClick('prev')}
      >
        &lt;
      </button>
      <button
        className="traveldetailseighth-button traveldetailseighth-next"
        onClick={() => handleClick('next')}
      >
        &gt;
      </button>
      <div className="traveldetailseighth-indicators-container">
        <ol className="traveldetailseighth-indicators-list">
          {images.map((_, index) => (
            <li
              key={index}
              className="traveldetailseighth-indicators"
              onClick={() => handleIndicatorClick(index)}
            />
          ))}
        </ol>
      </div>
    </div>
  );
};

export default TravelDetailsEighth;