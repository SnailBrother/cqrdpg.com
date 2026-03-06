// src/pages/modules/ModuleLayout.js
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Layout/Header';
import PublicMessage from '../../components/Layout/PublicMessage';
import { Tabs, Sidebar, BottomNav } from '../../components/UI';
import KeepAliveOutlet from '../../components/KeepAliveOutlet';
import { useTheme } from '../../context/ThemeContext'; // 导入 ThemeContext
import { useMusic } from '../../context/MusicContext'; // 导入音乐上下文
import { useAuth } from '../../context/AuthContext';
import Player from './music/Player';
import styles from './ModuleLayout.module.css';

import DarkClouds from '../../components/Animation/DarkClouds';// 导入背景组件
import WaterWave from '../../components/Animation/WaterWave';//水滴滚动
import NauticalBackground from '../../components/Animation/NauticalBackground';//路飞出海
import FlowerScene from '../../components/Animation/FlowerScene';//鲜花盛开
import SakuraBackground from '../../components/Animation/SakuraBackground';//樱花飘落
import DetailsHomeBackground from '../../components/Animation/DetailsHomeBackground';//烟花
import CustomBackground from '../../components/Animation/CustomBackground';//自定义
import CandleAnimation from '../../components/Animation/CandleAnimation';//蜡烛吹灭
import CompassTime from '../../components/Animation/CompassTime';//时间罗盘
import BallLoading from '../../components/Animation/BallLoading';//弹性小球

// 【第2步】创建一个从字符串到组件的映射
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

// 菜单配置 (保持不变)
const moduleMenus = {
  accounting: [
    { key: 'AccountingHomePage', label: '首页', icon: '#icon-shouye3', path: '/app/accounting/AccountingHomePage', showInTabs: false  },
    { key: 'AccountingDetails', label: '明细', icon: '#icon-shouruzhengmingshenqingdan', path: '/app/accounting/AccountingDetails', showInTabs: false },
    { key: 'AccountingAdd', label: '添加', icon: '#icon-tianjia5', path: '/app/accounting/AccountingAdd', showInTabs: false },
    { key: 'AccountingCharts', label: '图标', icon: '#icon-baobiao', path: '/app/accounting/AccountingCharts', showInTabs: false },
    { key: 'AccountingMy', label: '我的', icon: '#icon-drxx88', path: '/app/accounting/AccountingMy', showInTabs: false },
  ],
  music: [
    { key: 'home', label: '首页', icon: '#icon-biaoqianA01_shouye-51', path: '/app/music/home', showInTabs: false },
    { key: 'recommend', label: '推荐', icon: '#icon-tuijian1', path: '/app/music/recommend', showInTabs: false },
    { key: 'recent', label: '最近播放', icon: '#icon-zuijinbofang', path: '/app/music/recent', showInTabs: false },
    { key: 'favorites', label: '我的喜欢', icon: '#icon-xihuan11', path: '/app/music/favorites', showInTabs: false },
    { key: 'musictogetherroommanager', label: '一起听歌', icon: '#icon-kefu', path: '/app/music/musictogetherroommanager', showInTabs: false },
    // { key: 'musicplayerlyrics', label: '歌词', icon: '#icon-xihuan11', path: '/app/music/musicplayerlyrics' },
  ],
  outfit: [
    { key: 'previewwardrobe', label: '查看', icon: 'icon-guge', path: '/app/outfit/previewwardrobe' },
    { key: 'updatewardrobe', label: '更新', icon: 'icon-guge', path: '/app/outfit/updatewardrobe' },
    { key: 'closet', label: '衣橱', icon: 'icon-guge', path: '/app/outfit/closet' },
    { key: 'combos', label: '搭配', icon: 'icon-guge', path: '/app/outfit/combos' },
  ],
  office: [
    { key: 'dashboard', label: '面板', icon: 'icon-guge', path: '/app/office/dashboard' },
    { key: 'docs', label: '文档', icon: 'icon-guge', path: '/app/office/docs' },
    { key: 'tasks', label: '任务', icon: 'icon-guge', path: '/app/office/tasks' },
  ],
  chat: [
    { key: 'ChatChat', label: '聊天', icon: '#icon-liaotian12', path: '/app/chat/ChatChat', showInTabs: false },
    { key: 'ChatDressingGuidelines', label: '动态', icon: '#icon-dongtai', path: '/app/chat/ChatDressingGuidelines', showInTabs: false },
  ],
  system: [
    { key: 'theme', label: '主题设置', icon: 'icon-guge', path: '/app/system/theme' },
    { key: 'profile', label: '个人资料', icon: 'icon-guge', path: '/app/system/profile' },
  ],
};

// 获取模块菜单的辅助函数
const getModuleMenu = (moduleKey) => {
  return moduleMenus[moduleKey] || [];
};

