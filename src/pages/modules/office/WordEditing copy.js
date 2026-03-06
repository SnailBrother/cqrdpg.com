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

const WordEditing = ({ 
  initialData = null,          // 从WordReportGenerator传递过来的数据
  templateType = '住宅',       // 模板类型：住宅/商业
  hasFurnitureElectronics = false, // 是否有家具家电
  isPreviewMode = false,      // 是否为预览模式
  onClose = null              // 关闭回调（预览模式下使用）
}) => {
  // --- State Management ---
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [placeholders, setPlaceholders] = useState([]);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  
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
  const getTemplatePath = () => {
    if (templateType === '商业') {
      return '/test.docx';
    } else {
      return hasFurnitureElectronics
        ? '/test.docx'
        : '/test.docx';
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

  // --- JSX ---

  return (
    <div className={styles.container}>
      {isPreviewMode && (
        <div className={styles.previewHeader}>
          <h2 className={styles.title}>报告预览 - {templateType}模板</h2>
          {onClose && (
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          )}
        </div>
      )}
      
      {!isPreviewMode && <h2 className={styles.title}>Word 报告编辑器</h2>}
      
      <div className={styles.layout}>
        {/* 左侧表单面板 */}
        <div className={`${styles.formPanel} ${isFormCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.formHeader}>
            <h3>字段编辑</h3>
            {!isPreviewMode && (
              <button 
                className={styles.collapseButton} 
                onClick={() => setIsFormCollapsed(!isFormCollapsed)}
                title={isFormCollapsed ? '展开' : '折叠'}
              >
                <svg viewBox="0 0 1024 1024" width="16" height="16">
                  <path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" fill="currentColor"></path>
                </svg>
              </button>
            )}
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
            
            <div className={styles.buttonGroup}>
              <button onClick={handleExport} className={styles.exportBtn} disabled={isLoading}>
                📥 导出 Word
              </button>
              {!isPreviewMode && (
                <button onClick={() => window.location.reload()} className={styles.resetBtn}>
                  🔄 重置
                </button>
              )}
              {isPreviewMode && onClose && (
                <button onClick={onClose} className={styles.closeBtn}>
                  关闭
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 右侧文档预览 */}
        <div className={styles.previewPanel}>
          <div className={styles.panelHeader}>
            <h3>文档预览</h3>
            {!isPreviewMode && (
              <span className={styles.hint}>
                提示：可直接点击文档中 <span className={styles.hintHighlight}>高亮</span> 的字段进行编辑。
              </span>
            )}
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