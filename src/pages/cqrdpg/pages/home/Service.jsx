// Service.jsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './Service.module.css';

const Service = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});
  const sectionRef = useRef(null);

  const serviceItems = [
    {
      id: 1,
      title: '无形资产',
      icon: '💎',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: [
        '作价入股、资产转让、使用许可、特许经营',
        '专利技术、动植物品种权、专有技术评估',
        '商标专用权价值评估'
      ]
    },
    {
      id: 2,
      title: '司法鉴定',
      icon: '⚖️',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      description: [
        '重庆市各级人民法院指定司法鉴定评估机构',
        '房地产、土地使用权、机器设备评估',
        '机动车等各项资产的鉴定评估'
      ]
    },
    {
      id: 3,
      title: '企业价值',
      icon: '🏢',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: [
        '设立公司、组建集团、中外合资合作评估',
        '企业资产重组、股份制改造评估',
        '企业股份转让、兼并收购评估',
        '企业投融资、破产清算评估'
      ]
    },
    {
      id: 4,
      title: '单项资产',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      description: [
        '资产转让、资产抵押、资产拍卖',
        '资产租赁、诉讼清偿评估',
        '机器设备、建筑物、债权评估'
      ]
    },
    {
      id: 5,
      title: '房地产',
      icon: '🏠',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      description: [
        '抵押价值、转让价格、租赁价格评估',
        '课税价格、分割合并价格评估',
        '城市房屋征收、可行性研究分析'
      ]
    },
    {
      id: 6,
      title: '土地',
      icon: '🌍',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      description: [
        '土地收储、收购、出让底价评估',
        '土地使用权出让、转让、抵押评估',
        '企业兼并、破产、清产核算评估'
      ]
    }
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

  // 处理手机端点击翻转
  const handleCardClick = (id) => {
    // 检测是否为触摸设备
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      setFlippedCards(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    }
  };

  return (
    <div className={styles.serviceWrapper} ref={sectionRef}>
      <div className={styles.serviceContainer}>
        {/* 背景装饰 */}
        <div className={styles.bgDecoration}>
          <div className={styles.bgCircle1}></div>
          <div className={styles.bgCircle2}></div>
          <div className={styles.bgCircle3}></div>
        </div>

        {/* 头部区域 */}
        <div className={`${styles.header} ${isVisible ? styles.headerVisible : ''}`}>
          <span className={styles.subtitle}>我们的服务</span>
          <h1 className={styles.title}>
            专业<span className={styles.titleHighlight}>评估</span>解决方案
          </h1>
          <p className={styles.description}>
            我们提供全方位的资产评估服务，以专业的态度和精准的数据，为您的决策提供可靠依据
          </p>
        </div>

        {/* 服务卡片网格 */}
        <div className={styles.gridContainer}>
          {serviceItems.map((item, index) => (
            <div
              key={item.id}
              className={`${styles.card} ${isVisible ? styles.cardVisible : ''} ${flippedCards[item.id] ? styles.flipped : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleCardClick(item.id)}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>
                  <div className={styles.iconWrapper} style={{ background: item.gradient }}>
                    <span className={styles.icon}>{item.icon}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <div className={styles.cardLine}></div>
                  <button className={styles.learnMoreBtn}>
                    详情
                    <span className={styles.btnArrow}>→</span>
                  </button>
                </div>
                <div className={styles.cardBack} style={{ background: item.gradient }}>
                  <h3 className={styles.backTitle}>{item.title}</h3>
                  <ul className={styles.descriptionList}>
                    {item.description.map((desc, idx) => (
                      <li key={idx} className={styles.descriptionItem}>
                        <span className={styles.itemDot}>•</span>
                        {desc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部统计区域 */}
        <div className={`${styles.stats} ${isVisible ? styles.statsVisible : ''}`}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>5000+</div>
            <div className={styles.statLabel}>服务客户</div>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>98%</div>
            <div className={styles.statLabel}>客户满意度</div>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>30+</div>
            <div className={styles.statLabel}>专业团队</div>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>20年</div>
            <div className={styles.statLabel}>行业经验</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Service;