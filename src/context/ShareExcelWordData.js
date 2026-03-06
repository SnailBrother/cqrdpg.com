import React, { createContext, useContext, useReducer } from 'react';

// 初始状态
const initialState = {
  customCellValues: {}, // 实时编辑的增量更新
  fullWorkbookData: {}, // 完整 workbook 快照
  namedRanges: [],      // 原始命名区域数组
  addressToNamedRangeMap: {}, // 👈 新增：地址 -> 名称的映射（key: "Sheet!A1"）
};

// 构建地址到名称的映射（辅助函数）
const buildAddressToNamedRangeMap = (namedRanges) => {
  const map = {};
  namedRanges.forEach(nr => {
    // 注意：nr.address 是像 "C2" 这样的地址，nr.sheet 是工作表名
    const key = `${nr.sheet}!${nr.address}`;
    map[key] = nr.name;
  });
  return map;
};

// Reducer
const excelDataReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_CELL':
      const { sheetName, address, value, displayValue, formula, type, dataValidation } = action.payload;
      const key = `${sheetName}!${address}`;
      return {
        ...state,
        customCellValues: {
          ...state.customCellValues,
          [key]: {
            value: value || '',
            formula: formula ?? null,
            displayValue: displayValue ?? (value || ''),
            type: type ?? (value?.startsWith('=') ? 'formula' : typeof value === 'number' ? 'number' : 'text'),
            dataValidation: dataValidation ?? null, // 👈 显式保留
          },
        },
      };

    case 'LOAD_NAMED_RANGES':
      const { namedRanges } = action.payload;
      const addressToNamedRangeMap = buildAddressToNamedRangeMap(namedRanges || []);
      return {
        ...state,
        namedRanges: namedRanges || [],
        addressToNamedRangeMap, // 👈 保存映射
      };

    case 'LOAD_ENTIRE_WORKBOOK':
      const { workbookData } = action.payload;
      const fullWorkbook = {};
      Object.entries(workbookData).forEach(([sheetName, cells]) => {
        Object.entries(cells).forEach(([addr, cellInfo]) => {
          const key = `${sheetName}!${addr}`;
          fullWorkbook[key] = cellInfo;
        });
      });
      return {
        ...state,
        fullWorkbookData: fullWorkbook,
        customCellValues: {},
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

// 创建 Context
export const ShareExcelWordDataContext = createContext();

// Provider 组件
export const ShareExcelWordDataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(excelDataReducer, initialState);
  return (
    <ShareExcelWordDataContext.Provider value={{ state, dispatch }}>
      {children}
    </ShareExcelWordDataContext.Provider>
  );
};

// 自定义 Hook
export const useShareExcelWordData = () => {
  const context = useContext(ShareExcelWordDataContext);
  if (!context) {
    throw new Error('useShareExcelWordData must be used within ShareExcelWordDataProvider');
  }
  return context;
};