import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const TOKEN_EXPIRY_DAYS = 7; 
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isTokenExpired = useCallback(() => {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    const now = new Date().getTime();
    return now > parseInt(expiryTime);
  }, []);

  const forceLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // 核心改造：带着 id, username, email 三个字段去后端做严格比对
  const verifyUserWithBackend = async (localUser) => {
    try {
     
      
      const response = await fetch(`/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 把三个字段全部传过去
        body: JSON.stringify({ 
            userId: localUser.id, 
            username: localUser.username, 
            email: localUser.email 
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // 只要有一个字段对不上（比如 ID 还在，但用户名被换了），后端就会返回失败
      //  console.warn('后端安全验证失败:', data.message);
        forceLogout();
        return false;
      }

      // 验证通过，更新状态
      setUser(data.user); 
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return true;

    } catch (error) {
     // console.error('后端验证接口请求出错:', error);
      forceLogout();
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const userData = localStorage.getItem(USER_KEY);

      if (token && userData) {
        if (isTokenExpired()) {
         // console.log('本地 Token 已过期，请重新登录');
          forceLogout();
        } else {
          try {
            const localUser = JSON.parse(userData);
            // 把整个 localUser 对象传进去，以便提取三个字段
            const isValid = await verifyUserWithBackend(localUser);
            
            if (isValid) {
              setUser(localUser); 
            }
          } catch (error) {
          //  console.error('解析用户数据出错:', error);
            forceLogout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [isTokenExpired, forceLogout]);

  const setUserInfo = (userData, token) => {
    setUser(userData);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      const expiryTime = new Date().getTime() + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const logout = useCallback(() => {
    forceLogout();
  }, [forceLogout]);

  const value = {
    user,
    setUserInfo,
    logout,
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