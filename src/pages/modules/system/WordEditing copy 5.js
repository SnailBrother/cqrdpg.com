import React, { useState, useEffect, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { renderAsync } from 'docx-preview';
import styles from './WordEditing.module.css';
// 引入共享上下文
import { useShareExcelWordData } from '../../../context/ShareExcelWordData';

// 定义特殊标记
const START_DELIMITER = '__START__';
const END_DELIMITER = '__END__';

// 气泡输入框组件 - 支持自适应宽度
const BubbleInput = ({ value, onChange, onClose, position }) => {
  const inputRef = useRef(null);
  const isMouseClick = useRef(false);
  const hiddenSpanRef = useRef(null);

  const calculateInputWidth = useCallback(() => {
    if (!hiddenSpanRef.current || !inputRef.current) return 200;

    const text = value || '';
    hiddenSpanRef.current.textContent = text || ' ';
    const measuredWidth = hiddenSpanRef.current.offsetWidth;

    const minWidth = 150;
    const maxWidth = 400;
    let finalWidth = measuredWidth + 40;

    if (finalWidth < minWidth) finalWidth = minWidth;
    else if (finalWidth > maxWidth) finalWidth = maxWidth;

    return finalWidth;
  }, [value]);

  const [inputWidth, setInputWidth] = useState(200);

  useEffect(() => {
    setInputWidth(calculateInputWidth());

    if (inputRef.current) {
      inputRef.current.focus();
      const timer = setTimeout(() => {
        if (!isMouseClick.current) {
          const length = value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [value, calculateInputWidth]);

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
      <span
        ref={hiddenSpanRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre',
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: 'normal',
          padding: '6px 12px',
        }}
      />

      <div
        className={styles.bubbleInputContainer}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          transform: 'translateX(-50%)',
          width: `${inputWidth}px`,
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
            if (e.key === 'Enter' || e.key === 'Escape') {
              onClose();
            }
          }}
          className={styles.bubbleInput}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '100%', minWidth: '100%', boxSizing: 'border-box' }}
        />
      </div>
    </>
  );
};

