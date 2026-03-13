import React, { useState, lazy, Suspense } from 'react';
import styles from './RdSetting.module.css';
import MessageManagement from './MessageManagement';
import { useAuth } from '../../../context/AuthContext';

// 懒加载组件
const QrcodeManagementSettings = lazy(() => import('./QrcodeManagementSettings'));
const Overview = lazy(() => import('./Overview'));
const PublishNews = lazy(() => import('./PublishNews'));
const SearchPrice = lazy(() => import('../../modules/office/SearchPrice'));
const SearchPdfFileView = lazy(() => import('../../modules/office/SearchPdfFileView'));

const SvgIcon = ({ href, className, size = "24px" }) => (
  <svg className={className} aria-hidden="true" style={{ width: size, height: size, fill: 'currentColor' }}>
    <use xlinkHref={href}></use>
  </svg>
);

// ================= 配置菜单与组件映射 =================
const MENU_ITEMS = [
  { id: 'message', label: '留言管理', iconHref: '#icon-liuyanmoban', component: MessageManagement },
  { id: 'qrcode', label: '二维码', iconHref: '#icon-erweima2', component: QrcodeManagementSettings },
  // { id: 'overview', label: '概况', iconHref: '#icon-0jianchajieguotongji', component: Overview },
  { id: 'publishnews', label: '消息新闻', iconHref: '#icon-xinwenzixun', component: PublishNews },
  { id: 'searchprice', label: '价格查询', iconHref: '#icon-chakantupian4', component: SearchPrice },
  { id: 'templatemanagement', label: '模板下载', iconHref: '#icon-a-bianzu10', component: SearchPdfFileView },
  // 【修改点 1】将“系统日志”加入配置数组，并指定其组件为 Overview
  { id: 'system-logs', label: '系统日志', iconHref: '#icon-rizhi3', component: Overview },
];

const RdSetting = () => {
  const [activeTab, setActiveTab] = useState('message');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth(); 

  const handleMenuClick = (id) => setActiveTab(id);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  return (
    <div className={styles.container} style={{ backgroundImage: `url(./images/cqrdpg/image1.png)` }}>
      
      {/* 左侧导航栏 */}
      <aside className={`${styles.leftBox} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <ul className={styles.navList}>
          {MENU_ITEMS.map((item) => {
            // 【修改点 2】权限控制：如果不是管理员且菜单项是“系统日志”，则不渲染
            if (item.id === 'system-logs' && user?.permission_level !== 'Administrator') {
              return null;
            }

            const isActive = activeTab === item.id;
            return (
              <li
                key={item.id}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => handleMenuClick(item.id)}
                title={item.label}
              >
                <SvgIcon href={item.iconHref} className={styles.navIcon} />
                {!isSidebarCollapsed && <span className={styles.navText}>{item.label}</span>}
              </li>
            );
          })}

          {/* 分隔线也根据权限动态决定是否显示（可选优化） */}
          {/* 如果“系统日志”是最后一个且被隐藏了，分隔线可能显得多余，这里简单保留 */}
          {user?.permission_level === 'Administrator' && <hr className={styles.divider} />}
        </ul>

        {/* 底部用户信息 */}
        <div className={styles.userInfo}>
          <img src='/WebpageLogo.jpg' alt="Avatar" className={styles.userAvatar} onError={(e) => e.target.src = 'https://via.placeholder.com/32'} />
          {!isSidebarCollapsed && (
            <>
              <span className={styles.userName}>{user?.permission_level}</span>
              <SvgIcon href="#icon-guanyu3" className={styles.userIcon} size="18px" />
            </>
          )}
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className={styles.rightBox}>
        <header className={styles.topBar}>
          <div className={styles.currentTag}>
            <img src='/WebpageLogo.jpg' alt="Avatar" className={styles.userAvatar} onError={(e) => e.target.src = 'https://via.placeholder.com/32'} />
            <span className={styles.logotext}>重庆资产评估工作室</span>
          </div>
          <div className={styles.actionBtns}>
            <div className={styles.btn}><SvgIcon href="#icon-fangdajing2" className={styles.btnIcon} /></div>
            <div className={`${styles.btn} ${styles.btnAdd}`}><SvgIcon href="#icon-bianzu" className={styles.btnIcon} /></div>
          </div>
        </header>

        {/* 内容区域：渲染所有组件，通过 CSS 控制显示/隐藏 */}
        <div className={styles.contentArea}>
          <Suspense fallback={<div className={styles.loading}>正在加载模块...</div>}>
            {MENU_ITEMS.map((item) => {
              // 同样需要在渲染内容时进行权限检查，防止非管理员通过 URL 或直接状态访问到组件
              // 虽然菜单隐藏了，但为了安全起见，这里也加一层判断（或者依靠后端接口鉴权）
              if (item.id === 'system-logs' && user?.permission_level !== 'Administrator') {
                return null;
              }

              const Component = item.component;
              const isActive = activeTab === item.id;
              
              return (
                <div
                  key={item.id}
                  className={`${styles.tabPane} ${isActive ? styles.activePane : ''}`}
                  style={{ display: isActive ? 'block' : 'none' }} 
                >
                  <Component />
                </div>
              );
            })}
          </Suspense>
        </div>

        <div
          className={`${styles.handler} ${isSidebarCollapsed ? styles.closed : ''}`}
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "展开菜单" : "收起菜单"}
        ></div>
      </main>
    </div>
  );
};

export default RdSetting;