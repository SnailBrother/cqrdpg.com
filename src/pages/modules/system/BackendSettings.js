import React, { useState } from 'react';
import styles from './BackendSettings.module.css';

// 导入各个功能组件
import MusicUpload from './music/UploadMusic';
import DeleteMusic from './music/DeleteMusic';
import WebsiteManager from './usedwebsites/AddNewSiteLinks';
import MessagePublisher from './publicnews/AddNewPublicNews';
import SpecialNotice from './specialtips/AddNewSpecialtips';
import AddBuildingsPrice from './buildings/AddBuildingsPriceData';


const BackendSettings = () => {
  const [activeTab, setActiveTab] = useState('music');

  // 菜单项配置
  const menuItems = [
    { id: 'uploadmusic', label: '音乐上传', icon: '🎵' },
    { id: 'deletemusic', label: '音乐删除', icon: '🎵' },
    { id: 'website', label: '添加网站', icon: '🌐' },
    { id: 'message', label: '发布消息', icon: '📢' },
    { id: 'notice', label: '特别提示', icon: '⚠️' },
     { id: 'addBuildingsPrice', label: '建筑物价格', icon: '⚠️' }
  ];

  // 获取标签页名称
  const getTabLabel = (tabId) => {
    const item = menuItems.find(item => item.id === tabId);
    return item ? item.label : '';
  };

  return (
    <div className={styles.container}>
      {/* 侧边栏 */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>后台设置</h2>
        </div>
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`${styles.menuItem} ${
              activeTab === item.id ? styles.active : ''
            }`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* 主内容区域 */}
      <div className={styles.content}>
 

        {/* 所有组件都渲染，但只显示活动的那个 */}
        <div className={activeTab === 'uploadmusic' ? styles.tabActive : styles.tabHidden}>
          <MusicUpload />
        </div>
         <div className={activeTab === 'deletemusic' ? styles.tabActive : styles.tabHidden}>
          <DeleteMusic />
        </div>
        <div className={activeTab === 'website' ? styles.tabActive : styles.tabHidden}>
          <WebsiteManager />
        </div>
        
        <div className={activeTab === 'message' ? styles.tabActive : styles.tabHidden}>
          <MessagePublisher />
        </div>
        
        <div className={activeTab === 'notice' ? styles.tabActive : styles.tabHidden}>
          <SpecialNotice />
        </div>
 <div className={activeTab === 'addBuildingsPrice' ? styles.tabActive : styles.tabHidden}>
          <AddBuildingsPrice />
        </div>
        
      </div>
    </div>
  );
};

export default BackendSettings;