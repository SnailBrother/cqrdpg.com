import React, { useState, useEffect } from 'react';
import './DetailTopHeader.css';

const DetailTopHeader = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [audio] = useState(new Audio('http://121.4.22.55:80/backend/images/OurHomePage/BackgroundMusic/BackgroundMusic.mp3'));

  useEffect(() => {
    // Try to autoplay when component mounts
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Auto-play was prevented, show paused state
        setIsPlaying(false);
        console.log('Auto-play prevented:', error);
      });
    }

    // Cleanup function to pause audio when component unmounts
    return () => {
      audio.pause();
    };
  }, [audio]);

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <header className="detailtravel-header">
      <div className="detailtravel-container">
        <div className="detailtravel-logo">
          <span className="detailtravel-logo-main">CyyTravel</span>
          <span className="detailtravel-logo-sub">记录你的旅程</span>
        </div>
        
        <nav className="detailtravel-nav">
          <div className="detailtravel-nav-item detailtravel-active">
            <div className="detailtravel-icon travel-icon-map"></div>
            <span>我的足迹</span>
          </div>
          <div className="detailtravel-nav-item">
            <div className="detailtravel-icon travel-icon-camera"></div>
            <span>旅行相册</span>
          </div>
          <div className="detailtravel-nav-item">
            <div className="detailtravel-icon travel-icon-bookmark"></div>
            <span>收藏地点</span>
          </div>
        </nav>
        
        <div className="detailtravel-search">
          <div className="detailtravel-search-container">
            <div className="detailtravel-icon travel-icon-search"></div>
            <input 
              type="text" 
              placeholder="搜索目的地或回忆..." 
              className="detailtravel-search-input"
            />
          </div>
          <button className="travel-music-player" onClick={togglePlay}>
            <div className={`travel-icon ${isPlaying ? 'travel-icon-pause' : 'travel-icon-play'}`}></div>
          </button>
          <button className="detailtravel-user-profile">
            <div className="detailtravel-icon travel-icon-user"></div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default DetailTopHeader;