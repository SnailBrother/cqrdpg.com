import React, { useState, useEffect, useContext } from "react";
import * as XLSX from 'xlsx';
import axios from 'axios';
import io from 'socket.io-client';
import "./Tree.css";
import { useAuth } from '../../../../context/AuthContext';

// 初始化Socket.io连接
const socket = io('https://cqrdpg.com:5202');

function Tree() {
     const { user } = useAuth();
               const username = user?.username; // 从 user 对象中获取 username
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredTrees, setFilteredTrees] = useState([]);
    const [allTrees, setAllTrees] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTree, setEditTree] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // 分页相关状态
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [goToPage, setGoToPage] = useState("");
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // 批量上传相关状态
    const [excelData, setExcelData] = useState([]);
    const [excelHeaders, setExcelHeaders] = useState([]);
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [excelFile, setExcelFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');

    // 初始化加载数据和设置Socket监听
    useEffect(() => {
        fetchRandomTrees();

        // 设置Socket监听
        socket.on('treeUpdate', (data) => {
            if (data.action === 'add') {
                setAllTrees(prev => [...prev, data.tree]);
                setFilteredTrees(prev => [...prev, data.tree]);
            } else if (data.action === 'update') {
                setAllTrees(prev => prev.map(t => t.id === data.tree.id ? data.tree : t));
                setFilteredTrees(prev => prev.map(t => t.id === data.tree.id ? data.tree : t));
            } else if (data.action === 'delete') {
                setAllTrees(prev => prev.filter(t => t.id !== data.id));
                setFilteredTrees(prev => prev.filter(t => t.id !== data.id));
            } else if (data.action === 'batchAdd') {
                fetchRandomTrees();
            }
        });

        return () => {
            socket.off('treeUpdate');
        };
    }, []);

    // 获取随机树木数据
    const fetchRandomTrees = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('https://cqrdpg.com:5202/api/getRandomTrees');
            setAllTrees(response.data.Trees);
            setFilteredTrees(response.data.Trees);
            // 添加这行设置总条数
            setTotalCount(response.data.Trees.length);
        } catch (error) {
            console.error('获取数据失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 处理搜索提交
    const handleSearchSubmit = async () => {
        if (!searchTerm.trim()) {
            setIsSearching(false);
            fetchRandomTrees();
            return;
        }

        setIsSearching(true);
        setIsLoading(true);
        try {
            const response = await axios.get(
                `https://cqrdpg.com:5202/api/searchTrees?term=${encodeURIComponent(searchTerm)}&page=${currentPage}&pageSize=${itemsPerPage}`
            );
            setFilteredTrees(response.data.results);
            setTotalCount(response.data.totalCount);
            setTotalPages(Math.ceil(response.data.totalCount / itemsPerPage));
        } catch (error) {
            console.error('搜索失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 处理页码变化
    const handlePageChange = async (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            try {
                setIsLoading(true);
                if (isSearching) {
                    // 如果是搜索状态，保持搜索
                    const response = await axios.get(
                        `https://cqrdpg.com:5202/api/searchTrees?term=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${itemsPerPage}`
                    );
                    setFilteredTrees(response.data.results);
                } else {
                    // 如果不是搜索状态，获取新的分页数据
                    const response = await axios.get(
                        `https://cqrdpg.com:5202/api/getTrees?page=${page}&pageSize=${itemsPerPage}`
                    );
                    setFilteredTrees(response.data.results);
                }
            } catch (error) {
                console.error('获取数据失败:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // 获取分页数据
    // const fetchTreesWithPagination = async (page, size) => {
    //     try {
    //         setIsLoading(true);
    //         const response = await axios.get(
    //             `https://cqrdpg.com:5202/api/getTrees?page=${page}&pageSize=${size}`
    //         );
    //         setFilteredTrees(response.data.results);
    //         setTotalCount(response.data.totalCount);
    //         setTotalPages(Math.ceil(response.data.totalCount / size));
    //     } catch (error) {
    //         console.error('获取分页数据失败:', error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // 处理每页显示数量变化
    const handleItemsPerPageChange = async (e) => {
        const newSize = Number(e.target.value);
        setItemsPerPage(newSize);
        setCurrentPage(1); // 重置到第一页

        try {
            setIsLoading(true);
            if (isSearching) {
                // 如果是搜索状态，保持搜索
                const response = await axios.get(
                    `https://cqrdpg.com:5202/api/searchTrees?term=${encodeURIComponent(searchTerm)}&page=1&pageSize=${newSize}`
                );
                setFilteredTrees(response.data.results);
                setTotalCount(response.data.totalCount);
                setTotalPages(Math.ceil(response.data.totalCount / newSize));
            } else {
                // 如果不是搜索状态，获取新的分页数据
                const response = await axios.get(
                    `https://cqrdpg.com:5202/api/getTrees?page=1&pageSize=${newSize}`
                );
                setFilteredTrees(response.data.results);
                setTotalCount(response.data.totalCount);
                setTotalPages(Math.ceil(response.data.totalCount / newSize));
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 处理跳转页码
    const handleGoToPage = async (e) => {
        e.preventDefault();
        const page = parseInt(goToPage, 10);
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            try {
                setIsLoading(true);
                if (isSearching) {
                    // 如果是搜索状态，保持搜索
                    const response = await axios.get(
                        `https://cqrdpg.com:5202/api/searchTrees?term=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${itemsPerPage}`
                    );
                    setFilteredTrees(response.data.results);
                } else {
                    // 如果不是搜索状态，获取新的分页数据
                    const response = await axios.get(
                        `https://cqrdpg.com:5202/api/getTrees?page=${page}&pageSize=${itemsPerPage}`
                    );
                    setFilteredTrees(response.data.results);
                }
            } catch (error) {
                console.error('获取数据失败:', error);
            } finally {
                setIsLoading(false);
            }
        }
        setGoToPage("");
    };

    // 打开编辑模态框
    const handleEditClick = (tree) => {
        setEditTree(tree);
        setIsModalOpen(true);
    };

    // 处理删除操作
    const handleDeleteClick = async (id) => {
        try {
            await axios.delete(`https://cqrdpg.com:5202/api/deleteTree/${id}`);
            // Socket通知会自动更新数据
            alert('删除成功');
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败: ' + error.message);
        }
    };

    // 处理表单提交
    // 在表单提交处理中，只验证名称和价格
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const updatedTree = {
            name: formData.get('name'),
            diameter: formData.get('diameter') || null,  // 允许为空
            height: formData.get('height') || null,      // 允许为空
            crown_width: formData.get('crown_width') || null,  // 允许为空
            ground_diameter: formData.get('ground_diameter') || null,  // 允许为空
            price: formData.get('price'),
            region: formData.get('region') || '',        // 允许为空
            species: formData.get('species') || '',       // 允许为空
            notes: formData.get('notes') || ''           // 允许为空
        };

        // 验证名称和价格
        if (!updatedTree.name || !updatedTree.price) {
            alert('名称和价格是必填项');
            return;
        }

        try {
            if (editTree) {
                await axios.put(`https://cqrdpg.com:5202/api/updateTree/${editTree.id}`, updatedTree);
            } else {
                await axios.post('https://cqrdpg.com:5202/api/addTree', updatedTree);
                alert('新增成功');
            }
        } catch (error) {
            console.error('提交失败:', error);
            alert('操作失败: ' + error.message);
        } finally {
            setIsModalOpen(false);
        }
    };

    // 关闭模态框
    const closeModal = () => {
        setIsModalOpen(false);
        setEditTree(null);
    };

    // 处理Excel文件选择
    const handleExcelFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setExcelFile(file);
        setUploadStatus('waiting');

        try {
            const data = await readExcelFile(file);
            if (data.length > 0) {
                setExcelData(data);
                setExcelHeaders(Object.keys(data[0]));
                setUploadStatus('preview');
            } else {
                setUploadStatus('error');
                alert('Excel文件中没有数据或格式不正确');
            }
        } catch (error) {
            console.error('解析Excel失败:', error);
            setUploadStatus('error');
            alert('解析Excel文件失败: ' + error.message);
        }
    };

    const readExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    const formattedData = jsonData.map(row => ({
                        name: row.name || row.名称 || '',
                        diameter: row.diameter || row.米经 || null,
                        height: row.height || row.高度 || null,
                        crown_width: row.crown_width || row.冠幅 || null,
                        ground_diameter: row.ground_diameter || row.地径 || null,
                        price: row.price || row.价格 || 0,
                        region: row.region || row.区域 || '',
                        species: row.species || row.种类 || '',
                        notes: row.notes || row.备注 || ''
                    }));

                    resolve(formattedData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    };

    const handleExcelUpload = async () => {
        if (!excelFile || excelData.length === 0) return;

        setUploadStatus('uploading');
        setUploadProgress(0);

        try {
            const response = await axios.post('https://cqrdpg.com:5202/api/uploadTreesExcel', { data: excelData });

            if (response.data.success) {
                setUploadStatus('success');
                // Socket通知会自动更新数据
            } else {
                throw new Error(response.data.message || '上传失败');
            }
        } catch (error) {
            console.error('上传失败:', error);
            setUploadStatus('error');
            setUploadProgress(0);
        }
    };

    return (
        <div className="tree-container">
            {/* 头部搜索区域 */}
            <header className="tree-header">
                <div className="tree-search-box">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        placeholder="请输入关键字..."
                        className="tree-search-input"
                    />
                    <button
                        type="button"
                        className="tree-search-button"
                        onClick={handleSearchSubmit}
                        disabled={!searchTerm.trim()}
                    >
                        <svg className="tree-search-icon" aria-hidden="true">
                            <use xlinkHref="#icon-sousuo"></use>
                        </svg>
                    </button>
                    {username === '李中敬' && (
                        <>
                            <button
                                className="tree-add-button"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <svg className="tree-add-icon" aria-hidden="true">
                                    <use xlinkHref="#icon-tianjia5" />
                                </svg>
                            </button>
                            <button
                                className="tree-excel-button"
                                onClick={() => setIsExcelModalOpen(true)}
                            >
                                <svg className="tree-excel-icon" aria-hidden="true">
                                    <use xlinkHref="#icon-excel"></use>
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* 主要内容区域 */}
            <section className="tree-content">
                {isLoading ? (
                    <div className="tree-loading">
                        <div className="tree-spinner"></div>
                        <p>加载中...</p>
                    </div>
                ) : filteredTrees.length === 0 ? (
                    <div className="tree-empty">
                        <svg className="tree-empty-icon" aria-hidden="true">
                            <use xlinkHref="#icon-wushuju"></use>
                        </svg>
                        <p>没有找到相关苗木</p>
                    </div>
                ) : (
                    <>
                        <div className="tree-table-container">
                            <table className="tree-table">
                                <thead>
                                    <tr>
                                        <th>序号</th>
                                        <th>名称</th>
                                        <th>区域</th>
                                        <th>种类</th>
                                        <th>米经</th>
                                        <th>高度</th>
                                        <th>冠幅</th>
                                        <th>地径</th>
                                        <th>价格</th>
                                        {username === '李中敬' && <th>操作</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTrees.map((tree, index) => (
                                        <tr key={index}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{tree.name}</td>
                                            <td>{tree.region || '-'}</td>
                                            <td>{tree.species || '-'}</td>
                                            <td>{tree.diameter || tree.diameter === 0 ? '-' : tree.diameter}</td>
                                            <td>{tree.height || tree.height === 0 ? '-' : tree.height}</td>
                                            <td>{tree.crown_width || tree.crown_width === 0 ? '-' : tree.crown_width}</td>
                                            <td>{tree.ground_diameter || tree.ground_diameter === 0 ? '-' : tree.ground_diameter}</td>
                                            <td>{tree.price}</td>
                                            {username === '李中敬' && (
                                                <td>
                                                    <button
                                                        className="tree-edit-button"
                                                        onClick={() => handleEditClick(tree)}
                                                    >
                                                        <svg className="tree-edit-icon" aria-hidden="true">
                                                            <use xlinkHref="#icon-bianji"></use>
                                                        </svg>
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 分页控件 */}
                        <div className="tree-pagination">
                            <div className="tree-pagination-info">
                                共 {totalCount} 条
                            </div>

                            <div className="tree-pagination-controls">
                                <button
                                    className="tree-pagination-button"
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                >
                                    <svg className="tree-pagination-icon" aria-hidden="true">
                                        <use xlinkHref="#icon-arrow-double-left"></use>
                                    </svg>
                                </button>
                                <button
                                    className="tree-pagination-button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <svg className="tree-pagination-icon" aria-hidden="true">
                                        <use xlinkHref="#icon-arrow-left-bold"></use>
                                    </svg>
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    return (
                                        <button
                                            key={pageNum}
                                            className={`tree-pagination-button ${currentPage === pageNum ? "tree-pagination-active" : ""}`}
                                            onClick={() => handlePageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    className="tree-pagination-button"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <svg className="tree-pagination-icon" aria-hidden="true">
                                        <use xlinkHref="#icon-arrow-right-bold"></use>
                                    </svg>
                                </button>
                                <button
                                    className="tree-pagination-button"
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <svg className="tree-pagination-icon" aria-hidden="true">
                                        <use xlinkHref="#icon-arrow-double-right"></use>
                                    </svg>
                                </button>
                            </div>

                            <div className="tree-pagination-size">
                                <select
                                    className="tree-pagination-select"
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                >
                                    <option value="10">10条/页</option>
                                    <option value="20">20条/页</option>
                                    <option value="50">50条/页</option>
                                    <option value="100">100条/页</option>
                                </select>
                            </div>

                            <div className="tree-pagination-jump">
                                <form onSubmit={handleGoToPage}>
                                    <button
                                        type="submit"
                                        className="tree-pagination-jump-button"
                                    >
                                        跳至
                                    </button>
                                    <input
                                        type="number"
                                        className="tree-pagination-input"
                                        min="1"
                                        max={totalPages}
                                        value={goToPage}
                                        onChange={(e) => setGoToPage(e.target.value)}
                                        placeholder="页码"
                                    />
                                    <span className="tree-pagination-jump-button">页</span>
                                </form>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* 编辑/新增模态框 */}
            {isModalOpen && (
                <div className="tree-modal">
                    <div className="tree-modal-content">
                        <div className="tree-modal-header">
                            <h2>{editTree ? '编辑苗木信息' : '新增苗木'}</h2>
                            <button
                                className="tree-modal-close"
                                onClick={closeModal}
                            >
                                <svg className="tree-modal-close-icon" aria-hidden="true">
                                    <use xlinkHref="#icon-guanbi"></use>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="tree-modal-form">
                            <div className="tree-form-group">
                                <label className="tree-form-label">名称</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="tree-form-input"
                                    defaultValue={editTree?.name || ""}
                                    required
                                />
                            </div>

                            <div className="tree-form-group">
                                <label className="tree-form-label">米经</label>
                                <input
                                    type="number"
                                    name="diameter"
                                    className="tree-form-input"
                                    defaultValue={editTree?.diameter || ""}
                                    step="0.01"
                                />
                            </div>

                            <div className="tree-form-group">
                                <label className="tree-form-label">高度</label>
                                <input
                                    type="number"
                                    name="height"
                                    className="tree-form-input"
                                    defaultValue={editTree?.height || ""}
                                    step="0.01"
                                />
                            </div>

                            <div className="tree-form-group">
                                <label className="tree-form-label">冠幅</label>
                                <input
                                    type="number"
                                    name="crown_width"
                                    className="tree-form-input"
                                    defaultValue={editTree?.crown_width || ""}
                                    step="0.01"
                                />
                            </div>

                            <div className="tree-form-group">
                                <label className="tree-form-label">地径</label>
                                <input
                                    type="number"
                                    name="ground_diameter"
                                    className="tree-form-input"
                                    defaultValue={editTree?.ground_diameter || ""}
                                    step="0.01"
                                />
                            </div>

                            <div className="tree-form-group">
                                <label className="tree-form-label">价格</label>
                                <input
                                    type="number"
                                    name="price"
                                    className="tree-form-input"
                                    defaultValue={editTree?.price || ""}
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="tree-form-group">
                                <label className="tree-form-label">区域</label>
                                <input
                                    type="text"
                                    name="region"
                                    className="tree-form-input"
                                    defaultValue={editTree?.region || ""}
                                />
                            </div>

                            <div className="tree-form-group">
                                <label className="tree-form-label">种类</label>
                                <input
                                    type="text"
                                    name="species"
                                    className="tree-form-input"
                                    defaultValue={editTree?.species || ""}
                                />
                            </div>

                            <div className="tree-form-group">
                                <label className="tree-form-label">备注</label>
                                <textarea
                                    name="notes"
                                    className="tree-form-textarea"
                                    defaultValue={editTree?.notes || ""}
                                />
                            </div>

                            <div className="tree-modal-actions">
                                <button
                                    type="submit"
                                    className="tree-modal-save"
                                >
                                    保存
                                </button>
                                {editTree && (
                                    <button
                                        type="button"
                                        className="tree-modal-delete"
                                        onClick={() => {
                                            if (window.confirm('确定要删除这条苗木记录吗？')) {
                                                handleDeleteClick(editTree.id);
                                                closeModal();
                                            }
                                        }}
                                    >
                                        删除
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="tree-modal-cancel"
                                    onClick={closeModal}
                                >
                                    取消
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Excel批量导入模态框 */}
            {isExcelModalOpen && (
                <div className="tree-modal">
                    <div className="tree-modal-content" style={{ maxWidth: '800px' }}>
                        <div className="tree-modal-header">
                            <h2>Excel批量导入</h2>
                            <button
                                className="tree-modal-close"
                                onClick={() => {
                                    setIsExcelModalOpen(false);
                                    setExcelFile(null);
                                    setUploadStatus('');
                                    setUploadProgress(0);
                                }}
                            >
                                <svg className="tree-modal-close-icon" aria-hidden="true">
                                    <use xlinkHref="#icon-guanbi"></use>
                                </svg>
                            </button>
                        </div>

                        <div className="tree-excel-upload">
                            <div className="tree-excel-instructions">
                                <p>请上传包含以下字段的Excel文件：</p>
                                <ul>
                                    <li>name (名称)</li>
                                    <li>diameter (米经)</li>
                                    <li>height (高度)</li>
                                    <li>crown_width (冠幅)</li>
                                    <li>ground_diameter (地径)</li>
                                    <li>price (价格)</li>
                                    <li>region (区域)</li>
                                    <li>species (种类)</li>
                                    <li>notes (备注)</li>
                                </ul>
                                <p className="tree-excel-note">注意：第一行应为表头，数据从第二行开始</p>
                            </div>

                            <div className="tree-file-input">
                                <input
                                    type="file"
                                    id="excel-upload"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleExcelFileChange}
                                    className="tree-file-input-control"
                                />
                                <label htmlFor="excel-upload" className="tree-file-input-label">
                                    {excelFile ? excelFile.name : '选择Excel文件'}
                                </label>
                            </div>

                            {excelFile && (
                                <>
                                    {uploadStatus === 'preview' && (
                                        <div className="tree-excel-preview">
                                            <h4>数据预览 (共 {excelData.length} 条)</h4>
                                            <div className="tree-preview-table-container">
                                                <table className="tree-preview-table">
                                                    <thead>
                                                        <tr>
                                                            {excelHeaders.map((header, index) => (
                                                                <th key={index}>{header}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {excelData.slice(0, 5).map((row, rowIndex) => (
                                                            <tr key={rowIndex}>
                                                                {excelHeaders.map((header, colIndex) => (
                                                                    <td key={colIndex}>
                                                                        {header === 'price' ? Number(row[header]).toFixed(2) : row[header]}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {excelData.length > 5 && (
                                                    <div className="tree-preview-more">
                                                        显示前5条，共{excelData.length}条数据...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="tree-upload-actions">
                                        {uploadStatus === 'waiting' && (
                                            <button
                                                className="tree-upload-button"
                                                onClick={() => setUploadStatus('preview')}
                                            >
                                                预览数据
                                            </button>
                                        )}
                                        {uploadStatus === 'preview' && (
                                            <button
                                                className="tree-upload-button"
                                                onClick={handleExcelUpload}
                                            >
                                                开始上传
                                            </button>
                                        )}
                                        {uploadStatus === 'uploading' && (
                                            <div className="tree-upload-progress">
                                                <div className="tree-progress-bar">
                                                    <div
                                                        className="tree-progress-bar-fill"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="tree-progress-text">{uploadProgress}%</span>
                                            </div>
                                        )}
                                        {uploadStatus === 'success' && (
                                            <div className="tree-upload-success">
                                                <svg className="tree-success-icon" aria-hidden="true">
                                                    <use xlinkHref="#icon-success"></use>
                                                </svg>
                                                <span>上传成功！</span>
                                            </div>
                                        )}
                                        {uploadStatus === 'error' && (
                                            <div className="tree-upload-error">
                                                <svg className="tree-error-icon" aria-hidden="true">
                                                    <use xlinkHref="#icon-error"></use>
                                                </svg>
                                                <span>上传失败，请重试</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tree;