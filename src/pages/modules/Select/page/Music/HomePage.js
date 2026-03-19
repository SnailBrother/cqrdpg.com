import React, { useState } from 'react';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // 第一屏内容数据
  const firstPageContents = [
    {
      id: 0,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/小区定位.jpg',
      texts: [
        '百度Api',
        'Sql-Server',
        '实现地图找房'
      ]
    },
    {
      id: 1,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/数据查询.jpg',
      texts: [
        '数据统计',
        '历史数据一览无余'
      ]
    },
    {
      id: 2,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/房屋数据图片.jpg',
      texts: [
        '文字图像结合',
        '图文一览',
        '我爱你，你要记得我——《云边有个小卖部》'
      ]
    },
    {
      id: 3,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/二维码备份.jpg',
      texts: [
        '安全性',
        '数据备份',
         '官网备份'
      ]
    },
    {
      id: 4,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/excel链接.jpg',
      texts: [
        'Excel',
        '字段链接',
        '安全可靠'
      ]
    },
    {
      id: 5,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/房屋数据统计.jpg',
      texts: [
        '一键查找',
        '在线搜索'
        
      ]
    },
    {
      id: 6,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/pdf合并.jpg',
      texts: [
        '附件合并',
        '快捷打印'
      ]
    }
  ];

  return (
    <>
      {/* 背景圆点 */}
      <div className={styles.circle1}></div>
      <div className={styles.circle2}></div>
      <div className={styles.circle3}></div>
      
      {/* 内容区域 */}
      <main className={styles.main}>
        <div className={styles.mainLeft}>
          <div className={`${styles.myPhoto} ${activeIndex === 0 ? styles.current : ''}`}>
            <a  >
              <img src="http://121.4.22.55:80/logo512.png" alt="ChenBaby" />
              <h3>ChenBaby</h3>
              <p>取悦自己</p>
            </a>
          </div>
          
          {['百度', '统计', '58', '验证', 'excel', '搜索', '打印'].map((text, index) => (
            <div 
              key={index}
              className={activeIndex === index + 1 ? styles.current : ''}
              onMouseEnter={() => setActiveIndex(index + 1)}
            >
              <a href="#">
                <p className={styles[`icon${text}`]}></p>
                <span>{text}</span>
              </a>
            </div>
          ))}
        </div>

        <div className={styles.mainRight}>
          {firstPageContents.map((content, index) => (
            <div 
              key={content.id}
              className={`${styles.content} ${activeIndex === index + 1 ? '' : styles.hidden}`}
              style={{ display: activeIndex === index + 1 ? 'flex' : 'none' }}
            >
              <img 
                src={content.img} 
                alt="" 
                className={index === 0 ? styles.firstContent : ''}
              />
              <div className={styles.textdescription} >
                {content.texts.map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default HomePage;