// 主组件
const ModuleLayout = ({ moduleKey, onLogout }) => {
  // 在组件内部添加状态控制
  const [showPublicMessage, setShowPublicMessage] = useState(true);
  // 【第3步】从 useTheme 中获取 activeTheme 对象
  const { activeTheme, loading: themeLoading } = useTheme();
  const { state: musicState } = useMusic(); // 新增：获取音乐状态
  // 新增：判断是否显示播放器
  const shouldShowPlayer = moduleKey === 'music' && musicState.currentSong;

  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = getModuleMenu(moduleKey);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);


  // 【第4步】根据 activeTheme.background_animation 的值，动态选择背景组件
  // const BackgroundComponent = useMemo(() => {
  // 如果有活动主题，就用它的特效名称；否则，可以设置一个默认值（比如 WaterWave）
  // const animationName = activeTheme?.background_animation || 'WaterWave';

  // 从映射中找到对应的组件，如果找不到，也返回一个默认组件
  // return backgroundComponents[animationName] || <WaterWave />;
  // }, [activeTheme]); // 依赖项只有 activeTheme

  // 修改背景组件选择逻辑
  const BackgroundComponent = useMemo(() => {
    // 如果主题还在加载中，显示默认背景
    if (themeLoading && !activeTheme) {
      return <WaterWave />;
    }

    // 如果有活动主题，就用它的特效名称；否则，使用默认值
    const animationName = activeTheme?.background_animation || 'WaterWave';

    // 从映射中找到对应的组件，如果找不到，也返回一个默认组件
    return backgroundComponents[animationName] || <WaterWave />;
  }, [activeTheme, themeLoading]);
  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 根据当前路由和菜单项初始化或更新 tabs
  // 修改 useEffect 中的标签页更新逻辑
  useEffect(() => {
    const currentPath = location.pathname;
    const currentMenuItem = menuItems.find(item =>
      item.path === currentPath || currentPath.startsWith(item.path + '/')
    );

    if (currentMenuItem) {
      setTabs(prev => {
        const exists = prev.find(tab => tab.key === currentMenuItem.key);

        // 如果菜单项配置为不在标签页显示，则不添加到标签页
        if (currentMenuItem.showInTabs === false) {
          // 如果已存在，则移除
          if (exists) {
            return prev.filter(tab => tab.key !== currentMenuItem.key);
          }
          return prev;
        }

        // 正常添加到标签页
        if (exists) return prev;
        return [...prev, currentMenuItem];
      });
    }
  }, [location.pathname, menuItems]);

  // 修改 activeTab 计算逻辑
  const activeTab = useMemo(() => {
    const currentPath = location.pathname;
    const menuItem = menuItems.find(item =>
      item.path === currentPath || currentPath.startsWith(item.path + '/')
    );

    // 如果当前路由对应的菜单项不显示在标签页，则返回空字符串
    if (menuItem && menuItem.showInTabs === false) {
      return '';
    }

    return menuItem ? menuItem.key : '';
  }, [location.pathname, menuItems]);

  // 修改 handleMenuClick 函数，处理不显示在标签页的菜单项
  const handleMenuClick = useCallback((menuItem) => {
    // 如果菜单项不显示在标签页，先移除可能存在的标签页
    if (menuItem.showInTabs === false) {
      setTabs(prev => prev.filter(tab => tab.key !== menuItem.key));
    }
    navigate(menuItem.path);
  }, [navigate]);

  const handleTabChange = useCallback((tabKey) => {
    const tab = menuItems.find(t => t.key === tabKey);
    if (tab) navigate(tab.path);
  }, [menuItems, navigate]);

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

  // 统一的布局结构
  return (
    <>
      {/* 背景层 */}
      <div className={styles.backgroundContainer}>
        {/* 【第5步】在这里渲染动态选择的组件 */}
        {BackgroundComponent}
      </div>

      {/* 主布局容器 */}
      <div className={`${styles.unifiedLayout} ${isMobile ? styles.isMobile : styles.isDesktop} ${sidebarCollapsed ? styles.sidebarCollapsed : ''} ${shouldShowPlayer ? styles.hasPlayer : styles.noPlayer
        }`}>

        {/* Header (仅桌面端显示) */}
        <div className={styles.headerContainer}>
          <Header onLogout={onLogout} />
        </div>
        {/* <p><strong>用户ID:</strong> {activeTheme.id}</p> */}
        {/* 侧边栏 (仅桌面端显示) */}
        <div className={styles.sidebarContainer}>
          <Sidebar
            menuItems={menuItems}
            activeKey={activeTab}
            onMenuClick={handleMenuClick}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* 主内容区域 (桌面和移动端共用) */}
        <main className={styles.mainContentArea}>
          {/* 公共消息通知 */}
          {showPublicMessage && (
            <div className={styles.publicMessageContainer}>
              <PublicMessage onClose={() => setShowPublicMessage(false)} />
            </div>
          )}

          {/* Tabs (仅桌面端显示) */}
          <div className={styles.tabsContainer}>
            <Tabs
              tabs={tabs}
              activeKey={activeTab}
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
            />
          </div>

          {/* 页面路由内容 */}
          <div className={styles.pageContent}>
            <KeepAliveOutlet />
          </div>
        </main>

        {/* 播放器 (仅音乐模块显示，位置通过CSS控制) */}
        {/* {moduleKey === 'music' && (
          <div className={styles.playerContainer}>
            <Player />
          </div>
        )} */}
        {shouldShowPlayer && (
          <div className={styles.playerContainer}>
            <Player />
          </div>
        )}

        {/* 底部导航 (仅移动端显示) */}
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

export { moduleMenus, getModuleMenu };
export default ModuleLayout;