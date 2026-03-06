// src/components/MergePrintPdf.js
import React, { useState, useEffect } from 'react';
import styles from './MergePrintPdf.module.css';
import io from 'socket.io-client';
import { useAuth } from '../../../../context/AuthContext';
// 创建全局 socket 实例
const socket = io('http://121.4.22.55:5202');

const MergePrintPdf = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
    const [isMerging, setIsMerging] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [currentFilename, setCurrentFilename] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { user, isAuthenticated } = useAuth(); //获取用户名
    const [companyName, setCompanyName] = useState(null); // 新增：存储公司名称 
    // <p><strong>用户名:</strong> {user.username}</p>
    // <p><strong>邮箱:</strong> {user.email}</p>
    // 获取用户公司信息
    useEffect(() => {
        const fetchCompanyInfo = async () => {
            if (!user) return;

            try {
                const params = new URLSearchParams();
                if (user.username) params.append('username', user.username);
                if (user.email) params.append('email', user.email);

                const response = await fetch(`/api/user/company?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setCompanyName(data.companyName); // 这里设置公司名称
                    console.log(`用户属于公司: ${data.companyName}`);
                } else {
                    console.warn('获取公司信息失败，使用默认公司');
                    setCompanyName('zhonghe'); // 只有失败时才设置默认值
                }
            } catch (err) {
                console.error('获取公司信息错误:', err);
                setCompanyName('zhonghe'); // 只有出错时才设置默认值
            }
        };

        fetchCompanyInfo();
    }, [user]);
    // 获取 PDF 文件列表
    const fetchPdfFiles = async () => {
        try {
            // 在 fetchPdfFiles 开头加更强校验
            if (!companyName || companyName === 'null' || companyName === 'wu') {
                console.log('公司名称无效，跳过请求');
                return;
            }
            setLoading(true);
            // 确保 companyName 有值
            if (!companyName) {
                console.error('companyName 为空，无法获取文件列表');
                alert('无法确定公司信息，请刷新页面重试');
                setLoading(false);
                return;
            }

            // 传递公司名称参数到后端
            // console.log(`请求公司 ${companyName} 的PDF文件列表`);
            // 传递公司名称参数到后端
            const response = await fetch(`/api/ReportPdfPrintFile?company=${companyName}`);
            if (!response.ok) throw new Error('Failed to fetch PDF files');
            const data = await response.json();

            // 按 fileType 分组
            const grouped = data.reduce((acc, item) => {
                const { fileType, pdfPrintFileName, paperSize } = item;
                if (!acc[fileType]) {
                    acc[fileType] = {
                        name: fileType,
                        files: []
                    };
                }
                if (!acc[fileType].files.some(f => f.name === pdfPrintFileName)) {
                    acc[fileType].files.push({
                        name: pdfPrintFileName,
                        paperSize: paperSize || 'A4'
                    });
                }
                return acc;
            }, {});

            const categoriesArray = Object.values(grouped);
            setCategories(categoriesArray);
        } catch (err) {
            console.error('Error fetching PDF files:', err);
            alert('无法加载PDF文件列表，请检查网络或后端服务');
        } finally {
            setLoading(false);
        }
    };

    // 获取 PDF 文件列表
    const fetchPdfFilesold = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/ReportPdfPrintFile');
            if (!response.ok) throw new Error('Failed to fetch PDF files');
            const data = await response.json();

            // 按 fileType 分组
            const grouped = data.reduce((acc, item) => {
                const { fileType, pdfPrintFileName, paperSize } = item;
                if (!acc[fileType]) {
                    acc[fileType] = {
                        name: fileType,
                        files: []
                    };
                }
                if (!acc[fileType].files.some(f => f.name === pdfPrintFileName)) {
                    acc[fileType].files.push({
                        name: pdfPrintFileName,
                        paperSize: paperSize || 'A4'
                    });
                }
                return acc;
            }, {});

            const categoriesArray = Object.values(grouped);
            setCategories(categoriesArray);
        } catch (err) {
            console.error('Error fetching PDF files:', err);
            alert('无法加载PDF文件列表，请检查网络或后端服务');
        } finally {
            setLoading(false);
        }
    };
    // 当 companyName 变化时重新获取文件列表
    useEffect(() => {
        if (companyName) {
            fetchPdfFiles();
        }
    }, [companyName]);

    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const toggleFile = (category, filename, paperSize) => {
        const key = `${category}/${filename}`;
        const exists = selectedFiles.some((item) => `${item.category}/${item.filename}` === key);
        if (exists) {
            setSelectedFiles(selectedFiles.filter((item) => `${item.category}/${item.filename}` !== key));
        } else {
            setSelectedFiles([...selectedFiles, { category, filename, paperSize }]);
        }
        setMergedPdfUrl(null);
    };

    const moveUp = (index) => {
        if (index <= 0) return;
        const newSelected = [...selectedFiles];
        [newSelected[index - 1], newSelected[index]] = [newSelected[index], newSelected[index - 1]];
        setSelectedFiles(newSelected);
        setMergedPdfUrl(null);
    };

    const moveDown = (index) => {
        if (index >= selectedFiles.length - 1) return;
        const newSelected = [...selectedFiles];
        [newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
        setSelectedFiles(newSelected);
        setMergedPdfUrl(null);
    };

    const removeFile = (index) => {
        const newSelected = [...selectedFiles];
        newSelected.splice(index, 1);
        setSelectedFiles(newSelected);
        setMergedPdfUrl(null);
    };
    const handleMergePreview = async () => {
        if (selectedFiles.length === 0) return;
        setIsMerging(true);
        try {
            const response = await fetch('/api/mergePdfs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: selectedFiles,
                    oldFilename: currentFilename,
                    companyName: companyName // 新增：传递公司名称
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setMergedPdfUrl(data.url);
                setCurrentFilename(data.filename);
                socket.emit('useFile', { filename: data.filename });
            } else {
                alert('合并失败');
            }
        } catch (err) {
            console.error(err);
            alert('网络错误');
        } finally {
            setIsMerging(false);
        }
    };
    const handleMergePreviewold = async () => {
        if (selectedFiles.length === 0) return;
        setIsMerging(true);
        try {
            const response = await fetch('/api/mergePdfs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: selectedFiles,
                    oldFilename: currentFilename,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setMergedPdfUrl(data.url);
                setCurrentFilename(data.filename);
                socket.emit('useFile', { filename: data.filename });
            } else {
                alert('合并失败');
            }
        } catch (err) {
            console.error(err);
            alert('网络错误');
        } finally {
            setIsMerging(false);
        }
    };

    const clearAll = () => {
        setSelectedFiles([]);
        setMergedPdfUrl(null);
    };

    // 页面卸载时释放
    useEffect(() => {
        const onBeforeUnload = () => {
            if (currentFilename) {
                socket.emit('releaseFile', { filename: currentFilename });
            }
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            if (currentFilename) {
                socket.emit('releaseFile', { filename: currentFilename });
            }
        };
    }, [currentFilename]);

    if (loading) {
        return <div className={styles.container}>加载中...</div>;
    }

    return (
        <div className={styles.container}>
            {/* 头部功能区 */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>
                    <svg className={styles.titleicon} aria-hidden="true">
                        <use xlinkHref="#icon-a-fengcheertongleyuanyoulechang"></use>
                    </svg>
                    <svg className={styles.titleicon} aria-hidden="true">
                        <use xlinkHref="#icon-fengche"></use>
                    </svg>
                    <svg className={styles.titleicon} aria-hidden="true">
                        <use xlinkHref="#icon-a-fengcheertongleyuanyoulechang"></use>
                    </svg>
                    <svg className={styles.titleicon} aria-hidden="true">
                        <use xlinkHref="#icon-fengche_windmill-two"></use>
                    </svg>
                </h1>
                <div className={styles.headerActions}>

                    {/* <div className={styles.companyInfo}>
                        当前公司: <span className={styles.companyBadge}>  {companyName || '获取中...'}</span>
                    </div>
                    <strong>用户名:</strong> {user.username} */}
                    <button
                        className={styles.refreshBtn}
                        onClick={fetchPdfFiles}
                    >
                        🔄 刷新列表
                    </button>
                    {mergedPdfUrl && (
                        <button
                            className={styles.toggleBtn}
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        >
                            {isSidebarCollapsed ? '展开列表' : '折叠列表'}
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.mainContent}>
                {/* 左侧：文件库 */}
                <div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <h2>PDF 文件库</h2>
                        <span className={styles.countBadge}>{categories.reduce((acc, cat) => acc + cat.files.length, 0)}</span>
                    </div>
                    <div className={styles.categoryContainer}>
                    {categories.map((category) => (
                        <div key={category.name} className={styles.category}>
                            <div
                                className={styles.categoryHeader}
                                onClick={() => toggleCategory(category.name)}
                            >
                                <h3>{category.name}</h3>
                                <span className={styles.toggleIcon}>
                                    {expandedCategories[category.name] ? '−' : '+'}
                                </span>
                            </div>
                            <ul className={`${styles.categoryList} ${expandedCategories[category.name] ? styles.expanded : ''}`}>
                                {category.files.map((fileObj) => {
                                    const key = `${category.name}/${fileObj.name}`;
                                    const isChecked = selectedFiles.some(
                                        (item) => `${item.category}/${item.filename}` === key
                                    );
                                    return (
                                        <li key={key} className={styles.categoryItem}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleFile(category.name, fileObj.name, fileObj.paperSize)}
                                                />
                                                <span className={styles.fileName}>{fileObj.name}</span>
                                                <span className={styles.paperSizeBadge}>{fileObj.paperSize}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                    </div>
                </div>

                {/* 中间：已选文件列表 */}
                <div className={`${styles.centerPanel} ${isSidebarCollapsed ? styles.fullWidth : ''}`}>
                    <div className={styles.centerHeader}>
                        <h2>合并预览 ({selectedFiles.length} 个文件)</h2>
                        {selectedFiles.length > 0 && (
                            <button
                                className={styles.clearBtn}
                                onClick={clearAll}
                            >
                                清空
                            </button>
                        )}

                        <div className={styles.mergeActions}>
                            <button
                                onClick={handleMergePreview}
                                disabled={isMerging || selectedFiles.length === 0}
                                className={styles.mergeBtn}
                            >
                                {isMerging ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        合并中...
                                    </>
                                ) : (
                                    '合并'
                                )}
                            </button>
                        </div>

                    </div>

                    {selectedFiles.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📄</div>
                            <p>请从左侧选择 PDF 文件</p>
                            <p className={styles.emptyHint}>点击文件名称前的复选框添加文件</p>
                        </div>
                    ) : (
                        <div className={styles.selectedContainer}>
                            <ul className={styles.selectedList}>
                                {selectedFiles.map((item, index) => (
                                    <li key={`${item.category}-${item.filename}-${index}`} className={styles.selectedItem}>
                                        <span className={styles.itemIndex}>{index + 1}</span>
                                        <div className={styles.itemContent}>
                                            <span className={styles.categoryBadge}>{item.category}</span>
                                            <span className={styles.fileName}>{item.filename}</span>
                                            <span className={styles.paperSizeTag}>{item.paperSize}</span>
                                        </div>
                                        <div className={styles.itemActions}>
                                            <button
                                                onClick={() => moveUp(index)}
                                                disabled={index === 0}
                                                title="上移"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveDown(index)}
                                                disabled={index === selectedFiles.length - 1}
                                                title="下移"
                                            >
                                                ↓
                                            </button>
                                            {/* <button
                                                onClick={() => removeFile(index)}
                                                title="移除"
                                                className={styles.removeBtn}
                                            >
                                                ×
                                            </button> */}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}


                </div>

                {/* 右侧：PDF 预览 */}
                <div className={`${styles.previewPanel} ${isSidebarCollapsed ? styles.fullWidth : ''}`}>
                    <div className={styles.previewHeader}>
                        <h2>PDF 预览</h2>
                    </div>

                    {mergedPdfUrl ? (
                        <div className={styles.pdfContainer}>
                            <iframe
                                src={mergedPdfUrl}
                                title="Merged PDF"
                                className={styles.pdfFrame}
                            />
                        </div>
                    ) : (
                        <div className={styles.previewPlaceholder}>
                            <div className={styles.placeholderIcon}>👁️</div>
                            <p>生成合并预览后，PDF将显示在这里</p>
                            <p className={styles.placeholderHint}>
                                点击"生成合并预览"按钮查看合并后的PDF
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MergePrintPdf;