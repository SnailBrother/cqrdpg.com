// src/config/moduleConfig.js
import React, { lazy } from 'react';

// 核心页面 - 直接导入（常用页面）

import AccountingDetails from '../pages/modules/accounting/AccountingDetails';
import MusicHome from '../pages/modules/music/Home';
import MusicRecommend from '../pages/modules/music/Recommend';
import ChatChat from '../pages/modules/chat/Chat';
import Musicplayer from '../pages/modules/music/Player';
import SystemThemeSettings from '../pages/modules/system/SystemThemeSettings';
import SystemReadExcelData from '../pages/modules/system/ReadExcelData';
 
// 非核心页面 - 懒加载（不常用页面）
const AccountingAdd = lazy(() => import('../pages/modules/accounting/AccountingAdd'));
const AccountingCharts = lazy(() => import('../pages/modules/accounting/AccountingCharts'));
const AccountingMy = lazy(() => import('../pages/modules/accounting/AccountingMy'));
const AccountingHomePage = lazy(() => import('../pages/modules/accounting/AccountingHomePage'));

//------------------------------听歌------------------------------
const MusicRecent = lazy(() => import('../pages/modules/music/Recent'));
const MusicFavorites = lazy(() => import('../pages/modules/music/Favorites'));
const MusicTogetherRoomManager = lazy(() => import('../pages/modules/music/TogetherRoomManager'));
const FluteSheetMusic = lazy(() => import('../pages/modules/music/FluteSheetMusic'));
const MusicMenu = lazy(() => import('../pages/modules/music/MusicMenu'));

//------------------------------穿搭------------------------------
const OutfitPreviewWardrobe = lazy(() => import('../pages/modules/outfit/PreviewWardrobe'));
const OutfitUpdateWardrobe = lazy(() => import('../pages/modules/outfit/UpdateWardrobe'));
const OutfitCloset = lazy(() => import('../pages/modules/outfit/Closet'));
const OutfitCombos = lazy(() => import('../pages/modules/outfit/Combos'));

//------------------------------办公------------------------------
const OfficePublicNews = lazy(() => import('../pages/modules/office/PublicNews'));
//const OfficeMessageDetail = lazy(() => import('../pages/modules/office/MessageDetail'));
const OfficeFeeCalculation = lazy(() => import('../pages/modules/office/FeeCalculation'));
//const OfficeEvaluationFilePreview = lazy(() => import('../pages/modules/office/EvaluationFilePreview'));
const OfficeSearchPrice = lazy(() => import('../pages/modules/office/SearchPrice'));
const OfficeLookHousePricePicture = lazy(() => import('../pages/modules/office/SearchPrice/LookHousePricePicture'));
const OfficeLookBuildingsPricePicture = lazy(() => import('../pages/modules/office/SearchPrice/LookBuildingsPricePicture'));
const OfficeUploadHousePricePicture = lazy(() => import('../pages/modules/office/SearchPrice/UploadHousePricePicture'));
//const OfficeTemplateManagement = lazy(() => import('../pages/modules/office/TemplateManagement'));
const OfficeSpecialtips = lazy(() => import('../pages/modules/office/Specialtips'));
const OfficeSiteLinks = lazy(() => import('../pages/modules/office/SiteLinks'));
const OfficeWordReportGenerator = lazy(() => import('../pages/modules/office/WordReportGenerator'));
//const OfficeMergePrintPdf = lazy(() => import('../pages/modules/office/MergePrintPdf'));
//const OfficePriceConsultationDialog = lazy(() => import('../pages/modules/office/PriceConsultationDialog'));
//const OfficeNeighborhoodFinder = lazy(() => import('../pages/modules/office/NeighborhoodFinder'));
const OfficeSearchPdfFileView = lazy(() => import('../pages/modules/office/SearchPdfFileView'));
//------------------------------聊天------------------------------
const ChatDressingGuidelines = lazy(() => import('../pages/modules/chat/DressingGuidelines'));
const ChatUpdateWear = lazy(() => import('../pages/modules/chat/UpdateWear'));

