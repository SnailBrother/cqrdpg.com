import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import styles from './ExcelEditing.module.css';

// 注册 Handsontable 的所有模块
registerAllModules();

const ExcelEditing = () => {
  // --- State and Refs ---
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [namedCells, setNamedCells] = useState({});
  const [formData, setFormData] = useState({});
  const [cellInfo, setCellInfo] = useState({ name: '', value: '' });
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tableData, setTableData] = useState([]); // 新增：用于传递给 HotTable 的 data

  const hotTableRef = useRef(null);
  const namedCellsRef = useRef({});

  useEffect(() => {
    namedCellsRef.current = namedCells;
  }, [namedCells]);

  // --- Core Functions ---

  const loadAndParseWorkbook = useCallback(async (fileSource) => {
    setIsLoading(true);
    try {
      const arrayBuffer = typeof fileSource === 'string'
        ? await (await fetch(fileSource)).arrayBuffer()
        : fileSource;

      const wb = XLSX.read(arrayBuffer, { type: 'array', cellFormulas: true, cellStyles: true });

      const parsedNamedCells = {};
      const initialFormData = {};
      if (wb.Workbook?.Names) {
        wb.Workbook.Names.forEach(nameDef => {
          if (!nameDef.Ref) return;
          const [sheet, address] = nameDef.Ref.split('!');
          if (!sheet || !address) return;
          const cleanSheet = sheet.replace(/'/g, '');
          const cleanAddress = address.replace(/\$/g, '');
          parsedNamedCells[nameDef.Name] = { sheet: cleanSheet, address: cleanAddress };

          const cell = wb.Sheets[cleanSheet]?.[cleanAddress];
          initialFormData[nameDef.Name] = cell ? cell.v : '';
        });
      }

      const allSheetNames = wb.SheetNames;
      const targetSheet = allSheetNames.find(name => name === '评估明细表') || allSheetNames[0] || '';

      // 提取目标工作表的数据
      const worksheet = wb.Sheets[targetSheet];
      const data = worksheet ? XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) : [];

      // 更新状态
      setNamedCells(parsedNamedCells);
      setFormData(initialFormData);
      setSheetNames(allSheetNames);
      setActiveSheet(targetSheet);
      setWorkbook(wb);
      setTableData(data); // 👈 关键：设置 tableData 触发 HotTable 渲染

    } catch (error) {
      console.error("加载或解析Excel文件失败:", error);
      alert(`模板文件加载失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAndParseWorkbook('/template.xlsx');
  }, [loadAndParseWorkbook]);

  // 当切换工作表时，更新 tableData
  useEffect(() => {
    if (workbook && activeSheet) {
      const worksheet = workbook.Sheets[activeSheet];
      const data = worksheet ? XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) : [];
      setTableData(data);
    }
  }, [workbook, activeSheet]);

  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    const cellDef = namedCells[key];
    if (hotTableRef.current?.hotInstance && cellDef && activeSheet === cellDef.sheet) {
      const coords = XLSX.utils.decode_cell(cellDef.address);
      hotTableRef.current.hotInstance.setDataAtCell(coords.r, coords.c, value, 'formChange');
    }
  };

  const afterCellChange = (changes, source) => {
    if (source === 'loadData' || source === 'formChange' || !changes) return;
    if (!workbook) return;

    // 创建新的 workbook 副本
    const newWb = { ...workbook };
    const ws = newWb.Sheets[activeSheet];
    if (!ws) return;

    changes.forEach(([row, col, oldValue, newValue]) => {
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[address]) ws[address] = {};
      ws[address].v = newValue;

      const cellName = Object.keys(namedCells).find(key =>
        namedCells[key].sheet === activeSheet && namedCells[key].address === address
      );
      if (cellName) {
        setFormData(prev => ({ ...prev, [cellName]: newValue }));
      }
    });

    setWorkbook(newWb);
  };

  const afterCellSelect = (r, c, r2, c2, preventScrolling, selectionLayerLevel) => {
    const instance = hotTableRef.current?.hotInstance;
    if (!instance || r === undefined || c === undefined) return;
    const cellValue = instance.getDataAtCell(r, c);
    const address = XLSX.utils.encode_cell({ r, c });
    const cellName = Object.keys(namedCellsRef.current).find(key =>
      namedCellsRef.current[key].sheet === activeSheet && namedCellsRef.current[key].address === address
    );
    setCellInfo({ name: cellName || address, value: cellValue });
  };

  const handleExport = () => {
    if (!workbook) return;
    const workbookOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([workbookOut], { type: 'application/octet-stream' });
    saveAs(blob, '导出的文件.xlsx');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => loadAndParseWorkbook(e.target.result);
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>Excel 在线编辑器</h2>
        <div className={styles.cellInfoDisplay}>
          <span>{cellInfo.name}</span>
          <input type="text" value={cellInfo.value ?? ''} readOnly />
        </div>
        <div className={styles.buttonGroup}>
          <button onClick={() => alert('保存功能待实现')} className={styles.actionBtn}>💾 保存</button>
          <button onClick={handleExport} className={styles.actionBtn}>📥 下载 XLSX</button>
          <label htmlFor="upload-btn" className={styles.actionBtn}>
            📤 上传模板
            <input type="file" id="upload-btn" accept=".xlsx" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={`${styles.formPanel} ${isFormCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.formHeader}>
            <h3>命名单元格编辑</h3>
            <button className={styles.collapseButton} onClick={() => setIsFormCollapsed(!isFormCollapsed)} title={isFormCollapsed ? '展开' : '折叠'}>
              <svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" fill="currentColor"></path></svg>
            </button>
          </div>
          <div className={styles.formBody}>
            {Object.keys(namedCells).length > 0 ? (
              Object.keys(namedCells).map(key => (
                <div key={key} className={styles.formRow}>
                  <label htmlFor={key}>{key} ({namedCells[key].sheet}!{namedCells[key].address}):</label>
                  <input
                    id={key}
                    type="text"
                    value={formData[key] || ''}
                    onChange={(e) => handleFormChange(key, e.target.value)}
                    className={styles.controlInput}
                  />
                </div>
              ))
            ) : (
              !isLoading && <p className={styles.noPlaceholders}>模板中未检测到命名单元格。</p>
            )}
          </div>
        </div>

        <div className={styles.previewPanel}>
          {isLoading ? (
            <div className={styles.loading}>正在加载模板...</div>
          ) : (
            <>
              <div className={styles.hotContainer}>
                {/* ✅ 关键修改：通过 data 属性传入数据 */}
                <HotTable
                  key={activeSheet}
                  ref={hotTableRef}
                  data={tableData} // 👈 核心：绑定 data
                  rowHeaders={true}
                  colHeaders={true}
                  height="100%"
                  width="100%"
                  licenseKey="non-commercial-and-evaluation"
                  contextMenu={true}
                  formulas={{ engine: 'hot-formula-parser' }}
                  afterChange={afterCellChange}
                  afterSelection={afterCellSelect}
                  manualColumnResize={true}
                  manualRowResize={true}
                />
              </div>
              <div className={styles.sheetTabs}>
                {sheetNames.map(name => (
                  <button
                    key={name}
                    className={`${styles.sheetTab} ${name === activeSheet ? styles.active : ''}`}
                    onClick={() => setActiveSheet(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelEditing;