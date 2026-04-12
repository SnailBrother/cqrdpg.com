import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';
import WaterWave from './WaterWave';

// 图片路径
const bgImage = './images/love/Background.jpg';
const avatar1 = './images/love/girl.jpg';
const avatar2 = './images/love/Boy.jpg';

const Home = () => {
  const navigate = useNavigate();

  // 在一起的起始时间：2020年1月30日 中午12点（北京时间）
  const startDate = new Date('2020-01-30T12:00:00+08:00');

  const [time, setTime] = useState({
    totalDays: 0,
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // 控制3D旋转动画是否暂停
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const diff = now - startDate;

      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const years = Math.floor(totalDays / 365);
      const remainingDaysAfterYears = totalDays % 365;
      const months = Math.floor(remainingDaysAfterYears / 30);
      const days = remainingDaysAfterYears % 30;
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTime({
        totalDays,
        years,
        months,
        days,
        hours,
        minutes,
        seconds
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [startDate]);

  // 功能模块数据 - 用于3D旋转木马
  const features = [
 
  { icon: '🎵', title: '听歌', desc: '共享每一首喜欢的歌', path: '/app/music/home' },
 
  { icon: '💰', title: '记账', desc: '记录我们的小日常开销', path: '/app/accounting/AccountingAdd' },
 
  { icon: '🏃', title: '运动', desc: '一起挥洒汗水，健康生活', path: '/app/sport/sport' },
 
  { icon: '💬', title: '聊天', desc: '随时分享日常与心情', path: '/app/chat/ChatChat' },
 
  { icon: '📊', title: '办公', desc: '高效协作与数据管理', path: '/app/office/SearchPrice' },
 
 
  ];

  const goToPage = (path) => {
    navigate(path);
  };

  return (
    <div className={styles.container}>
      {/* 顶部导航 */}
      <header className={styles.header}>
        <div className={styles.logo}>ChenBaby</div>
        <div className={styles.slogan}>喜欢花 喜欢浪漫 喜欢你~</div>
      </header>

      {/* banner */}
      <div className={styles.banner}>
        {/* <div className={styles.west01}></div> */}
        <img src={bgImage} alt="情侣背景" className={styles.bannerBg} />

        <div className={styles.coupleCard}>
          <div className={styles.avatarWrapper}>
            <img src={avatar1} alt="ChenBaby" className={styles.avatar} />
            <span className={styles.name}>ChenBaby</span>
          </div>
          <div className={styles.heartIconWrapper}>
            <div className={styles.ecgLine}></div>
            <div className={styles.heartIcon}>❤️</div>
          </div>
          <div className={styles.avatarWrapper}>
            <img src={avatar2} alt="LiDarling" className={styles.avatar} />
            <span className={styles.name}>LiDarling</span>
          </div>
        </div>

        <div className={styles.waveContainer}>
          <WaterWave />
        </div>

        {/* 3D旋转木马功能模块 */}
        <div
          className={styles.carouselSection}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >

          <div className={styles.carouselContainer}>
            <div className={`${styles.carouselStage} ${isPaused ? styles.paused : ''}`}>
              {features.map((item, index) => (
                <div
                  key={index}
                  className={styles.carouselCard}
                  //  translateZ 数值越小 → 旋转半径越小（圆更紧凑）
                  style={{ transform: `rotateY(${index * 50}deg) translateZ(80px)` }}
                  onClick={() => goToPage(item.path)}
                >
                  <div className={styles.carouselIcon}>{item.icon}</div>
                  <div className={styles.carouselContent}>
                    <h3 className={styles.carouselTitleText}>{item.title}</h3>
                    {/* <p className={styles.carouselDesc}>{item.desc}</p>   */}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 时间区域 */}
      <div className={styles.timeSection}>
        <p className={styles.timeTitle}>这是我们在一起的</p>
        <div className={styles.timeCount}> 第 {time.totalDays} 天 {time.hours} 小时 {time.minutes} 分</div>
        <p className={styles.timeDetail}>
          {time.years} 年 {time.months} 月 {time.days} 天 {time.hours} 小时 {time.minutes} 分 {time.seconds} 秒
        </p>
      </div>

 
      {/* 手机端功能卡片网格 */}
      <div className={styles.mobileFeaturesGrid}>
        <h3 className={styles.sectionTitle}>我们的点滴</h3>
        <div className={styles.featuresGrid}>
          {features.map((item, index) => (
            <div
              key={index}
              className={styles.gridCard}
              onClick={() => goToPage(item.path)}
            >
              <div className={styles.gridIcon}>{item.icon}</div>
              <div className={styles.gridTitle}>{item.title}</div>
              <div className={styles.gridDesc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;