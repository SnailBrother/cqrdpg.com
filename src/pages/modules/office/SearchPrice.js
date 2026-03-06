import React, { useState } from 'react';
import styles from './SearchPrice.module.css';

import SearchHousePrice from './SearchPrice/SearchHousePrice';
import Buildings from './SearchPrice/SearchBuildings';
import Tree from './SearchPrice/Tree';
import Equipment from './SearchPrice/Equipment';
import NeighborhoodFinder from './SearchPrice/NeighborhoodFinder';
import RealEstateAISearch from './SearchPrice/RealEstateAISearch';
const SearchPrice = () => {
  const [activeTab, setActiveTab] = useState('房地产');

  const tabs = [
    { id: 'realEstate', label: '房地产', component: SearchHousePrice },
    { id: 'neighborhood', label: '地图找房', component: NeighborhoodFinder },
     { id: 'realestateaisearch', label: '智能管家', component: RealEstateAISearch },   
    { id: 'buildings', label: '构筑物', component: Buildings },
    { id: 'tree', label: '苗木', component: Tree },
    { id: 'equipment', label: '机器设备', component: Equipment }

  ];

  return (
    <div className={styles.container}>
      {/* Tab导航 */}
      <div className={styles.tabContainer}>
        <div className={styles.tabNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${
                activeTab === tab.label ? styles.active : ''
              }`}
              onClick={() => setActiveTab(tab.label)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 - 渲染所有组件但只显示激活的 */}
      <div className={styles.content}>
        {tabs.map((tab) => {
          const Component = tab.component;
          return (
            <div
              key={tab.id}
              className={`${styles.tabContent} ${
                activeTab === tab.label ? styles.active : ''
              }`}
            >
              <Component />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchPrice;