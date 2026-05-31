import React, { useEffect, useRef, useState } from 'react';
import styles from './Partner.module.css';

const Partner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('government');
  const sectionRef = useRef(null);

  // 政府机关数据
  const governmentList = [
    '重庆市国有资产监督管理委员会评估中介机构备选库',
    '全国最高人民法院司法评估机构名单库（房地产、土地、资产分库均入选）',
    '重庆市国有土地上房屋征收评估机构名单',
    '重庆市规划和自然资源局、大足区规划和自然资源局',
    '江津区规划和自然资源局',
    '永川区规划和自然资源局',
    '万盛经开区规划和自然资源局',
    '黔江区规划和自然资源局',
    '忠县规划和自然资源局',
    '江津区国有资产管理中心',
    '忠县财政局'
  ];

  // 金融机构数据
  const financialList = [
    '农业银行重庆分行',
    '建设银行重庆分行',
    '工商银行重庆分行',
    '重庆三峡银行',
    '大连银行重庆分行',
    '中德银行重庆分行',
    '哈尔滨银行重庆分行',
    '广东南粤银行重庆分行',
    '重庆农村商业银行股份有限公司',
    '厦门国际银行',
    '国家开发银行重庆市分行',
    '重庆农村商业银行'
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.container} ref={sectionRef}>
      <div className={styles.content}>
        {/* 头部区域 */}
        <div className={`${styles.header} ${isVisible ? styles.headerVisible : ''}`}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L2 9L16 16L30 9L16 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 16L16 23L30 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 23L16 30L30 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.mainTitle}>
              <span className={styles.titleGradient}>合作伙伴</span>
            </h2>
          </div>
          <p className={styles.subTitle}>信任源自专业 · 携手共筑未来</p>
          <div className={styles.headerLine}></div>
        </div>

        {/* 桌面端双栏布局 */}
        <div className={styles.desktopView}>
          <div className={styles.partnerGrid}>
            {/* 政府机关区块 */}
            <div className={`${styles.block} ${isVisible ? styles.blockVisible : ''}`}>
              <div className={styles.blockHeader}>
                <div className={styles.iconWrapper}>
                  <span className={styles.icon}>🏛️</span>
                </div>
                <div className={styles.headerContent}>
                  <h3 className={styles.blockTitle}>政府机关</h3>
                  {/* <div className={styles.statBadge}>
                    <span className={styles.statNumber}>{governmentList.length}</span>
                    <span className={styles.statLabel}>家合作单位</span>
                  </div> */}
                </div>
              </div>
              <div className={styles.listWrapper}>
                <ul className={styles.list}>
                  {governmentList.map((item, index) => (
                    <li 
                      key={`gov-${index}`} 
                      className={styles.listItem}
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <span className={styles.marker}></span>
                      <span className={styles.listText}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 金融机构区块 */}
            <div className={`${styles.block} ${isVisible ? styles.blockVisible : ''}`}>
              <div className={styles.blockHeader}>
                <div className={styles.iconWrapper}>
                  <span className={styles.icon}>🏦</span>
                </div>
                <div className={styles.headerContent}>
                  <h3 className={styles.blockTitle}>金融机构</h3>
                  {/* <div className={styles.statBadge}>
                    <span className={styles.statNumber}>{financialList.length}</span>
                    <span className={styles.statLabel}>家合作机构</span>
                  </div> */}
                </div>
              </div>
              <div className={styles.listWrapper}>
                <ul className={styles.list}>
                  {financialList.map((item, index) => (
                    <li 
                      key={`fin-${index}`} 
                      className={styles.listItem}
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <span className={styles.marker}></span>
                      <span className={styles.listText}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 手机端Tab切换布局 */}
        <div className={styles.mobileView}>
          <div className={styles.tabBar}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'government' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('government')}
            >
              <span className={styles.tabIcon}>🏛️</span>
              <span className={styles.tabLabel}>政府机关</span>
              {/* <span className={styles.tabCount}>{governmentList.length}</span> */}
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'financial' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('financial')}
            >
              <span className={styles.tabIcon}>🏦</span>
              <span className={styles.tabLabel}>金融机构</span>
              {/* <span className={styles.tabCount}>{financialList.length}</span> */}
            </button>
          </div>

          <div className={styles.tabContent}>
            <div className={`${styles.tabPane} ${activeTab === 'government' ? styles.paneActive : ''}`}>
              <div className={styles.mobileListWrapper}>
                <ul className={styles.mobileList}>
                  {governmentList.map((item, index) => (
                    <li key={`mobile-gov-${index}`} className={styles.mobileListItem}>
                      <span className={styles.mobileMarker}></span>
                      <span className={styles.mobileListText}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={`${styles.tabPane} ${activeTab === 'financial' ? styles.paneActive : ''}`}>
              <div className={styles.mobileListWrapper}>
                <ul className={styles.mobileList}>
                  {financialList.map((item, index) => (
                    <li key={`mobile-fin-${index}`} className={styles.mobileListItem}>
                      <span className={styles.mobileMarker}></span>
                      <span className={styles.mobileListText}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部装饰文案 */}
        <div className={`${styles.footer} ${isVisible ? styles.footerVisible : ''}`}>
          <div className={styles.marquee}>
            <span className={styles.marqueeText}>✦ 持续拓展中  ✦ 期待与您合作  ✦ 共创价值  ✦</span>
            <span className={styles.marqueeText}>✦ 持续拓展中  ✦ 期待与您合作  ✦ 共创价值  ✦</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partner;