const WordEditing = ({
  templateType = '住宅',
  hasFurnitureElectronics = false,
  isPreviewMode = false,
  onClose = null,
  onSave = null
}) => {
  // 使用共享上下文替代 initialData
  const { formData: sharedFormData, setFormData: setSharedFormData } = useShareExcelWordData();

  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [placeholders, setPlaceholders] = useState([]);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });

  const previewRef = useRef(null);
  const originalTemplateRef = useRef(null);
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

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
  const getTemplatePath = () => {
    if (templateType === '商业') {
      return '/test.docx';
    } else {
      return hasFurnitureElectronics
        ? '/test.docx'
        : '/test.docx';
    }
  };
  // const getTemplatePath = () => {
  //   if (templateType === '商业') {
  //     return '/backend/public/webreports/结果报告-单套商业-无家具家电.docx';
  //   } else {
  //     return hasFurnitureElectronics
  //       ? '/backend/public/webreports/结果报告-单套住宅-有家具家电.docx'
  //       : '/backend/public/webreports/结果报告-单套住宅-无家具家电.docx';
  //   }
  // };

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

  const processInitialData = (data) => {
    if (!data) return {};

    const allData = {
      documentNo: data.entrustment?.documentNo || '',
      entrustDate: formatChineseDateFirstType(data.entrustment?.entrustDate),
      entrustingParty: data.entrustment?.entrustingParty || '',
      assessmentCommissionDocument: data.entrustment?.assessmentCommissionDocument || '',
      valueDateRequirements: data.entrustment?.valueDateRequirements || '',
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
      mortgageStatus: data.equityStatus?.mortgageStatus || false,
      mortgageBasis: data.equityStatus?.mortgageBasis || '',
      seizureStatus: data.equityStatus?.seizureStatus || false,
      seizureBasis: data.equityStatus?.seizureBasis || '',
      utilizationStatus: data.equityStatus?.utilizationStatus || '',
      isLeaseConsidered: data.equityStatus?.isLeaseConsidered || false,
    };

    const buildingArea = parseFloat(data.property?.buildingArea) || 0;
    const valuationPrice = parseFloat(data.result?.valuationPrice) || 0;
    const furniturePrice = parseFloat(data.result?.furnitureElectronicsEstimatedPrice) || 0;

    allData.totalValuationPrice = buildingArea > 0 && valuationPrice > 0
      ? Math.round((buildingArea * valuationPrice) / 10000 * 100) / 100
      : 0;

    allData.totalValuationPriceChinese = buildingArea > 0 && valuationPrice > 0
      ? convertCurrency(Math.round((buildingArea * valuationPrice) / 100) * 100)
      : '零';

    if (data.result?.hasFurnitureElectronics) {
      allData.furnitureElectronicsEstimatedPriceChinese = convertCurrency(
        Math.round(furniturePrice / 100) * 100
      );

      const totalWithFurniture = buildingArea * valuationPrice + furniturePrice;
      allData.totalValuationPriceWithFurniture = Math.round((totalWithFurniture / 10000) * 100) / 100;
      allData.totalValuationPriceWithFurnitureChinese = convertCurrency(
        Math.round(totalWithFurniture / 100) * 100
      );
    }

    return allData;
  };

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
            const rect = e.target.getBoundingClientRect();
            const containerRect = previewRef.current.getBoundingClientRect();
            setBubblePosition({
              top: rect.top - containerRect.top + rect.height + 8,
              left: rect.left - containerRect.left + rect.width / 2
            });
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

  // 初始化：加载模板并处理共享数据
  useEffect(() => {
    const loadAndParseTemplate = async () => {
      try {
        setIsLoading(true);

        const templatePath = getTemplatePath();
        const response = await fetch(templatePath);
        if (!response.ok) throw new Error(`模板加载失败: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        originalTemplateRef.current = arrayBuffer;

        const text = (await mammoth.extractRawText({ arrayBuffer })).value;
        const placeholderRegex = /\{(\w+)\}/g;
        const foundPlaceholders = [...new Set(Array.from(text.matchAll(placeholderRegex), match => match[1]))];

        // 使用共享上下文中的数据
        const processedData = processInitialData(sharedFormData);

        if (foundPlaceholders.length > 0) {
          setPlaceholders(foundPlaceholders);
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
  }, [templateType, hasFurnitureElectronics, sharedFormData]); // 注意依赖项包含 sharedFormData

  useEffect(() => {
    if (!isLoading) {
      renderPreview(formData);
    }
  }, [formData, isLoading, renderPreview]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingKey && previewRef.current) {
        const bubbleInput = document.querySelector(`.${styles.bubbleInputContainer}`);
        const bubbleInputInput = document.querySelector(`.${styles.bubbleInput}`);

        const isClickInsideBubble = bubbleInput && bubbleInput.contains(e.target);
        const isClickInsideInput = bubbleInputInput && bubbleInputInput.contains(e.target);

        if (!isClickInsideBubble && !isClickInsideInput) {
          handleBubbleInputConfirm();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingKey, editingValue]);

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && editingKey) {
        setEditingKey(null);
        setEditingValue('');
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [editingKey]);

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

  const handleSave = () => {
    if (onSave) {
      // 如果需要反向转换，可在此处实现 reverseProcessData
      onSave(formData);
    }
    // 可选：同步回共享上下文
    // setSharedFormData(formData); // 若需全局同步可取消注释
  };

  const reverseProcessData = (templateData) => {
    return templateData;
  };

  return (
    <div className={styles.container}>
      <div className={styles.topActionBar}>
        {isPreviewMode && (
          <div className={styles.previewHeader}>
            <h2 className={styles.title}>预览 - {templateType}</h2>
            {onClose && (
              <button className={styles.closeButton} onClick={onClose}>×</button>
            )}
          </div>
        )}
        {!isPreviewMode && <h2 className={styles.title}>Word 报告编辑器</h2>}
        <div className={styles.actionButtons}>
          <button onClick={handleExport} className={styles.exportBtn} disabled={isLoading}>
            📥 导出 Word
          </button>
          {isPreviewMode && onSave && (
            <button onClick={handleSave} className={styles.saveBtn}>
              💾 保存
            </button>
          )}
        </div>
      </div>

      <div className={styles.contentArea}>
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