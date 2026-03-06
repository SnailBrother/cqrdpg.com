import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EvaluationFilePreview.css';
import { Loading } from '../../../../components/UI';
const EvaluationFilePreview = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/getEvaluationFilePreview');

                const formattedData = response.data.map(category => ({
                    id: Math.random().toString(36).substr(2, 9),
                    name: category.categoryName,
                    expanded: false, // 默认折叠
                    files: category.files.map(file => ({
                        id: Math.random().toString(36).substr(2, 9),
                        name: file.fileName,
                        remarks: file.remarks,
                        categoryName: category.categoryName
                    }))
                }));

                setCategories(formattedData);
                setLoading(false);
            } catch (err) {
                console.error('获取数据失败:', err);
                setError(`加载数据失败: ${err.message}`);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleCategory = (categoryId) => {
        setCategories(categories.map(category =>
            category.id === categoryId
                ? { ...category, expanded: !category.expanded }
                : category
        ));
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const handleFileClick = (file) => {
        setSelectedFile(file);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    // 过滤函数
    const filteredCategories = categories.map(category => {
        const filteredFiles = category.files.filter(file =>
            file.name.toLowerCase().includes(searchTerm) ||
            (file.remarks && file.remarks.toLowerCase().includes(searchTerm))
        );

        // 如果有匹配的文件或者分类名匹配，则显示该分类
        const shouldShowCategory =
            filteredFiles.length > 0 ||
            category.name.toLowerCase().includes(searchTerm);

        return {
            ...category,
            files: filteredFiles,
            // 如果有搜索词且匹配，则展开分类
            expanded: searchTerm ? shouldShowCategory : category.expanded,
            shouldShow: shouldShowCategory
        };
    }).filter(category => category.shouldShow || !searchTerm);

    if (loading) {
        return <div className="evaluationfilepreview-loading"><Loading message="文献加载中" /></div>;
    }

    if (error) {
        return <div className="evaluationfilepreview-error">{error}</div>;
    }

    const pdfPath = selectedFile
        ? `/backend/public/downloads/EvaluationFile/${selectedFile.categoryName}/${selectedFile.name}`
        : null;

    return (
        <div className="evaluationfilepreview-container">
            <div className={`evaluationfilepreview-sidebar ${sidebarCollapsed ? 'evaluationfilepreview-sidebar-collapsed' : ''}`}>
                <div className="evaluationfilepreview-sidebar-header">
                    {!sidebarCollapsed && (
                        <div className="evaluationfilepreview-title">文件目录</div>
                    )}
                    <button
                        className="evaluationfilepreview-collapse-btn"
                        onClick={toggleSidebar}
                    >
                        {sidebarCollapsed ? '▶' : '◀'}
                    </button>
                </div>
                {!sidebarCollapsed && (
                    <div className="evaluationfilepreview-tree">
                        <div className="evaluationfilepreview-search">
                            <input
                                type="text"
                                placeholder="搜索文件..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        {filteredCategories.map(category => (
                            <div key={category.id} className="evaluationfilepreview-category">
                                <div
                                    className="evaluationfilepreview-category-header"
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <span className={`evaluationfilepreview-caret ${category.expanded ? 'evaluationfilepreview-caret-down' : 'evaluationfilepreview-caret-right'}`}>
                                        {category.expanded ? '▼' : '▶'}
                                    </span>
                                    {category.name}
                                </div>
                                {category.expanded && (
                                    <div className="evaluationfilepreview-files">
                                        {category.files.map((file, index) => (
                                            <div
                                                key={file.id}
                                                className={`evaluationfilepreview-file ${selectedFile?.id === file.id ? 'evaluationfilepreview-file-selected' : ''}`}
                                                onClick={() => handleFileClick(file)}
                                            >
                                                <div className="evaluationfilepreview-file-index">{index + 1}.</div>
                                                <div className="evaluationfilepreview-file-content">
                                                    <div className="evaluationfilepreview-file-name">{file.name}</div>
                                                    {file.remarks && (
                                                        <div className="evaluationfilepreview-file-remarks">{file.remarks}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="evaluationfilepreview-content">
                <div className="evaluationfilepreview-file-preview">
                    {selectedFile ? (
                        <div style={{ width: '100%', height: '100%' }}>
                            <iframe
                                src={pdfPath}
                                width="100%"
                                height="100%"
                                title="PDF Viewer"
                                style={{ border: 'none' }}
                            >
                                <p>您的浏览器不支持 PDF 显示，请<a href={pdfPath}>点击这里下载</a>。</p>
                            </iframe>
                        </div>
                    ) : (
                        <div className="evaluationfilepreview-preview-placeholder">
                            文件预览区域
                            <div className="evaluationfilepreview-preview-hint">
                                选择左侧文件以预览内容
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvaluationFilePreview;