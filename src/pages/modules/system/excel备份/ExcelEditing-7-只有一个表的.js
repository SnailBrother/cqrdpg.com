import React, { useState, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import * as FORMULAS from 'formulajs';
import './ExcelEditor.css';

// 简单图标组件
const Icon = ({ type }) => {
  switch (type) {
    case 'load': return '📂';
    case 'save': return '💾';
    case 'download': return '📥';
    case 'add': return '➕';
    case 'delete': return '🗑️';
    case 'search': return '🔍';
    case 'formula': return '∑';
    case 'validation': return '✓';
    case 'namedCell': return '🏷️';
    default: return '📄';
  }
};

// 辅助：A1 转 {r, c}
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

// 辅助：{r, c} 转 A1
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

// 提取公式中的单元格引用（支持 A1, $A$1, A1:B2）
const extractReferencesFromFormula = (formula) => {
  if (!formula) return [];
  const cleanFormula = formula.replace(/"[^"]*"/g, '');
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
      if (cell) refs.add(encodeCellRef(cell));
    }
  }
  return Array.from(refs);
};

// 公式求值器（支持 IF 函数）
const evaluateFormula = (formula, sheetData, namedRanges = []) => {
  if (!formula || typeof formula !== 'string') return null;
  
  try {
    let expr = formula.startsWith('=') ? formula.substring(1) : formula;
    
    // 1. 替换命名区域
    namedRanges.forEach(nr => {
      let value = nr.value || '';
      if (!value && sheetData[nr.address]) {
        value = sheetData[nr.address].v || sheetData[nr.address].value || '';
      }
      
      const num = parseFloat(value);
      if (!isNaN(num) && value !== '') {
        const regex = new RegExp(`\\b${nr.name}\\b`, 'gi');
        expr = expr.replace(regex, num);
      } else {
        const regex = new RegExp(`\\b${nr.name}\\b`, 'gi');
        expr = expr.replace(regex, `"${value}"`);
      }
    });

    // 2. 替换单元格引用
    const refs = extractReferencesFromFormula(expr);
    refs.forEach(ref => {
      const cell = sheetData[ref];
      if (cell) {
        let value = cell.v || cell.value || '';
        if (cell.f) {
          value = evaluateFormula(`=${cell.f}`, sheetData, namedRanges) || '';
        }
        
        const num = parseFloat(value);
        if (!isNaN(num) && value !== '') {
          const regex = new RegExp(`\\b${ref}\\b`, 'g');
          expr = expr.replace(regex, num);
        } else {
          const regex = new RegExp(`\\b${ref}\\b`, 'g');
          expr = expr.replace(regex, `"${value}"`);
        }
      }
    });

    // 3. 将 Excel 函数转换为 JavaScript 函数
    expr = expr.replace(/\bIF\s*\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/gi, 
      (match, cond, trueVal, falseVal) => {
        let trueExpr = trueVal.trim();
        let falseExpr = falseVal.trim();
        if (!trueExpr.startsWith('"') && !trueExpr.startsWith("'") && 
            !/[+\-*/()]/.test(trueExpr) && !/^\d/.test(trueExpr)) {
          trueExpr = `"${trueExpr}"`;
        }
        if (!falseExpr.startsWith('"') && !falseExpr.startsWith("'") && 
            !/[+\-*/()]/.test(falseExpr) && !/^\d/.test(falseExpr)) {
          falseExpr = `"${falseExpr}"`;
        }
        return `(${cond.trim()} ? ${trueExpr} : ${falseExpr})`;
      }
    );

    expr = expr.replace(/(["'][^"']*["'])\s*&\s*(["'][^"']*["'])/g, '$1 + $2');

    const excelFunctions = ['ROUND', 'SUM', 'AVERAGE', 'MAX', 'MIN', 'ABS', 'SQRT', 'POWER'];
    excelFunctions.forEach(func => {
      const regex = new RegExp(`\\b${func}\\s*\\(`, 'gi');
      if (regex.test(expr)) {
        if (FORMULAS[func]) {
          expr = expr.replace(regex, `FORMULAS.${func}(`);
        }
      }
    });

    try {
      const result = Function('"use strict"; const FORMULAS = arguments[0]; return (' + expr + ')')(FORMULAS);
      return result;
    } catch (err) {
      console.error('计算错误:', expr, err);
      try {
        // eslint-disable-next-line no-eval
        const result = eval(expr);
        return result;
      } catch (e) {
        console.error('备用计算也失败:', e);
        return '#ERROR!';
      }
    }
    
  } catch (err) {
    console.error('公式解析错误:', formula, err);
    return '#ERROR!';
  }
};

