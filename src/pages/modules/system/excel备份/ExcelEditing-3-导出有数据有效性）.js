import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
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
  const [showInputPanel, setShowInputPanel] = useState(true); // 控制参数面板显隐
  const [isLoading, setIsLoading] = useState(false);
  const [namedRanges, setNamedRanges] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [editingContext, setEditingContext] = useState(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef(null);
  const spreadsheetRef = useRef(null);
  const cellEditorRef = useRef(null);
  const infoBarEditorRef = useRef(null);

  // ✅ 用于调用通知
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

  // 其他 useCallback / useMemo 函数
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

  // ✅ 使用 ExcelJS 导出（支持边框 + 无 alert）
const exportExcel = useCallback(async () => {
  if (!workbook || namedRanges.length === 0) {
    notificationRef.current?.addNotification('没有可导出的数据', 'warning');
    return;
  }

  try {
    setIsLoading(true);

    // Step 1: 重新加载原始模板（确保包含数据有效性、公式等）
    const templateResponse = await fetch('/template.xlsx');
    if (!templateResponse.ok) throw new Error('模板文件加载失败');
    const templateArrayBuffer = await templateResponse.arrayBuffer();

    // Step 2: 用 ExcelJS 加载模板
    const exceljsWorkbook = new ExcelJS.Workbook();
    await exceljsWorkbook.xlsx.load(templateArrayBuffer);

    // Step 3: 遍历命名区域，仅更新“非公式”单元格
    namedRanges.forEach(range => {
      const sheet = exceljsWorkbook.getWorksheet(range.sheet);
      if (!sheet) {
        console.warn(`工作表 ${range.sheet} 不存在`);
        return;
      }

      const cell = sheet.getCell(range.address);
      const currentValue = formValues[range.name];

      // 如果当前单元格在模板中已经有公式，跳过写入（防止覆盖公式）
      if (cell.type === ExcelJS.ValueType.Formula) {
        console.warn(`跳过写入 ${range.sheet}!${range.address}，因其包含公式: ${cell.value}`);
        return;
      }

      // 处理值：尝试转数字，空字符串转 null
      let finalValue = currentValue;
      if (currentValue === '') {
        finalValue = null;
      } else {
        const numVal = parseFloat(currentValue);
        if (!isNaN(numVal) && !currentValue.includes(',')) {
          finalValue = numVal;
        }
        // 否则保留字符串
      }

      // 安全写入：只设置 value，不影响其他属性（但会清除公式，所以我们已提前判断）
      cell.value = finalValue;
    });

    // Step 4: （可选）增强样式
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

    // Step 5: 导出
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

  // 渲染表格
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
          {/* ✅ 放置 NotificationManager */}
          <NotificationManager ref={notificationRef} />

          {/* 第一行：顶部工具栏 */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              {/* <h1 className={styles.title}>Excel数据编辑器</h1> */}
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
                {/* 📤 上传Excel */}
                <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-shangchuantupian2"></use>
                </svg>
              </button>
              <button
                className={styles.toolbarBtn}
                onClick={loadTemplate}
                title="重新加载模板"
              >
                {/* 🔄 加载模板 */}
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
                {/* 💾 保存下载 */}
                 <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-xiazaiwenjian1"></use>
                </svg>
              </button>
              <button
                className={styles.toolbarBtn}
                onClick={() => setShowInputPanel(!showInputPanel)}
                title={showInputPanel ? "隐藏参数面板" : "显示参数面板"}
              >
                {/* {showInputPanel ? "◀ 隐藏参数" : "显示参数 ▶"} */}
                {showInputPanel ? <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-yincangdaan"></use>
                </svg> : <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-xianshi"></use>
                </svg>}
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

          {/* 中间内容区 */}
          <div className={styles.mainContent}>
            {/* 左侧：参数面板 */}
            {showInputPanel && (
              <div className={styles.inputPanel}>
                <div className={styles.inputPanelHeader}>
                  <h3>
                    {/* 自定义名称 */}
                    {/* <span className={styles.sheetName}>{activeSheet}</span> */}
                    <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-neirongziduanguanli"></use>
                </svg>
                  </h3>
                </div>

                {/* <div className={styles.namedRangesInfo}>
                  <span className={styles.namedRangesCount}>
                    命名区域: {namedRanges.length}个
                  </span>
                </div> */}

                <div className={styles.formContainer}>
                  {renderInputForm()}
                </div>
              </div>
            )}

            {/* 右侧：表格区域 */}
            <div className={`${styles.previewPanel} ${!showInputPanel ? styles.fullWidth : ''}`}>
              {/* 第一部分：单元格信息栏 */}
              {workbook && activeSheet && (
                <div className={styles.cellInfoBar}>
                  <div className={styles.cellInfoRow}>
                    <span className={styles.cellLabel}>
                      {/* 名称: */}
                       <svg className={styles.buttonicon} aria-hidden="true">
                  <use xlinkHref="#icon-danyuange"></use>
                </svg>
                      </span>
                    <span className={styles.cellAddress}>
                      {/* {cellInfo.address ? `${activeSheet}!${cellInfo.address}` : '未选择'} */}
                      {cellInfo.address ? cellInfo.address : '未选择'}
                    </span>
                    <span className={styles.cellLabel}>
                      {/* 编辑: */}
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

              {/* 第二部分：Excel表格主体 */}
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

              {/* 第三部分：工作表标签切换区域 */}
              <div className={styles.sheetTabsSection}>
                {renderSheetTabs()}
              </div>
            </div>


          </div>

          {/* 底部状态栏 */}
          {/* <div className={styles.statusBar}>
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
          </div> */}
        </div>
      )}
    </ConfirmationDialogManager>
  );
};

export default ExcelEditing;