import React, { useState, useEffect, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { renderAsync } from 'docx-preview';
import styles from './WordEditing.module.css';

const WordEditing = () => {
  // --- State Management ---
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [placeholders, setPlaceholders] = useState([]);
  
  // --- Refs ---
  const previewRef = useRef(null); // 用于挂载 docx-preview 的容器
  const originalTemplateRef = useRef(null); // 存储原始的模板 ArrayBuffer

  /**
   * 核心功能 1: 填充模板并返回填充后的 Blob 对象
   * 使用 async/await 简化 Promise 逻辑
   */
  const fillTemplate = async (arrayBuffer, data) => {
    try {
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '', // 当模板中的值为 null 或 undefined 时，返回空字符串
      });

      doc.render(data);

      return doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    } catch (error) {
      console.error('模板填充失败:', error);
      throw error; // 抛出错误以便上层捕获
    }
  };

  /**
   * 核心功能 2: 渲染预览
   * 将此功能提取为可复用的 useCallback 函数
   */
  const renderPreview = useCallback(async (data) => {
    if (!previewRef.current || !originalTemplateRef.current) return;

    try {
      const filledDocBlob = await fillTemplate(originalTemplateRef.current, data);
      
      // 使用 docx-preview 渲染填充后的文档
      await renderAsync(filledDocBlob, previewRef.current, null, {
        className: styles.docxViewer,
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        debug: false,
        experimental: true,
      });
    } catch (error) {
      console.error('预览渲染失败:', error);
    }
  }, []); // 空依赖数组，因为所有依赖项 (refs) 都是稳定的

  // --- Effects ---

  // Effect 1: 在组件首次加载时，获取模板、检测占位符并进行初始渲染
  useEffect(() => {
    const loadAndParseTemplate = async () => {
      try {
        setIsLoading(true);

  //         const getTemplatePath = () => {
  //   if (templateType === '商业') {
  //     return '/backend/public/webreports/结果报告-单套商业-无家具家电.docx';
  //   } else {
  //     return hasFurnitureElectronics
  //       ? '/backend/public/webreports/结果报告-单套住宅-有家具家电.docx'
  //       : '/backend/public/webreports/结果报告-单套住宅-无家具家电.docx';
  //   }
  // };
  

        // 1. 获取模板文件
        const response = await fetch('/test.docx');
        if (!response.ok) throw new Error('网络响应错误，无法加载模板文件');
        const arrayBuffer = await response.arrayBuffer();
        originalTemplateRef.current = arrayBuffer;

        // 2. 检测占位符
        const text = (await mammoth.extractRawText({ arrayBuffer })).value;
        const placeholderRegex = /\{(\w+)\}/g; // 简化正则，只匹配 {placeholder} 格式
        const foundPlaceholders = [...new Set(Array.from(text.matchAll(placeholderRegex), match => match[1]))];
        
        if (foundPlaceholders.length > 0) {
          setPlaceholders(foundPlaceholders);
          // 3. 初始化表单数据
          const initialFormData = foundPlaceholders.reduce((acc, key) => {
            acc[key] = '';
            return acc;
          }, {});
          setFormData(initialFormData);
          // 4. 初始渲染预览
          await renderPreview(initialFormData);
        } else {
          // 如果没有找到占位符，也直接渲染原始模板
          await renderPreview({});
        }

      } catch (err) {
        console.error('加载或解析模板失败:', err);
        alert('模板加载失败，请确保 public/test.docx 文件存在且可访问。');
      } finally {
        setIsLoading(false);
      }
    };

    loadAndParseTemplate();
  }, [renderPreview]); // 依赖于 renderPreview 函数

  // Effect 2: 当 formData 变化时，重新渲染预览
  useEffect(() => {
    // 避免在初始加载时重复渲染
    if (!isLoading) {
      renderPreview(formData);
    }
  }, [formData, isLoading, renderPreview]);


  // --- Event Handlers ---

  const handleFormChange = (key, value) => {
    setFormData(prevData => ({ ...prevData, [key]: value }));
  };

  const handleExport = async () => {
    if (!originalTemplateRef.current) {
      alert('模板尚未加载，无法导出。');
      return;
    }
    try {
      const blob = await fillTemplate(originalTemplateRef.current, formData);
      saveAs(blob, '评估报告.docx');
    } catch (err) {
      alert(`导出失败: ${err.message || '未知错误'}`);
    }
  };

  // --- JSX ---

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Word 报告编辑器</h2>

      <div className={styles.layout}>
        {/* 左侧表单面板 */}
        <div className={styles.formPanel}>
          <h3>字段编辑</h3>
          {placeholders.length > 0 ? (
            placeholders.map(key => (
              <div key={key} className={styles.formRow}>
                <label htmlFor={key}>{key}：</label>
                <input
                  id={key}
                  type="text"
                  value={formData[key] || ''}
                  onChange={(e) => handleFormChange(key, e.target.value)}
                  className={styles.controlInput}
                  placeholder={`请输入 ${key}`}
                />
              </div>
            ))
          ) : (
            !isLoading && <p>在模板中未检测到占位符。</p>
          )}
          <div className={styles.buttonGroup}>
            <button onClick={handleExport} className={styles.exportBtn} disabled={isLoading}>
              📥 导出 Word 文档
            </button>
            <button onClick={() => window.location.reload()} className={styles.resetBtn}>
              🔄 重置
            </button>
          </div>
        </div>

        {/* 右侧文档预览 */}
        <div className={styles.previewPanel}>
          <div className={styles.panelHeader}>
            <h3>文档预览</h3>
            {/* 移除了点击提示，因为我们不再直接操作DOM添加点击事件 */}
          </div>
          
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>正在加载文档...</p>
            </div>
          ) : (
            <div className={styles.docxContainer}>
              <div ref={previewRef} className={styles.docxViewer} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordEditing;