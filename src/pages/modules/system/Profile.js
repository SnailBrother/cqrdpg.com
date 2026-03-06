import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import styles from './Profile.module.css';
const SystemProfile = () => {
  const { user, isAuthenticated } = useAuth(); //获取用户名 

  return (
    <div className={styles.container}>
      <h2>系统设置 - 个人资料</h2>
      
      {isAuthenticated && user ? (
        <div>
          <p><strong>用户名:</strong> {user.username}</p>
          <p><strong>邮箱:</strong> {user.email}</p>
          <p><strong>用户ID:</strong> {user.id}</p>
          <p><strong>登录时间:</strong> {new Date(user.loginTime).toLocaleString()}</p>
          <p><strong>权限:</strong> {user.permission_level}</p>
        </div>
      ) : (
        <p>未登录</p>
      )}
    </div>
  );
};

export default SystemProfile;