import React, { useState, lazy } from 'react';

import styles from './RdSetting.module.css';
// 引入三个子组件
import MessageManagement from './MessageManagement';
import { useAuth } from '../../../context/AuthContext';
const QrcodeManagementSettings = lazy(() => import('./QrcodeManagementSettings'));
const Overview = lazy(() => import('./Overview'));
const PublishNews = lazy(() => import('./PublishNews'));
const SearchPrice = lazy(() => import('../../modules/office/SearchPrice'));
const SearchPdfFileView = lazy(() => import('../../modules/office/SearchPdfFileView'));

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
  {
    id: 'searchprice',
    label: '价格查询',
    iconHref: '#icon-xinwenzixun'
  },
  {
    id: 'templatemanagement',
    label: '模板下载',
    iconHref: '#icon-xinwenzixun'
  }
  
];

const RdSetting = () => {
  const [activeTab, setActiveTab] = useState('message');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth(); 
  // 处理菜单点击
  const handleMenuClick = (id) => {
    setActiveTab(id);
  };

  // 处理侧边栏折叠
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };



  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(./images/cqrdpg/image1.png)`,
       
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
          <img src='/WebpageLogo.jpg' alt="Avatar" className={styles.userAvatar} onError={(e) => e.target.src = 'https://via.placeholder.com/32'} />
          {!isSidebarCollapsed && <span className={styles.userName}>{user?.permission_level}</span>}
          {!isSidebarCollapsed && <SvgIcon href="#icon-guanyu3" className={styles.userIcon} size="18px" />}
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className={styles.rightBox}>
        {/* 顶部操作栏 */}
        <header className={styles.topBar}>
          <div className={styles.currentTag}>
            {/* {currentTagLabel} */}

            <img src='/WebpageLogo.jpg' alt="Avatar" className={styles.userAvatar} onError={(e) => e.target.src = 'https://via.placeholder.com/32'} />
            <span className={styles.logotext}>
              评估工作室
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
          <div className={`${styles.tabPane} ${activeTab === 'searchprice' ? styles.activePane : ''}`}>
            <SearchPrice />
          </div>
          <div className={`${styles.tabPane} ${activeTab === 'templatemanagement' ? styles.activePane : ''}`}>
            <SearchPdfFileView />
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