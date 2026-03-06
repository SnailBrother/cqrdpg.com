import React, { useState, useEffect, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { renderAsync } from 'docx-preview';
import styles from './WordEditing.module.css';

// 定义特殊标记，这是实现免费双向绑定的核心
const START_DELIMITER = '__START__';
const END_DELIMITER = '__END__';

const WordEditing = () => {
  // --- State Management ---
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [placeholders, setPlaceholders] = useState([]);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  
  // --- Refs ---
  const previewRef = useRef(null);
  const originalTemplateRef = useRef(null);
  
  // 【核心修正】创建一个 ref 来同步最新的 formData，用于在回调中安全地访问，以斩断依赖循环。
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // --- Core Functions ---

  const handleFormChange = (key, value) => {
    setFormData(prevData => ({ ...prevData, [key]: value }));
  };

  /**
   * 为预览填充模板 (注入特殊标记)
   */
  const fillTemplateForPreview = async (arrayBuffer, data) => {
    try {
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter: () => '' });
      const templaterData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key] || `[空]`;
          const marker = `${START_DELIMITER}${JSON.stringify({ key })}${END_DELIMITER}`;
          templaterData[key] = `${marker}${value}${marker}`;
        }
      }
      doc.render(templaterData);
      return doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    } catch (error) { throw error; }
  };

  /**
   * “复活”占位符：在DOM中查找标记并重建为可点击元素
   * 【修正】依赖数组为空，函数变为稳定，内部通过 ref 获取最新 state。
   */
  const attachPlaceholderListeners = useCallback(() => {
    if (!previewRef.current) return;

    const regex = new RegExp(`${START_DELIMITER}(.*?)${END_DELIMITER}(.*?)${START_DELIMITER}(\\1)${END_DELIMITER}`, 'g');
    const walker = document.createTreeWalker(previewRef.current, NodeFilter.SHOW_TEXT, null, false);
    const nodesToProcess = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.nodeValue?.includes(START_DELIMITER)) {
            nodesToProcess.push(node);
        }
    }

    nodesToProcess.forEach(textNode => {
        const parent = textNode.parentNode;
        if (!parent || parent.nodeName === 'STYLE' || parent.nodeName === 'SCRIPT') return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        const text = textNode.nodeValue;

        text.replace(regex, (match, json, value, _, offset) => {
            if (offset > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, offset)));
            }
            try {
                const { key } = JSON.parse(json);
                const span = document.createElement('span');
                span.textContent = value;
                span.className = styles.placeholderHighlight;
                span.dataset.key = key;
                span.onclick = (e) => {
                  e.stopPropagation();
                  // 【修正】从 ref 获取最新值，而不是依赖 state
                  const currentValue = formDataRef.current[key] || '';
                  const newValue = prompt(`编辑 ${key}:`, currentValue);
                  if (newValue !== null && newValue !== currentValue) {
                    handleFormChange(key, newValue);
                  }
                };
                fragment.appendChild(span);
            } catch (e) {
                fragment.appendChild(document.createTextNode(match));
            }
            lastIndex = offset + match.length;
            return match;
        });

        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }
        if (fragment.childNodes.length > 0) {
            parent.replaceChild(fragment, textNode);
        }
    });
  }, []); // 空依赖数组是打破循环的关键！

  /**
   * 渲染预览
   * 【修正】现在依赖于一个稳定的 attachPlaceholderListeners 函数。
   */
  const renderPreview = useCallback(async (data) => {
    if (!previewRef.current || !originalTemplateRef.current) return;
    try {
      const filledDocBlob = await fillTemplateForPreview(originalTemplateRef.current, data);
      await renderAsync(filledDocBlob, previewRef.current, null, { className: styles.docxViewer, inWrapper: true });
      attachPlaceholderListeners();
    } catch (error) { console.error('预览渲染失败:', error); }
  }, [attachPlaceholderListeners]);

  // --- Effects ---
  
  // Effect 1: 组件首次加载时，执行一次初始化
  useEffect(() => {
    const loadAndParseTemplate = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/test.docx');
        if (!response.ok) throw new Error('网络响应错误');
        const arrayBuffer = await response.arrayBuffer();
        originalTemplateRef.current = arrayBuffer;

        const text = (await mammoth.extractRawText({ arrayBuffer })).value;
        const placeholderRegex = /\{(\w+)\}/g;
        const foundPlaceholders = [...new Set(Array.from(text.matchAll(placeholderRegex), match => match[1]))];
        
        if (foundPlaceholders.length > 0) {
          setPlaceholders(foundPlaceholders);
          const initialFormData = foundPlaceholders.reduce((acc, key) => ({ ...acc, [key]: '' }), {});
          setFormData(initialFormData); // 这会触发下面的 effect 来进行初始渲染
        } else {
          await renderPreview({}); // 如果没占位符，直接渲染一次
        }
      } catch (err) {
        console.error('加载或解析模板失败:', err);
        alert('模板加载失败，请确保 public/test.docx 存在。');
      } finally {
        setIsLoading(false);
      }
    };
    loadAndParseTemplate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 确保这个 effect 只在挂载时运行一次

  // Effect 2: 当 formData 变化时，重新渲染预览 (现在是安全的)
  useEffect(() => {
    // 初始加载时 isLoading 为 true，会跳过此次执行，避免与上一个 effect 重复渲染
    if (!isLoading) {
      renderPreview(formData);
    }
  }, [formData, isLoading, renderPreview]);

  // --- Event Handlers ---
  
  const handleExport = async () => {
    if (!originalTemplateRef.current) return;
    try {
      const zip = new PizZip(originalTemplateRef.current);
      const doc = new Docxtemplater(zip, { nullGetter: () => '' });
      doc.render(formData);
      const blob = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, '评估报告.docx');
    } catch (err) { alert(`导出失败: ${err.message}`); }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Word 报告编辑器</h2>
      <div className={styles.layout}>
        <div className={`${styles.formPanel} ${isFormCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.formHeader}>
            <h3>字段编辑</h3>
            <button 
              className={styles.collapseButton} 
              onClick={() => setIsFormCollapsed(!isFormCollapsed)}
              title={isFormCollapsed ? '展开' : '折叠'}
            >
              <svg viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" fill="currentColor"></path>
              </svg>
            </button>
          </div>
          <div className={styles.formBody}>
            {placeholders.length > 0 ? (
              placeholders.map(key => (
                <div key={key} className={styles.formRow}>
                  <label htmlFor={key}>{key}：</label>
                  <input
                    id={key} type="text" value={formData[key] || ''}
                    onChange={(e) => handleFormChange(key, e.target.value)}
                    className={styles.controlInput} placeholder={`请输入 ${key}`}
                  />
                </div>
              ))
            ) : (
              !isLoading && <p className={styles.noPlaceholders}>在模板中未检测到占位符。</p>
            )}
            <div className={styles.buttonGroup}>
              <button onClick={handleExport} className={styles.exportBtn} disabled={isLoading}>📥 导出 Word</button>
              <button onClick={() => window.location.reload()} className={styles.resetBtn}>🔄 重置</button>
            </div>
          </div>
        </div>

        <div className={styles.previewPanel}>
          <div className={styles.panelHeader}>
            <h3>文档预览</h3>
            <span className={styles.hint}>
              提示：可直接点击文档中 <span className={styles.hintHighlight}>高亮</span> 的字段进行编辑。
            </span>
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