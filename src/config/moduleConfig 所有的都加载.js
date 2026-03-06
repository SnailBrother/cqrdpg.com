// src/config/moduleConfig.js

// src/config/moduleConfig.js

// 直接导入所有组件
import AccountingHomePage from '../pages/modules/accounting/AccountingHomePage';
import AccountingDetails from '../pages/modules/accounting/AccountingDetails';
import AccountingAdd from '../pages/modules/accounting/AccountingAdd';
import AccountingCharts from '../pages/modules/accounting/AccountingCharts';
import AccountingMy from '../pages/modules/accounting/AccountingMy';

import MusicHome from '../pages/modules/music/Home';
import MusicRecommend from '../pages/modules/music/Recommend';
import MusicRecent from '../pages/modules/music/Recent';
import MusicFavorites from '../pages/modules/music/Favorites';
import MusicTogetherRoomManager from '../pages/modules/music/TogetherRoomManager';

import OutfitPreviewWardrobe from '../pages/modules/outfit/PreviewWardrobe';
import OutfitUpdateWardrobe from '../pages/modules/outfit/UpdateWardrobe';
import OutfitCloset from '../pages/modules/outfit/Closet';
import OutfitCombos from '../pages/modules/outfit/Combos';

import OfficeDashboard from '../pages/modules/office/Dashboard';
import OfficeDocs from '../pages/modules/office/Docs';
import OfficeTasks from '../pages/modules/office/Tasks';

import ChatChat from '../pages/modules/chat/Chat';
import ChatDressingGuidelines from '../pages/modules/chat/DressingGuidelines';

import SystemThemeSettings from '../pages/modules/system/SystemThemeSettings';
import SystemProfile from '../pages/modules/system/Profile';

export const moduleConfig = {
  accounting: {
    label: '记账',
    defaultRoute: 'AccountingHomePage',
    routes: [
      { key: 'AccountingHomePage', label: '首页', icon: '#icon-shouye3', component: AccountingHomePage, showInTabs: false },
      { key: 'AccountingDetails', label: '明细', icon: '#icon-shouruzhengmingshenqingdan', component: AccountingDetails, showInTabs: false },
      { key: 'AccountingAdd', label: '添加', icon: '#icon-tianjia5', component: AccountingAdd, showInTabs: false },
      { key: 'AccountingCharts', label: '图表', icon: '#icon-baobiao', component: AccountingCharts, showInTabs: false },  
      { key: 'AccountingMy', label: '我的', icon: '#icon-drxx88', component: AccountingMy, showInTabs: false },
    ]
  },
  music: {
    label: '音乐',
    defaultRoute: 'home',
    routes: [
      { key: 'home', label: '首页', icon: '#icon-biaoqianA01_shouye-51', component: MusicHome, showInTabs: false },
      { key: 'recommend', label: '推荐', icon: '#icon-tuijian1', component: MusicRecommend, showInTabs: false },
      { key: 'recent', label: '最近播放', icon: '#icon-zuijinbofang', component: MusicRecent, showInTabs: false },
      { key: 'favorites', label: '我的喜欢', icon: '#icon-xihuan11', component: MusicFavorites, showInTabs: false },
      { key: 'musictogetherroommanager', label: '一起听歌', icon: '#icon-kefu', component: MusicTogetherRoomManager, showInTabs: false },
    ]
  },
  outfit: {
    label: '穿搭',
    defaultRoute: 'closet',
    routes: [
      { key: 'previewwardrobe', label: '查看', icon: 'icon-guge', component: OutfitPreviewWardrobe },
      { key: 'updatewardrobe', label: '更新', icon: 'icon-guge', component: OutfitUpdateWardrobe },
      { key: 'closet', label: '衣橱', icon: 'icon-guge', component: OutfitCloset },
      { key: 'combos', label: '搭配', icon: 'icon-guge', component: OutfitCombos },
    ]
  },
  office: {
    label: '办公',
    defaultRoute: 'dashboard',
    routes: [
      { key: 'dashboard', label: '面板', icon: 'icon-guge', component: OfficeDashboard },
      { key: 'docs', label: '文档', icon: 'icon-guge', component: OfficeDocs },
      { key: 'tasks', label: '任务', icon: 'icon-guge', component: OfficeTasks },
    ]
  },
  chat: {
    label: '聊天',
    defaultRoute: 'ChatChat',
    routes: [
      { key: 'ChatChat', label: '聊天', icon: '#icon-liaotian12', component: ChatChat, showInTabs: false },
      { key: 'ChatDressingGuidelines', label: '动态', icon: '#icon-dongtai', component: ChatDressingGuidelines, showInTabs: false },
    ]
  },
  system: {
    label: '系统',
    defaultRoute: 'theme',
    routes: [
      { key: 'theme', label: '主题设置', icon: 'icon-guge', component: SystemThemeSettings },
      { key: 'profile', label: '个人资料', icon: 'icon-guge', component: SystemProfile },
    ]
  }
};

// 导出用于 ModuleLayout 的菜单数据
export const getModuleMenu = (moduleKey) => {
  return moduleConfig[moduleKey]?.routes.map(route => ({
    key: route.key,
    label: route.label,
    icon: route.icon,
    path: `/app/${moduleKey}/${route.key}`,
    showInTabs: route.showInTabs !== undefined ? route.showInTabs : true // 默认显示在标签页
  })) || [];
};

// 导出所有模块键
export const MODULE_KEYS = Object.keys(moduleConfig);