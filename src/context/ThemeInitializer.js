// components/ThemeInitializer.js
import { useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { useAuth } from '../hooks/useAuth';

const ThemeInitializer = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { fetchUserThemes, initialized } = useTheme();

  useEffect(() => {
    if (isAuthenticated && user?.email && !initialized) {
      fetchUserThemes(user.email);
    }
  }, [isAuthenticated, user, fetchUserThemes, initialized]);

  return children;
};

export default ThemeInitializer;
//在 App.js 中添加主题初始化组件
//在 App.js 中使用：
// import ThemeInitializer from './components/ThemeInitializer'; // 导入
// <ThemeInitializer> {/* 添加这层 */}
//                         <div className={styles.app}>
//                           <AppRoutes />
//                         </div>
//                       </ThemeInitializer>