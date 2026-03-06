// src/pages/modules/Select/index.js import { moduleConfig } from '../../../config/moduleConfig';


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleConfig } from '../../../config/moduleConfig';
import styles from './Phone.module.css';

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
      travelmanager: '✈️',  // 旅行改为飞机图标
      system: '⚙️',
      tool: '🛠️',          // 工具改为工具箱图标
      travel: '🧳',         // 单独的旅行改为行李箱图标
    };
    return emojiMap[key] || '📱';
  }

  function getModuleColor(key) {
    const colorMap = {
      accounting: '#10b981',  // 绿色
      music: '#8b5cf6',       // 紫色
      outfit: '#f59e0b',      // 橙色
      office: '#3b82f6',      // 蓝色
      chat: '#ec4899',        // 粉色
      travelmanager: '#06b6d4', // 青色（旅行管理）
      system: '#6b7280',      // 灰色
      tool: '#84cc16',        // 青绿色（工具）
      travel: '#f97316'       // 橙红色（旅行）
    };
    return colorMap[key] || '#6b7280';
  }

  const go = (defaultPath) => navigate(defaultPath);

  return (
    <div className={styles.wrapper}>
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

                <div className={styles.enterButton}>
                  <svg className={styles.arrowIcon} aria-hidden="true">
                    <use xlinkHref="#icon-jiantou_xiangyouliangci"></use>
                  </svg>
                </div>
              </div>


            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleSelect;