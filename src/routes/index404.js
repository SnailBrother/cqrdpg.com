// src/routes/index.js
// 来智能处理 部分懒加载，部分全部加载
import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

// 导入基础页面组件
//import Home from '../pages/home';
import Home from '../pages/cqrdpg/pages/Home';
import ModuleSelect from '../pages/modules/Select';
import ModuleLayout from '../pages/modules/ModuleLayout';
//import Login from '../pages/user/login';
import Login from '../pages/cqrdpg/pages/Login';
import Register from '../pages/user/register';
import Reportqrcodepag from '../pages/modules/office/WordReportGenerator/ReportQrCodePage';

import Four from '../components/Animation/NotFound';

// 导入 LookHousePricePicture 组件,无需保护路由
import OfficeLookHousePricePicture from '../pages/modules/office/SearchPrice/LookHousePricePicture'

// 导入配置
import { moduleConfig, MODULE_KEYS } from '../config/moduleConfig';

//二维码检测
//import CodeCheck from './pages/CodeCheck';
import CodeCheck from '../pages/cqrdpg/pages/CodeCheck';

// 判断组件是否是懒加载的
const isLazyComponent = (component) => {
  return component.$$typeof === Symbol.for('react.lazy');
};

// 优化的加载组件
const OptimizedLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    background: 'transparent',
    color: '#666'
  }}>
    <div>加载中...</div>
  </div>
);

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const [isBlockedIp, setIsBlockedIp] = useState(false);

  // 检查当前域名是否包含目标IP
  useEffect(() => {
    const checkHostname = () => {
      const hostname = window.location.hostname;
      // 检查是否包含 121.4.22.55
      if (hostname.includes('121.4.22.55')) {
        setIsBlockedIp(true);
      }
      if (hostname.includes('localhost')) {
        setIsBlockedIp(true);
      } else {
        setIsBlockedIp(false);
      }
    };

    checkHostname();
  }, []);

  // 动态生成模块路由
  const renderModuleRoutes = () => {
    return MODULE_KEYS.map(moduleKey => {
      const module = moduleConfig[moduleKey];

      return (
        <Route
          key={moduleKey}
          path={`/app/${moduleKey}`}
          element={
            <ProtectedRoute>
              <ModuleLayout moduleKey={moduleKey} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={module.defaultRoute} replace />} />
          {module.routes.map(route => (
            <Route
              key={route.key}
              path={route.key}
              element={
                isLazyComponent(route.component) ? (
                  // 懒加载组件使用 Suspense
                  <Suspense fallback={<OptimizedLoadingFallback />}>
                    <route.component />
                  </Suspense>
                ) : (
                  // 直接导入的组件直接渲染
                  <route.component />
                )
              }
            />
          ))}
        </Route>
      );
    });
  };

  // 如果检测到被屏蔽的IP，只显示404页面
  if (isBlockedIp) {
    return (
      <Routes>
        <Route path="*" element={<Four />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* 公开路由 */}

      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/apps" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/apps" replace /> : <Register />
        }
      />
      <Route
        path="/home"
        element={<Home />}
      // element={
      //   isAuthenticated ? <Home /> : <Navigate to="/login" replace />
      // }
      />
      <Route
        path="/app/office/reportqrcodepage"
        element={<Reportqrcodepag />}
      />

      {/* 公开的图片查看页面 - 不需要登录 */}
      <Route
        path="/app/office/LookHousePricePicture"
        element={<OfficeLookHousePricePicture />}
      />

      {/* 二维码查验页面 (通常不需要登录也能看，或者根据需要调整) */}
      <Route path="/codecheck/:code" element={<CodeCheck />} />

      {/* 登录后选择模块的入口 */}
      <Route
        path="/apps"
        element={
          <ProtectedRoute>
            <ModuleSelect />
          </ProtectedRoute>
        }
      />

      {/* 动态生成的模块路由 */}
      {renderModuleRoutes()}

      {/* 404 页面 */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default AppRoutes;