//------------------------------系统------------------------------
const SystemProfile = lazy(() => import('../pages/modules/system/Profile'));
const SystemBackendSettings = lazy(() => import('../pages/modules/system/BackendSettings'));
const SystemWordEditing = lazy(() => import('../pages/modules/system/WordEditing'));
const SystemExcelEditing = lazy(() => import('../pages/modules/system/ExcelEditing'));
const SystemUploadBuildingsPricePicture = lazy(() => import('../pages/modules/system/buildings/UploadBuildingsPricePicture'));
//const SystemReadExcelData = lazy(() => import('../pages/modules/system/ReadExcelData'));

//------------------------------旅行------------------------------
const FirstTimeTravel = lazy(() => import('../pages/modules/travel/FirstTime/HomeContainer'));
const SecondTimeTravel = lazy(() => import('../pages/modules/travel/SecondTime/DetailsHomeContainer'));
const TravelManager = lazy(() => import('../pages/modules/travel/TravelManager'));

//------------------------------游戏------------------------------
const ToolAuntFlo = lazy(() => import('../pages/modules/tool/AuntFlo'));
const ToolDeepseekAi = lazy(() => import('../pages/modules/tool/DeepseekAi'));
//const ToolAliyunAi = lazy(() => import('../pages/modules/tool/AliyunAi'));
const ToolDoubleChromosphere = lazy(() => import('../pages/modules/tool/DoubleChromosphere'));
const ToolImageCompressionTool = lazy(() => import('../pages/modules/tool/ImageCompressionTool'));
const ToolFunGames = lazy(() => import('../pages/modules/tool/FunGames'));

//------------------------------运动------------------------------
const Sport = lazy(() => import('../pages/modules/sports/Sports'));
const SportsDetails = lazy(() => import('../pages/modules/sports/SportsDetails'));
const SportsManual = lazy(() => import('../pages/modules/sports/Manual'));


// 隐藏页面 - 不显示在导航中
const MusicplayerLyrics = lazy(() => import('../pages/modules/music/MusicplayerLyrics'));
const MusicPlaylist = lazy(() => import('../pages/modules/music/MusicPlaylist'));
const MusicSongReview = lazy(() => import('../pages/modules/music/SongReview'));

