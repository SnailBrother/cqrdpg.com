import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './SearchHousePrice.module.css';  // 修改导入方式
import WordReportGeneratorLoader from '../../accounting/Notification/WordReportGeneratorLoader';

const SearchHousePrice = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [jumpPage, setJumpPage] = useState('');
     
    // 搜索函数
    // 在searchRecords函数中，获取数据后添加照片状态查询
    const searchRecords = async (page = 1) => {
        if (searchTerm.trim() === '') {
            setRecords([]);
            setTotalRecords(0);
            setTotalPages(0);
            return;
        }
        try {
            setLoading(true);
            setError('');

            const response = await axios.get('/api/searchHousePrice', {
                params: {
                    searchTerm: searchTerm,
                    page: page,
                    pageSize: pageSize
                }
            });

            if (response.data.success) {
                const recordsWithPhotos = await Promise.all(
                    response.data.data.records.map(async (record) => {
                        try {
                            const photoResponse = await axios.get('/api/GetHousePricePictures', {
                                params: { reportsID: record.reportsID }
                            });
                            return {
                                ...record,
                                hasPhotos: photoResponse.data.images && photoResponse.data.images.length > 0
                            };
                        } catch (error) {
                            console.error(`查询照片失败 ${record.reportsID}:`, error);
                            return {
                                ...record,
                                hasPhotos: false
                            };
                        }
                    })
                );

                setRecords(recordsWithPhotos);
                setTotalRecords(response.data.data.total);
                setTotalPages(response.data.data.totalPages);
                setCurrentPage(response.data.data.page);
            } else {
                setError(response.data.message || '搜索失败');
            }
        } catch (err) {
            setError('搜索失败: ' + (err.response?.data?.message || err.message));
            console.error('搜索错误:', err);
        } finally {
            setLoading(false);
        }
    };

    // 初始加载和搜索词变化时搜索
    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         if (searchTerm.trim() !== '') {
    //             searchRecords(1);
    //         } else {
    //             setRecords([]);
    //             setTotalRecords(0);
    //             setTotalPages(0);
    //         }
    //     }, 500);

    //     return () => clearTimeout(timer);
    // }, [searchTerm]);

    // 处理搜索
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // 添加这行
        searchRecords(1);
    };

    // 处理分页
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            searchRecords(newPage);
        }
    };

    // 处理每页显示条数变化
    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        setPageSize(newSize);
        setCurrentPage(1);
        if (searchTerm.trim() !== '') {
            searchRecords(1);
        }
    };

    // 处理跳转页面
    const handleJumpPage = () => {
        const pageNum = parseInt(jumpPage);
        if (pageNum >= 1 && pageNum <= totalPages) {
            handlePageChange(pageNum);
            setJumpPage('');
        }
    };

    // 生成页码数组
    const generatePageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5; // 最多显示的页码数

        if (totalPages <= maxVisiblePages) {
            // 如果总页数少于等于最大显示页数，显示所有页码
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // 显示部分页码，当前页在中间
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            // 调整起始页，确保显示maxVisiblePages个页码
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    // 格式化日期
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    };

    // 格式化金额
    const formatPrice = (price) => {
        if (!price) return '-';
        return new Intl.NumberFormat('zh-CN').format(price) + ' 元/㎡';
    };

    // 格式化面积
    const formatArea = (area) => {
        if (!area) return '-';
        return new Intl.NumberFormat('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(area) + ' ㎡';
    };

    return (

        <div className={styles.outContainer}>
            <div className={styles.container}>
                {/* 搜索框 */}
                <div className={styles.searchSection}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <div className={styles.searchInputGroup}>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="请输入房产坐落、小区名称等进行搜索..."
                                className={styles.searchInput}
                            />
                            <button
                                type="submit"
                                className={styles.searchButton}
                                disabled={loading}
                            >
                                {loading ? '搜索中...' : '搜索'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {/* 加载状态 */}
                {loading && (
                    <div className={styles.loading}>
                        <WordReportGeneratorLoader />
                    </div>
                )}

                {/* 搜索结果统计 */}
                {records.length > 0 && (
                    <div className={styles.stats}>
                        共 {totalRecords} 条记录:
                    </div>
                )}

                {/* 搜索结果表格 */}
                {records.length > 0 ? (
                    <div className={styles.results}>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>序号</th>
                                        <th>小区名称</th>
                                        <th>房产坐落</th>
                                        <th>建筑面积</th>
                                        <th>评估单价</th>
                                        <th>月租金</th>
                                        <th>日期</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record, index) => (
                                        <tr key={record.reportsID}>
                                            <td>{(currentPage - 1) * pageSize + index + 1}</td> {/* 计算序号 */}
                                            <td>{record.communityName || '-'}</td>
                                            <td>{record.location || '-'}</td>
                                            <td>{formatArea(record.buildingArea)}</td>
                                            <td>{formatPrice(record.valuationPrice)}</td>
                                            <td>{formatPrice(record.rent)}</td>
                                            <td>{formatDate(record.reportDate)}</td>
                                            <td>
                                                {record.hasPhotos ? (
                                                    <button
                                                        className={styles.detailButton}
                                                        onClick={() => {
                                                            const reportId = record.reportsID;
                                                            const location = record.location;
                                                            if (!reportId) {
                                                                alert('报告ID不存在');
                                                                return;
                                                            }
                                                            const reportData = {
                                                                reportsID: reportId,
                                                                location: location || '？'
                                                            };
                                                            const queryParams = new URLSearchParams(reportData).toString();
                                                            const qrCodePageUrl = `${window.location.origin}/app/office/LookHousePricePicture?${queryParams}`;
                                                            window.open(qrCodePageUrl, '_blank');
                                                        }}
                                                    >
                                                        <svg className={styles.icon} aria-hidden="true">
                                                            <use xlinkHref="#icon-chakantupian9" />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <svg className={styles.icon} aria-hidden="true">
                                                        <use xlinkHref="#icon-zanwutupian1" />
                                                    </svg>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 完整分页控件 */}
                        {totalPages > 0 && (
                            <div className={styles.paginationComplete}>
                                <div className={styles.paginationLeft}>
                                    <span>共 {totalPages} 页</span>
                                </div>

                                <div className={styles.paginationCenter}>
                                    <button
                                        className={styles.paginationButton}
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        title="首页"
                                    >
                                        «
                                    </button>
                                    <button
                                        className={styles.paginationButton}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        title="上一页"
                                    >
                                        ‹
                                    </button>

                                    {/* 动态页码显示 */}
                                    {generatePageNumbers().map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            className={`${styles.paginationButton} ${currentPage === pageNum ? styles.paginationActive : ''}`}
                                            onClick={() => handlePageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    <button
                                        className={styles.paginationButton}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        title="下一页"
                                    >
                                        ›
                                    </button>
                                    <button
                                        className={styles.paginationButton}
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        title="末页"
                                    >
                                        »
                                    </button>
                                </div>

                                <div className={styles.paginationRight}>
                                    <div className={styles.pageSizeSelector}>
                                        <select
                                            value={pageSize}
                                            onChange={handlePageSizeChange}
                                            className={styles.pageSizeSelect}
                                        >
                                            <option value={10}>10条/页</option>
                                            <option value={20}>20条/页</option>
                                            <option value={50}>50条/页</option>
                                            <option value={100}>100条/页</option>
                                        </select>
                                    </div>

                                    <div className={styles.pageJump}>
                                        <span>跳至</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max={totalPages}
                                            value={jumpPage}
                                            onChange={(e) => setJumpPage(e.target.value)}
                                            className={styles.jumpInput}
                                            placeholder="页数"
                                        />
                                        <span>页</span>
                                        <button
                                            onClick={handleJumpPage}
                                            className={styles.jumpButton}
                                        >
                                            跳转
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // 修改为：只有点击搜索后且没有数据时才显示
                    !loading && searchTerm && records.length === 0 && (
                        <div className={styles.noData}>
                            <svg className={styles.suggestIcon} aria-hidden="true">
                                <use xlinkHref="#icon-weisousuodaojieguo" />
                            </svg>
                        </div>
                    )
                )}

                {/* 搜索提示 */}
                {!loading && !searchTerm && records.length === 0 && (
                    <div className={styles.tips}>
                        <svg className={styles.suggestIcon} aria-hidden="true">
                            <use xlinkHref="#icon-weisousuodaojieguo" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchHousePrice;