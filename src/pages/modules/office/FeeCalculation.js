import React, { useState } from 'react';
import Assetcharges from './FeeCalculation/Assetcharges';  // 导入资产计算器组件
import RealEstateCalculator from './FeeCalculation/RealEstateCalculator';  // 导入房地产计算器组件
import ProjectManager from './FeeCalculation/ProjectManager';

 import './FeeCalculation.css'; // 引入样式
 
import { useTheme } from '../../../context/ThemeContext'; // 导入useTheme钩子

const FeeCalculation = () => {
  const [activeTab, setActiveTab] = useState('realEstate');  // 默认选项卡为“资产”
 

  return (
    <div className="fee-calculation-container" 
   >
       {/* <h2>&#32;当前位置：首页&#32;&gt;&#32;收费计算</h2> */}
      {/* 选项卡部分 */}
      <div className="tabs">
        <div
          className={`tab ${activeTab === 'projectManager' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('projectManager')}
        >
          绩效
        </div>
        <div
          className={`tab ${activeTab === 'realEstate' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('realEstate')}
        >
          房地产
        </div>
        <div
          className={`tab ${activeTab === 'asset' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('asset')}
        >
          资产
        </div>
      </div>

      {/* 根据选中的标签显示不同的小组件 */}
       {activeTab === 'projectManager' && <ProjectManager />}
       {activeTab === 'realEstate' && <RealEstateCalculator />}
      {activeTab === 'asset' && <Assetcharges />}
     
     
    </div>
  );
};

export default FeeCalculation;
