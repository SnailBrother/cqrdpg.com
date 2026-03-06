// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. 导入 useNavigate

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. 在 Provider 内部获取 navigate
  // 注意：这要求 AuthProvider 必须被包裹在 <Router> 内部
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('解析用户数据出错:', error);
        localStorage.clear(); // 出错时清空所有
      }
    }
    setLoading(false);
  }, []);

  const setUserInfo = (userData, token) => {
    setUser(userData);
    if (token) {
      localStorage.setItem('token', token);
    }
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 3. 创建一个完整的 logout 函数
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 在状态更新后，直接导航到登录页
    navigate('/login', { replace: true });
  }, [navigate]); // 依赖 navigate

  const value = {
    user,
    setUserInfo,
    logout, // 4. 将 logout 函数暴露出去
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

export default AuthContext;