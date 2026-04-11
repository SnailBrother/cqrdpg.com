import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TemplateManagementPDFViewer from './TemplateManagement/TemplateManagementPDFViewer';
import TemplateManagementDocxEditor from './TemplateManagement/TemplateManagementDocxEditor';
import './TemplateManagement.css';
import TemplateManagementExcelViewer from './TemplateManagement/TemplateManagementExcelViewer';
import { Loading } from '../../../components/UI';
const TemplateManagement = () => {
    const [selectedFiles, setSelectedFiles] = useState({});
    const [hoveredFileTooltip, setHoveredFileTooltip] = useState(null);
    const [hoveredFolderTooltip, setHoveredFolderTooltip] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewerState, setViewerState] = useState({
        visible: false,
        type: null,
        fileUrl: null,
        fileName: null
    });
    const [activeTab, setActiveTab] = useState('房地产'); // Default to first tab
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await axios.get('https://www.cqrdpg.com:5202/api/getTemplateManagement');
                setTemplates(response.data.Template);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const handleDownload = async (folderId, assetType, valuationPurpose) => {
        const selected = selectedFiles[folderId] || [];
        if (selected.length === 0) return;

        try {
            const response = await axios({
                url: 'https://www.cqrdpg.com:5202/api/downloadTemplateManagement',
                method: 'GET',
                params: {
                    assetType: assetType,
                    valuationPurpose: valuationPurpose,
                    files: selected.join(','),
                    downloadType: selected.length > 1 ? 'zip' : 'single'
                },
                responseType: 'blob'
            });

            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'download';

            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch[1]) {
                    fileName = fileNameMatch[1];
                }
            } else if (selected.length === 1) {
                fileName = selected[0];
            } else {
                fileName = `${folderId}_files.zip`;
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('下载失败:', error);
            alert('下载失败，请稍后重试');
        }
    };

    const handleViewDocument = (template, fileType) => {
        setViewerState({
            visible: true,
            type: fileType,// 可以是 'pdf', 'word', 'excel'
            fileUrl: `/downloads/Templates/${template.AssetType}/${template.ValuationPurpose}/${template.DocumentName}`,
            fileName: template.DocumentName,
            templateData: template // 传递完整的模板数据
        });
    };

    const groupedTemplates = templates.reduce((acc, template) => {

        // 添加过滤条件：只处理当前选中的AssetType
        if (template.AssetType !== activeTab) return acc;

        const key = template.ValuationPurpose;
        if (!acc[key]) {
            acc[key] = {
                id: `下载文件-${key.replace(/\s+/g, '-').toLowerCase()}`,
                name: key,
                assetType: template.AssetType,
                valuationPurpose: template.ValuationPurpose,
                description: template.AssetTypeRemark,
                files: [],
                rawTemplates: [] // 新增原始模板数据存储
            };
        }
        acc[key].files.push({
            name: template.DocumentName,
            type: template.DocumentName.split('.').pop().toLowerCase(),
            description: template.DocumentRemark
        });
        acc[key].rawTemplates.push(template); // 存储原始模板数据
        return acc;
    }, {});

    const folders = Object.values(groupedTemplates);

    const toggleFileSelection = (folderId, fileName) => {
        setSelectedFiles(prev => {
            const newSelection = { ...prev };
            if (newSelection[folderId]?.includes(fileName)) {
                newSelection[folderId] = newSelection[folderId].filter(f => f !== fileName);
                if (newSelection[folderId].length === 0) {
                    delete newSelection[folderId];
                }
            } else {
                newSelection[folderId] = [...(newSelection[folderId] || []), fileName];
            }
            return newSelection;
        });
    };

    const isFileSelected = (folderId, fileName) => {
        return selectedFiles[folderId]?.includes(fileName);
    };

    const hasSelectedFiles = (folderId) => {
        return selectedFiles[folderId]?.length > 0;
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'pdf': return (
                <svg className="temmanage-filepreview-icon" aria-hidden="true">
                    <use xlinkHref="#icon-pdf2"></use>
                </svg>
            );
            case 'xlsx': case 'xls': return (
                <svg className="temmanage-filepreview-icon" aria-hidden="true">
                    <use xlinkHref="#icon-xlsx"></use>
                </svg>
            );
            case 'docx': case 'doc': return (
                <svg className="temmanage-filepreview-icon" aria-hidden="true">
                    <use xlinkHref="#icon-docx1"></use>
                </svg>
            );
            default: return (
                <svg className="temmanage-filepreview-icon" aria-hidden="true">
                    <use xlinkHref="#icon-wenjianjia2"></use>
                </svg>
            );
        }
    };

    const filteredFolders = folders.filter(folder =>
        // 文件夹名称匹配 或 包含匹配的文件
        folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        folder.files.some(file =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) // 闭合 some() 的回调
    ); // 闭合 filter() 的回调

    if (loading) return <div className="temmanage-loading"><Loading message="模板加载中" /></div>;
    if (error) return <div className="temmanage-error">错误: {error}</div>;

    return (
        <div className="temmanage-app-container">
            <header className="temmanage-header">
                <nav className="temmanage-nav">
                    <ul>
                        {['房地产', '资产', '土地', '咨询'].map((tab) => (
                            <li
                                key={tab}
                                className={`temmanage-nav-item ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>

            <main className="temmanage-main-content">

                <div className="temmanage-search-box">
                    <input
                        type="text"
                        placeholder="搜索..."
                        className="temmanage-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {/* <button className="temmanage-search-btn">搜索</button> */}
                </div>

                <div className="temmanage-flex-container">
                    {filteredFolders.map((folder) => (
                        <div
                            className={`temmanage-card ${hasSelectedFiles(folder.id) ? 'temmanage-card-selected' : ''}`}
                            key={folder.id}
                        >
                            <div
                                className="temmanage-info-tooltip"
                                onMouseEnter={() => setHoveredFolderTooltip(folder.id)}
                                onMouseLeave={() => setHoveredFolderTooltip(null)}
                            >
                                <span className="temmanage-tooltip-icon">?</span>
                                {hoveredFolderTooltip === folder.id && (
                                    <div className="temmanage-tooltip-text temmanage-top-tooltip">
                                        {folder.description}
                                    </div>
                                )}


                            </div>

                            {hasSelectedFiles(folder.id) && (
                                <div className="temmanage-download-options">
                                    <button
                                        className="temmanage-download-btn"
                                        onClick={() => handleDownload(
                                            folder.id,
                                            folder.assetType,
                                            folder.valuationPurpose
                                        )}
                                    >
                                        下载 ({selectedFiles[folder.id].length})
                                    </button>
                                </div>
                            )}

                            <div className="temmanage-folder-iconcontainer">
                                <svg className="temmanage-folder-iconcontainer-icon" aria-hidden="true">
                                    <use xlinkHref="#icon-weibiaoti-_huabanfuben"></use>
                                </svg>

                                <h3 className="temmanage-folder-name">{folder.name}</h3>
                            </div>


                            <div className="temmanage-file-list-container">
                                <ul className="temmanage-file-list">
                                    {folder.files.map((file, index) => {
                                        // 找到对应的原始模板数据
                                        const template = folder.rawTemplates[index];
                                        return (
                                            <li
                                                key={file.name}
                                                className={`temmanage-file-item ${isFileSelected(folder.id, file.name) ? 'temmanage-file-selected' : ''}`}
                                                onClick={() => toggleFileSelection(folder.id, file.name)}
                                            >
                                                <div className="temmanage-file-content-left">
                                                    <span className="temmanage-file-icon">
                                                        {getFileIcon(file.type)}
                                                    </span>
                                                    <span
                                                        className="temmanage-file-name"
                                                        title={file.name}
                                                    >
                                                        {file.name}
                                                    </span>
                                                </div>

                                                <div className="temmanage-file-content-right">
                                                    <div
                                                        className="temmanage-file-tooltip"
                                                        onMouseEnter={(e) => {
                                                            e.stopPropagation();
                                                            setHoveredFileTooltip(`${folder.id}-${file.name}-tooltip`);
                                                        }}
                                                        onMouseLeave={() => setHoveredFileTooltip(null)}
                                                    >
                                                        <span className="temmanage-tooltip-icon">?</span>
                                                        {hoveredFileTooltip === `${folder.id}-${file.name}-tooltip` && (
                                                            <div className="temmanage-tooltip-text temmanage-top-tooltip">
                                                                {file.description}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isFileSelected(folder.id, file.name) && (
                                                        <div className="temmanage-file-actions">
                                                            {/* 只有docx/doc文件才显示这两个按钮 */}
                                                            {(file.type === 'docx') && (
                                                                <>
                                                                    <button
                                                                        className="temmanage-action-btn temmanage-pdf-btn"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleViewDocument(template, 'pdf');
                                                                        }}
                                                                    >
                                                                        <svg className="temmanage-Viewingmethod-icon" aria-hidden="true">
                                                                            <use xlinkHref="#icon-pdf2"></use>
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        className="temmanage-action-btn temmanage-word-btn"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleViewDocument(template, 'word');
                                                                        }}
                                                                    >
                                                                        <svg className="temmanage-Viewingmethod-icon" aria-hidden="true">
                                                                            <use xlinkHref="#icon-word4"></use>
                                                                        </svg>
                                                                    </button>
                                                                </>
                                                            )}

                                                             {/* 添加Excel查看按钮 */}
                                                            {(file.type === 'xlsx' || file.type === 'xls') && (
                                                                <button
                                                                    className="temmanage-action-btn temmanage-excel-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleViewDocument(template, 'excel');
                                                                    }}
                                                                >
                                                                    <svg className="temmanage-Viewingmethod-icon" aria-hidden="true">
                                                                        <use xlinkHref="#icon-xlsx"></use>
                                                                    </svg>
                                                                </button>
                                                            )}

                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* 文档查看器模态框 */}
            {viewerState.visible && (
                <div className="temmanage-modal-overlay">
                    <div className="temmanage-modal-container">
                        <button
                            className="temmanage-modal-close"
                            onClick={() => setViewerState({ ...viewerState, visible: false })}
                        >
                            ×
                        </button>
                        {viewerState.type === 'pdf' ? (
                            <TemplateManagementPDFViewer
                                fileUrl={viewerState.fileUrl}
                                fileName={viewerState.fileName}
                                templateData={viewerState.templateData}
                            />
                        ) : viewerState.type === 'word' ? (
                            <TemplateManagementDocxEditor
                                fileUrl={viewerState.fileUrl}
                                fileName={viewerState.fileName}
                                templateData={viewerState.templateData}
                            />
                        ) : (
                            <TemplateManagementExcelViewer
                                fileUrl={viewerState.fileUrl}
                                fileName={viewerState.fileName}
                                templateData={viewerState.templateData}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateManagement;