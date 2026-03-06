// src/pages/modules/ModuleLayout.js
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Layout/Header';
import PublicMessage from '../../components/Layout/PublicMessage';
import { Tabs, Sidebar, BottomNav } from '../../components/UI';
import KeepAliveOutlet from '../../components/KeepAliveOutlet';
import { useTheme } from '../../context/ThemeContext';
import { useMusic } from '../../context/MusicContext';
import Player from './music/Player';
import styles from './ModuleLayout.module.css';

// 动画背景组件
import DarkClouds from '../../components/Animation/DarkClouds';
import WaterWave from '../../components/Animation/WaterWave';
import NauticalBackground from '../../components/Animation/NauticalBackground';
import FlowerScene from '../../components/Animation/FlowerScene';
import SakuraBackground from '../../components/Animation/SakuraBackground';
import DetailsHomeBackground from '../../components/Animation/DetailsHomeBackground';
import CustomBackground from '../../components/Animation/CustomBackground';
import CandleAnimation from '../../components/Animation/CandleAnimation';
import CompassTime from '../../components/Animation/CompassTime';
import BallLoading from '../../components/Animation/BallLoading';

// 从配置文件导入
import { getModuleMenu } from '../../config/moduleConfig';

// 背景组件映射
const backgroundComponents = {
  WaterWave: <WaterWave />,
  NauticalBackground: <NauticalBackground />,
  FlowerScene: <FlowerScene />,
  DarkClouds: <DarkClouds />,
  SakuraBackground: <SakuraBackground />,
  DetailsHomeBackground: <DetailsHomeBackground />,
  CandleAnimation: <CandleAnimation />,
  CompassTime: <CompassTime />,
  BallLoading: <BallLoading />,
  CustomBackground: <CustomBackground />,
};

const ModuleLayout = ({ moduleKey, onLogout }) => {
  const [showPublicMessage, setShowPublicMessage] = useState(true);
  const { activeTheme, loading: themeLoading } = useTheme();
  const { state: musicState } = useMusic();
  const shouldShowPlayer = moduleKey === 'music' && musicState.currentSong;

  const location = useLocation();
  const navigate = useNavigate();
  
  // 使用配置获取菜单
  const menuItems = getModuleMenu(moduleKey);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // 动态背景组件
  const BackgroundComponent = useMemo(() => {
    if (themeLoading && !activeTheme) {
      return <WaterWave />;
    }
    const animationName = activeTheme?.background_animation || 'WaterWave';
    return backgroundComponents[animationName] || <WaterWave />;
  }, [activeTheme, themeLoading]);

  // 响应式检测
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 更新 tabs（根据路由）
  useEffect(() => {
    const currentPath = location.pathname;
    const currentMenuItem = menuItems.find(item =>
      item.path === currentPath || currentPath.startsWith(item.path + '/')
    );

    if (currentMenuItem) {
      setTabs(prev => {
        const exists = prev.find(tab => tab.key === currentMenuItem.key);

        if (currentMenuItem.showInTabs === false) {
          if (exists) return prev.filter(tab => tab.key !== currentMenuItem.key);
          return prev;
        }

        if (exists) return prev;
        return [...prev, currentMenuItem];
      });
    }
  }, [location.pathname, menuItems]);

  // 计算当前激活的 tab
  const activeTab = useMemo(() => {
    const currentPath = location.pathname;
    const menuItem = menuItems.find(item =>
      item.path === currentPath || currentPath.startsWith(item.path + '/')
    );

    if (menuItem && menuItem.showInTabs === false) {
      return '';
    }

    return menuItem ? menuItem.key : '';
  }, [location.pathname, menuItems]);

  // 菜单点击处理
  const handleMenuClick = useCallback((menuItem) => {
    if (menuItem.showInTabs === false) {
      setTabs(prev => prev.filter(tab => tab.key !== menuItem.key));
    }
    navigate(menuItem.path);
  }, [navigate]);

  // Tab 切换
  const handleTabChange = useCallback((tabKey) => {
    const tab = menuItems.find(t => t.key === tabKey);
    if (tab) navigate(tab.path);
  }, [menuItems, navigate]);

  // 关闭 Tab
  const handleTabClose = useCallback((tabKey) => {
    if (tabs.length <= 1) return;
    setTabs(prev => {
      const newTabs = prev.filter(t => t.key !== tabKey);
      if (tabKey === activeTab) {
        const closedIndex = prev.findIndex(t => t.key === tabKey);
        const nextTab = newTabs[Math.max(0, closedIndex - 1)];
        if (nextTab) {
          const menuItem = menuItems.find(item => item.key === nextTab.key);
          if (menuItem) navigate(menuItem.path);
        }
      }
      return newTabs;
    });
  }, [tabs, activeTab, menuItems, navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <>
      {/* 背景层 */}
      <div className={styles.backgroundContainer}>
        {BackgroundComponent}
      </div>

      {/* 主布局 */}
      <div className={`${styles.unifiedLayout} ${isMobile ? styles.isMobile : styles.isDesktop} ${sidebarCollapsed ? styles.sidebarCollapsed : ''} ${shouldShowPlayer ? styles.hasPlayer : styles.noPlayer}`}>
        
        {/* Header（桌面端） */}
        <div className={styles.headerContainer}>
          <Header onLogout={onLogout} />
        </div>

        {/* 侧边栏（桌面端） */}
        <div className={styles.sidebarContainer}>
          <Sidebar
            menuItems={menuItems}
            activeKey={activeTab}
            onMenuClick={handleMenuClick}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* 主内容区 */}
        <main className={styles.mainContentArea}>
          {/* 公共消息 */}
          {showPublicMessage && (
            <div className={styles.publicMessageContainer}>
              <PublicMessage onClose={() => setShowPublicMessage(false)} />
            </div>
          )}

          {/* Tabs（桌面端） */}
          <div className={styles.tabsContainer}>
            <Tabs
              tabs={tabs}
              activeKey={activeTab}
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
            />
          </div>

          {/* 路由出口 */}
          <div className={styles.pageContent}>
            <KeepAliveOutlet />
          </div>
        </main>

        {/* 音乐播放器 */}
        {shouldShowPlayer && (
          <div className={styles.playerContainer}>
            <Player />
          </div>
        )}

        {/* 底部导航（移动端） */}
        <div className={styles.bottomNavContainer}>
          <BottomNav
            menuItems={menuItems}
            activeKey={activeTab}
            onMenuClick={handleMenuClick}
          />
        </div>
      </div>
    </>
  );
};

export default ModuleLayout;