import React, { useState } from 'react';
import styles from './SearchPdfFileView.module.css';

import MergePrintPdf from './PdfFileView/MergePrintPdf';
import EvaluationFilePreview from './PdfFileView/EvaluationFilePreview';


const SearchPrice = () => {
  const [activeTab, setActiveTab] = useState('报告打印');

  const tabs = [
    { id: 'MergePrintPdf', label: '报告打印', component: MergePrintPdf },
    { id: 'EvaluationFilePreview', label: '评估资料', component: EvaluationFilePreview },


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