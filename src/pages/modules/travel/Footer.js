//底部组件
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="travel-footer-container">
      <div className="travel-footer-content">
        <div className="travel-footer-column">
          <h3 className="travel-footer-heading">我的旅程</h3>
          <ul className="travel-footer-list">
            <li className="travel-footer-item">旅行地图</li>
            <li className="travel-footer-item">年度回顾</li>
            <li className="travel-footer-item">旅行统计</li>
          </ul>
        </div>
        
        <div className="travel-footer-column">
          <h3 className="travel-footer-heading">照片管理</h3>
          <ul className="travel-footer-list">
            <li className="travel-footer-item">按地点浏览</li>
            <li className="travel-footer-item">按时间浏览</li>
            <li className="travel-footer-item">精选相册</li>
          </ul>
        </div>
        
        <div className="travel-footer-column">
          <h3 className="travel-footer-heading">分享</h3>
          <ul className="travel-footer-list">
            <li className="travel-footer-item">生成旅行日志</li>
            <li className="travel-footer-item">分享到社交媒体</li>
            <li className="travel-footer-item">打印旅行照片</li>
          </ul>
        </div>
        
        <div className="travel-footer-column">
          <h3 className="travel-footer-heading">关于</h3>
          <ul className="travel-footer-list">
            <li className="travel-footer-item">关于Cyy</li>
            <li className="travel-footer-item">使用帮助</li>
            <li className="travel-footer-item">联系我们</li>
          </ul>
        </div>
      </div>
      
      <div className="travel-footer-bottom">
        <p className="travel-footer-copyright">© {new Date().getFullYear()} Cyy - 记录你的每一段旅程</p>
      </div>
    </footer>
  );
};

export default Footer;