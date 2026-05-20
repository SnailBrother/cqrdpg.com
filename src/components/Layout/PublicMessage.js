// src/components/UI/PublicMessage/PublicMessage.js
import React, { useState } from 'react';
import styles from './PublicMessage.module.css';

const PublicMessage = ({ onClose }) => {
  const [currentAd, setCurrentAd] = useState(0);

  // 广告数据  听歌、记账、房地产、  
  const advertisements = [
    {
      id: 1,
      type: 'discount',
      title: '🎊 限时特惠',
      subtitle: '年度最大力度促销',
      description: '全场功能8折起，VIP会员买一送一',
      buttonText: '立即抢购',
      deadline: '2024-12-31',
      bgColor: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
      textColor: '#fff'
    },
    {
      id: 2,
      type: 'new',
      title: '🚀 新功能上线',
      subtitle: '智能助手正式发布',
      description: 'AI智能助手帮你更高效完成任务，现在体验享5折优惠',
      buttonText: '免费试用',
      deadline: '2024-11-30',
      bgColor: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
      textColor: '#fff'
    },
    {
      id: 3,
      type: 'vip',
      title: '👑 会员专享',
      subtitle: '尊贵特权等你来拿',
      description: '开通年度会员即送3个月时长，再享专属客服',
      buttonText: '升级会员',
      deadline: '2024-10-31',
      bgColor: 'linear-gradient(135deg, #FFD93D 0%, #FF9C33 100%)',
      textColor: '#333'
    }
  ];

  const handleAdClick = (ad) => {
    console.log('点击广告:', ad);
    // 这里可以添加跳转到活动页面的逻辑
    alert(`跳转到 ${ad.title} 活动页面`);
  };

  const handleNextAd = () => {
    setCurrentAd((prev) => (prev + 1) % advertisements.length);
  };

  const handlePrevAd = () => {
    setCurrentAd((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  const currentAdData = advertisements[currentAd];

  return (
    <div className={styles.publicMessage}>
      <div 
        className={styles.adContainer}
        style={{ 
          background: currentAdData.bgColor,
          color: currentAdData.textColor
        }}
      >
        {/* 关闭按钮 */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="关闭广告"
        >
          <svg className={styles.closeIcon} viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        {/* 广告内容 */}
        <div className={styles.adContent}>
          <div className={styles.adBadge}>
            {currentAdData.type === 'discount' && '热卖'}
            {currentAdData.type === 'new' && '新品'}
            {currentAdData.type === 'vip' && '尊享'}
          </div>
          
          <div className={styles.adHeader}>
            <h3 className={styles.adTitle}>{currentAdData.title}</h3>
            <p className={styles.adSubtitle}>{currentAdData.subtitle}</p>
          </div>

          <p className={styles.adDescription}>{currentAdData.description}</p>

          <div className={styles.adFooter}>
            <button 
              className={styles.actionButton}
              onClick={() => handleAdClick(currentAdData)}
            >
              {currentAdData.buttonText}
            </button>
            
            <div className={styles.deadline}>
              截止: {currentAdData.deadline}
            </div>
          </div>
        </div>

        {/* 轮播指示器 */}
        {advertisements.length > 1 && (
          <div className={styles.carouselControls}>
            <button 
              className={styles.carouselButton}
              onClick={handlePrevAd}
              title="上一个"
            >
              ‹
            </button>
            
            <div className={styles.carouselDots}>
              {advertisements.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${index === currentAd ? styles.active : ''}`}
                  onClick={() => setCurrentAd(index)}
                />
              ))}
            </div>
            
            <button 
              className={styles.carouselButton}
              onClick={handleNextAd}
              title="下一个"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMessage;