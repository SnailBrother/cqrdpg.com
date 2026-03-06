import React, { useState, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import * as FORMULAS from 'formulajs';
import styles from './ExcelEditing.module.css';
import { useShareExcelWordData } from '../../../context/ShareExcelWordData';
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

// A1 转 {r, c}
const parseCellRef = (ref) => {
  if (!ref) return null;
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const colStr = match[1];
  const row = parseInt(match[2], 10) - 1;
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return { r: row, c: col - 1 };
};

// {r, c} 转 A1
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

// 提取公式中的单元格引用
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
// 判断 cellAddress 是否在任意命名区域内 用于判断某个单元格地址是否属于任何命名区域（注意命名区域可能是单个单元格或范围）
const isCellInNamedRange = (cellAddress, namedRanges, sheetName) => {
  return namedRanges.some(nr => {
    if (nr.sheet !== sheetName) return false;

    const rangePart = nr.address;
    if (!rangePart.includes(':')) {
      // 单元格命名区域，如 "C2"
      return rangePart === cellAddress;
    } else {
      // 范围命名区域，如 "B8:B11" 或 "buildingArea:valuationPrice"（但后者已转为地址）
      const [start, end] = rangePart.split(':');
      const startCell = parseCellRef(start);
      const endCell = parseCellRef(end);
      const targetCell = parseCellRef(cellAddress);

      if (!startCell || !endCell || !targetCell) return false;

      return (
        targetCell.r >= startCell.r &&
        targetCell.r <= endCell.r &&
        targetCell.c >= startCell.c &&
        targetCell.c <= endCell.c
      );
    }
  });
};
// 公式求值器
// 公式求值器 - 只修改SUM函数处理部分
const evaluateFormula = (formula, sheetData, namedRanges = []) => {
  if (!formula || typeof formula !== 'string') return null;

  try {
    let expr = formula.startsWith('=') ? formula.substring(1) : formula;

    // 1. 处理命名区域引用（包括范围和单个单元格）
    namedRanges.forEach(nr => {
      // 查找所有对该命名区域的引用
      const regex = new RegExp(`\\b${nr.name}\\b`, 'gi');
      const matches = expr.match(regex);
      if (matches) {
        matches.forEach(() => {
          // 替换命名区域引用为实际单元格地址
          expr = expr.replace(new RegExp(`\\b${nr.name}\\b`, 'i'), nr.address);
        });
      }
    });

    // 2. 特殊处理 SUM 函数（支持单元格范围和命名区域范围）
    const sumRegex = /\bSUM\s*\(\s*([^)]+?)\s*\)/gi;
    let sumMatch;
    while ((sumMatch = sumRegex.exec(expr)) !== null) {
      const original = sumMatch[0];
      const rangeStr = sumMatch[1];

      // 处理范围（可能是 A1:B10 或 buildingArea:valuationPrice）
      if (rangeStr.includes(':')) {
        const [startRef, endRef] = rangeStr.split(':').map(s => s.trim());

        let startCell, endCell;

        // 检查是否是命名区域
        const startNamedRange = namedRanges.find(nr => nr.name.toLowerCase() === startRef.toLowerCase());
        const endNamedRange = namedRanges.find(nr => nr.name.toLowerCase() === endRef.toLowerCase());

        if (startNamedRange && endNamedRange) {
          // 命名区域范围，如 buildingArea:valuationPrice
          startCell = parseCellRef(startNamedRange.address);
          endCell = parseCellRef(endNamedRange.address);
        } else {
          // 单元格范围，如 B8:B11
          startCell = parseCellRef(startRef);
          endCell = parseCellRef(endRef);
        }

        if (startCell && endCell) {
          let sum = 0;
          let hasValue = false;

          // 计算范围内的所有单元格
          for (let r = startCell.r; r <= endCell.r; r++) {
            for (let c = startCell.c; c <= endCell.c; c++) {
              const cellAddress = `${numberToColumn(c + 1)}${r + 1}`;
              const cell = sheetData[cellAddress];

              if (cell) {
                let value = cell.v || cell.value || '';
                if (cell.f) {
                  value = evaluateFormula(`=${cell.f}`, sheetData, namedRanges) || '';
                }

                const num = parseFloat(value);
                if (!isNaN(num) && value !== '') {
                  sum += num;
                  hasValue = true;
                }
              }
            }
          }

          // 用计算结果替换 SUM 函数
          expr = expr.replace(original, hasValue ? sum.toString() : '0');
        }
      } else {
        // 单个单元格或值
        const cell = sheetData[rangeStr];
        if (cell) {
          let value = cell.v || cell.value || '';
          if (cell.f) {
            value = evaluateFormula(`=${cell.f}`, sheetData, namedRanges) || '';
          }
          const num = parseFloat(value);
          if (!isNaN(num) && value !== '') {
            expr = expr.replace(original, num.toString());
          }
        }
      }
    }

    // 3. 替换单元格引用（包括范围）
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

    // 4. IF 函数转换（保持不变）
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
        return `(${cond.trim()} ? ${trueExpr} : ${falseVal.trim()})`;
      }
    );

    // 5. 字符串连接符
    expr = expr.replace(/(["'][^"']*["'])\s*&\s*(["'][^"']*["'])/g, '$1 + $2');

    // 6. 其他 Excel 函数
    const excelFunctions = ['ROUND', 'AVERAGE', 'MAX', 'MIN', 'ABS', 'SQRT', 'POWER'];
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
      try {
        // eslint-disable-next-line no-eval
        const result = eval(expr);
        return result;
      } catch (e) {
        return '#ERROR!';
      }
    }
  } catch (err) {
    console.error('Formula evaluation error:', err);
    return '#ERROR!';
  }
};

