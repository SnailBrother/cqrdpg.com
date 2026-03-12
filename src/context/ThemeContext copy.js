// context/ThemeContext.js
// context/ThemeContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState({});
  const [defaultTheme, setDefaultTheme] = useState({
    'background-color': '#ffffff',
    'secondary-background-color': '#f5f5f5',
    'hover_background-color': '#e6f7ff',
    'focus_background-color': '#1890ff',
    'font-color': '#000000',
    'secondary-font-color': '#666666',
    'hover_font-color': '#1890ff',
    'focus_font-color': '#ffffff',
    'watermark-font-color': '#cccccc',
    'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    'border_color': '#d9d9d9',
    'secondary-border_color': '#f0f0f0',
    'hover_border_color': '#1890ff',
    'focus_border_color': '#1890ff',
    'shadow_color': 'rgba(0, 0, 0, 0.1)',
    'hover_shadow_color': 'rgba(24, 144, 255, 0.3)',
    'focus_shadow_color': 'rgba(24, 144, 255, 0.5)'
  });
  const [previewTheme, setPreviewTheme] = useState(null);
  const [allThemes, setAllThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [loading, setLoading] = useState(false);

  // 页面加载时从本地存储恢复主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('activeTheme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        console.log('从本地存储恢复主题:', theme);
        setActiveTheme(theme);
        applyThemeToRoot(transformDbThemeToCss(theme));
      } catch (error) {
        console.error('恢复主题失败:', error);
        localStorage.removeItem('activeTheme');
      }
    }
  }, []);

  // 当 activeTheme 变化时保存到本地存储
  useEffect(() => {
    if (activeTheme) {
      localStorage.setItem('activeTheme', JSON.stringify(activeTheme));
      console.log('主题已保存到本地存储:', activeTheme);
    }
  }, [activeTheme]);

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
    } else {
      applyThemeToRoot(defaultTheme);
    }
  }, [activeTheme, defaultTheme]);

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
      // 自动保存到本地存储
      localStorage.setItem('activeTheme', JSON.stringify(theme));
    } else {
      // 如果没有主题，清除本地存储并应用默认主题
      localStorage.removeItem('activeTheme');
      applyThemeToRoot(defaultTheme);
    }
  }, [applyThemeToRoot, transformDbThemeToCss, defaultTheme]);

  // 设置加载状态
  const setLoadingState = useCallback((isLoading) => {
    setLoading(isLoading);
  }, []);

  const value = {
    themeSettings,
    defaultTheme,
    previewTheme,
    allThemes,
    activeTheme,
    loading,
    updateThemeSettings,
    previewThemeSettings,
    cancelPreview,
    transformDbThemeToCss,
    transformCssToDbTheme,
    applyThemeToRoot,
    setDefaultTheme,
    updateThemes,
    updateActiveTheme,
    setLoadingState
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