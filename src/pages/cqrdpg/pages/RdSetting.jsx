import React, { useState } from 'react';
import styles from './RdSetting.module.css';
// 引入三个子组件
import MessageManagement from './MessageManagement';
import QrcodeManagementSettings from './QrcodeManagementSettings';
import Overview from './Overview';
import PublishNews from './PublishNews';

// ================= 通用 SVG 图标组件 =================
const SvgIcon = ({ href, className, size = "24px" }) => {
  return (
    <svg 
      className={className} 
      aria-hidden="true" 
      style={{ width: size, height: size, fill: 'currentColor' }}
    >
      <use xlinkHref={href}></use>
    </svg>
  );
};

// ================= 配置区域 =================
const bgImageUrl = './images/cqrdpg/image1.png'; 
const AVATAR_URL = '/RuidaLogo.jpg';
const USER_NAME = "瑞达管理员";

// 菜单配置：直接定义 SVG 的 xlinkHref
// 请确保你的项目中已经引入了包含这些 symbol 的 SVG sprite 文件
// 例如在 index.html 中引入了 <svg style="display:none">...symbols...</svg>
const MENU_ITEMS = [
  { 
    id: 'message', 
    label: '留言管理', 
    iconHref: '#icon-liuyanmoban' 
  },
  { 
    id: 'qrcode', 
    label: '二维码设置', 
    iconHref: '#icon-erweima2' 
  },
  { 
    id: 'overview', 
    label: '概况', 
    iconHref: '#icon-0jianchajieguotongji' 
  },
  { 
    id: 'publishnews', 
    label: '消息新闻', 
    iconHref: '#icon-xinwenzixun' 
  },
];

const RdSetting = () => {
  const [activeTab, setActiveTab] = useState('message');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div 
      className={styles.container}
      style={{
        backgroundImage: `url(${bgImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 左侧导航栏 */}
      <aside className={`${styles.leftBox} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <ul className={styles.navList}>
          {MENU_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li
                key={item.id}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => handleMenuClick(item.id)}
                title={item.label}
              >
                {/* 使用自定义 SVG 图标 */}
                <SvgIcon 
                  href={item.iconHref} 
                  className={styles.navIcon} 
                />
                <span className={styles.navText}>{item.label}</span>
              </li>
            );
          })}
          
          <hr className={styles.divider} />
          
          <li className={styles.navItem} title="系统日志">
             <SvgIcon href="#icon-rizhi3" className={styles.navIcon} />
             <span className={styles.navText}>系统日志</span>
          </li>
        </ul>

        {/* 底部用户信息 */}
        <div className={styles.userInfo}>
          <img src={AVATAR_URL} alt="Avatar" className={styles.userAvatar} onError={(e) => e.target.src='https://via.placeholder.com/32'} />
          {!isSidebarCollapsed && <span className={styles.userName}>{USER_NAME}</span>}
          {!isSidebarCollapsed && <SvgIcon href="#icon-guanyu3" className={styles.userIcon} size="18px" />}
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className={styles.rightBox}>
        {/* 顶部操作栏 */}
        <header className={styles.topBar}>
          <div className={styles.currentTag}>
            {/* {currentTagLabel} */}
        
             <img src={AVATAR_URL} alt="Avatar" className={styles.userAvatar} onError={(e) => e.target.src='https://via.placeholder.com/32'} />
               <span>
                重庆瑞达资产评估房地产土地估价有限公司
                </span> 
            </div>
          <div className={styles.actionBtns}>
            <div className={styles.btn}>
              <SvgIcon href="#icon-fangdajing2" className={styles.btnIcon} />
            </div>
            <div className={`${styles.btn} ${styles.btnAdd}`}>
              <SvgIcon href="#icon-bianzu" className={styles.btnIcon} />
            </div>
          </div>
        </header>

        {/* 
           核心修改：内容区域 
           不再使用条件渲染 (&&)，而是全部渲染，通过 CSS 控制显示隐藏。
           这样切换 Tab 时，组件不会卸载，状态（输入框、分页等）会被保留。
        */}
        <div className={styles.contentArea}>
          <div className={`${styles.tabPane} ${activeTab === 'message' ? styles.activePane : ''}`}>
            <MessageManagement />
          </div>
          
          <div className={`${styles.tabPane} ${activeTab === 'qrcode' ? styles.activePane : ''}`}>
            <QrcodeManagementSettings />
          </div>
          
          <div className={`${styles.tabPane} ${activeTab === 'overview' ? styles.activePane : ''}`}>
            <Overview />
          </div>
           <div className={`${styles.tabPane} ${activeTab === 'publishnews' ? styles.activePane : ''}`}>
            <PublishNews />
          </div>
          
        </div>

        {/* 侧边栏折叠控制器 */}
        <div 
          className={`${styles.handler} ${isSidebarCollapsed ? styles.closed : ''}`} 
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "展开菜单" : "收起菜单"}
        >
        </div>
      </main>
    </div>
  );
};

export default RdSetting;