// 辅助函数
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
  return ranges;
};

// 从 ExcelJS 获取数据有效性
const getDataValidationsFromExcelJS = (wsExcelJS) => {
  const dvMap = {};
  if (wsExcelJS.dataValidations?.model) {
    Object.keys(wsExcelJS.dataValidations.model).forEach(addr => {
      const v = wsExcelJS.dataValidations.model[addr];
      if (v.type === 'list' && v.formulae) {
        let options = [];
        if (Array.isArray(v.formulae)) {
          v.formulae.forEach(f => {
            if (typeof f === 'string' && f.startsWith('"') && f.endsWith('"')) {
              options = options.concat(f.slice(1, -1).split(',').map(s => s.trim()));
            }
          });
        } else if (typeof v.formulae === 'string' && v.formulae.startsWith('"') && v.formulae.endsWith('"')) {
          options = v.formulae.slice(1, -1).split(',').map(s => s.trim());
        }
        if (options.length > 0) {
          dvMap[addr] = { type: 'list', options };
        }
      }
    });
  }
  return dvMap;
};

// 根据 ExcelJS 单元格判断类型
const getCellTypeFromExcelJS = (cell) => {
  if (!cell || !cell.value) return 'text';
  const val = cell.value;
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (val instanceof Date) return 'date';
  return 'text';
};

