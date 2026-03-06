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


// 公式求值器（修复版，支持命名区域）
// 公式求值器（修复版，直接支持命名区域）
const evaluateFormula = (formula, sheetData, namedRanges = []) => {
  if (!formula || typeof formula !== 'string') {
    console.log('公式为空或不是字符串:', formula);
    return null;
  }

  try {
    let evalExpr = formula;

    // 如果公式以 = 开头，去掉它
    if (evalExpr.startsWith('=')) {
      evalExpr = evalExpr.substring(1);
    }

    console.log('=== 开始计算公式 ===');
    console.log('原始公式:', formula);
    console.log('处理公式:', evalExpr);

    if (!namedRanges || namedRanges.length === 0) {
      console.warn('没有命名区域信息');
    } else {
      console.log('传入的命名区域:', namedRanges);
    }

    // 创建命名区域映射
    const namedRangeValues = {};
    namedRanges.forEach(range => {
      console.log(`处理命名区域 ${range.name}:`, range);

      // 获取命名区域的值
      let value = range.value;
      if (value === undefined || value === null || value === '') {
        // 如果命名区域没有值，尝试从单元格获取
        const cell = sheetData[range.address];
        if (cell && cell.v != null) {
          value = cell.v;
          console.log(`从单元格 ${range.address} 获取值:`, value);
        } else {
          value = 0; // 默认值
          console.log(`命名区域 ${range.name} 使用默认值:`, value);
        }
      } else {
        console.log(`命名区域 ${range.name} 已有值:`, value);
      }

      // 转换为数字如果可能
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        namedRangeValues[range.name] = numValue;
        console.log(`命名区域 ${range.name} 数值:`, numValue);
      } else {
        namedRangeValues[range.name] = 0; // 非数字作为0处理
        console.log(`命名区域 ${range.name} 非数值，转为0`);
      }
    });

    console.log('命名区域映射表:', namedRangeValues);

    // 先替换命名区域为它们的值
    Object.keys(namedRangeValues).forEach(name => {
      // 使用单词边界确保完整匹配
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      if (regex.test(evalExpr)) {
        const oldExpr = evalExpr;
        evalExpr = evalExpr.replace(regex, namedRangeValues[name]);
        console.log(`替换命名区域: ${name} -> ${namedRangeValues[name]}`);
        console.log(`替换前: ${oldExpr}`);
        console.log(`替换后: ${evalExpr}`);
      }
    });

    console.log('替换命名区域后表达式:', evalExpr);

    // 提取单元格引用
    const refs = extractReferencesFromFormula(evalExpr);
    console.log('单元格引用:', refs);

    const replacements = {};

    for (const ref of refs) {
      const cell = sheetData[ref];
      let val = 0;

      if (cell && cell.v != null) {
        console.log(`单元格 ${ref} 值:`, cell.v, '类型:', typeof cell.v);
        if (typeof cell.v === 'number') {
          val = cell.v;
        } else if (typeof cell.v === 'string') {
          const num = parseFloat(cell.v);
          if (!isNaN(num) && cell.v.trim() !== '') {
            val = num;
          } else {
            console.log(`单元格 ${ref} 非数字字符串:`, cell.v);
          }
        }
      } else {
        console.log(`单元格 ${ref} 无值`);
      }

      replacements[ref] = val;
    }

    console.log('单元格值映射:', replacements);

    // 替换单元格引用
    const sortedRefs = Object.keys(replacements).sort((a, b) => b.length - a.length);
    for (const ref of sortedRefs) {
      const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedRef}\\b`, 'g');
      const oldExpr = evalExpr;
      evalExpr = evalExpr.replace(regex, replacements[ref]);
      if (oldExpr !== evalExpr) {
        console.log(`替换单元格引用: ${ref} -> ${replacements[ref]}`);
      }
    }

    console.log('替换所有引用后表达式:', evalExpr);

    // 处理 Excel 函数
    const functionRegex = /\b([A-Z_][A-Z0-9_]*)\(/g;
    let transformedExpr = evalExpr;
    const functionMatches = [...new Set(evalExpr.match(functionRegex) || [])];

    console.log('函数匹配:', functionMatches);

    for (const match of functionMatches) {
      const functionName = match.slice(0, -1);
      console.log(`检查函数: ${functionName}`, FORMULAS[functionName]);
      if (FORMULAS[functionName]) {
        const regex = new RegExp(`\\b${functionName}\\(`, 'g');
        transformedExpr = transformedExpr.replace(regex, `FORMULAS.${functionName}(`);
        console.log(`替换函数: ${functionName} -> FORMULAS.${functionName}`);
      }
    }

    console.log('转换函数后表达式:', transformedExpr);

    // 执行计算
    if (!transformedExpr.trim()) {
      console.log('表达式为空');
      return '';
    }

    console.log('准备执行计算:', transformedExpr);

    const result = Function('"use strict"; const FORMULAS = arguments[0]; return (' + transformedExpr + ')').call(null, FORMULAS);
    console.log('计算结果:', result);
    console.log('=== 计算结束 ===');
    return result;

  } catch (error) {
    console.error('公式计算失败:', formula, error);
    console.error('错误堆栈:', error.stack);
    return '#ERROR!';
  }
};

// 提取公式中引用的所有单元格和命名区域
const extractAllReferencesFromFormula = (formula, namedRanges = []) => {
  if (!formula) return [];

  const refs = new Set();

  // 1. 先查找命名区域
  namedRanges.forEach(range => {
    const regex = new RegExp(`\\b${range.name}\\b`, 'gi');
    if (regex.test(formula)) {
      refs.add(range.address); // 添加单元格地址
      console.log(`公式 ${formula} 引用命名区域 ${range.name} -> ${range.address}`);
    }
  });

  // 2. 再查找直接的单元格引用（原有的逻辑）
  const cleanFormula = formula.replace(/"[^"]*"/g, '');
  const rangeRegex = /(?:\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?)/gi;
  const matches = cleanFormula.match(rangeRegex) || [];

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

// 使用新的函数构建依赖图
const buildDependencyGraph = (ws, namedRanges = []) => {
  console.log('=== 构建依赖图（新） ===');
  const allCells = Object.keys(ws).filter(key => !key.startsWith('!'));
  const graph = {};

  // 初始化所有单元格
  allCells.forEach(cell => {
    graph[cell] = [];
  });

  // 遍历所有单元格，查找有公式的单元格
  allCells.forEach(cell => {
    const cellData = ws[cell];
    const formula = cellData?.f;

    if (formula) {
      console.log(`单元格 ${cell} 有公式: ${formula}`);

      // 使用新的函数提取所有引用（包括命名区域）
      const refs = extractAllReferencesFromFormula(formula, namedRanges);
      console.log(`公式 ${formula} 的所有引用:`, refs);

      refs.forEach(ref => {
        if (graph[ref] && !graph[ref].includes(cell)) {
          graph[ref].push(cell);
          console.log(`添加依赖: ${ref} -> ${cell}`);
        }
      });
    }
  });

  console.log('构建的依赖图:', graph);
  return graph;
};


// 递归重算依赖单元格
const recalculateDependents = (changedCell, ws, dependencyGraph, namedRanges) => {
  const visited = new Set();
  const queue = [changedCell];

  console.log('=== 开始重新计算依赖 ===');
  console.log('触发单元格:', changedCell);
  console.log('依赖图:', dependencyGraph);
  console.log('命名区域:', namedRanges);

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    console.log(`处理单元格: ${current}`);

    const dependents = dependencyGraph[current] || [];
    console.log(`单元格 ${current} 的依赖项:`, dependents);

    for (const dep of dependents) {
      const formula = ws[dep]?.f;
      if (formula) {
        console.log(`--- 重新计算单元格 ${dep} ---`);
        console.log(`公式: ${formula}`);
        console.log('工作表数据:', ws);

        const newValue = evaluateFormula(formula, ws, namedRanges);
        console.log(`单元格 ${dep} 新值:`, newValue);

        if (ws[dep]) {
          ws[dep].v = newValue;
          ws[dep].t = typeof newValue === 'number' ? 'n' : 's';
          console.log(`更新单元格 ${dep}: v=${newValue}, t=${typeof newValue === 'number' ? 'n' : 's'}`);
        }
        queue.push(dep);
      } else {
        console.log(`单元格 ${dep} 无公式`);
      }
    }
  }

  console.log('=== 依赖计算结束 ===');
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

  //撤销 恢复  ↓
  const [undoStack, setUndoStack] = useState([]); // 历史状态栈
  const [redoStack, setRedoStack] = useState([]); // 重做栈
  // 深拷贝工作表（仅当前 activeSheet 的 ws 数据）
  const createSheetSnapshot = useCallback((wb, sheetName) => {
    const ws = wb.Sheets[sheetName];
    return JSON.parse(JSON.stringify(ws)); // 简单深拷贝（适用于无函数/日期等复杂类型）
  }, []);
  
  const undo = () => {
    if (undoStack.length === 0) return;

    const lastState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    // 当前状态推入 redo 栈
    const currentSnapshot = createSheetSnapshot(workbook, activeSheet);
    setRedoStack(prev => [...prev, currentSnapshot]);

    // 恢复上一个状态
    const newWorkbook = { ...workbook };
    newWorkbook.Sheets[activeSheet] = JSON.parse(JSON.stringify(lastState));

    setWorkbook(newWorkbook);
    setUndoStack(newUndoStack);

    // 同步更新 namedRanges 和 formValues（重新提取）
    extractCurrentSheetNamedRanges(newWorkbook, activeSheet);
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    // 当前状态推入 undo 栈
    const currentSnapshot = createSheetSnapshot(workbook, activeSheet);
    setUndoStack(prev => [...prev, currentSnapshot]);

    const newWorkbook = { ...workbook };
    newWorkbook.Sheets[activeSheet] = JSON.parse(JSON.stringify(nextState));

    setWorkbook(newWorkbook);
    setRedoStack(newRedoStack);

    extractCurrentSheetNamedRanges(newWorkbook, activeSheet);
  };

  //撤销 恢复  上

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
    const ws = wb.Sheets[sheetName];

    currentSheetRanges.forEach(range => {
      // 从工作表中获取实际值
      const cell = ws?.[range.address];
      const cellValue = cell?.v?.toString() || '';
      newFormValues[range.name] = cellValue;

      // 更新命名区域的值
      range.value = cellValue;
    });

    setFormValues(newFormValues);

    // ✅ 构建当前工作表的依赖图
    if (ws) {
      dependencyGraphRef.current[sheetName] = buildDependencyGraph(ws, currentSheetRanges);
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
  const saveCellEditToSheet = (sheetName, cellAddress, value, currentNamedRanges) => {
    if (!workbook) return;
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;

    console.log(`保存到工作表 ${sheetName} 单元格 ${cellAddress}: ${value}`);

    if (!ws[cellAddress]) ws[cellAddress] = {};

    ws[cellAddress].f = undefined;

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && value !== '') {
      ws[cellAddress].v = numValue;
      ws[cellAddress].t = 'n';
    } else {
      ws[cellAddress].v = value === '' ? null : value;
      ws[cellAddress].t = 's';
    }

    // ✅ 使用传入的 currentNamedRanges，确保是最新的
    const graph = dependencyGraphRef.current[sheetName];
    if (graph) {
      recalculateDependents(cellAddress, ws, graph, currentNamedRanges);
    }
  };

  const saveCellEdit = (cellAddress, value) => {
    if (!workbook || !activeSheet) return;

    // ✅ 1. 保存当前状态到 undoStack
    const currentSnapshot = createSheetSnapshot(workbook, activeSheet);
    setUndoStack(prev => [...prev, currentSnapshot]);
    setRedoStack([]); // 清空 redo 栈（新操作打断历史）

    // ... 原有逻辑不变 ...
    let newNamedRanges = [...namedRanges];
    const namedRange = newNamedRanges.find(r => r.address === cellAddress && r.sheet === activeSheet);
    if (namedRange) {
      namedRange.value = value;
    }

    saveCellEditToSheet(activeSheet, cellAddress, value, newNamedRanges);

    setWorkbook({ ...workbook });
    if (namedRange) {
      setFormValues(prev => ({ ...prev, [namedRange.name]: value }));
      setNamedRanges(newNamedRanges);
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
    console.log(`表单变化: ${name} = ${value}`);

    if (!workbook) return;

    const namedRange = namedRanges.find(range => range.name === name);
    if (!namedRange) {
      console.warn(`未找到命名区域: ${name}`);
      return;
    }

    // ✅ 1. 保存快照
    const currentSnapshot = createSheetSnapshot(workbook, activeSheet);
    setUndoStack(prev => [...prev, currentSnapshot]);
    setRedoStack([]);

    const newNamedRanges = namedRanges.map(range =>
      range.name === name ? { ...range, value } : range
    );

    saveCellEditToSheet(namedRange.sheet, namedRange.address, value, newNamedRanges);

    setFormValues(prev => ({ ...prev, [name]: value }));
    setNamedRanges(newNamedRanges);
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
                onClick={undo}
                disabled={undoStack.length === 0}
                title="撤销 (Ctrl+Z)"
              >
                <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-chexiao1"></use> {/* 替换为你自己的图标 */}
                </svg>
              </button>
              <button
                className={styles.toolbarBtn}
                onClick={redo}
                disabled={redoStack.length === 0}
                title="重做 (Ctrl+Y)"
              >
                <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-huifu"></use>
                </svg>
              </button>


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