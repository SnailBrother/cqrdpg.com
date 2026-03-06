// components/ThemeSettings/SystemThemeSettings.js
// src/components/ThemeSettings/SystemThemeSettings.js
// src/components/ThemeSettings/SystemThemeSettings.js
import React, { useState, useEffect, useCallback } from 'react';
import { ColorPicker, message } from 'antd';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import styles from './SystemThemeSettings.module.css';
import Button from '../../../components/UI/Button';

// 辅助函数：确保颜色为8位带透明度的格式
const ensure8DigitHex = (color) => {
  if (!color) return '#FFFFFFFF';

  if (color.startsWith('#') && color.length === 7) {
    return `${color}FF`;
  }

  if (color.startsWith('#') && color.length === 4) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}FF`;
  }

  if (color.startsWith('#') && color.length === 9) {
    return color;
  }

  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      const alpha = match[4] ? Math.round(parseFloat(match[4]) * 255).toString(16).padStart(2, '0') : 'FF';
      return `#${r}${g}${b}${alpha}`;
    }
  }

  return '#FFFFFFFF';
};

// 辅助函数：从Ant Design颜色对象获取8位十六进制
const get8DigitHexFromColor = (color) => {
  if (!color) return '#FFFFFFFF';

  if (color && typeof color.toHexString === 'function') {
    const hex = color.toHexString();
    return ensure8DigitHex(hex);
  }

  if (typeof color === 'string') {
    return ensure8DigitHex(color);
  }

  return '#FFFFFFFF';
};

// 数据库字段名到CSS变量名的映射
const DB_FIELD_TO_CSS_VAR = {
  background_color: 'background-color',
  secondary_background_color: 'secondary-background-color',
  hover_background_color: 'hover_background-color',
  focus_background_color: 'focus_background-color',
  font_color: 'font-color',
  secondary_font_color: 'secondary-font-color',
  hover_font_color: 'hover_font-color',
  focus_font_color: 'focus_font-color',
  watermark_font_color: 'watermark-font-color',
  font_family: 'font-family',
  border_color: 'border_color',
  secondary_border_color: 'secondary-border_color',
  hover_border_color: 'hover_border_color',
  focus_border_color: 'focus_border_color',
  shadow_color: 'shadow_color',
  hover_shadow_color: 'hover_shadow_color',
  focus_shadow_color: 'focus_shadow_color'
};

