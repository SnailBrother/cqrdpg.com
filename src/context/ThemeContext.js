// context/ThemeContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth'; // 添加这行

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth(); // 添加这行
  const [themeSettings, setThemeSettings] = useState({});
  const [previewTheme, setPreviewTheme] = useState(null);
  const [allThemes, setAllThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false); // 添加初始化状态

  // 更新主题设置
  const updateThemeSettings = useCallback((newSettings) => {
    setThemeSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // 预览主题设置
  const previewThemeSettings = useCallback((previewSettings) => {
    setPreviewTheme(previewSettings);
    applyThemeToRoot(previewSettings);
  }, []);

  // 取消预览
  const cancelPreview = useCallback(() => {
    setPreviewTheme(null);
    if (activeTheme) {
      applyThemeToRoot(transformDbThemeToCss(activeTheme));
    }
  }, [activeTheme]);

  // 应用主题到根元素
  const applyThemeToRoot = useCallback((settings) => {
    const root = document.documentElement;
    Object.entries(settings).forEach(([key, value]) => {
      if (value) {
        const cssVarName = `--${key.replace(/_/g, '-')}`;
        root.style.setProperty(cssVarName, value);
      }
    });
  }, []);

  // 数据库主题转CSS变量格式
  const transformDbThemeToCss = useCallback((dbTheme) => {
    if (!dbTheme) return {};
    
    return {
      'background-color': dbTheme.background_color,
      'secondary-background-color': dbTheme.secondary_background_color,
      'hover_background-color': dbTheme.hover_background_color,
      'focus_background-color': dbTheme.focus_background_color,
      'font-color': dbTheme.font_color,
      'secondary-font-color': dbTheme.secondary_font_color,
      'hover_font-color': dbTheme.hover_font_color,
      'focus_font-color': dbTheme.focus_font_color,
      'watermark-font-color': dbTheme.watermark_font_color,
      'font-family': dbTheme.font_family,
      'border_color': dbTheme.border_color,
      'secondary-border_color': dbTheme.secondary_border_color,
      'hover_border_color': dbTheme.hover_border_color,
      'focus_border_color': dbTheme.focus_border_color,
      'shadow_color': dbTheme.shadow_color,
      'hover_shadow_color': dbTheme.hover_shadow_color,
      'focus_shadow_color': dbTheme.focus_shadow_color,
      'background-animation': dbTheme.background_animation
    };
  }, []);

  // CSS变量格式转数据库主题
  const transformCssToDbTheme = useCallback((cssTheme) => {
    return {
      background_color: cssTheme['background-color'],
      secondary_background_color: cssTheme['secondary-background-color'],
      hover_background_color: cssTheme['hover_background-color'],
      focus_background_color: cssTheme['focus_background-color'],
      font_color: cssTheme['font-color'],
      secondary_font_color: cssTheme['secondary-font-color'],
      hover_font_color: cssTheme['hover_font-color'],
      focus_font_color: cssTheme['focus_font-color'],
      watermark_font_color: cssTheme['watermark-font-color'],
      font_family: cssTheme['font-family'],
      border_color: cssTheme['border_color'],
      secondary_border_color: cssTheme['secondary-border_color'],
      hover_border_color: cssTheme['hover_border_color'],
      focus_border_color: cssTheme['focus_border_color'],
      shadow_color: cssTheme['shadow_color'],
      hover_shadow_color: cssTheme['hover_shadow_color'],
      focus_shadow_color: cssTheme['focus_shadow_color'],
      background_animation: cssTheme['background-animation']
    };
  }, []);

  // 更新主题列表
  const updateThemes = useCallback((themes) => {
    setAllThemes(themes);
  }, []);

  // 更新活动主题
  const updateActiveTheme = useCallback((theme) => {
    console.log('更新活动主题:', theme);
    setActiveTheme(theme);
    if (theme) {
      applyThemeToRoot(transformDbThemeToCss(theme));
    }
  }, [applyThemeToRoot, transformDbThemeToCss]);

  // 设置加载状态
  const setLoadingState = useCallback((isLoading) => {
    setLoading(isLoading);
  }, []);

  // API：获取用户主题
  const fetchUserThemes = useCallback(async (email) => {
    if (!email) {
      console.warn('fetchUserThemes: 未提供邮箱');
      return { success: false, message: '未提供邮箱' };
    }

    setLoadingState(true);
    try {
      const response = await axios.get('/api/SystemSettingsApp/UserThemeSettings', {
        params: { email }
      });

      if (response.data && response.data.success && Array.isArray(response.data.themes)) {
        const fetchedThemes = response.data.themes;
        updateThemes(fetchedThemes);

        // 查找活动主题
        const activeForUser = fetchedThemes.find(t => t.is_active && t.email === email);
        if (activeForUser) {
          updateActiveTheme(activeForUser);
        } else {
          // 如果没有活动主题，查找默认主题
          const defaultForUser = fetchedThemes.find(t => t.is_default && t.email === email);
          if (defaultForUser) {
            updateActiveTheme(defaultForUser);
          } else {
            updateActiveTheme(null);
          }
        }

        return { success: true, themes: fetchedThemes };
      } else {
        throw new Error('API data format error');
      }
    } catch (error) {
      console.error('获取用户主题失败:', error);
      updateThemes([]);
      updateActiveTheme(null);
      return { success: false, message: error.message };
    } finally {
      setLoadingState(false);
    }
  }, [updateThemes, updateActiveTheme, setLoadingState]);

  // API：获取用户活动主题
  const fetchActiveTheme = useCallback(async (email) => {
    if (!email) {
      console.warn('fetchActiveTheme: 未提供邮箱');
      return { success: false, message: '未提供邮箱' };
    }

    setLoadingState(true);
    try {
      const response = await axios.get('/api/SystemSettingsApp/UserThemeSettings/active', {
        params: { email }
      });

      if (response.data && response.data.success && response.data.theme) {
        const theme = response.data.theme;
        updateActiveTheme(theme);
        return { success: true, theme };
      } else {
        throw new Error(response.data?.message || '获取活动主题失败');
      }
    } catch (error) {
      console.error('获取活动主题失败:', error);
      return { success: false, message: error.message };
    } finally {
      setLoadingState(false);
    }
  }, [updateActiveTheme, setLoadingState]);

  // API：获取用户默认主题
  const fetchDefaultTheme = useCallback(async (email) => {
    if (!email) {
      console.warn('fetchDefaultTheme: 未提供邮箱');
      return { success: false, message: '未提供邮箱' };
    }

    setLoadingState(true);
    try {
      const response = await axios.get('/api/SystemSettingsApp/UserThemeSettings/default', {
        params: { email }
      });

      if (response.data && response.data.success && response.data.theme) {
        const theme = response.data.theme;
        return { success: true, theme };
      } else {
        throw new Error(response.data?.message || '获取默认主题失败');
      }
    } catch (error) {
      console.error('获取默认主题失败:', error);
      return { success: false, message: error.message };
    } finally {
      setLoadingState(false);
    }
  }, [setLoadingState]);

  // 自动加载主题数据
  useEffect(() => {
    const loadUserThemes = async () => {
      if (isAuthenticated && user?.email && !initialized) {
        console.log('自动加载用户主题:', user.email);
        await fetchUserThemes(user.email);
        setInitialized(true);
      } else if (!isAuthenticated) {
        // 未登录时加载默认主题或清除主题
        setInitialized(false);
        setAllThemes([]);
        setActiveTheme(null);
        // 可以在这里设置一个默认主题
        // applyThemeToRoot(defaultTheme);
      }
    };

    loadUserThemes();
  }, [isAuthenticated, user, fetchUserThemes, initialized]);

  // 监听用户变化
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      // 用户变化时重新加载
      setInitialized(false);
    }
  }, [user?.email, isAuthenticated]);

  const value = {
    themeSettings,
    previewTheme,
    allThemes,
    activeTheme,
    loading,
    initialized,
    updateThemeSettings,
    previewThemeSettings,
    cancelPreview,
    transformDbThemeToCss,
    transformCssToDbTheme,
    applyThemeToRoot,
    updateThemes,
    updateActiveTheme,
    setLoadingState,
    // API方法
    fetchUserThemes,
    fetchActiveTheme,
    fetchDefaultTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};