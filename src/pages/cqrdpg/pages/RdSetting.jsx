import React, { useState } from 'react';
import styles from './RdSetting.module.css';
// 引入两个子组件
import MessageManagement from './MessageManagement';
import QrcodeManagementSettings from './QrcodeManagementSettings';

// 模拟图标组件 (实际项目中建议使用 react-icons 或 svg)
const Icon = ({ name, className }) => {
  // 这里用 emoji 或简单字符模拟 font-icon，实际请替换为 <i className={`icon icon-${name}`}></i>
  const icons = {
    message: '💬',
    qrcode: '📱',
    search: '🔍',
    add: '➕',
    gear: '⚙️',
    collapse: '◀' 
  };
  return <span className={className}>{icons[name] || ''}</span>;

};
const bgImageUrl='./Picture/image1.png'; 
const AVATAR_URL = '/RuidaLogo.jpg';
const USER_NAME = "瑞达管理员";
const MENU_ITEMS = [
  { id: 'message', label: '留言管理', icon: 'message' },
  { id: 'qrcode', label: '二维码设置', icon: 'qrcode' },
];

const RdSetting = () => {
  const [activeTab, setActiveTab] = useState('message');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // 处理菜单点击
  const handleMenuClick = (id) => {
    setActiveTab(id);
  };

  // 处理侧边栏折叠
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // 获取当前激活的标签文本
  const currentTagLabel = MENU_ITEMS.find(item => item.id === activeTab)?.label || '设置';

  return (
    <div className={styles.container}
    style={{
        backgroundImage: `url(${bgImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      >
      {/* 左侧导航栏 */}
      <aside className={`${styles.leftBox} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <ul className={styles.navList}>
          {MENU_ITEMS.map((item) => (
            <li
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
              onClick={() => handleMenuClick(item.id)}
              title={item.label} // 折叠时显示 tooltip
            >
              <Icon name={item.icon} className={styles.navIcon} />
              <span className={styles.navText}>{item.label}</span>
            </li>
          ))}
          
          {/* 分割线 */}
          <hr className={styles.divider} />
          
          {/* 可以在这里添加更多系统级菜单，如“传输列表” */}
          <li className={styles.navItem} title="系统日志">
             <Icon name="gear" className={styles.navIcon} />
             <span className={styles.navText}>系统日志</span>
          </li>
        </ul>

        {/* 底部用户信息 */}
        <div className={styles.userInfo}>
          <img src={AVATAR_URL} alt="Avatar" className={styles.userAvatar} onError={(e) => e.target.src='https://via.placeholder.com/32'} />
          {!isSidebarCollapsed && <span className={styles.userName}>{USER_NAME}</span>}
          {!isSidebarCollapsed && <Icon name="gear" className={styles.userIcon} />}
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className={styles.rightBox}>
        {/* 顶部操作栏 */}
        <header className={styles.topBar}>
          <span className={styles.currentTag}>{currentTagLabel}</span>
          <div className={styles.actionBtns}>
            <div className={styles.btn}>
              <Icon name="search" className={styles.btnIcon} />
            </div>
            <div className={`${styles.btn} ${styles.btnAdd}`}>
              <Icon name="add" className={styles.btnIcon} />
            </div>
          </div>
        </header>

        {/* 内容区域 */}
        <div className={styles.contentArea}>
          {activeTab === 'message' && <MessageManagement />}
          {activeTab === 'qrcode' && <QrcodeManagementSettings />}
        </div>

        {/* 侧边栏折叠控制器 (悬浮在右侧区域左边缘) */}
        <div 
          className={`${styles.handler} ${isSidebarCollapsed ? styles.closed : ''}`} 
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "展开菜单" : "收起菜单"}
        >
          {/* CSS 伪元素绘制箭头 */}
        </div>
      </main>
    </div>
  );
};

export default RdSetting;