const SystemThemeSettings = () => {
  const {
    allThemes,
    activeTheme,
    previewTheme,
    themeSettings,
    defaultTheme, // 从 ThemeContext 获取默认主题
    loading: themeLoading,
    fetchUserAllThemes,
    setActiveThemeById,
    createNewTheme,
    updateThemeById,
    deleteThemeById,
    previewThemeSettings,
    cancelPreview,
    transformDbThemeToCss,
    transformCssToDbTheme
  } = useTheme();

  const { user, isAuthenticated } = useAuth();

  const [themeName, setThemeName] = useState('');
  const [editingTheme, setEditingTheme] = useState(null);
  const [customThemeSettings, setCustomThemeSettings] = useState({ ...defaultTheme });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 初始化设置 - 只在组件挂载时执行一次
  useEffect(() => {
    const initializeThemes = async () => {
      setLoading(true);
      try {
        if (isAuthenticated && user) {
          await fetchUserAllThemes();
        }

        // 如果有活动主题，使用活动主题初始化编辑器
        if (activeTheme) {
          const cssTheme = transformDbThemeToCss(activeTheme);
          setCustomThemeSettings(cssTheme);
        } else {
          // 否则使用默认主题
          setCustomThemeSettings({ ...defaultTheme });
        }
      } catch (error) {
        console.error('初始化主题失败:', error);
        message.error('加载主题失败');
        setCustomThemeSettings({ ...defaultTheme });
      } finally {
        setLoading(false);
      }
    };

    initializeThemes();
  }, []); // 空依赖数组

  // 监听活动主题变化
  useEffect(() => {
    if (activeTheme && !editingTheme) {
      const cssTheme = transformDbThemeToCss(activeTheme);
      setCustomThemeSettings(cssTheme);
    }
  }, [activeTheme, editingTheme, transformDbThemeToCss]);

  // 监听编辑主题变化
  useEffect(() => {
    if (editingTheme) {
      const theme = allThemes.find(t => t.id === editingTheme);
      if (theme) {
        const cssTheme = transformDbThemeToCss(theme);
        setCustomThemeSettings(cssTheme);
        setThemeName(theme.theme_name);
        previewThemeSettings(cssTheme);
      }
    }
  }, [editingTheme, allThemes, transformDbThemeToCss, previewThemeSettings]);

  // 实时预览主题变化 - 添加防抖
  useEffect(() => {
    if (Object.keys(customThemeSettings).length > 0 && !loading) {
      const timer = setTimeout(() => {
        previewThemeSettings(customThemeSettings);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [customThemeSettings, loading, previewThemeSettings]);

  // 处理颜色变化
  const handleColorChange = useCallback((key) => (color) => {
    const hex8Digit = get8DigitHexFromColor(color);
    setCustomThemeSettings(prev => ({
      ...prev,
      [key]: hex8Digit
    }));
  }, []);

  // 保存主题（创建新主题）
  const handleSaveTheme = useCallback(async () => {
    if (!themeName.trim()) {
      message.error('请输入主题名称');
      return;
    }

    if (!isAuthenticated || !user) {
      message.error('请先登录');
      return;
    }

    setSaving(true);
    try {
      await createNewTheme(themeName, customThemeSettings, false);
      message.success('主题创建成功！');
      setThemeName('');
      // 重新加载主题列表
      await fetchUserAllThemes();
    } catch (error) {
      console.error('保存主题失败:', error);
      message.error(error.message || '保存主题失败');
    } finally {
      setSaving(false);
    }
  }, [themeName, isAuthenticated, user, customThemeSettings, createNewTheme, fetchUserAllThemes]);

  // 更新主题
// 更新主题
const handleUpdateTheme = useCallback(async () => {
  if (!editingTheme) return;

  setSaving(true);
  try {
    // 构建更新数据，包含主题名和转换为数据库字段格式
    const dbTheme = transformCssToDbTheme(customThemeSettings);
    const updateData = {
      ...dbTheme,
      theme_name: themeName // 确保包含主题名
    };
    
    await updateThemeById(editingTheme, updateData);
    message.success('主题更新成功！');
    setEditingTheme(null);
    setThemeName('');
    // 重新加载主题列表
    await fetchUserAllThemes();
  } catch (error) {
    console.error('更新主题失败:', error);
    message.error(error.message || '更新主题失败');
  } finally {
    setSaving(false);
  }
}, [editingTheme, themeName, customThemeSettings, updateThemeById, fetchUserAllThemes, transformCssToDbTheme]);

  // 应用主题
  const handleApplyTheme = useCallback(async (themeId) => {
    try {
      await setActiveThemeById(themeId);
      message.success('主题应用成功！');
    } catch (error) {
      console.error('应用主题失败:', error);
      message.error(error.message || '应用主题失败');
    }
  }, [setActiveThemeById]);

  // 开始编辑主题
 
  const startEditing = useCallback((themeId) => {
    setEditingTheme(themeId);
    const theme = allThemes.find(t => t.id === themeId);
    if (theme) {
      setThemeName(theme.theme_name); // 确保设置正确的主题名
      const cssTheme = transformDbThemeToCss(theme);
      setCustomThemeSettings(cssTheme);
      previewThemeSettings(cssTheme);
    }
  }, [allThemes, transformDbThemeToCss, previewThemeSettings]);

  // 取消编辑
  const cancelEditing = useCallback(() => {
    setEditingTheme(null);
    setThemeName('');
    // 恢复当前活动主题的预览
    if (activeTheme) {
      const cssTheme = transformDbThemeToCss(activeTheme);
      setCustomThemeSettings(cssTheme);
      previewThemeSettings(cssTheme);
    } else {
      setCustomThemeSettings({ ...defaultTheme });
      cancelPreview();
    }
  }, [activeTheme, transformDbThemeToCss, previewThemeSettings, cancelPreview, defaultTheme]);

  // 删除主题
  const handleDeleteTheme = useCallback(async (themeId, themeName) => {
    if (window.confirm(`确定删除主题 "${themeName}" 吗？`)) {
      try {
        await deleteThemeById(themeId);
        message.success('主题删除成功！');
        // 重新加载主题列表
        await fetchUserAllThemes();
      } catch (error) {
        console.error('删除主题失败:', error);
        message.error(error.message || '删除主题失败');
      }
    }
  }, [deleteThemeById, fetchUserAllThemes]);

  // 创建新主题（重置编辑器）
  const handleCreateNewTheme = useCallback(() => {
    setEditingTheme(null);
    setThemeName('');
    setCustomThemeSettings({ ...defaultTheme });
    previewThemeSettings({ ...defaultTheme });
  }, [defaultTheme, previewThemeSettings]);

  // 处理设置变化
  const handleSettingChange = useCallback((key, value) => {
    setCustomThemeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // 快速应用预设
  const applyPreset = useCallback((presetName) => {
    const presets = {
      light: {
        'background-color': '#FFFFFFFF',
        'secondary-background-color': '#F8F9FAFF',
        'hover_background-color': '#E9ECEEFF',
        'focus_background-color': '#DEE2E6FF',
        'font-color': '#000000FF',
        'secondary-font-color': '#6C757DFF',
        'hover_font-color': '#0078D4FF',
        'focus_font-color': '#0056B3FF',
        'watermark-font-color': '#B3B5B6FF',
        'border_color': '#DEE2E6FF',
        'secondary-border_color': '#E9ECEEFF',
        'hover_border_color': '#0078D4FF',
        'focus_border_color': '#0056B3FF',
        'shadow_color': '#00000019',
        'hover_shadow_color': '#00000026',
        'focus_shadow_color': '#0078D440'
      },
      dark: {
        'background-color': '#1A1A1AFF',
        'secondary-background-color': '#2D2D2DFF',
        'hover_background-color': '#3D3D3DFF',
        'focus_background-color': '#4D4D4DFF',
        'font-color': '#FFFFFFFF',
        'secondary-font-color': '#B3B3B3FF',
        'hover_font-color': '#0078D4FF',
        'focus_font-color': '#0056B3FF',
        'watermark-font-color': '#666666FF',
        'border_color': '#495057FF',
        'secondary-border_color': '#5A6268FF',
        'hover_border_color': '#0078D4FF',
        'focus_border_color': '#0056B3FF',
        'shadow_color': '#00000080',
        'hover_shadow_color': '#00000099',
        'focus_shadow_color': '#0078D440'
      },
      blue: {
        'background-color': '#F0F8FFFF',
        'secondary-background-color': '#E6F2FFFF',
        'hover_background-color': '#D4EBFFFF',
        'focus_background-color': '#C2E4FFFF',
        'font-color': '#003366FF',
        'secondary-font-color': '#0066CCFF',
        'hover_font-color': '#004499FF',
        'focus_font-color': '#002244FF',
        'watermark-font-color': '#99CCFFFF',
        'border_color': '#B3D9FFFF',
        'secondary-border_color': '#99CCFFFF',
        'hover_border_color': '#0066CCFF',
        'focus_border_color': '#004499FF',
        'shadow_color': '#0066CC26',
        'hover_shadow_color': '#0066CC40',
        'focus_shadow_color': '#0066CC66'
      }
    };

    if (presets[presetName]) {
      setCustomThemeSettings(prev => ({
        ...prev,
        ...presets[presetName]
      }));
      message.info(`已应用 ${presetName} 预设`);
    }
  }, []);

  // 刷新主题列表
  const handleRefreshThemes = useCallback(async () => {
    try {
      await fetchUserAllThemes();
      message.success('主题列表已刷新');
    } catch (error) {
      console.error('刷新主题列表失败:', error);
      message.error('刷新主题列表失败');
    }
  }, [fetchUserAllThemes]);

  if (themeLoading || loading) {
    return <div className={styles.loading}>加载主题设置中...</div>;
  }

  return (
    <div className={styles.container}>
      {/* 顶部标题和状态 */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <svg className={styles.icon} aria-hidden="true">
            <use xlinkHref="#icon-pifu"></use>
          </svg>
          主题设置
          {previewTheme && <span className={styles.previewBadge}>预览模式</span>}
          {activeTheme && <span className={styles.dbBadge}>数据库主题</span>}
        </h1>
        <div className={styles.current}>
          <span className={styles.currentLabel}>当前主题:</span>
          <span className={styles.currentName}>
            {activeTheme ? activeTheme.theme_name : '默认主题'}
            {activeTheme && activeTheme.is_active && ' (活动)'}
          </span>
          {previewTheme && (
            <Button
              onClick={cancelPreview}
              variant="secondary"
              size="small"
            >
              取消预览
            </Button>
          )}
          <Button
            onClick={handleRefreshThemes}
            variant="secondary"
            size="small"
            loading={themeLoading}
          >
            刷新列表
          </Button>
          <Button
            onClick={handleCreateNewTheme}
            variant="primary"
            size="small"
          >
            新建主题
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {/* 左侧：主题编辑器 */}
        <div className={styles.editor}>
          {/* 主题信息 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-xinxi"></use>
              </svg>
              主题信息
            </h2>

            <div className={styles.themeInfo}>
              <div className={styles.settingItem}>
                <label>主题名称</label>
                <input
                  placeholder="输入主题名称"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  className={styles.nameInput}
                  disabled={!isAuthenticated}
                />
              </div>
              <div className={styles.themeStatus}>
                {editingTheme ? (
                  <span className={styles.editingBadge}>编辑模式</span>
                ) : (
                  <span className={styles.creatingBadge}>创建新主题</span>
                )}
                {!isAuthenticated && (
                  <span className={styles.loginWarning}>请登录后保存主题</span>
                )}
              </div>
            </div>

          </div>

          {/* 背景颜色设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-beijingyanse"></use>
              </svg>
              背景颜色
            </h2>

            <div className={styles.colorGrid}>
              <div className={styles.colorItem}>
                <label>主常规背景</label>
                <ColorPicker
                  value={customThemeSettings['background-color']}
                  onChange={handleColorChange('background-color')}
                  showText
                  className={styles.colorPicker}
                  size="large"
                />
              </div>

              <div className={styles.colorItem}>
                <label>次常规背景</label>
                <ColorPicker
                  value={customThemeSettings['secondary-background-color']}
                  onChange={handleColorChange('secondary-background-color')}
                  showText
                  className={styles.colorPicker}
                  size="large"
                />
              </div>

              <div className={styles.colorItem}>
                <label>悬浮背景</label>
                <ColorPicker
                  value={customThemeSettings['hover_background-color']}
                  onChange={handleColorChange('hover_background-color')}
                  showText
                  className={styles.colorPicker}
                  size="large"
                />
              </div>

              <div className={styles.colorItem}>
                <label>按下背景</label>
                <ColorPicker
                  value={customThemeSettings['focus_background-color']}
                  onChange={handleColorChange('focus_background-color')}
                  showText
                  className={styles.colorPicker}
                  size="large"
                />
              </div>
            </div>
          </div>

          {/* 字体颜色设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-ziti"></use>
              </svg>
              字体颜色
            </h2>

            <div className={styles.colorGrid}>
              <div className={styles.colorItem}>
                <label>常规颜色</label>
                <ColorPicker
                  value={customThemeSettings['font-color']}
                  onChange={handleColorChange('font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>次常规颜色</label>
                <ColorPicker
                  value={customThemeSettings['secondary-font-color']}
                  onChange={handleColorChange('secondary-font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>悬浮颜色</label>
                <ColorPicker
                  value={customThemeSettings['hover_font-color']}
                  onChange={handleColorChange('hover_font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>按下颜色</label>
                <ColorPicker
                  value={customThemeSettings['focus_font-color']}
                  onChange={handleColorChange('focus_font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>水印颜色</label>
                <ColorPicker
                  value={customThemeSettings['watermark-font-color']}
                  onChange={handleColorChange('watermark-font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>
            </div>
          </div>

          {/* 边框设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-biankuangyanse"></use>
              </svg>
              边框颜色
            </h2>

            <div className={styles.colorGrid}>
              <div className={styles.colorItem}>
                <label>常规颜色</label>
                <ColorPicker
                  value={customThemeSettings['border_color']}
                  onChange={handleColorChange('border_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>次常规颜色</label>
                <ColorPicker
                  value={customThemeSettings['secondary-border_color']}
                  onChange={handleColorChange('secondary-border_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>悬浮颜色</label>
                <ColorPicker
                  value={customThemeSettings['hover_border_color']}
                  onChange={handleColorChange('hover_border_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>按下颜色</label>
                <ColorPicker
                  value={customThemeSettings['focus_border_color']}
                  onChange={handleColorChange('focus_border_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>
            </div>
          </div>

          {/* 阴影设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-yinying"></use>
              </svg>
              阴影颜色
            </h2>

            <div className={styles.colorGrid}>
              <div className={styles.colorItem}>
                <label>常规阴影</label>
                <ColorPicker
                  value={customThemeSettings['shadow_color']}
                  onChange={handleColorChange('shadow_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>悬浮阴影</label>
                <ColorPicker
                  value={customThemeSettings['hover_shadow_color']}
                  onChange={handleColorChange('hover_shadow_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>按下阴影</label>
                <ColorPicker
                  value={customThemeSettings['focus_shadow_color']}
                  onChange={handleColorChange('focus_shadow_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>
            </div>
          </div>

          {/* 字体设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-ziti"></use>
              </svg>
              字体设置
            </h2>

            <div className={styles.settingsGrid}>
              <div className={styles.settingItem}>
                <label>字体家族</label>
                <select
                  value={customThemeSettings['font-family']}
                  onChange={(e) => handleSettingChange('font-family', e.target.value)}
                  className={styles.select}
                >
                  <option value="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">系统字体</option>
                  <option value="Arial, Helvetica, sans-serif">Arial</option>
                  <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
                  <option value="'SimSun', serif">宋体</option>
                  <option value="'KaiTi', serif">楷体</option>
                  <option value="'SimHei', sans-serif">黑体</option>
                </select>
              </div>
            </div>
          </div>

          {/* 快速预设 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-mofabang"></use>
              </svg>
              快速预设
            </h2>

            <div className={styles.presets}>
              <Button
                onClick={() => applyPreset('light')}
                variant="secondary"
                size="small"
              >
                浅色主题
              </Button>
              <Button
                onClick={() => applyPreset('dark')}
                variant="secondary"
                size="small"
              >
                深色主题
              </Button>
              <Button
                onClick={() => applyPreset('blue')}
                variant="secondary"
                size="small"
              >
                蓝色主题
              </Button>
            </div>
          </div>

          {/* 保存操作 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-baocun"></use>
              </svg>
              保存操作
            </h2>

            <div className={styles.saveActions}>
              {editingTheme ? (
                <div className={styles.editActions}>
                  <Button
                    onClick={handleUpdateTheme}
                    variant="primary"
                    size="large"
                    loading={saving}
                    disabled={!isAuthenticated}
                  >
                    {saving ? '更新中...' : '更新主题'}
                  </Button>
                  <Button
                    onClick={cancelEditing}
                    variant="secondary"
                    size="large"
                  >
                    取消编辑
                  </Button>
                </div>
              ) : (
                <div className={styles.createActions}>
                  <Button
                    onClick={handleSaveTheme}
                    variant="primary"
                    size="large"
                    loading={saving}
                    disabled={!themeName.trim() || !isAuthenticated}
                  >
                    {saving ? '保存中...' : '保存为新主题'}
                  </Button>
                  <div className={styles.saveHint}>
                    {!isAuthenticated && '请登录后保存主题'}
                    {isAuthenticated && !themeName.trim() && '请输入主题名称'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：主题列表 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-liebiao"></use>
              </svg>
              我的主题 ({allThemes.length})
            </h3>
            {!isAuthenticated && (
              <div className={styles.loginTip}>请登录后管理主题</div>
            )}
          </div>

          {allThemes.length === 0 ? (
            <div className={styles.empty}>
              <p>{isAuthenticated ? '暂无主题' : '请登录后查看主题'}</p>
              <small>{isAuthenticated ? '创建您的第一个主题' : '登录后可以创建和管理主题'}</small>
            </div>
          ) : (
            <div className={styles.list}>
              {allThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={`${styles.item} ${theme.is_active ? styles.itemActive : ''}`}
                >
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>
                      {theme.theme_name}
                      {theme.is_active && <span className={styles.activeBadge}>活动</span>}
                    </div>
                    <div className={styles.itemDate}>
                      {new Date(theme.created_at || theme.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <Button
                      onClick={() => handleApplyTheme(theme.id)}
                      variant={theme.is_active ? "primary" : "secondary"}
                      size="small"
                      disabled={theme.is_active}
                    >
                      {theme.is_active ? '已应用' : '应用'}
                    </Button>
                    <Button
                      onClick={() => startEditing(theme.id)}
                      variant="secondary"
                      size="small"
                    >
                      编辑
                    </Button>
                    <Button
                      onClick={() => handleDeleteTheme(theme.id, theme.theme_name)}
                      variant="secondary"
                      size="small"
                      disabled={theme.is_active && allThemes.length === 1}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemThemeSettings;