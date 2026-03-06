// src/pages/modules/Select/index.js import { moduleConfig } from '../../../config/moduleConfig';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleConfig } from '../../../config/moduleConfig';
import styles from './select.module.css';

const ModuleSelect = () => {
  const navigate = useNavigate();

  const modules = Object.entries(moduleConfig).map(([key, config]) => ({
    key,
    title: config.label,
    routes: config.routes,
    defaultPath: `/app/${key}/${config.defaultRoute}`,
    emoji: getModuleEmoji(key),
    color: getModuleColor(key)
  }));

  function getModuleEmoji(key) {
    const emojiMap = {
      accounting: '📊',
      music: '🎵',
      outfit: '👗',
      office: '💼',
      chat: '💬',
      system: '⚙️'
    };
    return emojiMap[key] || '📱';
  }

  function getModuleColor(key) {
    const colorMap = {
      accounting: '#10b981',
      music: '#8b5cf6',
      outfit: '#f59e0b',
      office: '#3b82f6',
      chat: '#ec4899',
      system: '#6b7280'
    };
    return colorMap[key] || '#6b7280';
  }

  const go = (defaultPath) => navigate(defaultPath);

  return (
    <div className={styles.wrapper}>
      {/* <div className={styles.header}>
        <h1 className={styles.title}>功能模块</h1>
        <p className={styles.subtitle}>选择您要使用的功能</p>
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
              {/* 模块头部 */}
              <div className={styles.cardHeader}>
                <div className={styles.moduleInfo}>
                  <div 
                    className={styles.iconCircle}
                    style={{ backgroundColor: module.color }}
                  >
                    <span className={styles.emoji}>{module.emoji}</span>
                  </div>
                  <div className={styles.moduleText}>
                    <h3 className={styles.cardTitle}>{module.title}</h3>
                    <p className={styles.moduleDesc}>{getModuleDescription(module.key)}</p>
                  </div>
                </div>
                <div className={styles.enterButton}>
 
                   <svg className={styles.arrowIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-jiantou_xiangyouliangci"></use>
                                </svg>
                </div>
              </div>

              {/* 功能标签区域 */}
              <div className={styles.tagsContainer}>
                {module.routes.slice(0, 5).map((route, routeIndex) => (
                  <span 
                    key={route.key} 
                    className={styles.tag}
                    style={{ 
                      backgroundColor: `${module.color}20`,
                      color: module.color,
                      borderColor: `${module.color}40`
                    }}
                  >
                    {route.label}
                  </span>
                ))}
                {module.routes.length > 5 && (
                  <span className={styles.moreTag}>
                    +{module.routes.length - 5}更多
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getModuleDescription(key) {
  const descMap = {
    accounting: '智能记账与财务分析',
    music: '高品质音乐体验',
    outfit: '时尚穿搭与衣橱管理',
    office: '高效办公协作',
    chat: '实时沟通交流',
    system: '个性化设置管理'
  };
  return descMap[key] || '功能模块';
}

export default ModuleSelect;