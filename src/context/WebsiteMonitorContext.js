// src/context/WebsiteMonitorContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
// 1. 导入 useAuth (请根据实际路径调整 import 路径)
import { useAuth } from './AuthContext'; 

const MonitorContext = createContext();

export const WebsiteMonitorProvider = ({ children }) => {
  const location = useLocation();
  // 2. 获取认证上下文
  const { user } = useAuth(); 
  
  const [sessionId, setSessionId] = useState(null);
  const [visitorId, setVisitorId] = useState(null);

  useEffect(() => {
    // 1. Visitor ID (持久化)
    let storedVisitorId = localStorage.getItem('wm_visitor_id');
    if (!storedVisitorId) {
      storedVisitorId = 'vid_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('wm_visitor_id', storedVisitorId);
    }
    setVisitorId(storedVisitorId);

    // 2. Session ID (会话级)
    let storedSessionId = sessionStorage.getItem('wm_session_id');
    if (!storedSessionId) {
      storedSessionId = 'sid_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      sessionStorage.setItem('wm_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  useEffect(() => {
    if (!sessionId || !visitorId) return;

    const sendRecord = () => {
      const entryUrl = sessionStorage.getItem('wm_entry_url') || window.location.href;
      if (!sessionStorage.getItem('wm_entry_url')) {
        sessionStorage.setItem('wm_entry_url', window.location.href);
      }

      // 3. 处理用户名和邮箱逻辑
      // 如果 user 存在且有 username/email，则使用；否则使用默认匿名标识
      const currentUsername = user?.username ? user.username : 'unknowusername';
      const currentEmail = user?.email ? user.email : 'unknowemail';

      const recordData = {
        visitor_id: visitorId,
        session_id: sessionId,
        current_url: window.location.href,
        referrer_url: document.referrer,
        entry_url: entryUrl,
        user_agent: navigator.userAgent,
        // 4. 添加新字段到 payload
        username: currentUsername,
        email: currentEmail
      };

      const blob = new Blob([JSON.stringify(recordData)], { type: 'application/json' });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/website/record', blob);
      } else {
        fetch('/api/website/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData),
          keepalive: true 
        }).catch(console.error);
      }
    };

    // 路由变化后延迟发送
    const timer = setTimeout(sendRecord, 500);
    return () => clearTimeout(timer);
  }, [location, sessionId, visitorId, user]); // 注意：依赖项中加入了 user，确保用户登录状态变化时能捕获最新状态（可选，视需求而定）

  return (
    <MonitorContext.Provider value={{ sessionId, visitorId }}>
      {children}
    </MonitorContext.Provider>
  );
};

export const useWebsiteMonitor = () => useContext(MonitorContext);