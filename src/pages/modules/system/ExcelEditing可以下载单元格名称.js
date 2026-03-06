import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import styles from './ExcelEditing.module.css';

const ExcelEditing = () => {
  const [workbook, setWorkbook] = useState(null);
  const [activeSheet, setActiveSheet] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellInfo, setCellInfo] = useState({ name: '', value: '', address: '', formula: '' });
  const [formValues, setFormValues] = useState({});
  const [showInputPanel, setShowInputPanel] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [namedRanges, setNamedRanges] = useState([]); // 每项: { name, sheet, address, isRange, rangeAddress, value, formula }
  const [editingCell, setEditingCell] = useState(null);
  const [editingContext, setEditingContext] = useState(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef(null);
  const spreadsheetRef = useRef(null);
  const cellEditorRef = useRef(null);
  const infoBarEditorRef = useRef(null);

  // 自动聚焦编辑框
  useEffect(() => {
    if (editingCell) {
      const timer = setTimeout(() => {
        if (editingContext === 'cell' && cellEditorRef.current) {
          cellEditorRef.current.focus();
          cellEditorRef.current.select();
        } else if (editingContext === 'infobar' && infoBarEditorRef.current) {
          infoBarEditorRef.current.focus();
          infoBarEditorRef.current.select();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [editingCell, editingContext]);

  // 实时显示的 cellInfo（含编辑中值）
  const displayCellInfo = useMemo(() => {
    if (!cellInfo.address) return null;
    return {
      ...cellInfo,
      value: editingCell === cellInfo.address ? editValue : cellInfo.value
    };
  }, [cellInfo, editingCell, editValue]);

  // ✅ 全面解析命名区域（支持单单元格 & 范围，跨工作表）
  const extractAllNamedRanges = useCallback((wb) => {
    const allNamedRanges = [];
    if (!wb?.Workbook?.Names) return allNamedRanges;

    wb.Workbook.Names.forEach(nameObj => {
      const ref = nameObj.Ref;
      if (!ref) return;

      // 支持 'Sheet1'!$A$1 或 Sheet1!A1 或 'Sheet1'!$A$1:$B$2
      let sheetName = '';
      let addressPart = '';

      if (ref.includes('!')) {
        const parts = ref.split('!');
        sheetName = parts[0].replace(/^'/, '').replace(/'$/, '');
        addressPart = parts[1];
      } else {
        // 无工作表前缀？跳过（应有）
        return;
      }

      // 去除 $ 符号，标准化地址
      const cleanAddress = addressPart.replace(/\$/g, '');

      let isRange = false;
      let rangeAddress = '';
      let firstCell = '';

      if (cleanAddress.includes(':')) {
        isRange = true;
        const [start, end] = cleanAddress.split(':');
        firstCell = start;
        rangeAddress = `${start}:${end}`;
      } else {
        firstCell = cleanAddress;
        rangeAddress = firstCell;
      }

      // 获取值（取第一个单元格的值）
      const ws = wb.Sheets[sheetName];
      const cell = ws?.[firstCell];
      const value = cell?.v?.toString() || '';
      const formula = cell?.f || '';

      allNamedRanges.push({
        name: nameObj.Name,
        sheet: sheetName,
        address: firstCell,
        isRange,
        rangeAddress,
        value,
        formula
      });
    });

    return allNamedRanges;
  }, []);

  // 提取当前工作表的命名区域
  const extractCurrentSheetNamedRanges = useCallback((wb, sheetName) => {
    const allRanges = extractAllNamedRanges(wb);
    const currentSheetRanges = allRanges.filter(r => r.sheet === sheetName);

    setNamedRanges(currentSheetRanges);

    const newFormValues = {};
    currentSheetRanges.forEach(range => {
      newFormValues[range.name] = range.value;
    });
    setFormValues(newFormValues);

    return currentSheetRanges;
  }, [extractAllNamedRanges]);

  // 加载模板
  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/template.xlsx');
      if (!response.ok) throw new Error('模板文件加载失败');
      const arrayBuffer = await response.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, {
        type: 'array',
        cellFormula: true,
        cellStyles: true,
        cellDates: true
      });
      setWorkbook(wb);
      const firstSheet = wb.SheetNames[0] || '';
      setActiveSheet(firstSheet);
      extractCurrentSheetNamedRanges(wb, firstSheet);
    } catch (error) {
      console.error('加载模板失败:', error);
      alert('加载模板失败，请确保 template.xlsx 文件存在');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, []);

  // 保存单元格编辑
  const saveCellEdit = (cellAddress, value) => {
    if (!workbook || !activeSheet) return;

    const ws = workbook.Sheets[activeSheet];
    if (!ws[cellAddress]) ws[cellAddress] = {};

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && value !== '') {
      ws[cellAddress].v = numValue;
      ws[cellAddress].t = 'n';
    } else {
      ws[cellAddress].v = value;
      ws[cellAddress].t = 's';
    }
    ws[cellAddress].f = undefined;

    // 更新命名区域表单值
    const namedRange = namedRanges.find(range => range.address === cellAddress);
    if (namedRange) {
      setFormValues(prev => ({ ...prev, [namedRange.name]: value }));
    }

    setWorkbook({ ...workbook });

    if (cellInfo.address === cellAddress) {
      setCellInfo(prev => ({ ...prev, value: value }));
    }
  };

  // 切换工作表
  const handleSheetChange = (sheetName) => {
    setActiveSheet(sheetName);
    setSelectedCell(null);
    setEditingCell(null);
    setEditingContext(null);
    setCellInfo({ name: '', value: '', address: '', formula: '' });
    if (workbook) extractCurrentSheetNamedRanges(workbook, sheetName);
  };

  // 单元格点击
  const handleCellClick = (cellAddress) => {
    if (!workbook || !activeSheet) return;

    const ws = workbook.Sheets[activeSheet];
    const cell = ws[cellAddress];

    // 查找是否属于某个命名区域（包括范围）
    let matchedRange = null;
    for (const range of namedRanges) {
      if (range.isRange) {
        const [startStr, endStr] = range.rangeAddress.split(':');
        const start = XLSX.utils.decode_cell(startStr);
        const end = XLSX.utils.decode_cell(endStr);
        const current = XLSX.utils.decode_cell(cellAddress);
        if (current.r >= start.r && current.r <= end.r &&
          current.c >= start.c && current.c <= end.c) {
          matchedRange = range;
          break;
        }
      } else if (range.address === cellAddress) {
        matchedRange = range;
        break;
      }
    }

    const cellName = matchedRange ? matchedRange.name : '';
    const cellValue = cell?.v?.toString() || '';

    setCellInfo({
      name: cellName,
      value: cellValue,
      address: cellAddress,
      formula: cell?.f || ''
    });

    setSelectedCell(cellAddress);
    setEditValue(cellValue);
    setEditingCell(cellAddress);
    setEditingContext('cell');
  };

  // 表单输入变化
  const handleFormChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (!workbook || !activeSheet) return;
    const namedRange = namedRanges.find(range => range.name === name);
    if (!namedRange || namedRange.sheet !== activeSheet) return;

    const ws = workbook.Sheets[activeSheet];
    const cellAddress = namedRange.address;
    if (!ws[cellAddress]) ws[cellAddress] = {};

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && value !== '') {
      ws[cellAddress].v = numValue;
      ws[cellAddress].t = 'n';
    } else {
      ws[cellAddress].v = value;
      ws[cellAddress].t = 's';
    }
    ws[cellAddress].f = undefined;

    if (selectedCell === cellAddress) {
      setCellInfo(prev => ({ ...prev, value: value }));
    }
    setWorkbook({ ...workbook });
  };

  // 导出
  const exportExcel = useCallback(() => {
    if (!workbook) {
      alert('没有可导出的数据');
      return;
    }
    try {
      const wbout = XLSX.write(workbook, {
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
      link.download = `编辑后的Excel_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  const saveWorkbook = () => {
    if (!workbook) {
      alert('没有可保存的工作簿');
      return;
    }
    exportExcel();
  };

  // 上传文件
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
        const firstSheet = wb.SheetNames[0] || '';
        setActiveSheet(firstSheet);
        extractCurrentSheetNamedRanges(wb, firstSheet);
        setSelectedCell(null);
        setEditingCell(null);
        setEditingContext(null);
        setCellInfo({ name: '', value: '', address: '', formula: '' });
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

  // 渲染表格
  const renderSpreadsheet = () => {
    if (!workbook || !activeSheet) {
      return <div className={styles.noData}>请上传或加载Excel文件</div>;
    }

    const ws = workbook.Sheets[activeSheet];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z100');
    const rows = [];

    const headerCells = [];
    for (let C = range.s.c; C <= Math.min(range.e.c, 20); ++C) {
      const colLetter = XLSX.utils.encode_col(C);
      headerCells.push(
        <th key={`header-${C}`} className={styles.columnHeader}>
          {colLetter}
        </th>
      );
    }
    rows.push(<tr key="header">{[<th key="row-header" className={styles.rowHeader}></th>, ...headerCells]}</tr>);

    for (let R = range.s.r; R <= Math.min(range.e.r, 100); ++R) {
      const cells = [];
      cells.push(
        <td key={`row-${R}`} className={styles.rowHeader}>
          {R + 1}
        </td>
      );

      for (let C = range.s.c; C <= Math.min(range.e.c, 20); ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellRef];
        let cellValue = '';
        if (cell) {
          if (cell.t === 'n' || cell.t === 'b') {
            cellValue = cell.v?.toString() || '';
          } else if (cell.t === 'd') {
            cellValue = new Date(cell.v).toLocaleDateString();
          } else {
            cellValue = cell.v?.toString() || '';
          }
        }

        const isSelected = selectedCell === cellRef;
        const isNamedCell = namedRanges.some(range => {
          if (range.isRange) {
            const [start, end] = range.rangeAddress.split(':');
            const startCell = XLSX.utils.decode_cell(start);
            const endCell = XLSX.utils.decode_cell(end);
            const currentCell = XLSX.utils.decode_cell(cellRef);
            return currentCell.r >= startCell.r && currentCell.r <= endCell.r &&
              currentCell.c >= startCell.c && currentCell.c <= endCell.c;
          }
          return range.address === cellRef;
        });
        const isEditing = editingCell === cellRef && editingContext === 'cell';

 
        //单元格颜色设置
        const cellStyle = cell?.s || {};
        let style = {};

        // 背景颜色（保留）
        if (cellStyle.fill) {
          style.backgroundColor = `#${cellStyle.fill.fgColor?.rgb?.slice(2) || 'FFFFFF'}`;
        }

        // 字体：保留粗体，但强制颜色为黑色
        if (cellStyle.font) {
          style.fontWeight = cellStyle.font.bold ? 'bold' : 'normal';
           //   style.color = cellStyle.font.color ? `#${cellStyle.font.color.rgb?.slice(2) || '000000'}` : 'inherit';
        }
        style.color = '#000000'; // 👈 所有文字强制黑色

        // 命名区域高亮（不影响文字颜色）
        if (isNamedCell) {
          style.backgroundColor = style.backgroundColor || '#f0f9ff';
          style.border = '2px solid #3b82f6';
        }

        
        cells.push(
          <td
            key={cellRef}
            className={`${styles.cell} ${isSelected ? styles.selectedCell : ''} ${isNamedCell ? styles.namedCell : ''}`}
            style={style}
            onClick={() => handleCellClick(cellRef)}
            title={`${cellRef}${cell?.f ? `\n公式: ${cell.f}` : ''}`}
          >
            {isEditing ? (
              <input
                type="text"
                className={styles.cellEditor}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => {
                  saveCellEdit(cellRef, editValue);
                  setEditingCell(null);
                  setEditingContext(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveCellEdit(cellRef, editValue);
                    setEditingCell(null);
                    setEditingContext(null);
                  } else if (e.key === 'Escape') {
                    setEditingCell(null);
                    setEditingContext(null);
                    setEditValue(cellValue);
                  }
                }}
                ref={cellEditorRef}
              />
            ) : (
              cellValue
            )}
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

  // 工作表标签
  const renderSheetTabs = () => {
    if (!workbook) return null;
    return (
      <div className={styles.sheetTabs}>
        {workbook.SheetNames.map(sheetName => (
          <button
            key={sheetName}
            className={`${styles.sheetTab} ${activeSheet === sheetName ? styles.activeSheet : ''}`}
            onClick={() => handleSheetChange(sheetName)}
          >
            {sheetName}
          </button>
        ))}
      </div>
    );
  };

  // 左侧表单（✅ 显示 sheet!address）
  const renderInputForm = () => {
    if (namedRanges.length === 0) {
      return (
        <div className={styles.noNamedRanges}>
          当前工作表没有定义命名区域
          <br />
          <small>请在Excel中使用"公式 → 定义名称"来创建命名区域</small>
        </div>
      );
    }

    return namedRanges.map(range => (
      <div key={range.name} className={styles.formGroup}>
        <label htmlFor={range.name}>
          <span className={styles.formLabel}>{range.name}</span>
          <span className={styles.cellRef}>{range.sheet}!{range.address}</span>
        </label>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            id={range.name}
            value={formValues[range.name] || ''}
            onChange={(e) => handleFormChange(range.name, e.target.value)}
            placeholder="输入值"
          />
          {range.formula && (
            <span className={styles.formulaHint} title={`公式: ${range.formula}`}>
              公式
            </span>
          )}
        </div>
        {range.formula && (
          <div className={styles.formulaPreview}>
            公式: <code>{range.formula}</code>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1 className={styles.title}>Excel数据编辑器</h1>
          <div className={styles.fileInfo}>
            {workbook && (
              <>
                <span>工作簿已加载</span>
                <span className={styles.sheetCount}>
                  {workbook.SheetNames.length}个工作表
                </span>
              </>
            )}
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <button
            className={styles.toolbarBtn}
            onClick={() => fileInputRef.current.click()}
            title="上传Excel文件"
          >
            📤 上传Excel
          </button>
          <button
            className={styles.toolbarBtn}
            onClick={loadTemplate}
            title="重新加载模板"
          >
            🔄 加载模板
          </button>
          <button
            className={styles.toolbarBtn}
            onClick={saveWorkbook}
            disabled={!workbook}
            title="保存并下载Excel"
          >
            💾 保存下载
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
      {displayCellInfo && (
        <div className={styles.cellInfoBar}>
          <div className={styles.cellInfo}>
            <span className={styles.cellLabel}>位置:</span>
            <span className={styles.cellAddress}>{activeSheet}!{displayCellInfo.address}</span>
            {displayCellInfo.name && (
              <>
                <span className={styles.cellLabel}>名称:</span>
                <span className={styles.cellName}>{displayCellInfo.name}</span>
              </>
            )}
            <span className={styles.cellLabel}>值:</span>
            {editingCell === displayCellInfo.address && editingContext === 'infobar' ? (
              <input
                type="text"
                className={styles.infoBarEditor}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => {
                  saveCellEdit(displayCellInfo.address, editValue);
                  setEditingCell(null);
                  setEditingContext(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveCellEdit(displayCellInfo.address, editValue);
                    setEditingCell(null);
                    setEditingContext(null);
                  } else if (e.key === 'Escape') {
                    setEditingCell(null);
                    setEditingContext(null);
                    setEditValue(displayCellInfo.value);
                  }
                }}
                ref={infoBarEditorRef}
              />
            ) : (
              <span
                className={styles.cellValue}
                onClick={() => {
                  setEditingCell(displayCellInfo.address);
                  setEditingContext('infobar');
                  setEditValue(displayCellInfo.value);
                }}
                style={{ cursor: 'pointer' }}
              >
                {displayCellInfo.value || '(空)'}
              </span>
            )}
            {displayCellInfo.formula && (
              <>
                <span className={styles.cellLabel}>公式:</span>
                <span className={styles.cellFormula}>{displayCellInfo.formula}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className={styles.mainContent}>
        {/* 左侧参数输入面板 */}
        {showInputPanel && (
          <div className={styles.inputPanel}>
            <div className={styles.inputPanelHeader}>
              <h3>
                参数输入
                <span className={styles.sheetName}>{activeSheet}</span>
              </h3>
              <button
                className={styles.toggleBtn}
                onClick={() => setShowInputPanel(false)}
                title="隐藏参数面板"
              >
                ◀ 隐藏
              </button>
            </div>

            <div className={styles.namedRangesInfo}>
              <span className={styles.namedRangesCount}>
                命名区域: {namedRanges.length}个
              </span>
              <span className={styles.namedRangesHint}>
                点击表格中的命名区域单元格可在此编辑
              </span>
            </div>

            <div className={styles.formContainer}>
              {renderInputForm()}
            </div>
          </div>
        )}

        {/* 右侧Excel预览 */}
        <div className={`${styles.previewPanel} ${!showInputPanel ? styles.fullWidth : ''}`}>
          <div className={styles.previewHeader}>
            {renderSheetTabs()}
            <div className={styles.previewControls}>
              {!showInputPanel && (
                <button
                  className={styles.toggleBtn}
                  onClick={() => setShowInputPanel(true)}
                  title="显示参数面板"
                >
                  显示参数 ▶
                </button>
              )}
            </div>
          </div>

          <div className={styles.spreadsheetWrapper} ref={spreadsheetRef}>
            {isLoading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                加载Excel数据...
              </div>
            ) : (
              renderSpreadsheet()
            )}
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          <span>当前工作表: <strong>{activeSheet}</strong></span>
          {selectedCell && <span> | 选中: {activeSheet}!{selectedCell}</span>}
          {cellInfo.name && <span> | 名称: {cellInfo.name}</span>}
          {editingCell && <span> | 编辑模式 ({editingContext})</span>}
        </div>
        <div className={styles.statusActions}>
          <span className={styles.hint}>
            提示: 单击单元格或信息栏值即可编辑
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExcelEditing;