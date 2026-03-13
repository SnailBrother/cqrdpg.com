// src/routes/index.js
import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

import { Loading } from '../components/UI';
// 导入动态模块配置
import { moduleConfig, MODULE_KEYS } from '../config/moduleConfig';

// 导入公开路由配置
import { publicRouteConfig, notFoundRedirect } from '../config/publicRouteConfig';
import ModuleSelect from '../pages/modules/Select';
import ModuleLayout from '../pages/modules/ModuleLayout';
import NotFound from '../components/Animation/NotFound';
import styles from './index.module.css';

// 判断组件是否是懒加载的
const isLazyComponent = (component) => {
  // 检查是否为 React Lazy 组件
  return component && component.$$typeof === Symbol.for('react.lazy');
};

// 优化的加载组件
const OptimizedLoadingFallback = () => (
  <div className={styles.loading}>
    {/* 这里可以放一个简单的加载 */}
    <Loading message="正在加载中..." />
  </div>
);

// 通用组件渲染器：处理懒加载 Suspense
const RenderComponent = ({ component: Component, ...props }) => {
  if (isLazyComponent(Component)) {
    return (
      <Suspense fallback={<OptimizedLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  }
  // 直接导入的组件
  return <Component {...props} />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const [isBlockedIp, setIsBlockedIp] = useState(false);
  // 检查当前域名是否包含目标IP
  useEffect(() => {
    const checkHostname = () => {
      const hostname = window.location.hostname;
      
      // 情况1: 本地开发环境 -> 放行 (false)
      if (hostname === 'localhost' || hostname === '192.168') {
        setIsBlockedIp(false);
        return;
      }

      // 情况2: 特定的被屏蔽IP -> 屏蔽 (true)
      if (hostname === '121.4.22.55') {
        setIsBlockedIp(true);
        return;
      }

      // 情况3: 其他所有正常域名 -> 放行 (false)
      // 如果你的策略是“非 localhost 即屏蔽”，请将此处改为 true
      setIsBlockedIp(false);
    };

    checkHostname();
  }, []);

  // 如果检测到被屏蔽的 IP，直接返回一个只有重定向的 Routes
  if (isBlockedIp) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/NotFound" replace />} />
        <Route path="/NotFound" element={<NotFound />} />
      </Routes>
    );
  }

  // 1. 生成公开路由
  const renderPublicRoutes = () => {
    return publicRouteConfig.map((route, index) => {
      // 特殊处理 /apps 路径，因为它需要 ProtectedRoute 且组件是固定的 ModuleSelect
      if (route.isSpecialEntry && route.path === '/apps') {
        return (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute>
                <ModuleSelect />
              </ProtectedRoute>
            }
          />
        );
      }

      // 处理需要登录重定向的逻辑 (如 login/register)
      let element = <RenderComponent component={route.component} />;

      if (route.redirectIfAuth && isAuthenticated) {
        element = <Navigate to={route.redirectIfAuth} replace />;
      } else if (route.requiresAuth && !isAuthenticated && !route.redirectIfAuth) {
        // 如果配置了需要 auth 但没有重定向逻辑（比如未来的某些公开但需登录页），可在此处理
        // 目前你的公开页大多不需要登录，除了 /apps 已特殊处理
        element = <Navigate to="/login" replace />;
      }

      return (
        <Route
          key={route.path || index}
          path={route.path}
          element={element}
        />
      );
    });
  };

  // 2. 生成模块路由 (保持原有逻辑，复用 RenderComponent)
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
                <RenderComponent component={route.component} />
              }
            />
          ))}
        </Route>
      );
    });
  };

  return (
    <Routes>
      {/* 渲染公开路由 */}
      {renderPublicRoutes()}

      {/* 动态生成的模块路由 */}
      {renderModuleRoutes()}
      {/* <Route path="*" element={<SystemProfile />} /> */}
      <Route path="*" element={<Navigate to="/home" replace />} /> 
    </Routes>
  );
};

export default AppRoutes;