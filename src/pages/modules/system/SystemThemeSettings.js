// src/components/ThemeSettings/SystemThemeSettings.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { ColorPicker, message } from 'antd';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import styles from './SystemThemeSettings.module.css';
import Button from '../../../components/UI/Button';
import { get8DigitHexFromColor } from '../../../utils';

const SystemThemeSettings = () => {
  const {
    allThemes,
    activeTheme,
    defaultTheme,
    loading: themeLoading,
    updateThemes,
    updateActiveTheme,
    setLoadingState,
    previewThemeSettings,
    cancelPreview,
    transformDbThemeToCss,
    transformCssToDbTheme,
    applyThemeToRoot
  } = useTheme();

  const [backgroundAnimation, setBackgroundAnimation] = useState('WaterWave');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const fileInputRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  const userThemes = allThemes.filter(theme =>
    theme.email === user?.email
  );

  const [editingTheme, setEditingTheme] = useState(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [customThemeSettings, setCustomThemeSettings] = useState(() =>
    activeTheme ? transformDbThemeToCss(activeTheme) : { ...defaultTheme }
  );
  const [saving, setSaving] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  // 获取用户主题
  const fetchUserThemes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      updateThemes([]);
      updateActiveTheme(null);
      setLoadingState(false);
      return;
    }

    setLoadingState(true);
    try {
      const response = await axios.get('/api/UserThemeSettings', {
        params: { email: user.email }
      });

      if (response.data && response.data.success && Array.isArray(response.data.themes)) {
        const fetchedThemes = response.data.themes;
        updateThemes(fetchedThemes);

        // 查找当前用户的活动主题
        const activeForUser = fetchedThemes.find(t => t.is_active && t.email === user.email);
        if (activeForUser) {
          updateActiveTheme(activeForUser);
        } else {
          // 如果没有活动主题，使用默认主题
          const defaultForUser = fetchedThemes.find(t => t.is_default && t.email === user.email);
          if (defaultForUser) {
            updateActiveTheme(defaultForUser);
          } else {
            updateActiveTheme(null);
            applyThemeToRoot(defaultTheme);
          }
        }
      } else {
        throw new Error('API data format error');
      }
    } catch (error) {
      console.error('获取用户主题失败:', error);
      updateThemes([]);
      updateActiveTheme(null);
      applyThemeToRoot(defaultTheme);
    } finally {
      setLoadingState(false);
    }
  }, [isAuthenticated, user, updateThemes, updateActiveTheme, setLoadingState, applyThemeToRoot, defaultTheme, transformDbThemeToCss]);

  // 设置活动主题
  const setActiveThemeById = useCallback(async (themeId) => {
    if (!isAuthenticated || !user) throw new Error('用户未登录');
    try {
      const response = await axios.put(`/api/UserThemeSettings/setActive/${themeId}`, {
        email: user.email
      });

      if (response.data && response.data.success) {
        const updatedThemes = allThemes.map(t => ({
          ...t,
          is_active: t.id === themeId
        }));
        const newActiveTheme = updatedThemes.find(t => t.id === themeId);

        updateThemes(updatedThemes);
        if (newActiveTheme) {
          updateActiveTheme(newActiveTheme);
        }
        return { success: true };
      } else {
        throw new Error(response.data?.message || '设置活动主题失败');
      }
    } catch (error) {
      console.error('设置活动主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, allThemes, updateThemes, updateActiveTheme]);

  // 设置默认主题
  const setDefaultThemeById = useCallback(async (themeId) => {
    if (!isAuthenticated || !user) throw new Error('用户未登录');
    try {
      const response = await axios.put(`/api/UserThemeSettings/setDefault/${themeId}`, {
        email: user.email
      });

      if (response.data && response.data.success) {
        const updatedThemes = allThemes.map(t => ({
          ...t,
          is_default: t.id === themeId
        }));
        updateThemes(updatedThemes);
        return { success: true };
      } else {
        throw new Error(response.data?.message || '设置默认主题失败');
      }
    } catch (error) {
      console.error('设置默认主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, allThemes, updateThemes]);

  // 处理特效变化
  const handleBackgroundAnimationChange = useCallback((value) => {
    setBackgroundAnimation(value);
    setShowImageUpload(value === 'CustomBackground');

    // 更新主题设置中的背景动画
    setCustomThemeSettings(prev => ({ ...prev, 'background-animation': value }));

    // 如果是自定义背景，清除已选择的图片
    if (value !== 'CustomBackground') {
      setSelectedImage(null);
      setImageFile(null);
    }
  }, []);

  // 处理图片选择
  const handleImageSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        message.error('请选择图片文件！');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        message.error('图片大小不能超过5MB！');
        return;
      }

      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // 上传背景图片
  // 上传背景图片函数
  const uploadBackgroundImage = useCallback(async (themeId) => {
    if (!imageFile || !isAuthenticated || !user) {
      throw new Error('请先选择图片并登录');
    }

    const imageFormData = new FormData();
    imageFormData.append('backgroundImage', imageFile);
    imageFormData.append('email', user.email);
    imageFormData.append('themeId', themeId.toString()); // 确保是字符串

    console.log('ReactDemo 上传图片数据:', {
      email: user.email,
      themeId: themeId,
      fileName: imageFile.name
    });

    // 使用新的独立路由
    const response = await axios.post('/api/react-demo/upload-background', imageFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data && response.data.success) {
      setImageTimestamp(Date.now());
      return response.data;
    } else {
      throw new Error(response.data?.message || 'ReactDemo: 图片上传失败');
    }
  }, [imageFile, isAuthenticated, user]);

  // 创建新主题
  const createNewTheme = useCallback(async (themeName, themeSettings, setAsActive = false) => {
    if (!isAuthenticated || !user) throw new Error('用户未登录');

    try {
      // 转换CSS主题设置到数据库格式
      const dbTheme = transformCssToDbTheme(themeSettings);

      // 创建主题数据 - 确保 is_active 是布尔值
      const themeData = {
        email: user.email,
        theme_name: themeName,
        is_active: setAsActive, // 这里应该是布尔值 true/false
        ...dbTheme
      };

      // 创建主题
      const response = await axios.post('/api/UserThemeSettings', themeData);

      if (response.data && response.data.success && response.data.theme) {
        const newTheme = response.data.theme;

        // 如果有自定义背景图片，上传图片
        if (backgroundAnimation === 'CustomBackground' && imageFile) {
          await uploadBackgroundImage(newTheme.id);
        }

        // 更新主题列表
        let newThemesList = [...allThemes, newTheme];
        if (setAsActive) {
          newThemesList = newThemesList.map(t => ({ ...t, is_active: t.id === newTheme.id }));
          updateActiveTheme(newTheme);
        }
        updateThemes(newThemesList);
        return { success: true, theme: newTheme };
      } else {
        throw new Error(response.data?.message || '创建主题失败');
      }
    } catch (error) {
      console.error('创建主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, backgroundAnimation, imageFile, allThemes, transformCssToDbTheme, updateThemes, updateActiveTheme, uploadBackgroundImage]);

  // 更新主题
  // const updateThemeById = useCallback(async (themeId, updateData) => {
  //   try {
  //     console.log('调用 updateThemeById:', { themeId, updateData, user });

  //     // 确保包含用户邮箱
  //     const requestData = {
  //       email: user?.email,
  //       ...updateData
  //     };

  //     const response = await axios.put(`/api/UserThemeSettings/${themeId}`, requestData);

  //     console.log('更新主题响应:', response.data);

  //     if (response.data && response.data.success && response.data.theme) {
  //       const updatedTheme = response.data.theme;
  //       const newThemesList = allThemes.map(t => t.id === themeId ? updatedTheme : t);
  //       updateThemes(newThemesList);

  //       if (activeTheme && activeTheme.id === themeId) {
  //         updateActiveTheme(updatedTheme);
  //       }

  //       // 如果有自定义背景图片，上传图片
  //       if (backgroundAnimation === 'CustomBackground' && imageFile) {
  //         try {
  //           console.log('开始上传背景图片...');
  //           await uploadBackgroundImage(themeId);
  //           console.log('背景图片上传成功');
  //           message.success('主题和背景图片更新成功！');
  //         } catch (uploadError) {
  //           console.error('背景图片上传失败:', uploadError);
  //           // 主题更新成功，但图片上传失败，显示警告而不是错误
  //           message.warning('主题更新成功，但背景图片上传失败');
  //         }
  //       } else {
  //         message.success('主题更新成功！');
  //       }

  //       return { success: true, theme: updatedTheme };
  //     } else {
  //       throw new Error(response.data?.message || '更新主题失败');
  //     }
  //   } catch (error) {
  //     console.error('updateThemeById 错误详情:', {
  //       error: error,
  //       response: error.response,
  //       data: error.response?.data,
  //       status: error.response?.status
  //     });
  //     throw error;
  //   }
  // }, [allThemes, activeTheme, updateThemes, updateActiveTheme, backgroundAnimation, imageFile, uploadBackgroundImage, user]);
const updateThemeById = useCallback(async (themeId, updateData) => {
  try {
    console.log('调用 updateThemeById:', { themeId, updateData, user });

    const requestData = {
      email: user?.email,
      ...updateData
    };

    const response = await axios.put(`/api/UserThemeSettings/${themeId}`, requestData);

    console.log('更新主题响应:', response.data);

    if (response.data && response.data.success && response.data.theme) {
      const updatedTheme = response.data.theme;
      const newThemesList = allThemes.map(t => t.id === themeId ? updatedTheme : t);
      updateThemes(newThemesList);

      if (activeTheme && activeTheme.id === themeId) {
        updateActiveTheme(updatedTheme);
      }

      // 如果有自定义背景图片，上传图片
      if (backgroundAnimation === 'CustomBackground' && imageFile) {
        try {
          console.log('开始上传背景图片...');
          await uploadBackgroundImage(themeId);
          console.log('背景图片上传成功');
          message.success('主题和背景图片更新成功！');
        } catch (uploadError) {
          console.error('背景图片上传失败:', uploadError);
          message.warning('主题更新成功，但背景图片上传失败');
        }
      } else {
        message.success('主题更新成功！');
      }

      // 关键：返回更新后的主题数据
      return { success: true, theme: updatedTheme };
    } else {
      throw new Error(response.data?.message || '更新主题失败');
    }
  } catch (error) {
    console.error('updateThemeById 错误详情:', error);
    throw error;
  }
}, [allThemes, activeTheme, updateThemes, updateActiveTheme, backgroundAnimation, imageFile, uploadBackgroundImage, user]);
  // 删除主题
  // 在 deleteThemeById 函数中也添加邮箱
  const deleteThemeById = useCallback(async (themeId) => {
    try {
      const response = await axios.delete(`/api/UserThemeSettings/${themeId}`, {
        data: { email: user?.email } // 在请求体中传递邮箱
      });

      if (response.data && response.data.success) {
        const newThemesList = allThemes.filter(t => t.id !== themeId);
        updateThemes(newThemesList);

        if (activeTheme && activeTheme.id === themeId) {
          const defaultForUser = newThemesList.find(t => t.is_default && t.email === user.email);
          if (defaultForUser) {
            updateActiveTheme(defaultForUser);
          } else {
            updateActiveTheme(null);
            applyThemeToRoot(defaultTheme);
          }
        }
        return { success: true };
      } else {
        throw new Error(response.data?.message || '删除主题失败');
      }
    } catch (error) {
      console.error('删除主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, allThemes, activeTheme, updateThemes, updateActiveTheme, applyThemeToRoot, defaultTheme]);

  // 监听活动主题变化
  useEffect(() => {
    if (activeTheme && !editingTheme && !creatingNew) {
      setCustomThemeSettings(transformDbThemeToCss(activeTheme));
      setBackgroundAnimation(activeTheme.background_animation || 'WaterWave');
    } else if (!activeTheme && !editingTheme && !creatingNew) {
      setCustomThemeSettings({ ...defaultTheme });
      setBackgroundAnimation('WaterWave');
    }
  }, [activeTheme, editingTheme, creatingNew, transformDbThemeToCss, defaultTheme]);

  // 实时预览
  useEffect(() => {
    if ((editingTheme || creatingNew) && Object.keys(customThemeSettings).length > 0) {
      const timer = setTimeout(() => {
        previewThemeSettings(customThemeSettings);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [customThemeSettings, editingTheme, creatingNew, previewThemeSettings]);

  // 初始化加载主题
  useEffect(() => {
    fetchUserThemes();
  }, [fetchUserThemes]);

  const handleColorChange = useCallback((key) => (color) => {
    setCustomThemeSettings(prev => ({ ...prev, [key]: get8DigitHexFromColor(color) }));
  }, []);

  const handleApplyTheme = useCallback(async (themeId) => {
    try {
      await setActiveThemeById(themeId);
      message.success('主题应用成功！');
    } catch (error) {
      message.error(error.message || '应用主题失败');
    }
  }, [setActiveThemeById]);

  const handleSetDefaultTheme = useCallback(async (themeId) => {
    try {
      await setDefaultThemeById(themeId);
      message.success('已设为个人默认主题！');
    } catch (error) {
      message.error(error.message || '设置默认主题失败');
    }
  }, [setDefaultThemeById]);

  const startEditing = useCallback((themeId) => {
    const themeToEdit = userThemes.find(t => t.id === themeId);
    if (themeToEdit) {
      setEditingTheme(themeId);
      setCreatingNew(false);
      setNewThemeName(themeToEdit.theme_name);
      setCustomThemeSettings(transformDbThemeToCss(themeToEdit));
      setBackgroundAnimation(themeToEdit.background_animation || 'WaterWave');
      setShowImageUpload(themeToEdit.background_animation === 'CustomBackground');

      // 加载自定义背景图片 - 使用新路由
      if (themeToEdit.background_animation === 'CustomBackground') {
        const imageUrl = `/api/react-demo/background-image/${user.email}/${themeId}?t=${Date.now()}`;
        setSelectedImage(imageUrl);
      } else {
        setSelectedImage(null);
        setImageFile(null);
      }
    }
  }, [userThemes, transformDbThemeToCss, user]);

  const cancelEditingAndCreating = useCallback(() => {
    setEditingTheme(null);
    setCreatingNew(false);
    setNewThemeName('');
    setSelectedImage(null);
    setImageFile(null);
    setShowImageUpload(false);
    setBackgroundAnimation('WaterWave');
    cancelPreview();
  }, [cancelPreview]);

  // const handleSaveEdit = useCallback(async () => {
  //   if (!editingTheme || !newThemeName.trim()) {
  //     message.error('请输入主题名称');
  //     return;
  //   }

  //   setSaving(true);
  //   try {
  //     const dbTheme = transformCssToDbTheme(customThemeSettings);

  //     // 添加调试信息
  //     console.log('更新主题数据:', {
  //       themeId: editingTheme,
  //       themeName: newThemeName,
  //       backgroundAnimation: backgroundAnimation,
  //       dbTheme: dbTheme
  //     });

  //     await updateThemeById(editingTheme, {
  //       ...dbTheme,
  //       theme_name: newThemeName,
  //       background_animation: backgroundAnimation
  //     });
  //     message.success('主题更新成功！');
  //     cancelEditingAndCreating();
  //   } catch (error) {
  //     // 详细错误日志
  //     console.error('更新主题失败详情:', {
  //       error: error,
  //       response: error.response,
  //       data: error.response?.data,
  //       status: error.response?.status
  //     });

  //     const errorMessage = error.response?.data?.message || error.message || '更新主题失败';
  //     message.error(errorMessage);
  //   } finally {
  //     setSaving(false);
  //   }
  // }, [editingTheme, newThemeName, customThemeSettings, backgroundAnimation, updateThemeById, transformCssToDbTheme, cancelEditingAndCreating]);
const handleSaveEdit = useCallback(async () => {
  if (!editingTheme || !newThemeName.trim()) {
    message.error('请输入主题名称');
    return;
  }

  setSaving(true);
  try {
    const dbTheme = transformCssToDbTheme(customThemeSettings);

    console.log('更新主题数据:', {
      themeId: editingTheme,
      themeName: newThemeName,
      backgroundAnimation: backgroundAnimation,
      dbTheme: dbTheme
    });

    // 保存主题更新
    const result = await updateThemeById(editingTheme, {
      ...dbTheme,
      theme_name: newThemeName,
      background_animation: backgroundAnimation
    });

    if (result.success) {
      message.success('主题更新成功！');
      
      // 关键修改：保存成功后立即应用更新后的主题
      const updatedTheme = result.theme;
      
      // 如果当前编辑的主题是活动主题，更新活动主题
      if (activeTheme && activeTheme.id === editingTheme) {
        updateActiveTheme(updatedTheme);
        applyThemeToRoot(transformDbThemeToCss(updatedTheme));
      }
      
      // 取消编辑状态，但保持主题应用
      setEditingTheme(null);
      setCreatingNew(false);
      setNewThemeName('');
      setSelectedImage(null);
      setImageFile(null);
      setShowImageUpload(false);
      
      // 不要调用 cancelPreview()，这样会重置到旧的主题
      // 而是直接应用更新后的主题
      if (activeTheme && activeTheme.id === editingTheme) {
        // 已经是活动主题，不需要额外操作
      } else {
        // 如果不是活动主题，取消预览会重置到当前活动主题，这是正确的行为
        cancelPreview();
      }
    }
  } catch (error) {
    console.error('更新主题失败详情:', {
      error: error,
      response: error.response,
      data: error.response?.data,
      status: error.response?.status
    });

    const errorMessage = error.response?.data?.message || error.message || '更新主题失败';
    message.error(errorMessage);
  } finally {
    setSaving(false);
  }
}, [editingTheme, newThemeName, customThemeSettings, backgroundAnimation, updateThemeById, transformCssToDbTheme, activeTheme, updateActiveTheme, applyThemeToRoot, transformDbThemeToCss, cancelPreview]);
  const handleCreateNewTheme = useCallback(() => {
    if (!isAuthenticated) {
      message.error('请先登录');
      return;
    }
    setCreatingNew(true);
    setEditingTheme(null);
    setNewThemeName('新主题');
    setCustomThemeSettings({ ...defaultTheme });
    setBackgroundAnimation('WaterWave');
    setShowImageUpload(false);
    setSelectedImage(null);
    setImageFile(null);
  }, [isAuthenticated, defaultTheme]);

  const handleSaveNewTheme = useCallback(async () => {
    if (!newThemeName.trim()) {
      message.error('请输入主题名称');
      return;
    }
    if (!isAuthenticated) {
      message.error('请先登录');
      return;
    }

    setSaving(true);
    try {
      await createNewTheme(newThemeName, customThemeSettings, false);
      message.success('主题创建成功！');
      cancelEditingAndCreating();
    } catch (error) {
      message.error(error.message || '创建主题失败');
    } finally {
      setSaving(false);
    }
  }, [newThemeName, isAuthenticated, customThemeSettings, createNewTheme, cancelEditingAndCreating]);

  const handleDeleteTheme = useCallback(async (themeId, themeName) => {
    if (window.confirm(`确定删除主题 "${themeName}" 吗？`)) {
      try {
        await deleteThemeById(themeId);
        message.success('主题删除成功！');
      } catch (error) {
        message.error(error.message || '删除主题失败');
      }
    }
  }, [deleteThemeById]);

  const handleRefreshThemes = useCallback(async () => {
    try {
      await fetchUserThemes();
      message.success('主题列表已刷新');
    } catch (error) {
      message.error('刷新主题列表失败');
    }
  }, [fetchUserThemes]);

  const handleSettingChange = useCallback((key, value) => {
    setCustomThemeSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  if (themeLoading) {
    return <div className={styles.loading}>加载主题设置中...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 左侧：主题编辑器 */}
        <div className={styles.editor}>
          {/* <p><strong>用户名:</strong> {user?.username}</p>
          <p><strong>邮箱:</strong> {user?.email}</p> */}

          {/* 背景颜色设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-beijingyanse"></use></svg>
              背景颜色
            </h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorItem}><label>主常规背景</label><ColorPicker value={customThemeSettings['background-color']} onChange={handleColorChange('background-color')} showText className={styles.colorPicker} size="large" /></div>
              <div className={styles.colorItem}><label>次常规背景</label><ColorPicker value={customThemeSettings['secondary-background-color']} onChange={handleColorChange('secondary-background-color')} showText className={styles.colorPicker} size="large" /></div>
              <div className={styles.colorItem}><label>悬浮背景</label><ColorPicker value={customThemeSettings['hover_background-color']} onChange={handleColorChange('hover_background-color')} showText className={styles.colorPicker} size="large" /></div>
              <div className={styles.colorItem}><label>按下背景</label><ColorPicker value={customThemeSettings['focus_background-color']} onChange={handleColorChange('focus_background-color')} showText className={styles.colorPicker} size="large" /></div>
            </div>
          </div>

          {/* 字体颜色设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-wenziyanse"></use></svg>字体颜色</h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorItem}><label>常规颜色</label><ColorPicker value={customThemeSettings['font-color']} onChange={handleColorChange('font-color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>次常规颜色</label><ColorPicker value={customThemeSettings['secondary-font-color']} onChange={handleColorChange('secondary-font-color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>悬浮颜色</label><ColorPicker value={customThemeSettings['hover_font-color']} onChange={handleColorChange('hover_font-color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>按下颜色</label><ColorPicker value={customThemeSettings['focus_font-color']} onChange={handleColorChange('focus_font-color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>水印颜色</label><ColorPicker value={customThemeSettings['watermark-font-color']} onChange={handleColorChange('watermark-font-color')} showText className={styles.colorPicker} /></div>
            </div>
          </div>

          {/* 边框颜色设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-biankuangyanse"></use></svg>边框颜色</h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorItem}><label>常规颜色</label><ColorPicker value={customThemeSettings['border_color']} onChange={handleColorChange('border_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>次常规颜色</label><ColorPicker value={customThemeSettings['secondary-border_color']} onChange={handleColorChange('secondary-border_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>悬浮颜色</label><ColorPicker value={customThemeSettings['hover_border_color']} onChange={handleColorChange('hover_border_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>按下颜色</label><ColorPicker value={customThemeSettings['focus_border_color']} onChange={handleColorChange('focus_border_color')} showText className={styles.colorPicker} /></div>
            </div>
          </div>

          {/* 阴影颜色设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-yinying"></use></svg>阴影颜色</h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorItem}><label>常规阴影</label><ColorPicker value={customThemeSettings['shadow_color']} onChange={handleColorChange('shadow_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>悬浮阴影</label><ColorPicker value={customThemeSettings['hover_shadow_color']} onChange={handleColorChange('hover_shadow_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>按下阴影</label><ColorPicker value={customThemeSettings['focus_shadow_color']} onChange={handleColorChange('focus_shadow_color')} showText className={styles.colorPicker} /></div>
            </div>
          </div>

          {/* 字体设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon--zitixieti"></use></svg>字体设置</h2>
            <div className={styles.settingsGrid}>
              <div className={styles.settingItem}>
                <label>字体家族</label>
                <select value={customThemeSettings['font-family']} onChange={(e) => handleSettingChange('font-family', e.target.value)} className={styles.select}>
                  <option value="SimSun">宋体</option>
                  <option value="KaiTi">楷体</option>
                  <option value="KaiTi_GB2312">楷体_GB2312</option>
                  <option value="FZKaKai-GBK">方正楷体</option>
                  <option value="FZMWFont">方正喵呜体</option>
                  <option value="AlimamaDongFangDaKai">阿里妈妈东方大楷</option>
                </select>
              </div>
            </div>
          </div>

          {/* 特效设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-mofabang"></use>
              </svg>
              特效设置
            </h2>

            <div className={styles.settingsGrid}>
              <div className={styles.settingItem}>
                <label>背景特效</label>
                <select
                  value={backgroundAnimation}
                  onChange={(e) => handleBackgroundAnimationChange(e.target.value)}
                  className={styles.select}
                >
                  <option value="WaterWave">水滴滚动</option>
                  <option value="NauticalBackground">路飞出海</option>
                  <option value="FlowerScene">鲜花盛开</option>
                  <option value="DarkClouds">乌云密布</option>
                  <option value="SakuraBackground">樱花飘落</option>
                  <option value="DetailsHomeBackground">烟花</option>
                  <option value="CandleAnimation">蜡烛动画</option>
                  <option value="CompassTime">时间罗盘</option>
                  <option value="BallLoading">弹性小球</option>
                  <option value="CustomBackground">自定义背景</option>
                </select>
              </div>
            </div>
          </div>

          {/* 自定义背景图片上传区域 */}
          {showImageUpload && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <svg className={styles.icon} aria-hidden="true">
                  <use xlinkHref="#icon-tupian"></use>
                </svg>
                背景图片
              </h2>

              <div className={styles.imageUpload}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={styles.fileInput}
                />
                <div
                  className={styles.uploadArea}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedImage ? (
                    <div className={styles.imagePreview}>
                      <img src={selectedImage} alt="背景预览" />
                      <div className={styles.changeText}>点击更换图片</div>
                    </div>
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <div className={styles.uploadIcon}>📁</div>
                      <div className={styles.uploadText}>点击选择背景图片</div>
                      <div className={styles.uploadHint}>支持 JPG, PNG, WEBP 格式</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 编辑/创建按钮 */}
          {/* {(editingTheme || creatingNew) && (
            <div className={styles.actionButtons}>
              <Button 
                onClick={editingTheme ? handleSaveEdit : handleSaveNewTheme} 
                variant="primary" 
                loading={saving} 
                disabled={!newThemeName.trim()}
              >
                {editingTheme ? '保存修改' : '创建主题'}
              </Button>
              <Button onClick={cancelEditingAndCreating} variant="secondary">
                取消
              </Button>
            </div>
          )} */}
        </div>

        {/* 右侧：主题列表 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-liebiao"></use></svg>我的主题 ({userThemes.length})</h3>
            <div className={styles.sidebarActions}>
              <Button onClick={handleRefreshThemes} variant="secondary" size="small" loading={themeLoading}>刷新列表</Button>
              <Button onClick={handleCreateNewTheme} variant="primary" size="small">新建主题</Button>
            </div>
          </div>

          {!isAuthenticated && (<div className={styles.loginTip}>请登录后管理主题</div>)}

          {userThemes.length === 0 && isAuthenticated ? (
            <div className={styles.empty}><p>暂无主题</p><small>创建您的第一个主题</small></div>
          ) : (
            <div className={styles.list}>
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
                    <Button onClick={handleSaveNewTheme} variant="primary" size="small" loading={saving} disabled={!newThemeName.trim()}>保存</Button>
                    <Button onClick={cancelEditingAndCreating} variant="secondary" size="small">取消</Button>
                  </div>
                </div>
              )}

              {userThemes.map((theme) => {
                const isActive = activeTheme?.id === theme.id;
                const isDefault = theme.is_default;

                return (
                  <div key={theme.id} className={`${styles.item} ${isActive ? styles.itemActive : ''}`}>
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
                          {/* {isActive && <span className={styles.badgeActive}>已应用</span>} */}
                          {isDefault && <span className={styles.badgeDefault}>默认</span>}
                        </div>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      {editingTheme === theme.id ? (
                        <>
                          <Button onClick={handleSaveEdit} variant="primary" size="small" loading={saving} disabled={!newThemeName.trim()}>保存</Button>
                          <Button onClick={cancelEditingAndCreating} variant="secondary" size="small">取消</Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => handleApplyTheme(theme.id)} disabled={isActive} size="small">{isActive ? '已应用' : '应用'}</Button>
                          {/* <Button onClick={() => handleSetDefaultTheme(theme.id)} variant="secondary" size="small" disabled={isDefault}>设默认</Button> */}
                          <Button onClick={() => startEditing(theme.id)} variant="secondary" size="small">编辑</Button>
                          <Button onClick={() => handleDeleteTheme(theme.id, theme.theme_name)} variant="secondary" size="small" disabled={isActive && userThemes.length === 1}>删除</Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemThemeSettings;