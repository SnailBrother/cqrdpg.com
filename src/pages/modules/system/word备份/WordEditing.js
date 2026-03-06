import React, { useState, useEffect, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { renderAsync } from 'docx-preview';
import styles from './WordEditing.module.css';
import { useShareExcelWordData } from '../../../context/ShareExcelWordData'; // 👈 引入上下文 Hook

const START_DELIMITER = '__START__';
const END_DELIMITER = '__END__';

const WordEditing = () => {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [placeholders, setPlaceholders] = useState([]);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  const previewRef = useRef(null);
  const originalTemplateRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const formDataRef = useRef(formData);
  const editingInputRef = useRef(null);

  const { state: excelState } = useShareExcelWordData(); // 👈 获取共享数据

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const fillTemplateForPreview = async (arrayBuffer, data) => {
    try {
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '',
      });
      const templaterData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key] || '[空]';
          const marker = `${START_DELIMITER}${JSON.stringify({ key })}${END_DELIMITER}`;
          templaterData[key] = `${marker}${value}${marker}`;
        }
      }
      doc.render(templaterData);
      return doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    } catch (error) {
      throw error;
    }
  };

  const attachPlaceholderListeners = useCallback(() => {
    if (!previewRef.current || !scrollContainerRef.current) return;

    const existingInputs = scrollContainerRef.current.querySelectorAll(`.${styles.inlineEditor}`);
    existingInputs.forEach(el => el.remove());

    const regex = new RegExp(`${START_DELIMITER}(.*?)${END_DELIMITER}(.*?)${START_DELIMITER}(\\1)${END_DELIMITER}`, 'g');
    const walker = document.createTreeWalker(previewRef.current, NodeFilter.SHOW_TEXT, null, false);
    const nodesToProcess = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue?.includes(START_DELIMITER)) {
        nodesToProcess.push(node);
      }
    }

    nodesToProcess.forEach(textNode => {
      const parent = textNode.parentNode;
      if (!parent || ['STYLE', 'SCRIPT'].includes(parent.nodeName)) return;

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

            const scrollTop = scrollContainerRef.current.scrollTop;
            const scrollContainer = scrollContainerRef.current;
            const spanRect = span.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();

            const input = document.createElement('input');
            input.type = 'text';
            input.value = formDataRef.current[key] || '';
            input.className = styles.inlineEditor;
            editingInputRef.current = input;

            input.style.position = 'absolute';
            input.style.left = `${spanRect.left - containerRect.left + scrollContainer.scrollLeft}px`;
            input.style.top = `${spanRect.top - containerRect.top + scrollContainer.scrollTop}px`;
            input.style.width = `${spanRect.width + 4}px`;
            input.style.height = `${spanRect.height}px`;

            const computedStyle = window.getComputedStyle(span);
            input.style.fontSize = computedStyle.fontSize;
            input.style.fontFamily = computedStyle.fontFamily;
            input.style.fontWeight = computedStyle.fontWeight;
            input.style.lineHeight = computedStyle.lineHeight;
            input.style.letterSpacing = computedStyle.letterSpacing;
            input.style.color = computedStyle.color;
            input.style.margin = '0';
            input.style.padding = '0 2px';
            input.style.border = '2px solid #1890ff';
            input.style.background = '#f0faff';
            input.style.zIndex = '10';
            input.style.outline = 'none';
            input.style.borderRadius = '3px';
            input.style.boxSizing = 'content-box';

            input.focus();

            const cleanup = () => {
              if (input.parentNode) {
                input.parentNode.removeChild(input);
              }
              editingInputRef.current = null;
            };

            const saveValue = () => {
              const newValue = input.value;
              const oldValue = formDataRef.current[key] || '';
              if (newValue !== oldValue) {
                setTimeout(() => {
                  handleFormChange(key, newValue);
                }, 0);
              }
              cleanup();
              setTimeout(() => {
                scrollContainerRef.current.scrollTop = scrollTop;
              }, 10);
            };

            input.addEventListener('blur', saveValue);
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                cleanup();
                setTimeout(() => {
                  scrollContainerRef.current.scrollTop = scrollTop;
                }, 10);
              }
            });

            scrollContainer.appendChild(input);
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
  }, []);

  const renderPreview = useCallback(async (data, preserveScroll = false) => {
    if (!previewRef.current || !originalTemplateRef.current) return;

    try {
      const scrollTop = scrollContainerRef.current?.scrollTop || 0;

      if (editingInputRef.current && editingInputRef.current.parentNode) {
        const input = editingInputRef.current;
        const key = input.dataset.key;
        if (key) {
          const newValue = input.value;
          const oldValue = formDataRef.current[key] || '';
          if (newValue !== oldValue) {
            handleFormChange(key, newValue);
          }
        }
      }

      const filledDocBlob = await fillTemplateForPreview(originalTemplateRef.current, data);
      previewRef.current.innerHTML = '';

      await renderAsync(filledDocBlob, previewRef.current, null, {
        className: styles.docxViewer,
        inWrapper: true,
      });
      attachPlaceholderListeners();

      if (preserveScroll && scrollContainerRef.current) {
        setTimeout(() => {
          scrollContainerRef.current.scrollTop = scrollTop;
        }, 50);
      }
    } catch (error) {
      console.error('预览渲染失败:', error);
    }
  }, [attachPlaceholderListeners]);

  // 👇 新增：从 Excel 数据中查找匹配的值
  const getInitialValueFromExcel = (placeholderKey) => {
    // 先查 customCellValues（用户编辑过的）
    for (const [addrKey, cell] of Object.entries(excelState.customCellValues)) {
      const namedRangeName = excelState.addressToNamedRangeMap[addrKey];
      if (namedRangeName === placeholderKey) {
        return cell.displayValue || cell.value || '';
      }
    }

    // 再查 fullWorkbookData（原始加载的数据）
    for (const [addrKey, cell] of Object.entries(excelState.fullWorkbookData)) {
      const namedRangeName = excelState.addressToNamedRangeMap[addrKey];
      if (namedRangeName === placeholderKey) {
        return cell.displayValue || cell.value || '';
      }
    }

    return ''; // 未找到则为空
  };

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

          // 👇 构建初始 formData，优先从 Excel 数据中取值
          const initialFormData = {};
          foundPlaceholders.forEach(key => {
            initialFormData[key] = getInitialValueFromExcel(key);
          });

          setFormData(initialFormData);
        } else {
          await renderPreview({});
        }
      } catch (err) {
        console.error('加载或解析模板失败:', err);
        alert('模板加载失败，请确保 public/test.docx 存在。');
      } finally {
        setIsLoading(false);
      }
    };
    loadAndParseTemplate();
  }, []); // 注意：这里不依赖 excelState，因为 Excel 数据可能异步加载

  // 👇 监听 Excel 数据变化，自动同步到 Word 表单（可选增强）
  useEffect(() => {
    if (!isLoading && placeholders.length > 0) {
      // 只更新那些尚未被用户手动修改过的字段（可选策略）
      // 这里我们选择：只要 Excel 有新值，就覆盖（除非用户正在编辑）
      if (!editingInputRef.current) {
        const updatedData = { ...formData };
        let hasChange = false;
        placeholders.forEach(key => {
          const excelValue = getInitialValueFromExcel(key);
          if (excelValue !== formData[key]) {
            updatedData[key] = excelValue;
            hasChange = true;
          }
        });
        if (hasChange) {
          setFormData(updatedData);
        }
      }
    }
  }, [excelState.customCellValues, excelState.fullWorkbookData, excelState.addressToNamedRangeMap, isLoading, placeholders]);

  // 防抖渲染
  useEffect(() => {
    if (!isLoading && originalTemplateRef.current) {
      const timer = setTimeout(() => {
        if (!editingInputRef.current) {
          renderPreview(formData, true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData, isLoading, renderPreview]);

  const handleExport = async () => {
    if (!originalTemplateRef.current) return;
    try {
      const zip = new PizZip(originalTemplateRef.current);
      const doc = new Docxtemplater(zip, { nullGetter: () => '' });
      doc.render(formData);
      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(blob, '评估报告.docx');
    } catch (err) {
      alert(`导出失败: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>Word 报告编辑器</h2>
        <div className={styles.topButtons}>
          <button onClick={handleExport} className={styles.exportBtn} disabled={isLoading}>
            📥 导出 Word
          </button>
          <button onClick={() => window.location.reload()} className={styles.resetBtn}>
            🔄 重置
          </button>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={`${styles.formPanel} ${isFormCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.formHeader}>
            <h3>字段</h3>
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
              !isLoading && <p className={styles.noPlaceholders}>在模板中未检测到占位符。</p>
            )}
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
            <div ref={scrollContainerRef} className={styles.docxContainer}>
              <div ref={previewRef} className={styles.docxViewer} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordEditing;