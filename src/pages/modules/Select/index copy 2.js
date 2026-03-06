// src/pages/modules/Select/index.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './select.module.css';

const modules = [
  { 
    key: 'accounting', 
    title: '智能记账', 
    desc: '专业财务分析与报表管理', 
    emoji: '📊',
    defaultPath: '/app/accounting/AccountingHomePage',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  { 
    key: 'music', 
    title: '沉浸音乐', 
    desc: '高品质音乐收藏与个性化推荐', 
    emoji: '🎵',
    defaultPath: '/app/music/home',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  { 
    key: 'outfit', 
    title: '时尚穿搭', 
    desc: '智能衣橱管理与时尚搭配推荐', 
    emoji: '👗',
    defaultPath: '/app/outfit/closet',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  { 
    key: 'office', 
    title: '高效办公', 
    desc: '智能日程管理与团队协作', 
    emoji: '💼',
    defaultPath: '/app/office/dashboard',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
  },
  { 
    key: 'chat', 
    title: '即时通讯', 
    desc: '安全可靠的实时沟通平台', 
    emoji: '💬',
    defaultPath: '/app/chat/ChatChat',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
  },
  { 
    key: 'system', 
    title: '系统设置', 
    desc: '个性化主题与账户管理', 
    emoji: '⚙️',
    defaultPath: '/app/system/theme',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
  },
];

const ModuleSelect = () => {
  const navigate = useNavigate();

  const go = (defaultPath) => navigate(defaultPath);

  return (
    <div className={styles.wrapper}>
      {/* <div className={styles.header}>
        <h1 className={styles.title}>选择功能模块</h1>
        <p className={styles.subtitle}>请选择您要进入的功能板块，开始您的个性化体验</p>
      </div> */}
      
      <div className={styles.container}>
        {modules.map((module, index) => (
          <div 
            key={module.key} 
            className={styles.cardWrapper}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div 
              className={styles.card}
              onClick={() => go(module.defaultPath)}
            >
              {/* 装饰性背景元素 */}
              <div 
                className={styles.cardBackground}
                style={{ background: module.gradient }}
              />
              
              {/* 内容区域 */}
              <div className={styles.cardContent}>
                <div className={styles.iconContainer}>
                  <div 
                    className={styles.iconCircle}
                    style={{ backgroundColor: module.color }}
                  >
                    <span className={styles.emoji}>{module.emoji}</span>
                  </div>
                </div>
                
                <div className={styles.textContainer}>
                  <h3 className={styles.cardTitle}>{module.title}</h3>
                  <p className={styles.cardDesc}>{module.desc}</p>
                </div>
                
                <div className={styles.actionContainer}>
                  <div className={styles.enterButton}>
                    <span>进入</span>
                    <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* 悬停效果层 */}
              <div className={styles.hoverEffect} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleSelect;