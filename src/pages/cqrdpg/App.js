// src/App.jsx
import { useState, useEffect } from 'react'; // 1. 引入 useEffect
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Codesettings from './pages/QrcodeManagementSettings';
import CodeCheck from './pages/CodeCheck';
import MessageManagement from './pages/MessageManagement';
import RdSetting from './pages/RdSetting';
import './App.css';

// 定义本地存储的 Key 常量
const STORAGE_KEY = 'is_logged_in';

function App() {
  // 2. 初始化状态时，立即从 localStorage 读取
  // 如果 localStorage 里有 'true'，则初始化为 true，否则为 false
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedLogin = localStorage.getItem(STORAGE_KEY);
    return savedLogin === 'true';
  });

  // 3. 监听 isLoggedIn 变化，自动同步到 localStorage
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isLoggedIn]);

  // 处理登录
  const handleLogin = () => {
    setIsLoggedIn(true);
    // useEffect 会自动处理保存逻辑，也可以在这里手动写 localStorage.setItem(...)
  };

  // 处理登出
  const handleLogout = () => {
    setIsLoggedIn(false);
    // useEffect 会自动处理清除逻辑
  };

  return (
    <Router>
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<Home />} />

        {/* 二维码查验页面 (通常不需要登录也能看，或者根据需要调整) */}
        <Route path="/codecheck/:code" element={<CodeCheck />} />

        {/* 登录页：如果已登录，直接跳转到管理页 */}
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/rdsetting" /> : <Login onLogin={handleLogin} />}
        />

        {/* 受保护的路由 - 操作管理页 */}
        <Route
          path="/codesettings"
          element={
            isLoggedIn ? (
              <Codesettings onLogout={handleLogout} />
            ) : (
              /* 如果未登录尝试访问，重定向到登录页 */
              <Navigate to="/login" />
            )
          }
        />
        {/* 受保护的路由 - 消息管理页 */}
        <Route
          path="/messagemanagement"
          element={
            isLoggedIn ? (
              <MessageManagement onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/rdsetting"
          element={
            isLoggedIn ? (
              <RdSetting onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        

        {/* 未匹配到的路由重定向到首页 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;