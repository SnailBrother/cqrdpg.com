//无法添加边框 公司没有问题

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import styles from './ExcelEditing.module.css';

// ✅ 引入你的通知组件
import ConfirmationDialogManager from '../accounting/Notification/ConfirmationDialogManager';
import NotificationManager from '../accounting/Notification/NotificationManager';

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

  const saveCellEditToSheet = (sheetName, cellAddress, value) => {
    if (!workbook) return;
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;

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
  };

  const saveCellEdit = (cellAddress, value) => {
    if (!workbook || !activeSheet) return;
    saveCellEditToSheet(activeSheet, cellAddress, value);
    setWorkbook({ ...workbook });

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

  // ✅ 使用纯 SheetJS 导出，保留命名区域
  const exportExcel = useCallback(async () => {
    if (!workbook) {
      notificationRef.current?.addNotification('没有可导出的数据', 'warning');
      return;
    }

    try {
      setIsLoading(true);

      // 确保 workbook.Workbook 存在
      if (!workbook.Workbook) {
        workbook.Workbook = {};
      }

      // ✅ 确保 Names 中的 Ref 是绝对引用（带 $）
      if (workbook.Workbook.Names?.length > 0) {
        workbook.Workbook.Names = workbook.Workbook.Names.map(nameObj => {
          let ref = nameObj.Ref;
          const name = nameObj.Name;

          if (!ref || !name) return nameObj;

          // 如果已经包含 $，跳过
          if (ref.includes('$')) {
            return nameObj;
          }

          // 否则转换为绝对引用
          const parts = ref.split('!');
          if (parts.length !== 2) return nameObj;

          const sheetPart = parts[0];
          let addrPart = parts[1];

          const addDollar = (addr) => {
            if (addr.includes(':')) {
              const [start, end] = addr.split(':');
              const encode = (c) => {
                const match = c.match(/^([A-Z]+)(\d+)$/);
                if (match) return `$${match[1]}$${match[2]}`;
                return c;
              };
              return `${encode(start)}:${encode(end)}`;
            } else {
              const match = addr.match(/^([A-Z]+)(\d+)$/);
              if (match) return `$${match[1]}$${match[2]}`;
              return addr;
            }
          };

          const newRef = `${sheetPart}!${addDollar(addrPart)}`;
          return { Name: name, Ref: newRef };
        });
      }

      // ✅ 使用 XLSX.write 直接导出
      const uint8Array = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      const blob = new Blob([uint8Array], {
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
  }, [workbook]);

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

  // 渲染表格（保持不变）
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
              <button
                className={styles.toolbarBtn}
                onClick={() => setShowInputPanel(!showInputPanel)}
                title={showInputPanel ? "隐藏参数面板" : "显示参数面板"}
              >
                {showInputPanel ? "◀ 隐藏参数" : "显示参数 ▶"}
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

          <div className={styles.mainContent}>
            {showInputPanel && (
              <div className={styles.inputPanel}>
                <div className={styles.inputPanelHeader}>
                  <h3>
                    参数输入
                    <span className={styles.sheetName}>{activeSheet}</span>
                  </h3>
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

            <div className={`${styles.previewPanel} ${!showInputPanel ? styles.fullWidth : ''}`}>
              <div className={styles.previewHeader}>
                {renderSheetTabs()}
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
      )}
    </ConfirmationDialogManager>
  );
};

export default ExcelEditing;