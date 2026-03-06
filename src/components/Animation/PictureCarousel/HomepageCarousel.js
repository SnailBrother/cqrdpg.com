import React, { useState, useEffect, useRef } from 'react';
import './HomepageCarousel.css';

const carouselImages = [
  '/images/1.jpg',
  '/images/2.jpg',
  '/images/3.jpg',
  '/images/4.jpg',
  '/images/5.jpg'
];

const HomepageCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  // 初始化轮播图位置
  const initializeCarousel = () => {
    const lis = document.getElementsByClassName("homecarousel-images");
    const anNiu = document.getElementsByClassName("homecarousel-anNius");

    resetStyles();
    normalDisplay();
    anNiu[currentIndex].style.backgroundColor = "grey";

    if (currentIndex === 0) {
      handleIndexZero();
    } else if (currentIndex === carouselImages.length - 1) {
      handleIndexMax();
    } else {
      handleMiddleIndex();
    }
  };

  // 重置所有样式
  const resetStyles = () => {
    const lis = document.getElementsByClassName("homecarousel-images");
    const anNiu = document.getElementsByClassName("homecarousel-anNius");

    for (let i = 0; i < lis.length; i++) {
      lis[i].style.opacity = 0;
      lis[i].style.left = "0px";
      lis[i].style.right = "0px";
      lis[i].style.transform = "scale(1)";
      lis[i].style.zIndex = 0;
      lis[i].style.boxShadow = "";
      lis[i].style.top = "0px";
      anNiu[i].style.backgroundColor = "white";
    }
  };

  // 当前图片正常显示
  const normalDisplay = () => {
    const lis = document.getElementsByClassName("homecarousel-images");
    lis[currentIndex].style.opacity = 1;
    lis[currentIndex].style.zIndex = 3;
    lis[currentIndex].style.left = "0px";
    lis[currentIndex].style.boxShadow = "0px 0px 20px black";
    lis[currentIndex].style.filter = "blur(0)";
    lis[currentIndex].style.transform = "scale(1.2)";
    lis[currentIndex].style.top = "100px";
  };

  // 处理索引为0的情况
  const handleIndexZero = () => {
    const lis = document.getElementsByClassName("homecarousel-images");
    lis[carouselImages.length - 1].style.left = "-800px";
    lis[carouselImages.length - 1].style.opacity = 1;
    lis[carouselImages.length - 1].style.transform = "scale(0.4)";
    lis[carouselImages.length - 1].style.filter = "blur(15px)";
    lis[carouselImages.length - 1].style.top = "-100px";
    lis[currentIndex + 1].style.opacity = 1;
    lis[currentIndex + 1].style.right = "-800px";
    lis[currentIndex + 1].style.transform = "scale(0.4)";
    lis[currentIndex + 1].style.filter = "blur(15px)";
    lis[currentIndex + 1].style.top = "-100px";
  };

  // 处理最大索引情况
  const handleIndexMax = () => {
    const lis = document.getElementsByClassName("homecarousel-images");
    lis[0].style.opacity = 1;
    lis[0].style.right = "-800px";
    lis[0].style.transform = "scale(0.4)";
    lis[0].style.filter = "blur(15px)";
    lis[0].style.top = "-100px";
    lis[currentIndex - 1].style.left = "-800px";
    lis[currentIndex - 1].style.opacity = 1;
    lis[currentIndex - 1].style.transform = "scale(0.4)";
    lis[currentIndex - 1].style.filter = "blur(15px)";
    lis[currentIndex - 1].style.top = "-100px";
  };

  // 处理中间索引
  const handleMiddleIndex = () => {
    const lis = document.getElementsByClassName("homecarousel-images");
    lis[currentIndex - 1].style.left = "-800px";
    lis[currentIndex - 1].style.opacity = 1;
    lis[currentIndex - 1].style.transform = "scale(0.4)";
    lis[currentIndex - 1].style.filter = "blur(15px)";
    lis[currentIndex - 1].style.top = "-100px";
    lis[currentIndex + 1].style.opacity = 1;
    lis[currentIndex + 1].style.right = "-800px";
    lis[currentIndex + 1].style.transform = "scale(0.4)";
    lis[currentIndex + 1].style.filter = "blur(15px)";
    lis[currentIndex + 1].style.top = "-100px";
  };

  // 自动轮播
  const startInterval = () => {
    clearInterval(intervalRef.current);
    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % carouselImages.length);
      }, 2000);
    }
  };

  // 处理按钮点击
  const handleClick = (direction) => {
    clearInterval(intervalRef.current);
    if (direction === 'prev') {
      setCurrentIndex(prev => (prev - 1 + carouselImages.length) % carouselImages.length);
    } else {
      setCurrentIndex(prev => (prev + 1) % carouselImages.length);
    }
    startInterval();
  };

  // 处理指示器点击
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
      className="homecarousel-out"
      style={{ backgroundImage: `url(${carouselImages[0]})` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ul className="homecarousel-list">
        {carouselImages.map((image, index) => (
          <li key={index} className="homecarousel-images">
            <img src={image} alt={`carousel-${index}`} />
          </li>
        ))}
      </ul>
      <button
        className="homecarousel-button homecarousel-prev"
        onClick={() => handleClick('prev')}
      >
        &lt;
      </button>
      <button
        className="homecarousel-button homecarousel-next"
        onClick={() => handleClick('next')}
      >
        &gt;
      </button>
      <div className="homecarousel-indicators-container">
        <ol className="homecarousel-indicators">
          {carouselImages.map((_, index) => (
            <li
              key={index}
              className="homecarousel-anNius"
              onClick={() => handleIndicatorClick(index)}
            />
          ))}
        </ol>
      </div>
    </div>
  );
};

export default HomepageCarousel;