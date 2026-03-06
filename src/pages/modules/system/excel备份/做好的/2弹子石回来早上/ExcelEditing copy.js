import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import styles from './ExcelEditing.module.css';

const ExcelEditing = () => {
  const [workbook, setWorkbook] = useState(null);
  const [activeSheet, setActiveSheet] = useState('评估明细表');
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellInfo, setCellInfo] = useState({ name: '', value: '', address: '' });
  const [formValues, setFormValues] = useState({
    buildingArea: '',
    valuationPrice: '',
    totalValuationPrice: ''
  });
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const spreadsheetRef = useRef(null);
const handleUploadTemplate = () => {
  fileInputRef.current.click();
};
  // 初始化：加载模板文件
  useEffect(() => {
    
    loadTemplate();
  }, []);

  // 加载模板文件
// 原来的 loadTemplate 函数，修改为：
const loadTemplate = async () => {
  try {
    setIsLoading(true);
    setError('');
    
    // 先尝试从 public 目录加载
    let response;
    try {
      response = await fetch('http://www.cyywork.top/示例.xlsx');
    } catch (fetchError) {
      console.log('直接加载失败，尝试相对路径');
      response = await fetch('示例.xlsx');
    }
    
    if (!response.ok) {
      // 如果文件不存在，直接创建示例工作簿
      console.log('模板文件不存在，创建示例工作簿');
      createSampleWorkbook();
      return;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellFormula: true,
      cellStyles: true,
      cellDates: true
    });
    
    setWorkbook(wb);
    extractFormValues(wb);
    console.log('模板加载成功，工作表:', Object.keys(wb.Sheets));
    
  } catch (error) {
    console.error('加载模板失败:', error);
    // 直接创建示例工作簿，不显示错误
    createSampleWorkbook();
  } finally {
    setIsLoading(false);
  }
};

  // 创建示例工作簿（后备方案）
  const createSampleWorkbook = () => {
    const wb = XLSX.utils.book_new();
    
    // 创建评估明细表
    const assessmentData = [
      ['序号', '建筑面积', '单价', '总价', '备注'],
      [1, 100, 5000, 500000, '示例数据'],
      [2, 150, 6000, 900000, '示例数据'],
      [3, 200, 5500, 1100000, '示例数据'],
      [4, '', '', '', ''],
      [5, '', '', '', ''],
      ['合计', '', '', '=D2+D3+D4', '']
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(assessmentData);
    ws1['!ref'] = 'A1:E7';
    
    // 设置标题行样式
    const titleCells = ['A1', 'B1', 'C1', 'D1', 'E1'];
    titleCells.forEach(cell => {
      if (!ws1[cell]) ws1[cell] = {};
      ws1[cell].s = {
        fill: { fgColor: { rgb: "FF4F46E5" } },
        font: { bold: true, color: { rgb: "FFFFFFFF" } },
        alignment: { horizontal: "center" }
      };
    });
    
    // 设置数字格式
    ws1['B2'] = { v: 100, t: 'n', s: { numFmt: '#,##0.00' } };
    ws1['C2'] = { v: 5000, t: 'n', s: { numFmt: '#,##0.00' } };
    ws1['D2'] = { v: 500000, t: 'n', s: { numFmt: '#,##0.00' } };
    ws1['D6'] = { v: '=SUM(D2:D5)', t: 'n', s: { numFmt: '#,##0.00' } };
    
    // 添加边框
    addBordersToSheet(ws1, 'A1:E7');
    
    XLSX.utils.book_append_sheet(wb, ws1, '评估明细表');
    
    // 添加命名区域
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.Names = [
      { Name: 'buildingArea', Ref: "'评估明细表'!$B$2" },
      { Name: 'valuationPrice', Ref: "'评估明细表'!$C$2" },
      { Name: 'totalValuationPrice', Ref: "'评估明细表'!$D$2" }
    ];
    
    setWorkbook(wb);
    extractFormValues(wb);
  };

  // 添加边框到工作表
  const addBordersToSheet = (ws, rangeStr) => {
    const range = XLSX.utils.decode_range(rangeStr);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.border = {
          top: { style: "thin", color: { rgb: "FFCBD5E1" } },
          bottom: { style: "thin", color: { rgb: "FFCBD5E1" } },
          left: { style: "thin", color: { rgb: "FFCBD5E1" } },
          right: { style: "thin", color: { rgb: "FFCBD5E1" } }
        };
      }
    }
  };

  // 从工作簿提取表单值
  const extractFormValues = (wb) => {
    const values = {};
    
    if (wb.Workbook?.Names) {
      wb.Workbook.Names.forEach(nameObj => {
        const ref = nameObj.Ref;
        const match = ref.match(/'([^']+)'!\$(.)\$(\d+)/);
        if (match) {
          const sheetName = match[1];
          const col = match[2];
          const row = parseInt(match[3]);
          const cellRef = col + row;
          
          const ws = wb.Sheets[sheetName];
          if (ws && ws[cellRef]) {
            values[nameObj.Name] = ws[cellRef].v?.toString() || '';
          }
        }
      });
    }
    
    setFormValues(prev => ({ ...prev, ...values }));
  };

  // 获取单元格信息
  const getCellInfo = (cellAddress) => {
    if (!workbook || !cellAddress) return;
    
    const ws = workbook.Sheets[activeSheet];
    const cell = ws[cellAddress];
    
    // 查找命名区域
    let cellName = '';
    if (workbook.Workbook?.Names) {
      const namedRange = workbook.Workbook.Names.find(n => {
        const ref = n.Ref;
        const match = ref.match(/'([^']+)'!\$(.)\$(\d+)/);
        if (!match) return false;
        const sheetName = match[1];
        const col = match[2];
        const row = parseInt(match[3]);
        return sheetName === activeSheet && `${col}${row}` === cellAddress;
      });
      cellName = namedRange?.Name || '';
    }
    
    setCellInfo({
      name: cellName,
      value: cell?.v?.toString() || '',
      address: cellAddress,
      formula: cell?.f || ''
    });
  };

  // 处理单元格点击
  const handleCellClick = (cellAddress) => {
    setSelectedCell(cellAddress);
    getCellInfo(cellAddress);
    
    // 如果是命名区域的单元格，更新表单值
    const cellName = Object.keys(formValues).find(name => {
      const namedRange = workbook.Workbook?.Names?.find(n => n.Name === name);
      if (!namedRange) return false;
      const match = namedRange.Ref.match(/'([^']+)'!\$(.)\$(\d+)/);
      if (!match) return false;
      return match[1] === activeSheet && `${match[2]}${match[3]}` === cellAddress;
    });
    
    if (cellName) {
      const ws = workbook.Sheets[activeSheet];
      const cell = ws[cellAddress];
      setFormValues(prev => ({
        ...prev,
        [cellName]: cell?.v?.toString() || ''
      }));
    }
  };

  // 处理表单输入变化
  const handleFormChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // 更新工作簿中的单元格值
    if (workbook) {
      const namedRange = workbook.Workbook?.Names?.find(n => n.Name === name);
      if (namedRange) {
        const match = namedRange.Ref.match(/'([^']+)'!\$(.)\$(\d+)/);
        if (match) {
          const sheetName = match[1];
          const col = match[2];
          const row = parseInt(match[3]);
          const cellAddress = col + row;
          
          const ws = workbook.Sheets[sheetName];
          const numValue = parseFloat(value);
          
          if (!ws[cellAddress]) {
            ws[cellAddress] = { 
              v: isNaN(numValue) ? value : numValue, 
              t: isNaN(numValue) ? 's' : 'n' 
            };
          } else {
            // 保留原有的公式
            if (!ws[cellAddress].f) {
              ws[cellAddress].v = isNaN(numValue) ? value : numValue;
              ws[cellAddress].t = isNaN(numValue) ? 's' : 'n';
            }
          }
          
          // 如果是建筑面积或单价变化，更新总价
          if (name === 'buildingArea' || name === 'valuationPrice') {
            const area = parseFloat(name === 'buildingArea' ? value : formValues.buildingArea) || 0;
            const price = parseFloat(name === 'valuationPrice' ? value : formValues.valuationPrice) || 0;
            const total = area * price;
            
            const totalName = 'totalValuationPrice';
            const totalRange = workbook.Workbook?.Names?.find(n => n.Name === totalName);
            if (totalRange && !ws[totalRange.Ref.split('!')[1].replace('$', '')]?.f) {
              const totalMatch = totalRange.Ref.match(/'([^']+)'!\$(.)\$(\d+)/);
              if (totalMatch && totalMatch[1] === sheetName) {
                const totalAddress = totalMatch[2] + totalMatch[3];
                if (!ws[totalAddress]) {
                  ws[totalAddress] = { v: total, t: 'n' };
                } else {
                  ws[totalAddress].v = total;
                  ws[totalAddress].t = 'n';
                }
                
                // 更新表单中的总价
                setFormValues(prev => ({ ...prev, [totalName]: total.toString() }));
              }
            }
          }
          
          setWorkbook({ ...workbook });
          getCellInfo(cellAddress);
        }
      }
    }
  };

  // 保存工作簿
  const saveWorkbook = () => {
    if (!workbook) return;
    
    // 这里可以实现保存到服务器的逻辑
    console.log('保存工作簿:', workbook);
    alert('工作簿已保存（演示功能）');
  };

  // 导出Excel文件
  const exportExcel = useCallback(() => {
    if (!workbook) {
      alert('没有可导出的数据');
      return;
    }

    try {
      // 创建深拷贝以保留所有数据
      const wb = XLSX.utils.book_new();
      
      // 复制所有工作表
      Object.keys(workbook.Sheets).forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        
        // 获取工作表数据范围
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z100');
        
        // 收集所有单元格数据
        const data = [];
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const row = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellRef];
            row.push(cell?.v || '');
          }
          data.push(row);
        }
        
        // 创建新工作表
        const newWs = XLSX.utils.aoa_to_sheet(data);
        
        // 复制样式和公式
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellRef];
            if (cell) {
              if (cell.s) {
                if (!newWs[cellRef]) newWs[cellRef] = {};
                newWs[cellRef].s = { ...cell.s };
              }
              if (cell.f) {
                if (!newWs[cellRef]) newWs[cellRef] = {};
                newWs[cellRef].f = cell.f;
              }
            }
          }
        }
        
        newWs['!ref'] = ws['!ref'];
        XLSX.utils.book_append_sheet(wb, newWs, sheetName);
      });
      
      // 保留命名区域
      if (workbook.Workbook?.Names) {
        wb.Workbook = { Names: [...workbook.Workbook.Names] };
      }
      
      // 导出文件
      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false
      });
      
      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `评估报告_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Excel文件导出成功！');
    } catch (error) {
      console.error('导出文件失败:', error);
      alert(`导出失败: ${error.message}`);
    }
  }, [workbook]);

  // 上传新模板
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.some(type => file.type.includes(type))) {
      alert('请上传Excel文件 (.xlsx 或 .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setIsLoading(true);
        const wb = XLSX.read(e.target.result, { 
          type: 'array',
          cellFormula: true,
          cellStyles: true
        });
        
        setWorkbook(wb);
        setActiveSheet(Object.keys(wb.Sheets)[0]);
        extractFormValues(wb);
        setSelectedCell(null);
        setCellInfo({ name: '', value: '', address: '' });
      } catch (error) {
        console.error('解析Excel文件失败:', error);
        alert('文件解析失败，请检查文件格式');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  // 渲染工作表
  const renderSpreadsheet = () => {
    if (!workbook || !workbook.Sheets[activeSheet]) {
      return <div className={styles.noData}>没有可显示的数据</div>;
    }

    const ws = workbook.Sheets[activeSheet];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z100');
    
    const rows = [];
    
    // 表头行
    const headerCells = [];
    for (let C = range.s.c; C <= Math.min(range.e.c, 10); ++C) {
      const colLetter = XLSX.utils.encode_col(C);
      headerCells.push(
        <th key={`header-${C}`} className={styles.columnHeader}>
          {colLetter}
        </th>
      );
    }
    rows.push(<tr key="header">{[<th key="row-header" className={styles.rowHeader}></th>, ...headerCells]}</tr>);
    
    // 数据行
    for (let R = range.s.r; R <= Math.min(range.e.r, 50); ++R) {
      const cells = [];
      cells.push(
        <td key={`row-${R}`} className={styles.rowHeader}>
          {R + 1}
        </td>
      );
      
      for (let C = range.s.c; C <= Math.min(range.e.c, 10); ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellRef];
        const cellValue = cell?.v?.toString() || '';
        const isSelected = selectedCell === cellRef;
        
        const cellStyle = cell?.s || {};
        let style = {};
        
        if (cellStyle.fill) {
          style.backgroundColor = `#${cellStyle.fill.fgColor?.rgb?.slice(2) || 'FFFFFF'}`;
        }
        if (cellStyle.font) {
          style.fontWeight = cellStyle.font.bold ? 'bold' : 'normal';
          style.color = cellStyle.font.color ? `#${cellStyle.font.color.rgb?.slice(2) || '000000'}` : 'inherit';
        }
        
        cells.push(
          <td
            key={cellRef}
            className={`${styles.cell} ${isSelected ? styles.selectedCell : ''}`}
            style={style}
            onClick={() => handleCellClick(cellRef)}
            title={`${cellRef}: ${cellValue}`}
          >
            {cellValue}
          </td>
        );
      }
      
      rows.push(<tr key={`row-${R}`}>{cells}</tr>);
    }
    
    return (
      <div className={styles.spreadsheetContainer}>
        <table className={styles.spreadsheet}>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  };

  // 渲染工作表标签
  const renderSheetTabs = () => {
    if (!workbook) return null;
    
    return (
      <div className={styles.sheetTabs}>
        {Object.keys(workbook.Sheets).map(sheetName => (
          <button
            key={sheetName}
            className={`${styles.sheetTab} ${activeSheet === sheetName ? styles.activeSheet : ''}`}
            onClick={() => {
              setActiveSheet(sheetName);
              setSelectedCell(null);
              setCellInfo({ name: '', value: '', address: '' });
            }}
          >
            {sheetName}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1 className={styles.title}>Excel评估报告编辑器</h1>
        </div>
        
        <div className={styles.toolbarRight}>
          <button className={styles.toolbarBtn} onClick={saveWorkbook}>
            💾 保存
          </button>
          <button className={styles.toolbarBtn} onClick={exportExcel} disabled={!workbook}>
            ⬇️ 下载XLSX
          </button>
          <button 
            className={styles.toolbarBtn}
            onClick={() => fileInputRef.current.click()}
          >
            📤 上传模板
          </button>
          <button onClick={handleUploadTemplate}>
  📤 上传我的模板
</button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* 单元格信息栏 */}
      {cellInfo.address && (
        <div className={styles.cellInfoBar}>
          <div className={styles.cellInfo}>
            <span className={styles.cellLabel}>单元格:</span>
            <span className={styles.cellAddress}>{cellInfo.address}</span>
            {cellInfo.name && (
              <>
                <span className={styles.cellLabel}>名称:</span>
                <span className={styles.cellName}>{cellInfo.name}</span>
              </>
            )}
            <span className={styles.cellLabel}>值:</span>
            <span className={styles.cellValue}>{cellInfo.value}</span>
            {cellInfo.formula && (
              <>
                <span className={styles.cellLabel}>公式:</span>
                <span className={styles.cellFormula}>{cellInfo.formula}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className={styles.mainContent}>
        {/* 左侧输入面板 */}
        <div className={`${styles.inputPanel} ${!showPreview ? styles.fullWidth : ''}`}>
          <div className={styles.inputPanelHeader}>
            <h3>评估参数输入</h3>
            <button 
              className={styles.toggleBtn}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '折叠表格' : '展开表格'}
            </button>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="buildingArea">
              <span className={styles.formLabel}>建筑面积 (m²)</span>
              <span className={styles.cellRef}>评估明细表!B2</span>
            </label>
            <input
              type="number"
              id="buildingArea"
              value={formValues.buildingArea}
              onChange={(e) => handleFormChange('buildingArea', e.target.value)}
              placeholder="请输入建筑面积"
              step="0.01"
              min="0"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="valuationPrice">
              <span className={styles.formLabel}>单价 (元/m²)</span>
              <span className={styles.cellRef}>评估明细表!C2</span>
            </label>
            <input
              type="number"
              id="valuationPrice"
              value={formValues.valuationPrice}
              onChange={(e) => handleFormChange('valuationPrice', e.target.value)}
              placeholder="请输入单价"
              step="0.01"
              min="0"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="totalValuationPrice">
              <span className={styles.formLabel}>总价 (元)</span>
              <span className={styles.cellRef}>评估明细表!D2</span>
            </label>
            <input
              type="text"
              id="totalValuationPrice"
              value={formValues.totalValuationPrice ? 
                `¥${parseFloat(formValues.totalValuationPrice).toLocaleString('zh-CN', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}` : '¥0.00'}
              readOnly
              className={styles.readonlyInput}
            />
          </div>

          <div className={styles.formulaPreview}>
            <h4>公式计算</h4>
            <div className={styles.formulaBox}>
              <span className={styles.formulaText}>
                总价 = 建筑面积 × 单价
              </span>
              <br />
              <span className={styles.formulaResult}>
                {formValues.buildingArea || 0} × {formValues.valuationPrice || 0} = 
                <span className={styles.resultValue}>
                  ¥{((parseFloat(formValues.buildingArea) || 0) * (parseFloat(formValues.valuationPrice) || 0)).toLocaleString('zh-CN')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 右侧Excel预览 */}
        {showPreview && (
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              {renderSheetTabs()}
              <div className={styles.previewControls}>
                <button 
                  className={styles.refreshBtn}
                  onClick={loadTemplate}
                  disabled={isLoading}
                >
                  {isLoading ? '加载中...' : '🔄 刷新'}
                </button>
              </div>
            </div>
            
            <div className={styles.spreadsheetWrapper} ref={spreadsheetRef}>
              {isLoading ? (
                <div className={styles.loading}>加载Excel数据...</div>
              ) : error ? (
                <div className={styles.error}>
                  <p>{error}</p>
                  <button onClick={createSampleWorkbook}>创建示例数据</button>
                </div>
              ) : (
                renderSpreadsheet()
              )}
            </div>
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          <span>工作表: {activeSheet}</span>
          {selectedCell && <span> | 选中: {selectedCell}</span>}
          {workbook && <span> | 总计: {Object.keys(workbook.Sheets).length} 个工作表</span>}
        </div>
        <div className={styles.statusActions}>
          <span className={styles.hint}>双击单元格查看详情，命名区域将自动同步</span>
        </div>
      </div>
    </div>
  );
};

export default ExcelEditing;