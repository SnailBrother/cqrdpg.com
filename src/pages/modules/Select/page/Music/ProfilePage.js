import React, { useState } from 'react';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // 第二屏内容数据
  const pageContents = [
    {
      id: 0,
      img: 'https://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/动态图.jpg',
      texts: [
        '💘',
        '记录',
        '生活',
        '美好',
        '瞬间',
        '💓'
      ]
    },
    {
      id: 1,
      img: 'https://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/文本互动.jpg',
      texts: [
        '💘',
        '文本',
          '快速替换',
        '💓'
      ]
    },
    {
      id: 2,
      img: 'https://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/图片压缩.jpg',
      texts: [
        '💘',
        '图片',
        '压缩',
        '减少内存',
        '💓'
      ]
    },
    {
      id: 3,
      img: 'https://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/记账.jpg',
      texts: [
        '💘',
        '生活',
        '消费',
        '💓'
      ]
    },
    {
      id: 4,
      img: 'https://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/百度数据获取.jpg',
      texts: [
        '💘',
        '定位',
        '拾取',
        '周边数据',
        '💓'
      ]
    },
    {
      id: 5,
      img: 'https://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐统计.jpg',
      texts: [
        '💘',
        '自动分析用户爱好！！！',
        '💓'
      ]
    }
  ];

  const navItems = ['动态', '互动', '压缩', '记账', '抓取', '学习'];

  return (
    <>
      <div className={styles.circle1}></div>
      <div className={styles.circle2}></div>
      <div className={styles.circle3}></div>

      <div className={styles.sectionCenter}>
        <div className={styles.main}>
          <div className={styles.mainHead}>
            <ul>
              {navItems.map((item, index) => (
                <li 
                  key={index}
                  className={activeIndex === index ? styles.current : ''}
                  onClick={() => setActiveIndex(index)}
                >
                  <a href="#">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.mainBody}>
            {pageContents.map((content, index) => (
              <div 
                key={content.id}
                className={`${styles.mainBodyContent} ${activeIndex === index ? '' : styles.hidden}`}
                style={{ display: activeIndex === index ? 'flex' : 'none' }}
              >
                <div className={styles.mainBodyContentLeft}>
                  {content.texts.map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </div>
                <div className={styles.mainBodyContentRight}>
                  <img src={content.img} alt="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;