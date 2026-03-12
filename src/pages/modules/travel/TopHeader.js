import React, { useState, useEffect } from 'react';
import './TopHeader.css';
import { useTheme } from './ThemeContext';

const TravelHeader = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [audio] = useState(new Audio('http://121.4.22.55:80/backend/images/OurHomePage/BackgroundMusic/BackgroundMusic.mp3'));
  const { toggleTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(true); // 默认是黑夜模式
  
  useEffect(() => {
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        setIsPlaying(false);
        console.log('Auto-play prevented:', error);
      });
    }

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

  // 修改后的主题切换函数
  const handleThemeToggle = () => {
    toggleTheme(); // 调用从 ThemeContext 获取的 toggleTheme
    setIsDarkMode(!isDarkMode); // 切换本地图标状态
  };

  return (
    <header className="travel-header">
      <div className="travel-container">
        <div className="travel-logo">
          <span className="travel-logo-main">CyyTravel</span>
          <span className="travel-logo-sub">记录你的旅程</span>
        </div>

        <nav className="travel-nav">
          <div className="travel-nav-item travel-active">
            <div className="travel-icon travel-icon-map"></div>
            <span>我的足迹</span>
          </div>
          <div className="travel-nav-item">
            <div className="travel-icon travel-icon-camera"></div>
            <span>旅行相册</span>
          </div>
          <div className="travel-nav-item">
            <div className="travel-icon travel-icon-bookmark"></div>
            <span>收藏地点</span>
          </div>
        </nav>

        <div className="travel-search">
          <div className="travel-search-container">
            <div className="travel-icon travel-icon-search"></div>
            <input
              type="text"
              placeholder="搜索目的地或回忆..."
              className="travel-search-input"
            />
          </div>
          <button title='播放背景音乐' className="travel-music-player" onClick={togglePlay}>
            <div className={`travel-icon ${isPlaying ? 'travel-icon-pause' : 'travel-icon-play'}`}></div>
          </button>
          <button title='切换主题' className="travel-user-profile" onClick={handleThemeToggle}>
            <svg className="icon" aria-hidden="true">
              <use xlinkHref={isDarkMode ? "#icon-baitian" : "#icon-heiye"}></use>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TravelHeader;