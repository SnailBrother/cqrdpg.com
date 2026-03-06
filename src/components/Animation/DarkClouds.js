import React from 'react';
import './DarkClouds.css';

// 直接导入图片（确保路径正确）
import clouds1 from './img/clouds_1.webp';
import clouds2 from './img/clouds_2.webp';
import clouds3 from './img/clouds_3.webp';

const DarkClouds = ( ) => {
  return (
    <div className="darkclouds-container">
      

      <div className="darkclouds-clouds">
        <div 
          className="darkclouds-clouds-1"
          style={{ backgroundImage: `url(${clouds2})` }}
        ></div>
        <div 
          className="darkclouds-clouds-2"
          style={{ backgroundImage: `url(${clouds1})` }}
        ></div>
        <div 
          className="darkclouds-clouds-3"
          style={{ backgroundImage: `url(${clouds3})` }}
        ></div>
      </div>
    </div>
  );
};

export default DarkClouds;