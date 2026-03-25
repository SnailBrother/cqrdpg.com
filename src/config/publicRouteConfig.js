// src/config/publicRouteConfig.js
import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// --- 1. 核心/高频页面 (直接导入 - Eager Loading) ---
// 这些页面用户进入网站最先看到，直接打包进主 bundle，避免闪烁
// import Home from '../pages/cqrdpg/pages/Home';
// import Login from '../pages/cqrdpg/pages/Login';
// import Register from '../pages/user/register';
 

// --- 2. 非核心/低频页面 (懒加载 - Lazy Loading) ---
// 这些页面只有用户点击特定链接才会访问，拆分出去减小主包体积
//const Home = lazy(() => import('../pages/cqrdpg/pages/Home'));//评估官网
const Home = lazy(() => import('../pages/love/home'));

const Login = lazy(() => import('../pages/cqrdpg/pages/Login'));
const Register = lazy(() => import('../pages/user/register'));
const NewsDetails = lazy(() => import('../pages/cqrdpg/pages/home/NewsDetails'));
const Suggestion = lazy(() => import('../pages/cqrdpg/pages/Suggestion'));
const EasyValuation = lazy(() => import('../pages/cqrdpg/pages/EasyValuation'));
const QrcodeRealCheck = lazy(() => import('../pages/cqrdpg/pages/home/QrcodeRealCheck'));
const Reportqrcodepag = lazy(() => import('../pages/modules/office/WordReportGenerator/ReportQrCodePage'));
const OfficeLookHousePricePicture = lazy(() => import('../pages/modules/office/SearchPrice/LookHousePricePicture'));
const CodeCheck = lazy(() => import('../pages/cqrdpg/pages/CodeCheck'));
const Four = lazy(() => import('../components/Animation/NotFound')); // 404 页面通常也可以懒加载

// --- 3. 路由配置表 ---
export const publicRouteConfig = [
  {
    path: '/login',
    component: Login,
    requiresAuth: false, // 标记：不需要登录，但如果已登录需跳转
    redirectIfAuth: '/apps'
  },
  {
    path: '/register',
    component: Register,
    requiresAuth: false,
    redirectIfAuth: '/apps'
  },
  {
    path: '/home',
    component: Home,
    requiresAuth: false, // 根据你的注释，Home 似乎不需要强制登录保护，或者保护逻辑在组件内？
    // 如果需要强制登录保护，可以在 index.js 渲染时包裹 ProtectedRoute
  },
  {
    path: '/suggestion',
    component: Suggestion,
    requiresAuth: false
  },
  {
    path: '/app/office/reportqrcodepage',
    component: Reportqrcodepag,
    requiresAuth: false
  },
  {
    path: '/app/office/LookHousePricePicture',
    component: OfficeLookHousePricePicture,
    requiresAuth: false
  },
  {
    path: '/codecheck/:code',
    component: CodeCheck,
    requiresAuth: false
  },
  {
    path: '/newsdetails/:id',
    component: NewsDetails,
    requiresAuth: false
  },
  {
    path: '/qrcodeRealcheck',
    component: QrcodeRealCheck,
    requiresAuth: false
  },
  {
    path: '/easyvaluation',
    component: EasyValuation,
    requiresAuth: false
  },
  {
    path: '/apps', // 模块选择页，通常需要登录
    component: () => {
      // 这里为了演示配置结构，实际逻辑中 /apps 需要 ProtectedRoute 包裹
      // 我们在 index.js 中会特殊处理这个路径
      return null; 
    },
    requiresAuth: true, 
    isSpecialEntry: true // 标记这是一个特殊入口，需要额外处理
  }
];

// 404 重定向配置
export const notFoundRedirect = {
  path: '*',
  element: <Navigate to="/home" replace />
};