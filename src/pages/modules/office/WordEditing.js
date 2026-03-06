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

// 气泡输入框组件
// 修改气泡输入框组件
// 修改气泡输入框组件
// 气泡输入框组件 - 支持自适应宽度
const BubbleInput = ({ value, onChange, onClose, position }) => {
  const inputRef = useRef(null);
  const isMouseClick = useRef(false);
  const hiddenSpanRef = useRef(null);

  // 计算输入框宽度
  const calculateInputWidth = useCallback(() => {
    if (!hiddenSpanRef.current || !inputRef.current) return 200; // 默认宽度

    // 获取文本内容
    const text = value || '';

    // 设置到隐藏的span中来测量宽度
    hiddenSpanRef.current.textContent = text || ' ';

    // 获取测量后的宽度，并加上一些边距
    const measuredWidth = hiddenSpanRef.current.offsetWidth;

    // 设置最小和最大宽度
    const minWidth = 150;
    const maxWidth = 400;

    // 计算最终宽度，确保在合理范围内
    let finalWidth = measuredWidth + 40; // 加上一些边距

    if (finalWidth < minWidth) {
      finalWidth = minWidth;
    } else if (finalWidth > maxWidth) {
      finalWidth = maxWidth;
    }

    return finalWidth;
  }, [value]);

  // 输入框宽度
  const [inputWidth, setInputWidth] = useState(200);

  useEffect(() => {
    // 组件挂载时计算初始宽度
    setInputWidth(calculateInputWidth());

    if (inputRef.current) {
      inputRef.current.focus();

      // 延迟设置光标到末尾
      const timer = setTimeout(() => {
        if (!isMouseClick.current) {
          const length = value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [value, calculateInputWidth]);

  // 监听输入内容变化，动态调整宽度
  useEffect(() => {
    setInputWidth(calculateInputWidth());
  }, [value, calculateInputWidth]);

  const handleMouseDown = (e) => {
    isMouseClick.current = true;
    e.stopPropagation();
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      isMouseClick.current = false;
    }, 100);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <>
      {/* 隐藏的span用于测量文本宽度 */}
      <span
        ref={hiddenSpanRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre',
          fontFamily: 'inherit',
          fontSize: '14px', // 与输入框字体大小一致
          fontWeight: 'normal',
          padding: '6px 12px', // 与输入框内边距一致
        }}
      />

      <div
        className={styles.bubbleInputContainer}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          transform: 'translateX(-50%)',
          width: `${inputWidth}px`, // 动态宽度
        }}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.bubbleInputArrow} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onClose();
            }
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          className={styles.bubbleInput}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', // 使用100%宽度填充容器
            minWidth: '100%',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </>
  );
};

const WordEditing = ({
  initialData = null,          // 从WordReportGenerator传递过来的数据
  templateType = '住宅',       // 模板类型：住宅/商业
  hasFurnitureElectronics = false, // 是否有家具家电
  isPreviewMode = false,      // 是否为预览模式
  onClose = null,             // 关闭回调（预览模式下使用）
  onSave = null               // 新增：保存回调，用于将数据传回WordReportGenerator
}) => {
  // --- State Management ---
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [placeholders, setPlaceholders] = useState([]);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });

  // --- Refs ---
  const previewRef = useRef(null);
  const originalTemplateRef = useRef(null);

  // 创建一个 ref 来同步最新的 formData，用于在回调中安全地访问
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // --- Core Functions ---

  const handleFormChange = (key, value) => {
    setFormData(prevData => ({ ...prevData, [key]: value }));
  };

  const handleBubbleInputConfirm = () => {
    if (editingKey && editingValue !== formDataRef.current[editingKey]) {
      handleFormChange(editingKey, editingValue);
    }
    setEditingKey(null);
    setEditingValue('');
  };

  /**
   * 为预览填充模板 (注入特殊标记)
   */
  const fillTemplateForPreview = async (arrayBuffer, data) => {
    try {
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => ''
      });

      const templaterData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key] || `[空]`;
          const marker = `${START_DELIMITER}${JSON.stringify({ key })}${END_DELIMITER}`;
          templaterData[key] = `${marker}${value}${marker}`;
        }
      }

      doc.render(templaterData);
      return doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    } catch (error) {
      console.error('模板填充失败:', error);
      throw error;
    }
  };

  /**
   * 获取模板文件路径
   */
  // const getTemplatePath = () => {
  //   if (templateType === '商业') {
  //     return '/test.docx';
  //   } else {
  //     return hasFurnitureElectronics
  //       ? '/test.docx'
  //       : '/test.docx';
  //   }
  // };

  const getTemplatePath = () => {
    if (templateType === '商业') {
      return '/backend/public/webreports/结果报告-单套商业-无家具家电.docx';
    } else {
      return hasFurnitureElectronics
        ? '/backend/public/webreports/结果报告-单套住宅-有家具家电.docx'
        : '/backend/public/webreports/结果报告-单套住宅-无家具家电.docx';
    }
  };

  /**
   * 数字转中文大写金额
   */
  const convertCurrency = (money) => {
    if (isNaN(money)) return '零';
    if (money === 0) return '零';

    const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const cnIntRadice = ['', '拾', '佰', '仟'];
    const cnIntUnits = ['', '万', '亿', '兆'];
    const cnDecUnits = ['角', '分', '毫', '厘'];

    const maxNum = 999999999999999.9999;
    let integerNum;
    let decimalNum;
    let chineseStr = '';
    let parts;

    if (money >= maxNum) return '超出处理范围';
    if (money === 0) return '零';

    money = money.toString();
    if (money.indexOf('.') === -1) {
      integerNum = money;
      decimalNum = '';
    } else {
      parts = money.split('.');
      integerNum = parts[0];
      decimalNum = parts[1].substr(0, 4);
    }

    if (parseInt(integerNum, 10) > 0) {
      let zeroCount = 0;
      const IntLen = integerNum.length;
      for (let i = 0; i < IntLen; i++) {
        const n = integerNum.substr(i, 1);
        const p = IntLen - i - 1;
        const q = p / 4;
        const m = p % 4;
        if (n === '0') {
          zeroCount++;
        } else {
          if (zeroCount > 0) chineseStr += cnNums[0];
          zeroCount = 0;
          chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
        }
        if (m === 0 && zeroCount < 4) chineseStr += cnIntUnits[q];
      }
    }

    if (decimalNum !== '') {
      const decLen = decimalNum.length;
      for (let i = 0; i < decLen; i++) {
        const n = decimalNum.substr(i, 1);
        if (n !== '0') chineseStr += cnNums[Number(n)] + cnDecUnits[i];
      }
    }

    return chineseStr || '零';
  };

  /**
   * 日期转换函数
   */
  const formatChineseDateFirstType = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const chineseNumbers = ['○', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const monthNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    const dayNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十', '三十一'];

    let chineseYear = '';
    if (year >= 2000 && year < 2100) {
      chineseYear = `二○${chineseNumbers[year % 100 / 10 | 0]}${chineseNumbers[year % 10]}`;
    } else {
      const yearStr = year.toString();
      for (let i = 0; i < yearStr.length; i++) {
        chineseYear += chineseNumbers[parseInt(yearStr[i])];
      }
    }

    return `${chineseYear}年${monthNames[month - 1]}月${dayNames[day - 1]}日`;
  };

  const formatChineseDateSecondType = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  /**
   * 处理初始数据，转换为模板需要的格式
   */
  const processInitialData = (data) => {
    if (!data) return {};

    const allData = {
      // 委托信息
      documentNo: data.entrustment?.documentNo || '',
      entrustDate: formatChineseDateFirstType(data.entrustment?.entrustDate),
      entrustingParty: data.entrustment?.entrustingParty || '',
      assessmentCommissionDocument: data.entrustment?.assessmentCommissionDocument || '',
      valueDateRequirements: data.entrustment?.valueDateRequirements || '',

      // 产权信息
      location: data.property?.location || '',
      buildingArea: data.property?.buildingArea || '',
      interiorArea: data.property?.interiorArea || '',
      propertyCertificateNo: data.property?.propertyCertificateNo || '',
      housePurpose: data.property?.housePurpose || '',
      propertyUnitNo: data.property?.propertyUnitNo || '',
      rightsHolder: data.property?.rightsHolder || '',
      landPurpose: data.property?.landPurpose || '',
      sharedLandArea: data.property?.sharedLandArea || '',
      landUseRightEndDate: formatChineseDateSecondType(data.property?.landUseRightEndDate),
      houseStructure: data.property?.houseStructure || '',
      coOwnershipStatus: data.property?.coOwnershipStatus || '',
      rightsNature: data.property?.rightsNature || '',

      // 实物状况
      communityName: data.physicalCondition?.communityName || '',
      totalFloors: data.physicalCondition?.totalFloors || '',
      floorNumber: data.physicalCondition?.floorNumber || '',
      elevator: data.physicalCondition?.elevator ? '有' : '无',
      decorationStatus: data.physicalCondition?.decorationStatus || '',
      ventilationStatus: data.physicalCondition?.ventilationStatus ? '' : '未',
      spaceLayout: data.physicalCondition?.spaceLayout || '',
      exteriorWallMaterial: data.physicalCondition?.exteriorWallMaterial || '',
      yearBuilt: data.physicalCondition?.yearBuilt || '',
      boundaries: data.physicalCondition?.boundaries || '',
      bank: data.physicalCondition?.bank || '',
      supermarket: data.physicalCondition?.supermarket || '',
      hospital: data.physicalCondition?.hospital || '',
      school: data.physicalCondition?.school || '',
      nearbyCommunity: data.physicalCondition?.nearbyCommunity || '',
      busStopName: data.physicalCondition?.busStopName || '',
      busRoutes: data.physicalCondition?.busRoutes || '',
      areaRoad: data.physicalCondition?.areaRoad || '',
      landShape: data.physicalCondition?.landShape || '',
      direction: data.physicalCondition?.direction || '',
      distance: data.physicalCondition?.distance || '',
      orientation: data.physicalCondition?.orientation || '',
      streetStatus: data.physicalCondition?.streetStatus || '',
      parkingStatus: data.physicalCondition?.parkingStatus || '',

      // 结果信息
      valueDate: formatChineseDateSecondType(data.result?.valueDate),
      reportDate: formatChineseDateFirstType(data.result?.reportDate),
      valuationMethod: data.result?.valuationMethod || '',
      projectID: data.result?.projectID || '',
      reportID: data.result?.reportID || '',
      valuationPrice: data.result?.valuationPrice || '',
      hasFurnitureElectronics: data.result?.hasFurnitureElectronics || false,
      furnitureElectronicsEstimatedPrice: data.result?.furnitureElectronicsEstimatedPrice || '',
      appraiserA_name: data.result?.appraiserA?.name || '',
      appraiserA_licenseNo: data.result?.appraiserA?.licenseNo || '',
      appraiserB_name: data.result?.appraiserB?.name || '',
      appraiserB_licenseNo: data.result?.appraiserB?.licenseNo || '',
      rent: data.result?.rent || '',

      // 权益状况
      mortgageStatus: data.equityStatus?.mortgageStatus || false,
      mortgageBasis: data.equityStatus?.mortgageBasis || '',
      seizureStatus: data.equityStatus?.seizureStatus || false,
      seizureBasis: data.equityStatus?.seizureBasis || '',
      utilizationStatus: data.equityStatus?.utilizationStatus || '',
      isLeaseConsidered: data.equityStatus?.isLeaseConsidered || false,
    };

    // 添加计算字段
    const buildingArea = parseFloat(data.property?.buildingArea) || 0;
    const valuationPrice = parseFloat(data.result?.valuationPrice) || 0;
    const furniturePrice = parseFloat(data.result?.furnitureElectronicsEstimatedPrice) || 0;

    // 评估总价小写
    allData.totalValuationPrice = buildingArea > 0 && valuationPrice > 0
      ? Math.round((buildingArea * valuationPrice) / 10000 * 100) / 100
      : 0;

    // 评估总价大写
    allData.totalValuationPriceChinese = buildingArea > 0 && valuationPrice > 0
      ? convertCurrency(Math.round((buildingArea * valuationPrice) / 100) * 100)
      : '零';

    // 家具家电评估总价大写
    if (data.result?.hasFurnitureElectronics) {
      allData.furnitureElectronicsEstimatedPriceChinese = convertCurrency(
        Math.round(furniturePrice / 100) * 100
      );

      // 包含家具家电的总评估价
      const totalWithFurniture = buildingArea * valuationPrice + furniturePrice;
      allData.totalValuationPriceWithFurniture = Math.round((totalWithFurniture / 10000) * 100) / 100;
      allData.totalValuationPriceWithFurnitureChinese = convertCurrency(
        Math.round(totalWithFurniture / 100) * 100
      );
    }

    return allData;
  };

  /**
   * "复活"占位符：在DOM中查找标记并重建为可点击元素
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

            // 获取点击位置
            const rect = e.target.getBoundingClientRect();
            const containerRect = previewRef.current.getBoundingClientRect();

            // 设置气泡位置
            setBubblePosition({
              top: rect.top - containerRect.top + rect.height + 8,
              left: rect.left - containerRect.left + rect.width / 2
            });

            // 设置编辑状态
            const currentValue = formDataRef.current[key] || '';
            setEditingKey(key);
            setEditingValue(currentValue);
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

  /**
   * 渲染预览
   */
  const renderPreview = useCallback(async (data) => {
    if (!previewRef.current || !originalTemplateRef.current) return;

    try {
      const filledDocBlob = await fillTemplateForPreview(originalTemplateRef.current, data);
      await renderAsync(filledDocBlob, previewRef.current, null, {
        className: styles.docxViewer,
        inWrapper: true
      });
      attachPlaceholderListeners();
    } catch (error) {
      console.error('预览渲染失败:', error);
    }
  }, [attachPlaceholderListeners]);

  // --- Effects ---

  // Effect 1: 组件首次加载时，执行一次初始化
  useEffect(() => {
    const loadAndParseTemplate = async () => {
      try {
        setIsLoading(true);

        // 获取模板文件
        const templatePath = getTemplatePath();
        const response = await fetch(templatePath);
        if (!response.ok) throw new Error(`模板加载失败: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        originalTemplateRef.current = arrayBuffer;

        // 提取占位符
        const text = (await mammoth.extractRawText({ arrayBuffer })).value;
        const placeholderRegex = /\{(\w+)\}/g;
        const foundPlaceholders = [...new Set(Array.from(text.matchAll(placeholderRegex), match => match[1]))];

        // 处理初始数据
        const processedData = processInitialData(initialData);

        // 设置占位符和表单数据
        if (foundPlaceholders.length > 0) {
          setPlaceholders(foundPlaceholders);

          // 合并默认空值和传递过来的数据
          const initialFormData = foundPlaceholders.reduce((acc, key) => {
            acc[key] = processedData[key] || '';
            return acc;
          }, {});

          setFormData(initialFormData);
        } else {
          setFormData(processedData);
          await renderPreview(processedData);
        }

      } catch (err) {
        console.error('加载或解析模板失败:', err);
        alert(`模板加载失败: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadAndParseTemplate();
  }, [initialData, templateType, hasFurnitureElectronics]);

  // Effect 2: 当 formData 变化时，重新渲染预览
  useEffect(() => {
    if (!isLoading) {
      renderPreview(formData);
    }
  }, [formData, isLoading, renderPreview]);

  // Effect 3: 点击外部关闭气泡输入框
  // 修改点击外部关闭的处理，避免点击输入框内部时关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingKey && previewRef.current) {
        const bubbleInput = document.querySelector(`.${styles.bubbleInputContainer}`);
        const bubbleInputInput = document.querySelector(`.${styles.bubbleInput}`);

        // 检查点击的是否是气泡输入框或输入框
        const isClickInsideBubble = bubbleInput && bubbleInput.contains(e.target);
        const isClickInsideInput = bubbleInputInput && bubbleInputInput.contains(e.target);

        // 如果点击的不是气泡输入框或输入框，则关闭
        if (!isClickInsideBubble && !isClickInsideInput) {
          handleBubbleInputConfirm();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingKey, editingValue]);

  // Effect 4: 按ESC键关闭气泡输入框
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && editingKey) {
        setEditingKey(null);
        setEditingValue('');
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [editingKey]);

  // --- Event Handlers ---

  const handleExport = async () => {
    if (!originalTemplateRef.current) return;

    try {
      const zip = new PizZip(originalTemplateRef.current);
      const doc = new Docxtemplater(zip, { nullGetter: () => '' });
      doc.render(formData);
      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      saveAs(blob, '评估报告.docx');
    } catch (err) {
      alert(`导出失败: ${err.message}`);
    }
  };

  // 添加保存函数
  const handleSave = () => {
    if (onSave) {
      // 将formData转换回原始数据格式（如果需要的话）
      const processedData = reverseProcessData(formData);
      onSave(processedData);
    }
  };

  // 可选：如果需要将模板数据转换回原始格式
  const reverseProcessData = (templateData) => {
    // 这里根据你的数据结构进行反向转换
    // 如果数据结构相同，可以直接返回
    return templateData;
  };

  // --- JSX ---

  return (
    <div className={styles.container}>
      {/* 第一行：顶部操作按钮 */}
      <div className={styles.topActionBar}>
        {isPreviewMode && (
          <div className={styles.previewHeader}>
            <h2 className={styles.title}>预览 - {templateType}</h2>
            {onClose && (
              <button className={styles.closeButton} onClick={onClose}>
                ×
              </button>
            )}
          </div>
        )}

        {!isPreviewMode && <h2 className={styles.title}>Word 报告编辑器</h2>}

        <div className={styles.actionButtons}>
          <button onClick={handleExport} className={styles.exportBtn} disabled={isLoading}>
            📥 导出 Word
          </button>
          {/* 在预览模式下显示保存按钮 */}
          {isPreviewMode && onSave && (
            <button onClick={handleSave} className={styles.saveBtn}>
              💾 保存
            </button>
          )}
        </div>
      </div>

      {/* 第二行：内容区域 */}
      <div className={styles.contentArea}>
        {/* 左侧编辑字段区域 */}
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

        {/* 右侧预览窗口 */}
        <div className={styles.previewPanel}>
          <div className={styles.panelHeader}>
            <h3>文档预览</h3>
            {!isPreviewMode && (
              <span className={styles.hint}>
                提示：可直接点击文档中 <span className={styles.hintHighlight}>高亮</span> 的字段进行编辑。
              </span>
            )}
          </div>

          <div className={styles.previewContent}>
            {isLoading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>正在加载文档...</p>
              </div>
            ) : (
              <>
                <div ref={previewRef} className={styles.docxViewer} />

                {/* 气泡输入框 */}
                {editingKey && (
                  <BubbleInput
                    value={editingValue}
                    onChange={setEditingValue}
                    onClose={handleBubbleInputConfirm}
                    position={bubblePosition}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordEditing;