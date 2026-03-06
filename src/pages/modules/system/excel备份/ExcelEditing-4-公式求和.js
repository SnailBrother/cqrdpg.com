import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import * as FORMULAS from 'formulajs'; // ✅ 引入公式库
import styles from './ExcelEditing.module.css';

// ✅ 引入你的通知组件
import ConfirmationDialogManager from '../accounting/Notification/ConfirmationDialogManager';
import NotificationManager from '../accounting/Notification/NotificationManager';

// 辅助函数：将 A1 转为 {r, c}
const parseCellRef = (ref) => {
  if (!ref) return null;
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const colStr = match[1];
  const row = parseInt(match[2], 10) - 1; // 0-based
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return { r: row, c: col - 1 };
};

// 辅助函数：将 {r, c} 转为 A1
const encodeCellRef = ({ r, c }) => {
  let col = '';
  let n = c + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    col = String.fromCharCode(65 + remainder) + col;
    n = Math.floor((n - 1) / 26);
  }
  return `${col}${r + 1}`;
};

// 提取公式中引用的所有单元格（简单正则，支持 A1, $A$1, A1:B2 等基础形式）
const extractReferencesFromFormula = (formula) => {
  if (!formula) return [];
  // 移除引号内的内容避免误匹配
  const cleanFormula = formula.replace(/"[^"]*"/g, '');
  // 匹配类似 A1, $B$2, C3:D4 的模式
  const rangeRegex = /(?:\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?)/gi;
  const matches = cleanFormula.match(rangeRegex) || [];
  const refs = new Set();

  for (const match of matches) {
    if (match.includes(':')) {
      const [start, end] = match.split(':');
      const startCell = parseCellRef(start.replace(/\$/g, ''));
      const endCell = parseCellRef(end.replace(/\$/g, ''));
      if (startCell && endCell) {
        for (let r = startCell.r; r <= endCell.r; r++) {
          for (let c = startCell.c; c <= endCell.c; c++) {
            refs.add(encodeCellRef({ r, c }));
          }
        }
      }
    } else {
      const cell = parseCellRef(match.replace(/\$/g, ''));
      if (cell) {
        refs.add(encodeCellRef(cell));
      }
    }
  }

  return Array.from(refs);
};

 
const evaluateFormula = (formula, sheetData) => {
  if (!formula || typeof formula !== 'string') return null;

  try {
    let evalExpr = formula;
    
    // 如果公式以 = 开头，去掉它
    if (evalExpr.startsWith('=')) {
      evalExpr = evalExpr.substring(1);
    }
    
    const refs = extractReferencesFromFormula(formula);

    const replacements = {};

    for (const ref of refs) {
      const cell = sheetData[ref];
      let val = 0; // 默认值设为 0 而不是空字符串

      if (cell && cell.v != null) {
        if (typeof cell.v === 'number') {
          val = cell.v;
        } else if (typeof cell.v === 'string') {
          const num = parseFloat(cell.v);
          if (!isNaN(num) && cell.v.trim() !== '') {
            val = num;
          } else {
            // 对于非数字文本，我们将其作为 0 处理，或者可以根据需要调整
            val = 0;
          }
        }
      }

      replacements[ref] = val;
    }

    const sortedRefs = Object.keys(replacements).sort((a, b) => b.length - a.length);
    for (const ref of sortedRefs) {
      const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedRef}\\b`, 'g');
      evalExpr = evalExpr.replace(regex, replacements[ref]);
    }
    
    console.log('原始公式:', formula);
    console.log('替换后表达式:', evalExpr);
    
    // 直接使用 formulajs 函数进行计算
    // 创建一个计算环境，使用 FORMULAS 中的所有函数
    const context = { ...FORMULAS };
    
    // 将表达式中的函数调用转换为使用 FORMULAS 中的函数
    const functionRegex = /\b([A-Z_][A-Z0-9_]*)\(/g;
    let transformedExpr = evalExpr;
    const functionMatches = [...new Set(evalExpr.match(functionRegex) || [])];
    
    for (const match of functionMatches) {
      const functionName = match.slice(0, -1);
      if (FORMULAS[functionName]) {
        // 替换函数调用为 FORMULAS.函数名
        const regex = new RegExp(`\\b${functionName}\\(`, 'g');
        transformedExpr = transformedExpr.replace(regex, `FORMULAS.${functionName}(`);
      }
    }
    
    // 使用 Function 构造函数创建执行环境
    const computeFunction = new Function('FORMULAS', 'return (' + transformedExpr + ')');
    const result = computeFunction(FORMULAS);
    
    return result;
  } catch (error) {
    console.warn('公式计算失败:', formula, error);
    return '#ERROR!';
  }
};

// 构建依赖图：cell -> [dependents]
const buildDependencyGraph = (ws) => {
  const graph = {};
  const allCells = Object.keys(ws).filter(key => !key.startsWith('!'));

  // 初始化
  allCells.forEach(cell => {
    graph[cell] = [];
  });

  // 遍历每个有公式的单元格，提取其依赖，并反向建立图
  allCells.forEach(cell => {
    const formula = ws[cell]?.f;
    if (formula) {
      const refs = extractReferencesFromFormula(formula);
      refs.forEach(ref => {
        if (graph[ref]) {
          graph[ref].push(cell);
        }
      });
    }
  });

  return graph;
};

// 递归重算依赖单元格
const recalculateDependents = (changedCell, ws, dependencyGraph) => {
  const visited = new Set();
  const queue = [changedCell];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    const dependents = dependencyGraph[current] || [];
    for (const dep of dependents) {
      const formula = ws[dep]?.f;
      if (formula) {
        const newValue = evaluateFormula(formula, ws);
        if (ws[dep]) {
          ws[dep].v = newValue;
          ws[dep].t = typeof newValue === 'number' ? 'n' : 's';
        }
        queue.push(dep);
      }
    }
  }
};

const ExcelEditing = () => {
  const [workbook, setWorkbook] = useState(null);
  const [activeSheet, setActiveSheet] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellInfo, setCellInfo] = useState({ name: '', value: '', address: '', formula: '' });
  const [formValues, setFormValues] = useState({});
  const [showInputPanel, setShowInputPanel] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [namedRanges, setNamedRanges] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [editingContext, setEditingContext] = useState(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef(null);
  const spreadsheetRef = useRef(null);
  const cellEditorRef = useRef(null);
  const infoBarEditorRef = useRef(null);
  const notificationRef = useRef(null);

  // 缓存依赖图（按工作表）
  const dependencyGraphRef = useRef({});

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

  const displayCellInfo = useMemo(() => {
    if (!cellInfo.address) return null;
    return {
      ...cellInfo,
      value: editingCell === cellInfo.address ? editValue : cellInfo.value
    };
  }, [cellInfo, editingCell, editValue]);

  const extractAllNamedRanges = useCallback((wb) => {
    const allNamedRanges = [];
    if (!wb?.Workbook?.Names) return allNamedRanges;

    wb.Workbook.Names.forEach(nameObj => {
      const ref = nameObj.Ref;
      if (!ref) return;

      let sheetName = '';
      let addressPart = '';

      if (ref.includes('!')) {
        const parts = ref.split('!');
        sheetName = parts[0].replace(/^'/, '').replace(/'$/, '');
        addressPart = parts[1];
      } else {
        return;
      }

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

  const extractCurrentSheetNamedRanges = useCallback((wb, sheetName) => {
    const allRanges = extractAllNamedRanges(wb);
    const currentSheetRanges = allRanges.filter(r => r.sheet === sheetName);

    setNamedRanges(currentSheetRanges);

    const newFormValues = {};
    currentSheetRanges.forEach(range => {
      newFormValues[range.name] = range.value;
    });
    setFormValues(newFormValues);

    // ✅ 构建当前工作表的依赖图
    const ws = wb.Sheets[sheetName];
    if (ws) {
      dependencyGraphRef.current[sheetName] = buildDependencyGraph(ws);
    }

    return currentSheetRanges;
  }, [extractAllNamedRanges]);

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
      notificationRef.current?.addNotification('加载模板失败，请确保 template.xlsx 文件存在', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, []);

  // ✅ 增强版保存：支持公式重算
  const saveCellEditToSheet = (sheetName, cellAddress, value) => {
    if (!workbook) return;
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;

    if (!ws[cellAddress]) ws[cellAddress] = {};

    // 清除公式（用户输入覆盖公式）
    ws[cellAddress].f = undefined;

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && value !== '') {
      ws[cellAddress].v = numValue;
      ws[cellAddress].t = 'n';
    } else {
      ws[cellAddress].v = value === '' ? null : value;
      ws[cellAddress].t = 's';
    }

    // ✅ 触发依赖重算
    const graph = dependencyGraphRef.current[sheetName];
    if (graph) {
      recalculateDependents(cellAddress, ws, graph);
    }
  };

  const saveCellEdit = (cellAddress, value) => {
    if (!workbook || !activeSheet) return;
    saveCellEditToSheet(activeSheet, cellAddress, value);
    setWorkbook({ ...workbook }); // 触发重渲染

    const namedRange = namedRanges.find(range => range.address === cellAddress && range.sheet === activeSheet);
    if (namedRange) {
      setFormValues(prev => ({ ...prev, [namedRange.name]: value }));
    }

    if (cellInfo.address === cellAddress) {
      setCellInfo(prev => ({ ...prev, value: value }));
    }
  };

  const handleSheetChange = (sheetName) => {
    setActiveSheet(sheetName);
    setSelectedCell(null);
    setEditingCell(null);
    setEditingContext(null);
    setCellInfo({ name: '', value: '', address: '', formula: '' });
    if (workbook) extractCurrentSheetNamedRanges(workbook, sheetName);
  };

  const handleCellClick = (cellAddress) => {
    if (!workbook || !activeSheet) return;

    const ws = workbook.Sheets[activeSheet];
    const cell = ws[cellAddress];

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

  const handleFormChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (!workbook) return;
    const namedRange = namedRanges.find(range => range.name === name);
    if (!namedRange) return;

    saveCellEditToSheet(namedRange.sheet, namedRange.address, value);
    setWorkbook({ ...workbook });

    if (selectedCell === namedRange.address && activeSheet === namedRange.sheet) {
      setCellInfo(prev => ({ ...prev, value: value }));
    }
  };

  const exportExcel = useCallback(async () => {
    if (!workbook || namedRanges.length === 0) {
      notificationRef.current?.addNotification('没有可导出的数据', 'warning');
      return;
    }

    try {
      setIsLoading(true);

      const templateResponse = await fetch('/template.xlsx');
      if (!templateResponse.ok) throw new Error('模板文件加载失败');
      const templateArrayBuffer = await templateResponse.arrayBuffer();

      const exceljsWorkbook = new ExcelJS.Workbook();
      await exceljsWorkbook.xlsx.load(templateArrayBuffer);

      namedRanges.forEach(range => {
        const sheet = exceljsWorkbook.getWorksheet(range.sheet);
        if (!sheet) {
          console.warn(`工作表 ${range.sheet} 不存在`);
          return;
        }

        const cell = sheet.getCell(range.address);
        const currentValue = formValues[range.name];

        if (cell.type === ExcelJS.ValueType.Formula) {
          console.warn(`跳过写入 ${range.sheet}!${range.address}，因其包含公式: ${cell.value}`);
          return;
        }

        let finalValue = currentValue;
        if (currentValue === '') {
          finalValue = null;
        } else {
          const numVal = parseFloat(currentValue);
          if (!isNaN(numVal) && !currentValue.includes(',')) {
            finalValue = numVal;
          }
        }

        cell.value = finalValue;
      });

      exceljsWorkbook.eachSheet((worksheet) => {
        worksheet.columns = Array.from({ length: 26 }, (_, i) => ({ width: 12 }));
        const startRow = 1, endRow = 22, startCol = 1, endCol = 5;
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const cell = worksheet.getCell(row, col);
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          }
        }
      });

      const buffer = await exceljsWorkbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
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

      notificationRef.current?.addNotification('Excel文件导出成功！', 'success');

    } catch (error) {
      console.error('导出失败:', error);
      notificationRef.current?.addNotification(`导出失败: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [workbook, namedRanges, formValues]);

  const saveWorkbook = () => {
    exportExcel();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!validTypes.some(type => file.type.includes(type))) {
      notificationRef.current?.addNotification('请上传Excel文件 (.xlsx 或 .xls)', 'warning');
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
        notificationRef.current?.addNotification('文件解析失败，请检查文件格式', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const renderSpreadsheet = () => {
    if (!workbook || !activeSheet) {
      return <div className={styles.noData}>请上传或加载Excel文件</div>;
    }

    const ws = workbook.Sheets[activeSheet];
    const fixedRange = { s: { r: 0, c: 0 }, e: { r: 149, c: 25 } };
    const rows = [];

    const headerCells = [];
    for (let C = fixedRange.s.c; C <= fixedRange.e.c; ++C) {
      const colLetter = XLSX.utils.encode_col(C);
      headerCells.push(<th key={`header-${C}`} className={styles.columnHeader}>{colLetter}</th>);
    }
    rows.push(<tr key="header">{[<th key="row-header" className={styles.rowHeader}></th>, ...headerCells]}</tr>);

    for (let R = fixedRange.s.r; R <= fixedRange.e.r; ++R) {
      const cells = [<td key={`row-${R}`} className={styles.rowHeader}>{R + 1}</td>];
      for (let C = fixedRange.s.c; C <= fixedRange.e.c; ++C) {
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

        const cellStyle = cell?.s || {};
        let style = {};

        if (cellStyle.fill?.fgColor?.rgb) {
          style.backgroundColor = `#${cellStyle.fill.fgColor.rgb.slice(2)}`;
        }
        if (cellStyle.font) {
          style.fontWeight = cellStyle.font.bold ? 'bold' : 'normal';
        }
        style.color = '#000000';

        if (cellStyle.border) {
          const sides = ['top', 'right', 'bottom', 'left'];
          const borderMap = { top: 'borderTop', right: 'borderRight', bottom: 'borderBottom', left: 'borderLeft' };
          sides.forEach(side => {
            const b = cellStyle.border[side];
            if (b && b.style > 0) {
              const color = b.color?.rgb ? `#${b.color.rgb.slice(2)}` : '#000000';
              style[borderMap[side]] = `1px solid ${color}`;
            }
          });
        }

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

  const renderSheetTabs = () => {
    if (!workbook) return null;
    return (
      <div className={styles.sheetTabsContainer}>
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
    <ConfirmationDialogManager>
      {(confirm) => (
        <div className={styles.container}>
          <NotificationManager ref={notificationRef} />

          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <svg className={styles.titleicon} aria-hidden="true">
                <use xlinkHref="#icon-excel3"></use>
              </svg>
            </div>

            <div className={styles.toolbarRight}>
              <button
                className={styles.toolbarBtn}
                onClick={() => fileInputRef.current.click()}
                title="上传Excel文件"
              >
                <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-shangchuantupian2"></use>
                </svg>
              </button>
              <button
                className={styles.toolbarBtn}
                onClick={loadTemplate}
                title="重新加载模板"
              >
                <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-liebiaoxunhuan3"></use>
                </svg>
              </button>
              <button
                className={styles.toolbarBtn}
                onClick={saveWorkbook}
                disabled={!workbook}
                title="保存并下载Excel"
              >
                <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-xiazaiwenjian1"></use>
                </svg>
              </button>
              <button
                className={styles.toolbarBtn}
                onClick={() => setShowInputPanel(!showInputPanel)}
                title={showInputPanel ? "隐藏参数面板" : "显示参数面板"}
              >
                {showInputPanel ? (
                  <svg className={styles.buttonicon} aria-hidden="true">
                    <use xlinkHref="#icon-yincangdaan"></use>
                  </svg>
                ) : (
                  <svg className={styles.buttonicon} aria-hidden="true">
                    <use xlinkHref="#icon-xianshi"></use>
                  </svg>
                )}
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

          <div className={styles.mainContent}>
            {showInputPanel && (
              <div className={styles.inputPanel}>
                <div className={styles.inputPanelHeader}>
                  <h3>
                    <svg className={styles.buttonicon} aria-hidden="true">
                      <use xlinkHref="#icon-neirongziduanguanli"></use>
                    </svg>
                  </h3>
                </div>
                <div className={styles.formContainer}>
                  {renderInputForm()}
                </div>
              </div>
            )}

            <div className={`${styles.previewPanel} ${!showInputPanel ? styles.fullWidth : ''}`}>
              {workbook && activeSheet && (
                <div className={styles.cellInfoBar}>
                  <div className={styles.cellInfoRow}>
                    <span className={styles.cellLabel}>
                      <svg className={styles.buttonicon} aria-hidden="true">
                        <use xlinkHref="#icon-danyuange"></use>
                      </svg>
                    </span>
                    <span className={styles.cellAddress}>
                      {cellInfo.address ? cellInfo.address : '未选择'}
                    </span>
                    <span className={styles.cellLabel}>
                      <svg className={styles.buttonicon} aria-hidden="true">
                        <use xlinkHref="#icon-bianji1"></use>
                      </svg>
                    </span>
                    {editingCell === cellInfo.address && editingContext === 'infobar' ? (
                      <input
                        type="text"
                        className={styles.infoBarEditor}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          saveCellEdit(cellInfo.address, editValue);
                          setEditingCell(null);
                          setEditingContext(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveCellEdit(cellInfo.address, editValue);
                            setEditingCell(null);
                            setEditingContext(null);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                            setEditingContext(null);
                            setEditValue(cellInfo.value);
                          }
                        }}
                        ref={infoBarEditorRef}
                      />
                    ) : (
                      <span
                        className={styles.cellValue}
                        onClick={() => {
                          if (cellInfo.address) {
                            setEditingCell(cellInfo.address);
                            setEditingContext('infobar');
                            setEditValue(cellInfo.value);
                          }
                        }}
                        style={{ cursor: cellInfo.address ? 'pointer' : 'default' }}
                      >
                        {cellInfo.value || (cellInfo.address ? '(空)' : '未选择')}
                      </span>
                    )}
                    {cellInfo.name && (
                      <>
                        <span className={styles.cellLabel}>名称:</span>
                        <span className={styles.cellName}>{cellInfo.name}</span>
                      </>
                    )}
                    {cellInfo.formula && (
                      <>
                        <span className={styles.cellLabel}>公式:</span>
                        <span className={styles.cellFormula}>{cellInfo.formula}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

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

              <div className={styles.sheetTabsSection}>
                {renderSheetTabs()}
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmationDialogManager>
  );
};

export default ExcelEditing;