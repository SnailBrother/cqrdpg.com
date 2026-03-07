// src/context/WebsiteMonitorContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const MonitorContext = createContext();


const API_URL = '/api/website/record';

export const WebsiteMonitorProvider = ({ children }) => {
  const location = useLocation();
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

      const recordData = {
        visitor_id: visitorId,
        session_id: sessionId,
        current_url: window.location.href,
        referrer_url: document.referrer,
        entry_url: entryUrl,
        user_agent: navigator.userAgent,
      };

      const blob = new Blob([JSON.stringify(recordData)], { type: 'application/json' });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(API_URL, blob);
      } else {
        fetch(API_URL, {
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
  }, [location, sessionId, visitorId]);

  return (
    <MonitorContext.Provider value={{ sessionId, visitorId }}>
      {children}
    </MonitorContext.Provider>
  );
};

export const useWebsiteMonitor = () => useContext(MonitorContext);