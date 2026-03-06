import React from 'react';
import { useShareExcelWordData } from '../../../context/ShareExcelWordData';
import styles from './ReadExcelData.module.css';

// 辅助函数：解析单元格地址
const parseCellKey = (key) => {
  const separatorIndex = key.indexOf('!');
  if (separatorIndex === -1) {
    return { sheetName: '未知工作表', address: key };
  }
  const sheetName = key.substring(0, separatorIndex);
  const address = key.substring(separatorIndex + 1);
  return { sheetName, address };
};

// 辅助函数：按工作表分组数据
const groupDataBySheet = (customCellValues) => {
  const grouped = {};
  Object.entries(customCellValues).forEach(([key, cellInfo]) => {
    const { sheetName, address } = parseCellKey(key);
    if (!grouped[sheetName]) {
      grouped[sheetName] = {};
    }
    // 确保字段完整性（兼容旧数据）
    grouped[sheetName][address] = {
      value: '',
      formula: '',
      displayValue: '',
      type: 'text',
      ...cellInfo,
    };
  });
  return grouped;
};

// 辅助函数：格式化数据类型展示
const formatCellType = (type) => {
  const typeMap = {
    text: '文本',
    formula: '公式',
    number: '数值',
    boolean: '布尔值',
    date: '日期',
    null: '空值',
  };
  return typeMap[type] || type || '未知类型';
};

const ReadExcelData = () => {
  const { state, dispatch } = useShareExcelWordData();
  const { namedRanges } = state;
  const { fullWorkbookData = {}, customCellValues = {} } = state;

  // 合并数据：优先使用 customCellValues（用户编辑内容），fallback 到 fullWorkbookData
  const mergedData = { ...fullWorkbookData, ...customCellValues };

  const sheetGroupedData = groupDataBySheet(mergedData);

  // 重置数据
  const handleReset = () => {
    dispatch({ type: 'RESET' });
  };

  // 判断是否有任何数据（合并后）
  const hasData = Object.keys(mergedData).length > 0;
  // 👇 把 isCellInRange 放在组件外部或 use 某个 hook 内（避免重复定义）
  const isCellInRange = (cellAddr, rangeRef) => {
    if (!rangeRef) return false;
    const rangePart = rangeRef.split('!').pop();
    if (!rangePart.includes(':')) {
      return cellAddr === rangePart;
    }

    const [start, end] = rangePart.split(':');
    const startCol = start.replace(/[0-9]/g, '');
    const startRow = parseInt(start.replace(/[^0-9]/g, ''), 10);
    const endCol = end.replace(/[0-9]/g, '');
    const endRow = parseInt(end.replace(/[^0-9]/g, ''), 10);

    const cellCol = cellAddr.replace(/[0-9]/g, '');
    const cellRow = parseInt(cellAddr.replace(/[^0-9]/g, ''), 10);

    const colToIndex = (col) => {
      return col.split('').reduce((acc, char) => acc * 26 + (char.toUpperCase().charCodeAt(0) - 64), 0);
    };

    const startColIdx = colToIndex(startCol);
    const endColIdx = colToIndex(endCol);
    const cellColIdx = colToIndex(cellCol);

    return (
      !isNaN(cellRow) &&
      !isNaN(startRow) &&
      !isNaN(endRow) &&
      cellRow >= startRow &&
      cellRow <= endRow &&
      cellColIdx >= startColIdx &&
      cellColIdx <= endColIdx
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Excel 共享数据完整展示</h2>

      <button onClick={handleReset} className={styles.resetBtn}>
        重置所有数据
      </button>

      {/* 无数据提示 */}
      {!hasData ? (
        <div className={styles.emptyData}>
          暂无 Excel 数据，请先加载 Excel 文件
        </div>
      ) : (
        <div>
          {/* 遍历每个工作表 */}
          {Object.entries(sheetGroupedData).map(([sheetName, cellData]) => (
            <div key={sheetName} className={styles.sheetCard}>
              <h3 className={styles.sheetTitle}>工作表：{sheetName}</h3>

              {/* 完整的单元格数据表格 */}
              <table className={styles.cellTable}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.tableTh}>工作表</th>
                    <th className={styles.tableTh}>单元格地址</th>
                    <th className={styles.tableTh}>自定义名称</th>
                    <th className={styles.tableTh}>内容:</th>
                    <th className={styles.tableTh}>显示值</th>
                    <th className={styles.tableTh}>数据类型</th>
                    <th className={styles.tableTh}>选择项</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(cellData).map(([address, cellInfo]) => {
                    const fullKey = `${sheetName}!${address}`;

                    // ✅ 直接从映射表查名称（仅支持单单元格命名区域）
                    const namedRangeName = state.addressToNamedRangeMap[fullKey] || '';

                    const { value, formula, displayValue, type, dataValidation } = cellInfo;
                    const content = formula ? `=${formula}` : value;
                    const optionsText = dataValidation?.type === 'list'
                      ? dataValidation.options?.join(', ') || ''
                      : '';

                    return (
                      <tr key={address}>
                        <td className={styles.tableTd}>{sheetName}</td>
                        <td className={styles.tableTd}>{address}</td>
                        <td className={styles.tableTd}>{namedRangeName}</td> 
                        <td className={styles.tableTd}>{content}</td>
                        <td className={styles.tableTd}>{displayValue || content}</td>
                        {/* <td className={styles.tableTd}>
  {cellInfo.displayValue !== undefined ? cellInfo.displayValue : content}
</td> */}
                        <td className={styles.tableTd}>{formatCellType(type)}</td>
                        <td className={styles.tableTd}>{optionsText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}


    </div>
  );
};

export default ReadExcelData;

