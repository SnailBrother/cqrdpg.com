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

const SystemThemeSettings = () => {
  const {
    allThemes,
    activeTheme,
    previewTheme,
    themeSettings,
    defaultTheme,
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

  // 过滤出当前用户的主题
  const userThemes = allThemes.filter(theme => 
    theme.email === user?.email && theme.username === user?.username
  );

  const [editingTheme, setEditingTheme] = useState(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [customThemeSettings, setCustomThemeSettings] = useState({ ...defaultTheme });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  // 初始化设置
  useEffect(() => {
    const initializeThemes = async () => {
      setLoading(true);
      try {
        if (isAuthenticated && user) {
          await fetchUserAllThemes();
        }

        if (activeTheme) {
          const cssTheme = transformDbThemeToCss(activeTheme);
          setCustomThemeSettings(cssTheme);
        } else {
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
  }, []);

  // 监听活动主题变化
// src/components/ThemeSettings/SystemThemeSettings.js

// 监听活动主题变化 (修改后的版本)
// 职责单一：当活动主题本身变化时，更新颜色设置。
// 仅当不在编辑或创建模式下，才同步UI。
useEffect(() => {
  if (activeTheme && !editingTheme && !creatingNew) {
    setCustomThemeSettings(transformDbThemeToCss(activeTheme));
  }
  // 依赖项只保留 activeTheme。
  // 这确保了只有在 activeTheme 对象本身变化时，我们才考虑重置颜色选择器。
}, [activeTheme, transformDbThemeToCss]);

 

  // 实时预览主题变化
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
 // 开始编辑主题 (修改后的版本)
  const startEditing = useCallback((themeId) => {
    const themeToEdit = userThemes.find(t => t.id === themeId);
    if (themeToEdit) {
      setEditingTheme(themeId);
      setCreatingNew(false);
      // 直接在这里设置编辑器的初始状态
      setNewThemeName(themeToEdit.theme_name);
      setCustomThemeSettings(transformDbThemeToCss(themeToEdit));
    }
  }, [userThemes, transformDbThemeToCss]); // 确保依赖项正确

  // 取消编辑
  const cancelEditing = useCallback(() => {
    setEditingTheme(null);
    setCreatingNew(false);
    setNewThemeName('');
    if (activeTheme) {
      const cssTheme = transformDbThemeToCss(activeTheme);
      setCustomThemeSettings(cssTheme);
      previewThemeSettings(cssTheme);
    } else {
      setCustomThemeSettings({ ...defaultTheme });
      cancelPreview();
    }
  }, [activeTheme, transformDbThemeToCss, previewThemeSettings, cancelPreview, defaultTheme]);

  // 保存主题编辑
  const handleSaveEdit = useCallback(async () => {
    if (!editingTheme || !newThemeName.trim()) {
      message.error('请输入主题名称');
      return;
    }

    setSaving(true);
    try {
      const dbTheme = transformCssToDbTheme(customThemeSettings);
      const updateData = {
        ...dbTheme,
        theme_name: newThemeName
      };
      
      await updateThemeById(editingTheme, updateData);
      message.success('主题更新成功！');
      setEditingTheme(null);
      setNewThemeName('');
    } catch (error) {
      console.error('更新主题失败:', error);
      message.error(error.message || '更新主题失败');
    } finally {
      setSaving(false);
    }
  }, [editingTheme, newThemeName, customThemeSettings, updateThemeById, transformCssToDbTheme]);

  // 创建新主题
  const handleCreateNewTheme = useCallback(async () => {
    if (!isAuthenticated || !user) {
      message.error('请先登录');
      return;
    }

    setCreatingNew(true);
    setEditingTheme(null);
    setNewThemeName('新主题');
    setCustomThemeSettings({ ...defaultTheme });
    previewThemeSettings({ ...defaultTheme });
  }, [isAuthenticated, user, defaultTheme, previewThemeSettings]);

  // 保存新主题
  const handleSaveNewTheme = useCallback(async () => {
    if (!newThemeName.trim()) {
      message.error('请输入主题名称');
      return;
    }

    if (!isAuthenticated || !user) {
      message.error('请先登录');
      return;
    }

    setSaving(true);
    try {
      await createNewTheme(newThemeName, customThemeSettings, false);
      message.success('主题创建成功！');
      setCreatingNew(false);
      setNewThemeName('');
      await fetchUserAllThemes();
    } catch (error) {
      console.error('创建主题失败:', error);
      message.error(error.message || '创建主题失败');
    } finally {
      setSaving(false);
    }
  }, [newThemeName, isAuthenticated, user, customThemeSettings, createNewTheme, fetchUserAllThemes]);

  // 取消创建新主题
  const handleCancelNewTheme = useCallback(() => {
    setCreatingNew(false);
    setNewThemeName('');
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
        await fetchUserAllThemes();
      } catch (error) {
        console.error('删除主题失败:', error);
        message.error(error.message || '删除主题失败');
      }
    }
  }, [deleteThemeById, fetchUserAllThemes]);

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

  // 处理设置变化
  const handleSettingChange = useCallback((key, value) => {
    setCustomThemeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  if (themeLoading || loading) {
    return <div className={styles.loading}>加载主题设置中...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 左侧：主题编辑器 */}
        <div className={styles.editor}>
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
        </div>

        {/* 右侧：主题列表 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-liebiao"></use>
              </svg>
              我的主题 ({userThemes.length})
            </h3>
            <div className={styles.sidebarActions}>
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

          {!isAuthenticated && (
            <div className={styles.loginTip}>请登录后管理主题</div>
          )}

          {userThemes.length === 0 && isAuthenticated ? (
            <div className={styles.empty}>
              <p>暂无主题</p>
              <small>创建您的第一个主题</small>
            </div>
          ) : (
            <div className={styles.list}>
              {/* 新建主题行 */}
              {creatingNew && (
                <div className={`${styles.item} ${styles.creatingItem}`}>
                  <div className={styles.itemInfo}>
                    <input
                      type="text"
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      className={styles.nameInput}
                      placeholder="输入主题名称"
                    />
                  </div>
                  <div className={styles.itemActions}>
                    <Button
                      onClick={handleSaveNewTheme}
                      variant="primary"
                      size="small"
                      loading={saving}
                      disabled={!newThemeName.trim()}
                    >
                      保存
                    </Button>
                    <Button
                      onClick={handleCancelNewTheme}
                      variant="secondary"
                      size="small"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}

              {/* 现有主题列表 */}
              {userThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={`${styles.item} ${theme.is_active ? styles.itemActive : ''}`}
                >
                  <div className={styles.itemInfo}>
                    {editingTheme === theme.id ? (
                      <input
                        type="text"
                        value={newThemeName}
                        onChange={(e) => setNewThemeName(e.target.value)}
                        className={styles.nameInput}
                      />
                    ) : (
                      <div className={styles.itemName}>
                        {theme.theme_name}
                        {theme.is_active && <span className={styles.activeBadge}>活动</span>}
                      </div>
                    )}
                    <div className={styles.itemDate}>
                      {new Date(theme.created_at || theme.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    {editingTheme === theme.id ? (
                      <>
                        <Button
                          onClick={handleSaveEdit}
                          variant="primary"
                          size="small"
                          loading={saving}
                          disabled={!newThemeName.trim()}
                        >
                          保存
                        </Button>
                        <Button
                          onClick={cancelEditing}
                          variant="secondary"
                          size="small"
                        >
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
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
                          disabled={theme.is_active && userThemes.length === 1}
                        >
                          删除
                        </Button>
                      </>
                    )}
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