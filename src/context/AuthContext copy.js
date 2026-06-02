// src/context/AuthContext.js  增加用户验证保护，七天之后需要重新登陆
// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

// 定义常量
const TOKEN_EXPIRY_DAYS = 7; // 7天过期
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // 检查 token 是否过期
  const isTokenExpired = useCallback(() => {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    const now = new Date().getTime();
    return now > parseInt(expiryTime);
  }, []);

  // 清除过期的登录信息
  const clearExpiredAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);

    // 检查是否有 token 且未过期
    if (token && userData) {
      if (isTokenExpired()) {
        // token 已过期，清除登录信息
        console.log('登录信息已过期，请重新登录');
        clearExpiredAuth();
      } else {
        try {
          setUser(JSON.parse(userData));
          
          // 可选：在每次访问时刷新过期时间（滑动过期）
          // refreshExpiryTime();
        } catch (error) {
          console.error('解析用户数据出错:', error);
          localStorage.clear();
        }
      }
    }
    
    setLoading(false);
  }, [isTokenExpired, clearExpiredAuth]);

  // 设置用户信息并记录过期时间
  const setUserInfo = (userData, token) => {
    setUser(userData);
    
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      
      // 设置过期时间（7天后）
      const expiryTime = new Date().getTime() + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
    
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  // 刷新过期时间（可选：每次操作后调用，实现滑动过期）
  const refreshExpiryTime = useCallback(() => {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiryTime) {
      // 重新设置过期时间为当前时间 + 7天
      const newExpiryTime = new Date().getTime() + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, newExpiryTime.toString());
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = {
    user,
    setUserInfo,
    logout,
    refreshExpiryTime, // 导出刷新方法，可在需要时调用
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