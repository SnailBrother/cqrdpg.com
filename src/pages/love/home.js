import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 新增路由钩子
import styles from './home.module.css';
import WaterWave from './WaterWave';
// 图片路径
const bgImage = './images/love/Background.jpg';
const avatar1 = './images/love/girl.jpg';
const avatar2 = './images/love/Boy.jpg';

const Home = () => {
  const navigate = useNavigate(); // 路由跳转

  // 在一起的起始时间：2020年1月30日 中午12点（北京时间）
  const startDate = new Date('2020-01-30T12:00:00+08:00');

  // 时间状态
  const [time, setTime] = useState({
    totalDays: 0,
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // 实时计算时间
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const diff = now - startDate;

      // 总天数
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));

      // 换算 年 月 日 时 分 秒
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

  // 功能模块 + 绑定跳转路由
  const features = [
    {
      icon: '🎵',
      title: '听歌',
      desc: '共享每一首喜欢的歌',
      path: '/app/music/home'
    },
    {
      icon: '💰',
      title: '记账',
      desc: '记录我们的小日常开销',
      path: '/app/accounting/AccountingAdd'
    },
    {
      icon: '✈️',
      title: '旅游',
      desc: '一起去看遍山川湖海',
      path: '/app/chat/ChatDressingGuidelines'
    },
    {
      icon: '✨',
      title: '愿望',
      desc: '许下我们的小小心愿',
      path: '/app/music/favorites'
    },
    {
      icon: '👕',
      title: '穿搭',
      desc: '每天都要精致又好看',
      path: '/app/chat/ChatDressingGuidelines'
    },
    {
      icon: '💞',
      title: '关于',
      desc: '属于我们的专属故事',
      path: '/app/office/SearchPrice'
    }
  ];

  // 点击跳转
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
        <div className={styles.west01}></div>

        <img src={bgImage} alt="情侣背景" className={styles.bannerBg} />
        <div className={styles.coupleCard}>
          <div className={styles.avatarWrapper}>
            <img src={avatar1} alt="ChenBaby" className={styles.avatar} />
            <span className={styles.name}>ChenBaby</span>
          </div>
          <div className={styles.heartIcon}>❤️</div>
          <div className={styles.avatarWrapper}>
            <img src={avatar2} alt="LiDarling" className={styles.avatar} />
            <span className={styles.name}>LiDarling</span>
          </div>
        </div>


        <div className={styles.waveContainer}>
          <WaterWave></WaterWave>
          {/* <div className={styles.waveAnimation} />
          <div className={styles.waterAnimation} /> */}
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

      {/* 功能模块（点击可跳转） */}
      <div className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          {features.map((item, index) => (
            <div
              key={index}
              className={styles.featureCard}
              onClick={() => goToPage(item.path)} // 点击跳转
            >
              <div className={styles.featureIcon}>{item.icon}</div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>{item.title}</h3>
                <p className={styles.featureDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;