import React, { useState, useEffect } from 'react';
import Computer from './Computer'; 
import Phone from './Phone'; 
import styles from './index.module.css';
import { useAuth } from '../../../context/AuthContext';
import Codesettings from '../../cqrdpg/pages/RdSetting';

const ResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const { user } = useAuth(); 

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 【新增逻辑】权限判断
  // 如果 user 存在 且 权限级别 不是 'Administrator'，则强制显示桌面版 (Codesettings)
  if (user && user.permission_level !== 'Administrator') {
    return (
      <div className={styles.desktopView}>
        <Codesettings />
      </div>
    );
  }

  // 【原有逻辑】如果是 Administrator，则继续判断屏幕宽度
  if (isMobile) {
    return (
      <div className={styles.mobileView}>
         {/* <p><strong>用户名:</strong> {user?.username}</p>
         <p><strong>邮箱:</strong> {user?.email}</p>
         <p><strong>权限:</strong> {user?.permission_level}</p>
        */}
         {/* 显示所有字段（调试用）
            <pre>{JSON.stringify(user, null, 2)}</pre> */}
         <Phone />
       
      </div>
    );
  }

  return (
    <div className={styles.desktopView}>
       <Codesettings />
    </div>
  );
};

export default ResponsiveLayout;