// 主组件
const ExcelEditor = () => {
  const { dispatch } = useShareExcelWordData();
  const [workbook, setWorkbook] = useState(null); // ExcelJS.Workbook 实例
  const [currentSheetName, setCurrentSheetName] = useState('');
  const [sheetNames, setSheetNames] = useState([]);
  const [namedRanges, setNamedRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [cellInput, setCellInput] = useState('');
  const [cellDisplayValue, setCellDisplayValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [history, setHistory] = useState({});
  const [historyIndex, setHistoryIndex] = useState({});
  const fileInputRef = useRef(null);
  const cellRefs = useRef({});

  // 列字母
  const columns = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // 加载模板
  const loadExcelFromPublic = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/template.xlsx');
      if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();

      // XLSX 用于命名区域 & 基础数据
      const wbXLSX = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true });
      // ExcelJS 用于保留完整 workbook（含验证、样式等）
      const wbExcelJS = new ExcelJS.Workbook();
      await wbExcelJS.xlsx.load(arrayBuffer);

      const allSheetNames = wbXLSX.SheetNames;
      setSheetNames(allSheetNames);

      // 解析命名区域（全局）
      const globalNamedRanges = parseNamedRangesWithXLSX(wbXLSX);
      setNamedRanges(globalNamedRanges);

      // 构建 cells 结构（仅用于 UI 渲染和计算）
      const newExcelData = {};
      for (const name of allSheetNames) {
        const wsXLSX = wbXLSX.Sheets[name];
        const wsExcelJS = wbExcelJS.getWorksheet(name);
        if (!wsExcelJS) continue;

        // let maxRows = 100, maxCols = 26;
        // if (wsXLSX && wsXLSX['!ref']) {
        //   const range = XLSX.utils.decode_range(wsXLSX['!ref']);
        //   maxRows = range.e.r + 1;
        //   maxCols = range.e.c + 1;
        // } else if (wsExcelJS.dimensions) {
        //   maxRows = wsExcelJS.dimensions.bottom;
        //   maxCols = wsExcelJS.dimensions.right;
        // }
        let actualMaxRows = 100; // 最少100行
        let actualMaxCols = 30; // 最少30列

        if (wsXLSX && wsXLSX['!ref']) {
          const range = XLSX.utils.decode_range(wsXLSX['!ref']);
          actualMaxRows = Math.max(actualMaxRows, range.e.r + 1);
          actualMaxCols = Math.max(actualMaxCols, range.e.c + 1);
        } else if (wsExcelJS.dimensions) {
          actualMaxRows = Math.max(actualMaxRows, wsExcelJS.dimensions.bottom || 0);
          actualMaxCols = Math.max(actualMaxCols, wsExcelJS.dimensions.right || 0);
        }

        const maxRows = actualMaxRows;
        const maxCols = actualMaxCols;


        const dvMap = getDataValidationsFromExcelJS(wsExcelJS);

        const headers = Array.from({ length: maxCols }, (_, i) => ({
          label: getColumnLetter(i + 1),
          colIndex: i + 1,
        }));

        const cells = Array.from({ length: maxRows }, (_, r) =>
          Array.from({ length: maxCols }, (_, c) => {
            const addr = `${getColumnLetter(c + 1)}${r + 1}`;
            let value = '', formula = null, type = 'text';
            try {
              const excelJSCell = wsExcelJS.getCell(addr);
              if (excelJSCell.value) {
                if (excelJSCell.value.formula) {
                  formula = excelJSCell.value.formula;
                  type = 'formula';
                } else {
                  value = String(excelJSCell.value);
                  type = getCellTypeFromExcelJS(excelJSCell);
                }
              }
            } catch (e) { }

            return {
              id: `R${r + 1}C${c + 1}`,
              row: r + 1,
              col: c + 1,
              value,
              formula,
              type,
              isEmpty: !value && !formula,
              displayValue: '',
              dataValidation: dvMap[addr] || null,
            };
          })
        );

        newExcelData[name] = { cells, headers, dvMap };
      }

      setWorkbook(wbExcelJS); // 保存原始 workbook
      setExcelData(newExcelData);
      if (allSheetNames.length > 0) {
        setCurrentSheetName(allSheetNames[0]);
      }

      const initHistory = {};
      const initHistoryIndex = {};
      allSheetNames.forEach(name => {
        initHistory[name] = [];
        initHistoryIndex[name] = -1;
      });
      setHistory(initHistory);
      setHistoryIndex(initHistoryIndex);



      // 构建用于共享的完整数据结构 这样 fullWorkbookData 就包含了所有单元格的完整信息 这会把所有单元格都加载进 fullWorkbookData。但如果你希望 初始共享数据也只包含命名区域中的单元格
      // const workbookDataForSharing = {};
      // for (const name of allSheetNames) {
      //   const sheet = newExcelData[name];
      //   if (!sheet) continue;
      //   workbookDataForSharing[name] = {};
      //   sheet.cells.forEach((row, r) => {
      //     row.forEach((cell, c) => {
      //       const addr = `${getColumnLetter(c + 1)}${r + 1}`;
      //       workbookDataForSharing[name][addr] = {
      //         value: cell.value || '',
      //         formula: cell.formula || null,
      //         type: cell.type || 'text',
      //         displayValue: cell.displayValue || '',
      //         dataValidation: cell.dataValidation || null,
      //         isEmpty: cell.isEmpty,
      //       };
      //     });
      //   });
      // }
      // 构建用于共享的完整数据结构 —— 仅包含命名区域中的单元格
      const workbookDataForSharing = {};
      for (const name of allSheetNames) {
        const sheet = newExcelData[name];
        if (!sheet) continue;

        // 获取当前工作表的所有命名区域地址集合
        const namedAddresses = new Set();
        namedRanges
          .filter(nr => nr.sheet === name)
          .forEach(nr => {
            if (!nr.address.includes(':')) {
              namedAddresses.add(nr.address);
            } else {
              const [start, end] = nr.address.split(':');
              const startCell = parseCellRef(start);
              const endCell = parseCellRef(end);
              if (startCell && endCell) {
                for (let r = startCell.r; r <= endCell.r; r++) {
                  for (let c = startCell.c; c <= endCell.c; c++) {
                    namedAddresses.add(encodeCellRef({ r, c }));
                  }
                }
              }
            }
          });

        workbookDataForSharing[name] = {};
        sheet.cells.forEach((row, r) => {
          row.forEach((cell, c) => {
            const addr = `${getColumnLetter(c + 1)}${r + 1}`;
            if (namedAddresses.has(addr)) {
              // 构建用于求值的临时 map（仅当前 sheet 命名区域）
              const tempSheetMap = {};
              namedAddresses.forEach(a => {
                const [c, rStr] = a.match(/^([A-Z]+)(\d+)$/).slice(1);
                const r = parseInt(rStr) - 1;
                const cIdx = columnToNumber(c) - 1;
                const sourceCell = sheet.cells[r]?.[cIdx];
                if (sourceCell) {
                  tempSheetMap[a] = {
                    v: sourceCell.value || '',
                    f: sourceCell.formula,
                  };
                }
              });

              let displayValue = cell.value || '';
              if (cell.formula) {
                const result = evaluateFormula(`=${cell.formula}`, tempSheetMap, namedRanges);
                displayValue = result != null ? String(result) : '#ERROR!';
              }

              workbookDataForSharing[name][addr] = {
                value: cell.formula ? '' : (cell.value || ''),
                formula: cell.formula || null,
                type: cell.type || 'text',
                displayValue,
                dataValidation: cell.dataValidation || null,
                isEmpty: cell.isEmpty,
              };
            }
          });
        });
      }

      //样 fullWorkbookData 就只包含命名区域内的单元格了
      // 👇 分发到全局状态
      dispatch({
        type: 'LOAD_ENTIRE_WORKBOOK',
        payload: { workbookData: workbookDataForSharing },
      });

      // 👇 新增：同步到全局 context
      dispatch({
        type: 'LOAD_NAMED_RANGES',
        payload: { namedRanges: globalNamedRanges },
      });

    } catch (err) {
      console.error('加载失败:', err);
      setError(`加载失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 新增状态：存储 UI 用的 cells 数据
  const [excelData, setExcelData] = useState({});

  // 重新计算当前工作表的所有公式
  const recalculateCurrentSheet = () => {
    const sheet = excelData[currentSheetName];
    if (!sheet) return;

    const { cells } = sheet;
    const wsMap = {};
    cells.forEach((row, r) => {
      row.forEach((cell, c) => {
        const addr = `${getColumnLetter(c + 1)}${r + 1}`;
        wsMap[addr] = { v: cell.value, f: cell.formula };
      });
    });

    const newCells = cells.map((row, r) =>
      row.map((cell, c) => {
        let displayValue = cell.value || '';
        if (cell.formula) {
          const result = evaluateFormula(`=${cell.formula}`, wsMap, namedRanges);
          displayValue = result != null ? String(result) : '#ERROR!';
        }
        return { ...cell, displayValue };
      })
    );

    setExcelData(prev => ({
      ...prev,
      [currentSheetName]: { ...prev[currentSheetName], cells: newCells }
    }));
  };

  useEffect(() => {
    if (currentSheetName && excelData[currentSheetName]) {
      recalculateCurrentSheet();
    }
  }, [excelData, currentSheetName, namedRanges]);

  // 编辑单元格（同时更新 ExcelJS workbook）
  const handleCellEdit = (rowIndex, colIndex, value) => {
    const sheet = excelData[currentSheetName];
    if (!sheet || !workbook) return;

    // 保存历史
    const currentHistory = [...(history[currentSheetName] || []).slice(0, (historyIndex[currentSheetName] || -1) + 1)];
    currentHistory.push({
      cells: sheet.cells.map(r => [...r]),
      activeCell,
      timestamp: new Date().toISOString()
    });
    setHistory(prev => ({ ...prev, [currentSheetName]: currentHistory }));
    setHistoryIndex(prev => ({ ...prev, [currentSheetName]: currentHistory.length - 1 }));

    // 更新 UI 数据
    const newCells = [...sheet.cells];
    const cell = newCells[rowIndex][colIndex];
    if (value.startsWith('=')) {
      cell.formula = value.substring(1);
      cell.value = '';
    } else {
      cell.formula = null;
      cell.value = value;
    }
    cell.isEmpty = !value && !cell.formula;

    setExcelData(prev => ({
      ...prev,
      [currentSheetName]: { ...prev[currentSheetName], cells: newCells }
    }));

    // 同步更新 ExcelJS workbook
    const ws = workbook.getWorksheet(currentSheetName);
    const wsCell = ws.getCell(rowIndex + 1, colIndex + 1);
    if (value.startsWith('=')) {
      wsCell.value = { formula: value.substring(1) };
    } else {
      wsCell.value = value;
    }

    setEditingCell(null);

    const address = `${getColumnLetter(colIndex + 1)}${rowIndex + 1}`;

    // ✅ 构建用于公式求值的 sheet 数据映射（仅命名区域内的单元格）
    const buildSheetMapForEvaluation = (sheetName) => {
      const sheetMap = {};
      const sheetData = excelData[sheetName]?.cells;
      if (!sheetData) return sheetMap;

      // 获取当前工作表所有命名区域地址
      const namedAddresses = new Set();
      namedRanges
        .filter(nr => nr.sheet === sheetName)
        .forEach(nr => {
          if (!nr.address.includes(':')) {
            namedAddresses.add(nr.address);
          } else {
            const [start, end] = nr.address.split(':');
            const startCell = parseCellRef(start);
            const endCell = parseCellRef(end);
            if (startCell && endCell) {
              for (let r = startCell.r; r <= endCell.r; r++) {
                for (let c = startCell.c; c <= endCell.c; c++) {
                  namedAddresses.add(encodeCellRef({ r, c }));
                }
              }
            }
          }
        });

      sheetData.forEach((row, r) => {
        row.forEach((cell, c) => {
          const addr = `${getColumnLetter(c + 1)}${r + 1}`;
          if (namedAddresses.has(addr)) {
            sheetMap[addr] = {
              v: cell.value || '',
              f: cell.formula,
            };
          }
        });
      });

      return sheetMap;
    };

    // ✅ 计算 displayValue
    let computedDisplayValue = value;
    if (value.startsWith('=')) {
      const formula = value.substring(1);
      const sheetMap = buildSheetMapForEvaluation(currentSheetName);
      const result = evaluateFormula(`=${formula}`, sheetMap, namedRanges);
      computedDisplayValue = result != null ? String(result) : '#ERROR!';
    } else {
      computedDisplayValue = value;
    }

    // ✅ 仅当该单元格属于某个命名区域时，才同步到全局
    if (isCellInNamedRange(address, namedRanges, currentSheetName)) {
      dispatch({
        type: 'UPDATE_CELL',
        payload: {
          sheetName: currentSheetName,
          address,
          value: value.startsWith('=') ? '' : value, // value 字段存原始输入（非公式部分）
          formula: value.startsWith('=') ? value.substring(1) : null,
          displayValue: computedDisplayValue,
          type: value.startsWith('=') ? 'formula' : typeof value === 'number' ? 'number' : 'text',
        },
      });
    }
  };

  // 单元格点击
  const handleCellClick = (rowIndex, colIndex) => {
    const address = `${getColumnLetter(colIndex + 1)}${rowIndex + 1}`;
    setActiveCell(address);
    setEditingCell(address);
    const sheet = excelData[currentSheetName];
    const cell = sheet?.cells?.[rowIndex]?.[colIndex];
    if (cell) {
      const inputValue = cell.formula ? `=${cell.formula}` : (cell.value || '');
      setCellInput(inputValue);
      setCellDisplayValue(cell.displayValue || cell.value || '');
    } else {
      setCellInput('');
      setCellDisplayValue('');
    }
  };

  // 下拉选择
  const handleSelectChange = (rowIndex, colIndex, value) => {
    handleCellEdit(rowIndex, colIndex, value);
    setEditingCell(null);
  };

  // 渲染表格
  // 渲染表格
  const renderExcelGrid = () => {
    const sheet = excelData[currentSheetName];
    if (!sheet || !sheet.cells.length || !sheet.headers.length) return null;

    const { cells, headers } = sheet;

    return (
      <div className={styles.excelgridcontainer}>
        <div className={styles.excelgrid}>
          <div className={`${styles.excelrow} ${styles.headerrow}`}>
            <div className={`${styles.excelcell} ${styles.cornercell}`}></div>
            {headers.map((_, colIndex) => (
              <div key={colIndex} className={`${styles.excelcell} ${styles.headercell}`}>{getColumnLetter(colIndex + 1)}</div>
            ))}
          </div>
          {cells.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.excelrow}>
              <div className={`${styles.excelcell} ${styles.rowheader}`}>{rowIndex + 1}</div>
              {row.map((cell, colIndex) => {
                const address = `${getColumnLetter(colIndex + 1)}${rowIndex + 1}`;
                const isActive = activeCell === address;
                const highlight = searchTerm && (cell.value || cell.displayValue || '').toLowerCase().includes(searchTerm.toLowerCase());
                const displayContent = editingCell === address
                  ? (cell.formula ? `=${cell.formula}` : (cell.value || ''))
                  : (cell.displayValue || '');

                if (cell.dataValidation?.type === 'list' && cell.dataValidation.options?.length > 0) {
                  if (editingCell === address) {
                    return (
                      <div key={cell.id} className={`${styles.excelcell} ${isActive ? styles.active : ''} ${highlight ? styles.highlighted : ''}`} onBlur={() => setEditingCell(null)}>
                        <select
                          autoFocus
                          value={cell.value || ''}
                          onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                          className={styles.dvselect}
                        >
                          <option value="">请选择</option>
                          {cell.dataValidation.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={cell.id}
                        className={`${styles.excelcell} ${isActive ? styles.active : ''} ${highlight ? styles.highlighted : ''} ${styles.dvcell}`}
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

                return (
                  <div
                    key={cell.id}
                    ref={el => { if (el) cellRefs.current[cell.id] = el; }}
                    className={`${styles.excelcell} ${isActive ? styles.active : ''} ${cell.formula ? styles.formulacell : ''} ${highlight ? styles.highlighted : ''}`}
                    contentEditable
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
                    {displayContent || (cell.isEmpty ? '' : '')}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 导出：直接使用原始 workbook
  const saveAndExportExcel = async () => {
    if (!workbook) return;
    try {
      setLoading(true);
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_workbook.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3000);
    } catch (err) {
      console.error('导出失败:', err);
      setError(`导出失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 撤销/重做
  const undo = () => {
    const idx = historyIndex[currentSheetName] || -1;
    if (idx <= 0) return;
    const prev = history[currentSheetName][idx - 1];
    setExcelData(prevData => ({
      ...prevData,
      [currentSheetName]: { ...prevData[currentSheetName], cells: prev.cells.map(r => [...r]) }
    }));
    setActiveCell(prev.activeCell);
    setHistoryIndex(prevIdx => ({ ...prevIdx, [currentSheetName]: idx - 1 }));
    updateInputFromHistory(prev);
  };

  const redo = () => {
    const hist = history[currentSheetName] || [];
    const idx = historyIndex[currentSheetName] || -1;
    if (idx >= hist.length - 1) return;
    const next = hist[idx + 1];
    setExcelData(prevData => ({
      ...prevData,
      [currentSheetName]: { ...prevData[currentSheetName], cells: next.cells.map(r => [...r]) }
    }));
    setActiveCell(next.activeCell);
    setHistoryIndex(prevIdx => ({ ...prevIdx, [currentSheetName]: idx + 1 }));
    updateInputFromHistory(next);
  };

  const updateInputFromHistory = (state) => {
    if (!state.activeCell) return;
    const [col, rowStr] = state.activeCell.match(/^([A-Z]+)(\d+)$/).slice(1);
    const row = parseInt(rowStr) - 1;
    const colIdx = columnToNumber(col) - 1;
    const cell = state.cells[row]?.[colIdx];
    if (cell) {
      setCellInput(cell.formula ? `=${cell.formula}` : (cell.value || ''));
      setCellDisplayValue(cell.displayValue || cell.value || '');
    }
  };

  const getActiveCellContent = () => {
    if (!activeCell || !excelData[currentSheetName]) return '';
    const [col, rowStr] = activeCell.match(/^([A-Z]+)(\d+)$/).slice(1);
    const row = parseInt(rowStr) - 1;
    const colIdx = columnToNumber(col) - 1;
    const cell = excelData[currentSheetName].cells[row]?.[colIdx];
    return cell ? (cell.formula ? `=${cell.formula}` : cell.value || '') : '';
  };

  const handleInputBlur = () => {
    if (!activeCell) return;
    const [col, rowStr] = activeCell.match(/^([A-Z]+)(\d+)$/).slice(1);
    const rowIndex = parseInt(rowStr) - 1;
    const colIndex = columnToNumber(col) - 1;
    const cell = excelData[currentSheetName]?.cells?.[rowIndex]?.[colIndex];
    const current = cell?.formula ? `=${cell.formula}` : (cell?.value || '');
    if (cellInput !== current) {
      handleCellEdit(rowIndex, colIndex, cellInput);
    }
  };

  // 地址到名称映射（仅当前 sheet）
  const addressToNameMap = {};
  namedRanges
    .filter(nr => nr.sheet === currentSheetName)
    .forEach(nr => {
      addressToNameMap[nr.address] = nr.name;
    });

  return (
    <div className={styles.exceleditor}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarsection}>
          <button className={`${styles.toolbarbtn} ${styles.primary}`} onClick={loadExcelFromPublic} disabled={loading}>
            <Icon type="load" /> 加载Excel
          </button>
          <button className={`${styles.toolbarbtn} ${styles.success}`} onClick={saveAndExportExcel} disabled={!workbook || loading}>
            <Icon type="save" /> 下载Excel
          </button>
          <button className={`${styles.toolbarbtn} ${styles.warning}`} onClick={undo} disabled={(historyIndex[currentSheetName] || -1) <= 0}>
            <Icon type="load" /> 撤销
          </button>
          <button className={`${styles.toolbarbtn} ${styles.info}`} onClick={redo} disabled={(historyIndex[currentSheetName] || -1) >= (history[currentSheetName]?.length - 1 || 0)}>
            <Icon type="save" /> 恢复
          </button>
        </div>
      </div>
      {/* 信息栏 */}
      <div className={styles.infobar}>
        <div className={styles.infoitem}>
          <span className={styles.infobarlabel}>工作表:</span>
          <span className={styles.infobarvalue}>{currentSheetName || '未加载'}</span>
        </div>
        <div className={styles.infoitem}>
          <span className={styles.infobarlabel}>单元格:</span>
          <span className={styles.infobarvalue}>{activeCell || '未选中'}</span>
        </div>
        <div className={styles.infoitem}>
          <span className={styles.infobarlabel}>自定义名称:</span>
          <span className={styles.infobarvalue}>{activeCell ? (addressToNameMap[activeCell] || '无') : '未选中'}</span>
        </div>
        <div className={styles.infoitem}>
          <span className={styles.infobarlabel}>内容:</span>
          <span className={`${styles.infobarvalue} ${styles.contentvalue}`}>{getActiveCellContent()}</span>
        </div>
        <div className={styles.infoitem}>
          <span className={styles.infobarlabel}>显示值:</span>
          <span className={`${styles.infobarvalue} ${styles.displayvalue}`}>{cellDisplayValue || '空'}</span>
        </div>
      </div>
      {/* 编辑输入框 */}
      <div className={styles.cellinputbar}>
        <div className={`${styles.infoitem} ${styles.infoitemcell}`}>
          <span className={styles.infovalue}>{activeCell || ''}</span>
        </div>
        <div className={`${styles.infoitem} ${styles.infoitemcell}`}>
          <svg className={styles.titleicon} aria-hidden="true">
            <use xlinkHref="#icon-sandian-vertical"></use>
          </svg>
        </div>


        <div className={styles.infoitem}>
          <svg className={styles.titleicon} aria-hidden="true">
            <use xlinkHref="#icon-a-duicuocuo"></use>
          </svg>
          <svg className={styles.titleicon} aria-hidden="true">
            <use xlinkHref="#icon-a-duicuodui"></use>
          </svg>
          <svg className={styles.titleicon} aria-hidden="true">
            <use xlinkHref="#icon-hanshu"></use>
          </svg>
          <input
            type="text"
            className={styles.cellinput}
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

      {/* 工作表标签 */}
      {sheetNames.length > 0 && (
        <div className={styles.sheettabs}>
          <div className={styles.sheettabscontainer}>
            {sheetNames.map((name, index) => (
              <button
                key={index}
                className={`${styles.sheettab} ${currentSheetName === name ? styles.active : ''}`}
                onClick={() => setCurrentSheetName(name)}
                disabled={loading}
              >
                {name}
                {currentSheetName === name && <span className={styles.tabindicator}></span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 状态提示 */}
      {loading && (
        <div className={styles.loadingoverlay}>
          <div className={styles.loadingspinner}></div>
          <div>处理中...</div>
        </div>
      )}
      {error && (
        <div className={styles.errormessage}>
          <span className={styles.erroricon}>⚠️</span>
          <span>{error}</span>
          <button className={styles.errorclose} onClick={() => setError(null)}>×</button>
        </div>
      )}
      {showSaveNotification && (
        <div className={styles.savenotification}>文件已保存并开始下载！</div>
      )}
    </div>
  );
};

export default ExcelEditor;