const ExcelEditor = () => {
  const [workbook, setWorkbook] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [cells, setCells] = useState([]); // 二维数组
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [cellInput, setCellInput] = useState('');
  const [cellDisplayValue, setCellDisplayValue] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [namedRanges, setNamedRanges] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [addressToNameMap, setAddressToNameMap] = useState({});
  const cellRefs = useRef({});
  const fileInputRef = useRef(null);

  const columns = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const columnToNumber = (col) => {
    let colNum = 0;
    for (let i = 0; i < col.length; i++) {
      colNum = colNum * 26 + (col.charCodeAt(i) - 64);
    }
    return colNum;
  };

  const numberToColumn = (num) => {
    let column = '';
    while (num > 0) {
      const remainder = (num - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      num = Math.floor((num - 1) / 26);
    }
    return column;
  };

  const getColumnLetter = (colNumber) => numberToColumn(colNumber);

  // 解析命名区域
  const parseNamedRangesWithXLSX = (wb) => {
    const ranges = [];
    if (wb.Workbook?.Names) {
      wb.Workbook.Names.forEach(nameObj => {
        const name = nameObj.Name;
        const ref = nameObj.Ref;
        if (!ref || !ref.includes('!')) return;
        const [sheetPart, addrPart] = ref.split('!');
        const cleanAddr = addrPart.replace(/\$/g, '');
        let address = cleanAddr;
        if (cleanAddr.includes(':')) {
          address = cleanAddr.split(':')[0];
        }
        ranges.push({ name, address, sheet: sheetPart.replace(/^'/, '').replace(/'$/, '') });
      });
    }
    setNamedRanges(ranges);
    const addrMap = {};
    ranges.forEach(nr => {
      addrMap[nr.address] = nr.name;
    });
    setAddressToNameMap(addrMap);
  };

  const buildSheetDataMap = (ws) => {
    const map = {};
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (cell) {
          map[addr] = { v: cell.v, f: cell.f };
        }
      }
    }
    return map;
  };

  const recalculateAllFormulas = () => {
    if (!cells.length) return;
    const ws = {};
    cells.forEach((row, r) => {
      row.forEach((cell, c) => {
        const addr = `${getColumnLetter(c + 1)}${r + 1}`;
        ws[addr] = { v: cell.value, f: cell.formula };
      });
    });

    const newCells = cells.map((row, r) =>
      row.map((cell, c) => {
        const addr = `${getColumnLetter(c + 1)}${r + 1}`;
        let displayValue = cell.value || '';
        if (cell.formula) {
          const result = evaluateFormula(`=${cell.formula}`, ws, namedRanges);
          displayValue = result != null ? String(result) : '#ERROR!';
        }
        return { ...cell, displayValue };
      })
    );
    setCells(newCells);
  };

  useEffect(() => {
    recalculateAllFormulas();
  }, [cells, namedRanges]);

  // 从ExcelJS直接获取数据有效性
  const getDataValidationsFromExcelJS = (wsExcelJS) => {
    const dvMap = {};
    
    console.log('=== 从ExcelJS获取数据有效性 ===');
    console.log('ExcelJS工作表:', wsExcelJS.name);
    console.log('数据有效性对象:', wsExcelJS.dataValidations);
    
    // ExcelJS的数据有效性模型存储方式
    if (wsExcelJS.dataValidations && wsExcelJS.dataValidations.model) {
      const model = wsExcelJS.dataValidations.model;
      console.log('数据有效性模型:', model);
      
      // 遍历所有单元格的数据有效性
      Object.keys(model).forEach(cellAddress => {
        const validation = model[cellAddress];
        if (validation && validation.type === 'list' && validation.formulae) {
          console.log(`单元格 ${cellAddress} 有数据有效性:`, validation);
          
          let options = [];
          // 处理formulae（可能是数组或字符串）
          if (Array.isArray(validation.formulae)) {
            validation.formulae.forEach(formula => {
              if (typeof formula === 'string' && formula.startsWith('"') && formula.endsWith('"')) {
                const str = formula.slice(1, -1);
                const formulaOptions = str.split(',').map(s => s.trim());
                options = options.concat(formulaOptions);
              }
            });
          } else if (typeof validation.formulae === 'string') {
            const formula = validation.formulae;
            if (formula.startsWith('"') && formula.endsWith('"')) {
              const str = formula.slice(1, -1);
              options = str.split(',').map(s => s.trim());
            }
          }
          
          if (options.length > 0) {
            dvMap[cellAddress] = { 
              type: 'list', 
              options: options 
            };
            console.log(`  为 ${cellAddress} 设置下拉选项:`, options);
          }
        }
      });
    }
    
    console.log('最终数据有效性映射:', dvMap);
    return dvMap;
  };

  const loadExcelFromPublic = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/template.xlsx');
      if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();

      // 1. 先用 XLSX 读取（用于解析命名区域）
      const workbookXLSX = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true, cellNF: true });
      const sheetName = workbookXLSX.SheetNames[0];
      const worksheetXLSX = workbookXLSX.Sheets[sheetName];

      // 2. 再用 ExcelJS 读取（用于解析数据有效性）
      const wbExcelJS = new ExcelJS.Workbook();
      await wbExcelJS.xlsx.load(arrayBuffer);
      const wsExcelJS = wbExcelJS.worksheets[0];

      // 3. 从ExcelJS获取数据有效性
      const dvMap = getDataValidationsFromExcelJS(wsExcelJS);

      setFileInfo({
        sheetName,
        rowCount: worksheetXLSX['!ref'] ? XLSX.utils.decode_range(worksheetXLSX['!ref']).e.r + 1 : 0,
        columnCount: worksheetXLSX['!ref'] ? XLSX.utils.decode_range(worksheetXLSX['!ref']).e.c + 1 : 0,
      });

      // 4. 使用ExcelJS的数据来解析工作表（关键修改！）
      parseWorksheetData(wsExcelJS, sheetName, dvMap);
      parseNamedRangesWithXLSX(workbookXLSX);

      setWorkbook(wbExcelJS);
      setWorksheet(wsExcelJS);
      
    } catch (err) {
      console.error('加载失败:', err);
      setError(`加载失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 修改：使用ExcelJS解析工作表数据
  const parseWorksheetData = (wsExcelJS, sheetName, dvMap = {}) => {
    console.log('=== 使用ExcelJS解析工作表数据 ===');
    
    // 从ExcelJS获取工作表尺寸
    const dimensions = wsExcelJS.dimensions;
    const maxRows = dimensions ? dimensions.bottom : 100;
    const maxCols = dimensions ? dimensions.right : 26;
    
    console.log(`工作表尺寸: ${maxRows}行 x ${maxCols}列`);

    // 创建列标题
    const columnHeaders = [];
    for (let c = 0; c < maxCols; c++) {
      columnHeaders.push({
        key: `col${c}`,
        label: getColumnLetter(c + 1),
        colIndex: c + 1,
      });
    }

    // 从ExcelJS获取所有单元格数据
    const cellData = [];
    for (let r = 0; r < maxRows; r++) {
      const rowData = [];
      for (let c = 0; c < maxCols; c++) {
        const address = `${getColumnLetter(c + 1)}${r + 1}`;
        const excelJSCell = wsExcelJS.getCell(address);
        
        let value = '';
        let formula = null;
        let cellType = 'text';
        
        // 从ExcelJS获取单元格值和公式
        if (excelJSCell.value) {
          if (excelJSCell.value.formula) {
            // 公式单元格
            formula = excelJSCell.value.formula;
            cellType = 'formula';
          } else {
            // 普通值
            value = String(excelJSCell.value);
            cellType = getCellTypeFromExcelJS(excelJSCell);
          }
        }
        
        // 获取数据有效性
        const dataValidation = dvMap[address] || null;

        rowData.push({
          id: `R${r + 1}C${c + 1}`,
          row: r + 1,
          col: c + 1,
          value: value,
          formula: formula,
          type: cellType,
          style: {},
          isHeader: r === 0,
          isEmpty: !value && !formula,
          displayValue: '',
          dataValidation, // 使用从ExcelJS获取的数据有效性
        });
      }
      cellData.push(rowData);
    }

    console.log(`解析完成: ${cellData.length}行 x ${columnHeaders.length}列`);
    setHeaders(columnHeaders);
    setCells(cellData);
  };

  // 根据ExcelJS单元格判断类型
  const getCellTypeFromExcelJS = (cell) => {
    if (!cell || !cell.value) return 'text';
    
    const value = cell.value;
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    return 'text';
  };

  const handleCellEdit = (rowIndex, colIndex, value) => {
    const newHistory = [...history.slice(0, historyIndex + 1)];
    newHistory.push({
      cells: cells.map(row => [...row]),
      activeCell,
      timestamp: new Date().toISOString()
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    const newCells = [...cells];
    const cell = newCells[rowIndex][colIndex];
    if (value.startsWith('=')) {
      cell.formula = value.substring(1);
      cell.value = '';
    } else {
      cell.formula = null;
      cell.value = value;
    }
    cell.isEmpty = !value && !cell.formula;
    setCells(newCells);
    setEditingCell(null);

    if (worksheet) {
      const wsRow = worksheet.getRow(rowIndex + 1);
      const wsCell = wsRow.getCell(colIndex + 1);
      if (value.startsWith('=')) {
        wsCell.value = { formula: value.substring(1) };
      } else {
        wsCell.value = value;
      }
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    const address = `${getColumnLetter(colIndex + 1)}${rowIndex + 1}`;
    setActiveCell(address);
    setEditingCell(address);
    const cell = cells[rowIndex]?.[colIndex];
    if (cell) {
      const inputValue = cell.formula ? `=${cell.formula}` : (cell.value || '');
      setCellInput(inputValue);
      setCellDisplayValue(cell.displayValue || cell.value || '');
    } else {
      setCellInput('');
      setCellDisplayValue('');
    }
  };

  const handleSelectChange = (rowIndex, colIndex, value) => {
    handleCellEdit(rowIndex, colIndex, value);
    setEditingCell(null);
  };

  const getCellDisplayContent = (cell, rowIndex, colIndex) => {
    const address = `${getColumnLetter(colIndex + 1)}${rowIndex + 1}`;
    if (editingCell === address) {
      return cell.formula ? `=${cell.formula}` : (cell.value || '');
    }
    return cell.displayValue || '';
  };

  const saveAndExportExcel = async () => {
    if (!workbook || !worksheet) return;
    try {
      setLoading(true);
      cells.forEach((row, r) => {
        row.forEach((cell, c) => {
          const wsCell = worksheet.getCell(r + 1, c + 1);
          if (cell.formula) {
            wsCell.value = { formula: cell.formula };
          } else {
            wsCell.value = cell.value;
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${worksheet.name}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3000);
    } catch (err) {
      console.error('保存失败:', err);
      setError(`保存失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setCells(prev.cells.map(r => [...r]));
      setActiveCell(prev.activeCell);
      setHistoryIndex(historyIndex - 1);
      const [col, rowStr] = (prev.activeCell || 'A1').match(/^([A-Z]+)(\d+)$/).slice(1);
      const row = parseInt(rowStr) - 1;
      const colIdx = columnToNumber(col) - 1;
      const cell = prev.cells[row]?.[colIdx];
      if (cell) {
        setCellInput(cell.formula ? `=${cell.formula}` : (cell.value || ''));
        setCellDisplayValue(cell.displayValue || cell.value || '');
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setCells(next.cells.map(r => [...r]));
      setActiveCell(next.activeCell);
      setHistoryIndex(historyIndex + 1);
      const [col, rowStr] = (next.activeCell || 'A1').match(/^([A-Z]+)(\d+)$/).slice(1);
      const row = parseInt(rowStr) - 1;
      const colIdx = columnToNumber(col) - 1;
      const cell = next.cells[row]?.[colIdx];
      if (cell) {
        setCellInput(cell.formula ? `=${cell.formula}` : (cell.value || ''));
        setCellDisplayValue(cell.displayValue || cell.value || '');
      }
    }
  };

  const addNewRow = () => {
    if (!cells.length || !headers.length) return;
    const newRow = [];
    const newRowIndex = cells.length;
    for (let col = 0; col < headers.length; col++) {
      newRow.push({
        id: `R${newRowIndex + 1}C${col + 1}`,
        row: newRowIndex + 1,
        col: col + 1,
        value: '',
        formula: null,
        type: 'text',
        style: {},
        isHeader: false,
        isEmpty: true,
        displayValue: '',
        dataValidation: null,
      });
    }
    setCells([...cells, newRow]);
  };

  const shouldHighlight = (cell) => {
    if (!searchTerm) return false;
    const searchValue = cell.value || cell.displayValue || '';
    return searchValue.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const getActiveCellContent = () => {
    if (!activeCell || !cells.length) return '';
    const [col, rowStr] = activeCell.match(/^([A-Z]+)(\d+)$/).slice(1);
    const row = parseInt(rowStr) - 1;
    const colIdx = columnToNumber(col) - 1;
    const cell = cells[row]?.[colIdx];
    return cell ? (cell.formula ? `=${cell.formula}` : cell.value || '') : '';
  };

  const handleInputBlur = () => {
    if (!activeCell) return;
    const [col, rowStr] = activeCell.match(/^([A-Z]+)(\d+)$/).slice(1);
    const rowIndex = parseInt(rowStr) - 1;
    const colIndex = columnToNumber(col) - 1;
    const cell = cells[rowIndex]?.[colIndex];
    const current = cell?.formula ? `=${cell.formula}` : (cell?.value || '');
    if (cellInput !== current) {
      handleCellEdit(rowIndex, colIndex, cellInput);
    }
  };

  const renderExcelGrid = () => {
    if (!cells.length || !headers.length) return null;
    return (
      <div className="excel-grid-container">
        <div className="excel-grid">
          <div className="excel-row header-row">
            <div className="excel-cell corner-cell"></div>
            {headers.map((header, colIndex) => (
              <div key={colIndex} className="excel-cell header-cell">{header.label}</div>
            ))}
          </div>
          {cells.map((row, rowIndex) => (
            <div key={rowIndex} className="excel-row">
              <div className="excel-cell row-header">{rowIndex + 1}</div>
              {row.map((cell, colIndex) => {
                const address = `${getColumnLetter(colIndex + 1)}${rowIndex + 1}`;
                const isActive = activeCell === address;
                const highlight = shouldHighlight(cell);
                const displayContent = getCellDisplayContent(cell, rowIndex, colIndex);

                // 检查是否有数据有效性（下拉列表）
                if (cell.dataValidation && cell.dataValidation.type === 'list' && cell.dataValidation.options && cell.dataValidation.options.length > 0) {
                  // 如果是当前正在编辑的单元格，显示下拉选择框
                  if (editingCell === address) {
                    return (
                      <div
                        key={cell.id}
                        className={`excel-cell ${isActive ? 'active' : ''} ${highlight ? 'highlighted' : ''}`}
                        onBlur={() => setEditingCell(null)}
                      >
                        <select
                          autoFocus
                          value={cell.value || ''}
                          onChange={(e) => {
                            handleCellEdit(rowIndex, colIndex, e.target.value);
                            setEditingCell(null);
                          }}
                          className="dv-select"
                          
                        >
                          <option value="">请选择</option>
                          {cell.dataValidation.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  } else {
                    // 如果不是编辑状态，显示当前值，点击后进入编辑模式
                    return (
                      <div
                        key={cell.id}
                        className={`excel-cell ${isActive ? 'active' : ''} ${highlight ? 'highlighted' : ''} dv-cell`}
                        onClick={() => {
                          setActiveCell(address);
                          setEditingCell(address);
                          setCellInput(cell.value || '');
                          setCellDisplayValue(cell.displayValue || cell.value || '');
                        }}
                        title="点击选择"
                      >
                        {cell.value || cell.displayValue || ''}
                      </div>
                    );
                  }
                }

                // 普通单元格
                return (
                  <div
                    key={cell.id}
                    ref={el => { if (el) cellRefs.current[cell.id] = el; }}
                    className={`excel-cell ${isActive ? 'active' : ''} ${cell.formula ? 'formula-cell' : ''} ${highlight ? 'highlighted' : ''}`}
                    contentEditable={!cell.isHeader}
                    suppressContentEditableWarning
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onBlur={() => {
                      const el = cellRefs.current[cell.id];
                      if (el) {
                        const newValue = el.textContent;
                        const current = cell.formula ? `=${cell.formula}` : (cell.value || '');
                        if (newValue !== current) {
                          handleCellEdit(rowIndex, colIndex, newValue);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (rowIndex < cells.length - 1) handleCellClick(rowIndex + 1, colIndex);
                      } else if (e.key === 'Tab') {
                        e.preventDefault();
                        if (colIndex < headers.length - 1) handleCellClick(rowIndex, colIndex + 1);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        const el = cellRefs.current[cell.id];
                        if (el) el.textContent = cell.displayValue || '';
                      }
                    }}
                    title={cell.formula ? `公式: =${cell.formula}` : ''}
                  >
                    {displayContent || (cell.isEmpty && !cell.isHeader ? '(空)' : '')}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="excel-editor">
      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-section">
          <button className="toolbar-btn primary" onClick={loadExcelFromPublic} disabled={loading}>
            <Icon type="load" /> 加载Excel
          </button>
          <button className="toolbar-btn success" onClick={saveAndExportExcel} disabled={!workbook || loading}>
            <Icon type="save" /> 下载Excel
          </button>
          <button className="toolbar-btn warning" onClick={undo} disabled={historyIndex <= 0}>
            <Icon type="load" /> 撤销
          </button>
          <button className="toolbar-btn info" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Icon type="save" /> 恢复
          </button>
        </div>
      </div>

      {/* 信息栏 */}
      <div className="info-bar">
        <div className="info-item">
          <span className="info-label">单元格:</span>
          <span className="info-value">{activeCell || '未选中'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">自定义名称:</span>
          <span className="info-value">{activeCell ? (addressToNameMap[activeCell] || '无') : '未选中'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">内容:</span>
          <span className="info-value content-value">{getActiveCellContent()}</span>
        </div>
        <div className="info-item">
          <span className="info-label">显示值:</span>
          <span className="info-value display-value">{cellDisplayValue || '空'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">公式:</span>
          <span className="info-value formula-display">
            {activeCell && cells.length > 0 ? (() => {
              const [col, rowStr] = activeCell.match(/^([A-Z]+)(\d+)$/).slice(1);
              const cell = cells[parseInt(rowStr) - 1]?.[columnToNumber(col) - 1];
              return cell?.formula ? `=${cell.formula}` : '无';
            })() : '无'}
          </span>
        </div>
      </div>

      {/* 编辑输入框 */}
      <div className="cell-input-bar">
        <div className="info-item">
          <span className="info-label">编辑:</span>
          <input
            type="text"
            className="cell-input"
            value={cellInput}
            onChange={(e) => setCellInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && activeCell) {
                e.preventDefault();
                const [col, rowStr] = activeCell.match(/^([A-Z]+)(\d+)$/).slice(1);
                handleCellEdit(parseInt(rowStr) - 1, columnToNumber(col) - 1, cellInput);
              }
            }}
            onBlur={handleInputBlur}
            placeholder="输入值或公式（以=开头）"
          />
        </div>
      </div>

      {/* 表格 */}
      {renderExcelGrid()}

      {/* 工作表信息 */}
      <div className="sheet-info">
        <div className="sheet-name">{fileInfo ? `工作表: ${fileInfo.sheetName}` : '未加载文件'}</div>
        {fileInfo && (
          <div className="sheet-stats">
            <span>行数: {cells.length}</span>
            <span>列数: {headers.length}</span>
            <span>公式单元格: {cells.flat().filter(cell => cell.formula).length}</span>
          </div>
        )}
      </div>

      {/* 状态提示 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div>处理中...</div>
        </div>
      )}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      {showSaveNotification && (
        <div className="save-notification">文件已保存并开始下载！</div>
      )}
    </div>
  );
};

export default ExcelEditor;