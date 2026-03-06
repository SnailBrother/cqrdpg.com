//const filename = "/backend/public/downloads/Templates/${templateData.AssetType}/${templateData.ValuationPurpose}/${templateData.DocumentName}";
//const filename = "/backend/public/downloads/Templates/房地产/司法/测算表-单套住宅.xlsx";
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './TemplateManagementExcelViewer.css';

const TemplateManagementExcelViewer = ({ fileUrl, fileName, templateData }) => {
    const [workbook, setWorkbook] = useState(null);
    const [activeSheet, setActiveSheet] = useState(0);
    const [selectedCell, setSelectedCell] = useState(null);
    const [cellFormula, setCellFormula] = useState('');
    const filenameha = `/backend/public/downloads/Templates/${templateData.AssetType}/${templateData.ValuationPurpose}/${templateData.DocumentName}`;
    //const filenameha = "./backend/public/downloads/Templates/房地产/司法/测算表-单套住宅.xlsx";
    // const filenameha = `/backend/public/downloads/Templates/${templateData.AssetType}/${templateData.ValuationPurpose}/${templateData.DocumentName}`;
    useEffect(() => {
        const loadExcelFile = async () => {
            try {
                // 使用动态构建的文件路径
                const response = await fetch(filenameha);
                const arrayBuffer = await response.arrayBuffer();
                const wb = XLSX.read(arrayBuffer, { cellStyles: true });
                setWorkbook(wb);
            } catch (error) {
                console.error('加载Excel文件失败:', error);
            }
        };

        loadExcelFile();
    }, [filenameha]); // 将 filenameha 添加到依赖项中

    const renderSheet = () => {
        if (!workbook || !workbook.SheetNames[activeSheet]) return null;

        const worksheet = workbook.Sheets[workbook.SheetNames[activeSheet]];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        const maxColumns = range.e.c + 1;
        const maxRows = range.e.r + 1;

        // 生成列标头 (A, B, C...)
        const columnHeaders = Array.from({ length: maxColumns }, (_, i) =>
            XLSX.utils.encode_col(i)
        );

        return (
            <div className="excel-table-container">
                {/* 左上角空白单元格 */}
                <div className="excel-corner"></div>

                {/* 列标头 (A, B, C...) */}
                <div className="excel-column-headers">
                    {columnHeaders.map((col, index) => (
                        <div key={`col-${index}`} className="excel-column-header">
                            {col}
                        </div>
                    ))}
                </div>

                {/* 行标头和数据 */}
                <div className="excel-rows-container">
                    {/* 行标头 (1, 2, 3...) - 垂直排列 */}
                    <div className="excel-row-headers">
                        {Array.from({ length: maxRows }, (_, i) => i + 1).map((rowNum) => (
                            <div key={`row-header-${rowNum}`} className="excel-row-header">
                                {rowNum}
                            </div>
                        ))}
                    </div>

                    {/* 数据单元格 */}
                    <div className="excel-data-rows">
                        {Array.from({ length: maxRows }).map((_, rowIndex) => (
                            <div key={`row-${rowIndex}`} className="excel-data-row">
                                {Array.from({ length: maxColumns }).map((_, colIndex) => {
                                    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                                    const cell = worksheet[cellAddress];
                                    const value = cell?.v ?? '';
                                    const formula = cell?.f;

                                    return (
                                        <div
                                            key={`cell-${rowIndex}-${colIndex}`}
                                            className={`excel-cell ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'selected' : ''
                                                }`}
                                            onClick={() => {
                                                setSelectedCell({ row: rowIndex, col: colIndex });
                                                setCellFormula(formula || '');
                                            }}
                                        >
                                            {value}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="excel-container">
            {/* 顶部工具栏 */}
            <div className="excel-toolbar">
                <div className="formula-bar">
                    {selectedCell && (
                        <div className="cell-address">
                            {XLSX.utils.encode_col(selectedCell.col)}{selectedCell.row + 1}
                        </div>
                    )}
                    <input
                        type="text"
                        className="formula-input"
                        value={cellFormula}
                        readOnly
                        placeholder={selectedCell ? "公式" : ""}
                    />
                </div>
            </div>

            {/* 主表格区域 */}
            <div className="excel-grid-container">
                {renderSheet()}
            </div>

            {/* 底部工作表标签 */}
            <div className="sheet-tabs-container">
                {workbook?.SheetNames?.map((sheet, index) => (
                    <div
                        key={sheet}
                        className={`sheet-tab ${index === activeSheet ? 'active' : ''}`}
                        onClick={() => setActiveSheet(index)}
                    >
                        {sheet}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TemplateManagementExcelViewer;