export const moduleConfig = {
  accounting: {
    label: '记账',
    defaultRoute: 'AccountingAdd',
    routes: [
      { key: 'AccountingHomePage', label: '首页', icon: '#icon-shouye3', component: AccountingHomePage, showInTabs: false, showInNavigation: true },
      { key: 'AccountingDetails', label: '明细', icon: '#icon-shouruzhengmingshenqingdan', component: AccountingDetails, showInTabs: false, showInNavigation: true },
      { key: 'AccountingAdd', label: '添加', icon: '#icon-tianjia5', component: AccountingAdd, showInTabs: false, showInNavigation: true },
      { key: 'AccountingCharts', label: '图表', icon: '#icon-baobiao', component: AccountingCharts, showInTabs: false, showInNavigation: true },
      { key: 'AccountingMy', label: '我的', icon: '#icon-drxx88', component: AccountingMy, showInTabs: false, showInNavigation: true },
    ]
  },
  music: {
    label: '音乐',
    defaultRoute: 'home',
    routes: [
      { key: 'home', label: '首页', icon: '#icon-biaoqianA01_shouye-51', component: MusicHome, showInTabs: false, showInNavigation: true },
      { key: 'recommend', label: '推荐', icon: '#icon-tuijian1', component: MusicRecommend, showInTabs: false, showInNavigation: true },
      { key: 'recent', label: '最近', icon: '#icon-zuijinbofang', component: MusicRecent, showInTabs: false, showInNavigation: true },
      { key: 'favorites', label: '喜欢', icon: '#icon-xihuan11', component: MusicFavorites, showInTabs: false, showInNavigation: true },
      { key: 'musictogetherroommanager', label: '一起听', icon: '#icon-kefu', component: MusicTogetherRoomManager, showInTabs: false, showInNavigation: true },

      
     // { key: 'fluteSheetMusic', label: '音符', icon: '#icon-kefu', component: FluteSheetMusic, showInTabs: false, showInNavigation: true },
     
      // 隐藏的路由 - 不显示在导航中
            { key: 'musicMenu', label: '快捷键', icon: '#icon-kefu', component: MusicMenu, showInTabs: false, showInNavigation: false },
      { key: 'musicplayerlyrics', label: '歌词', component: MusicplayerLyrics, showInTabs: false, showInNavigation: false },
      { key: 'musicplayer', label: '播放器', component: Musicplayer, showInTabs: false, showInNavigation: false },
      { key: 'musicplaylist', label: '播放列表', component: MusicPlaylist, showInTabs: false, showInNavigation: false },
      { key: 'musicsongreview', label: '播放列表', component: MusicSongReview, showInTabs: false, showInNavigation: false },

    ]
  },
  outfit: {
    label: '穿搭',
    defaultRoute: 'closet',
    routes: [
      { key: 'previewwardrobe', label: '查看', icon: 'icon-guge', component: OutfitPreviewWardrobe, showInNavigation: true },
      { key: 'updatewardrobe', label: '更新', icon: 'icon-guge', component: OutfitUpdateWardrobe, showInNavigation: true },
      { key: 'closet', label: '衣橱', icon: 'icon-guge', component: OutfitCloset, showInNavigation: true },
      { key: 'combos', label: '搭配', icon: 'icon-guge', component: OutfitCombos, showInNavigation: true },
    ]
  },
  office: {
    label: '办公',
    defaultRoute: 'SearchPrice',
    routes: [
        { key: 'SearchPrice', label: '价格查询', icon: '#icon-chakantupian4', component: OfficeSearchPrice, showInNavigation: true, showInTabs: false },
        { key: 'OfficeSearchPdfFileView', label: '资料查找', icon: '#icon-pdf2', component: OfficeSearchPdfFileView, showInNavigation: true, showInTabs: false  },
        // { key: 'TemplateManagement', label: '模板下载', icon: '#icon-a-bianzu10', component: OfficeTemplateManagement, showInNavigation: true, showInTabs: false },
        { key: 'PublicNews', label: '消息通知', icon: '#icon-tongzhi4', component: OfficePublicNews, showInNavigation: true, showInTabs: false },
     // { key: 'PriceConsultationDialog', label: '价格咨询', icon: '#icon-dingwei-xiaoquzuola', component: OfficePriceConsultationDialog, showInNavigation: true, showInTabs: false  },
      //{ key: 'NeighborhoodFinder', label: '小区查询', icon: '#icon-stock', component: OfficeNeighborhoodFinder, showInNavigation: true, showInTabs: false  },
      // { key: 'MessageDetail/:messageId', label: '消息详情', icon: '#icon-yinliang2',  component: OfficeMessageDetail, showInNavigation: false, showInTabs: false },
      // { key: 'MessageDetail', label: '消息通知', icon: '#icon-yinliang2', component: OfficeMessageDetail,  showInNavigation: false, showInTabs: false },
    
      { key: 'LookHousePricePicture', label: '查看图片', icon: '#icon-chakantupian4', component: OfficeLookHousePricePicture, showInNavigation: false, showInTabs: false  },
      { key: 'LookBuildingsPricePicture', label: '查看图片', icon: '#icon-chakantupian4', component: OfficeLookBuildingsPricePicture, showInNavigation: false, showInTabs: false  },
      { key: 'UploadHousePricePicture', label: '上传图片', icon: '#icon-chakantupian4', component: OfficeUploadHousePricePicture, showInNavigation: false, showInTabs: false  },
      //{ key: 'OfficeMergePrintPdf', label: '资料打印', icon: '#icon-pdf2', component: OfficeMergePrintPdf, showInNavigation: true, showInTabs: false  },
     
      { key: 'Specialtips', label: '特别提示', icon: '#icon-tishi', component: OfficeSpecialtips, showInNavigation: true, showInTabs: false },
      { key: 'SiteLinks', label: '常用网站', icon: '#icon-web', component: OfficeSiteLinks, showInNavigation: true, showInTabs: false },
      { key: 'FeeCalculation', label: '收费计算', icon: '#icon-jisuanji', component: OfficeFeeCalculation, showInNavigation: true, showInTabs: false },
     // { key: 'EvaluationFilePreview', label: '参考文献', icon: '#icon-bendiwenjianziyuan', component: OfficeEvaluationFilePreview, showInNavigation: true, showInTabs: false },
      { key: 'WordReportGenerator', label: '撰写报告', icon: '#icon-xiti', component: OfficeWordReportGenerator, showInNavigation: true, showInTabs: false },
    ]
  },
  chat: {
    label: '聊天',
    defaultRoute: 'ChatChat',
    routes: [
      { key: 'ChatChat', label: '聊天', icon: '#icon-liaotian12', component: ChatChat, showInTabs: false, showInNavigation: true },
      { key: 'ChatDressingGuidelines', label: '动态', icon: '#icon-dongtai', component: ChatDressingGuidelines, showInTabs: false, showInNavigation: true },
      { key: 'ChatUpdateWear', label: '发布', icon: '#icon-logo2', component: ChatUpdateWear, showInTabs: false, showInNavigation: true },
    ]
  },
  travel: {
    label: '旅行',
    defaultRoute: 'TravelManager',
    routes: [
      { key: 'TravelManager', label: '美好时光', icon: '#icon-icon-test-copy', component: TravelManager, showInTabs: false, showInNavigation: true },
      { key: 'FirstTimeTravel', label: '第一卷', icon: '#icon-lvhang', component: FirstTimeTravel, showInTabs: false, showInNavigation: false },
      { key: 'SecondTimeTravel', label: '第二卷', icon: '#icon-icon-test-copy', component: SecondTimeTravel, showInTabs: false, showInNavigation: false },
    ]
  },
  system: {
    label: '系统',
    defaultRoute: 'theme',
    routes: [
      { key: 'theme', label: '主题设置', icon: '#icon-zhuti1', component: SystemThemeSettings, showInNavigation: true },
      { key: 'profile', label: '个人资料', icon: '#icon-user-01', component: SystemProfile, showInNavigation: true },
       { key: 'WordEditing', label: 'word编辑', icon: '#icon-word', component: SystemWordEditing, showInNavigation: true },
       { key: 'ExcelEditing', label: 'Excel编辑', icon: '#icon-excel4', component: SystemExcelEditing, showInNavigation: true },
       { key: 'ReadExcelData', label: 'Excel读取', icon: '#icon-excel4', component: SystemReadExcelData, showInNavigation: true },
       
      { key: 'BackendSettings', label: '数据更新', icon: '#icon-gongjuxuanzhong', component: SystemBackendSettings, showInNavigation: true },
      { key: 'UploadBuildingsPricePicture', label: '更新建筑物图片', icon: '#icon-gongjuxuanzhong', component: SystemUploadBuildingsPricePicture, showInTabs: false, showInNavigation: false },
     
    ]
  },
  tool: {
    label: '小工具',
    defaultRoute: 'imagecompressiontool',
    routes: [
      { key: 'imagecompressiontool', label: '图片压缩', icon: '#icon-gongju1', component: ToolImageCompressionTool, showInNavigation: true },
      { key: 'doublechromosphere', label: '双色球', icon: '#icon-shuangseqiu', component: ToolDoubleChromosphere, showInNavigation: true },
       { key: 'deepseekai', label: 'AI', icon: '#icon-Ai', component: ToolDeepseekAi, showInNavigation: true },
      // { key: 'aliyunAi', label: '阿里百炼', icon: '#icon-yigui1', component: ToolAliyunAi, showInNavigation: true },
      { key: 'auntflo', label: '经期', icon: '#icon-tianjiabiao', component: ToolAuntFlo, showInNavigation: true },
      { key: 'fungames', label: '游戏', icon: '#icon-yigui1', component: ToolFunGames, showInNavigation: true },
     
    ]
  },
    sport: {
    label: '运动',
    defaultRoute: 'sport',
    routes: [
      { key: 'sport', label: '运动', icon: '#icon-ticao2', component: Sport, showInTabs: false, showInNavigation: true },
       { key: 'sportsdetails', label: '详情', icon: '#icon-yuqiequanxuanzhong', component: SportsDetails, showInTabs: false, showInNavigation: true },
        { key: 'sportsManual', label: '教程', icon: '#icon-dr_yxyz', component: SportsManual, showInTabs: false, showInNavigation: true },
      
    ]
  },
};

// 导出用于 ModuleLayout 的菜单数据 - 只包含 showInNavigation 为 true 的路由
export const getModuleMenu = (moduleKey) => {
  return moduleConfig[moduleKey]?.routes
    .filter(route => route.showInNavigation !== false) // 只包含显示在导航中的路由
    .map(route => ({
      key: route.key,
      label: route.label,
      icon: route.icon,
      path: `/app/${moduleKey}/${route.key}`,
      showInTabs: route.showInTabs !== undefined ? route.showInTabs : true
    })) || [];
};

// 导出所有模块键
export const MODULE_KEYS = Object.keys(moduleConfig);