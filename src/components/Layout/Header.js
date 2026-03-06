// src/components/Layout/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { IconButton, Span } from '../UI';
import Button from '../UI/Button';
import styles from './Header.module.css';

const Header = ({ title = "ChenBaby" }) => {
  const { user, logout } = useAuth(); // 直接使用 context 提供的 logout 函数
  const navigate = useNavigate();

  // Header.js
  const handleBackToHome = () => {
    // 如果用户已登录，跳转到模块选择页；如果未登录，跳转到登录页
    if (user) {
      navigate('/apps', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };
  // 退出登录（清理用户状态）
  const handleLogout = async () => {
    try {
      // 先执行退出登录
      await logout();

      // 等待状态更新完成后再跳转
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);

    } catch (error) {
      console.error('退出登录失败:', error);
      // 即使失败也强制跳转
      navigate('/login', { replace: true });
    }
  };
  const handlethemset = () => {
    navigate('/app/system/theme', { replace: true });
  };
  //聊天
  const handlechat = () => {
    navigate('/app/chat/ChatChat', { replace: true });
  };
  //记账
  const handleAccounting = () => {
    navigate('/app/accounting/AccountingAdd', { replace: true });
  };
  //听歌
  const handleMusic = () => {
    navigate('/app/music/home', { replace: true });
  };
  //办公
  const handleOffice = () => {
    navigate('/app/office/SearchPrice', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerlog}>
        <svg className={styles.titleicon} aria-hidden="true">
          <use xlinkHref="#icon-ertongleyuan"></use>
        </svg>
        <h1 className={styles.title}>{title}</h1>

      </div>

      <div className={styles.headerActions}>

        <IconButton
          icon="#icon-shouye3"
          onClick={handleBackToHome}
          title={user.username || user.email || '用户'}
          variant="ghost"
          size="medium"
        />

        {user?.permission_level === 'Administrator' && (
          <IconButton
            icon="#icon-icon-zhangben"
            onClick={handleAccounting}
            title="记账"
            variant="ghost"
            size="medium"
          />
        )}
        <IconButton
          icon="#icon-kefu"
          onClick={handleMusic}
          title="听歌"
          variant="ghost"
          size="medium"
        />

        <IconButton
          icon="#icon-zdxmzs"
          onClick={handleOffice}
          title="办公"
          variant="ghost"
          size="medium"

        />

        {/* {user && (
          <Span>
            {user.username || user.email || '用户'}
          </Span>
        )} */}

        <IconButton
          icon="#icon-duihuaxinxi"
          onClick={handlechat}
          title="聊天"
          variant="ghost"
          size="medium"
        />
        <IconButton
          icon="#icon-zhuti1"
          onClick={handlethemset}
          title="主题设置"
          variant="ghost"
          size="medium"
        />
        {/* 点击时直接调用从 context 来的 logout 函数 */}
        <IconButton
          icon="#icon-bianzu"
          onClick={handleLogout}
          title="退出"
          variant="ghost"
          size="medium"
        />



      </div>
    </header>
  );
};

export default Header;