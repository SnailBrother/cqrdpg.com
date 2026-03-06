// src/routes/index.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

// 导入基础页面组件
import Home from '../pages/home';
import ModuleSelect from '../pages/modules/Select';
import ModuleLayout from '../pages/modules/ModuleLayout';
import Login from '../pages/user/login';
import Register from '../pages/user/register';

// 导入配置
import { moduleConfig, MODULE_KEYS } from '../config/moduleConfig';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  // 动态生成模块路由 - 使用直接导入的组件
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
              element={<route.component />}  // 直接渲染组件，没有懒加载
            />
          ))}
        </Route>
      );
    });
  };

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
        element={
          isAuthenticated ? <Home /> : <Navigate to="/login" replace />
        }
      />

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