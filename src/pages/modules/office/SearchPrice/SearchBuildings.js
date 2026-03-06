import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './SearchBuildings.module.css';
import { Loading } from '../../../../components/UI';

const Buildings = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [hasMore, setHasMore] = useState(true);
    const [initialSearch, setInitialSearch] = useState(false);
    const [showFullscreenLoading, setShowFullscreenLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const observer = useRef();
    const lastRecordRef = useRef();

    // 计算总价
    const calculateTotalPrice = (area, unitPrice, unit) => {
        if (!area || !unitPrice) return '-';
        let total = 0;

        if (unit === '元/㎡') {
            total = (area * unitPrice) / 10000; // 转换为万元
        } else if (unit === '元/m³') {
            total = (area * unitPrice) / 10000; // 转换为万元
        } else if (unit === '元/m') {
            total = (area * unitPrice) / 10000; // 转换为万元
        } else if (unit === '元/座') {
            total = unitPrice / 10000; // 转换为万元
        } else if (unit === '元/个') {
            total = unitPrice / 10000; // 转换为万元
        }

        return new Intl.NumberFormat('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(total) + ' 万元';
    };

    // 格式化日期
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    };

    // 格式化单价（带单位）
    // 修改格式化单价函数
    const formatUnitPrice = (price, unit) => {
        if (!price) return '-';

        // 如果单位不包含"元/"，则添加
        let formattedUnit = unit || '';
        if (formattedUnit && !formattedUnit.includes('元/')) {
            formattedUnit = '元/' + formattedUnit;
        }

        return new Intl.NumberFormat('zh-CN').format(price) + ` ${formattedUnit}`;
    };

    // 格式化面积/数量
    const formatArea = (area, unit) => {
        if (!area) return '-';
        if (unit === '元/㎡' || unit === '元/m²') {
            return new Intl.NumberFormat('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(area) + ' ㎡';
        } else if (unit === '元/m³') {
            return new Intl.NumberFormat('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(area) + ' m³';
        } else if (unit === '元/m') {
            return new Intl.NumberFormat('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(area) + ' m';
        } else if (unit === '元/座' || unit === '元/个') {
            return '1 项';
        }
        return area;
    };

    // 获取图片预览（只加载第一张）
    const getPreviewImage = async (buildingsPriceid) => {
        try {
            const response = await axios.get('/api/GetBuildingsPricePictures', {
                params: { buildingsPriceid }
            });

            if (response.data.success && response.data.images && response.data.images.length > 0) {
                const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
                const firstImage = response.data.images[0];
                return `${baseUrl}/backend/images/BuildingsPricePictures/${buildingsPriceid}/${firstImage.pictureFileName}`;
            }
            return null;
        } catch (error) {
            console.error(`获取图片预览失败 ${buildingsPriceid}:`, error);
            return null;
        }
    };

    // 搜索函数
    const searchRecords = useCallback(async (page = 1, isLoadMore = false) => {
        try {
            // 初始搜索时显示全屏加载
            if (!isLoadMore) {
                setShowFullscreenLoading(true);
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError('');

            const response = await axios.get('/api/QueryBuildingsPrice', {
                params: {
                    searchText: searchTerm,
                    page: page,
                    pageSize: pageSize
                }
            });

            if (response.data.success) {
                const recordsData = response.data.data;

                // 并行获取所有记录的预览图片
                const recordsWithPreview = await Promise.all(
                    recordsData.map(async (record) => {
                        const previewImage = await getPreviewImage(record.id);
                        return {
                            ...record,
                            previewImage: previewImage,
                            totalPrice: calculateTotalPrice(record.area, record.price, record.unit)
                        };
                    })
                );

                if (isLoadMore) {
                    setRecords(prev => [...prev, ...recordsWithPreview]);
                } else {
                    setRecords(recordsWithPreview);
                    setInitialSearch(true);
                }

                const pagination = response.data.pagination;
                setTotalCount(pagination.totalCount);
                const currentTotal = isLoadMore ? records.length + recordsData.length : recordsData.length;
                setHasMore(currentTotal < pagination.totalCount);

                if (!isLoadMore) {
                    setCurrentPage(1);
                }
            } else {
                setError(response.data.message || '搜索失败');
            }
        } catch (err) {
            setError('搜索失败: ' + (err.response?.data?.message || err.message));
            console.error('搜索错误:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            // 数据加载完成后隐藏全屏加载
            setShowFullscreenLoading(false);
        }
    }, [searchTerm, pageSize, records.length]);

    // 处理搜索
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim() === '') {
            setRecords([]);
            setHasMore(false);
            setInitialSearch(false);
            return;
        }
        searchRecords(1, false);
    };

    // 处理Enter键搜索
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    // 处理图片点击跳转
    const handleImageClick = (record) => {
        if (!record.previewImage) return;

        const params = {
            buildingsPriceid: record.id,
            name: record.name,
            structure: record.structure,
            area: record.area,
            unit: record.unit,
            price: record.price
        };
        const queryParams = new URLSearchParams(params).toString();
        // const uploadPageUrl = `${window.location.origin}/app/office/LookBuildingsPricePicture?${queryParams}`;
        // navigate(uploadPageUrl);
        const uploadPageUrl = `${window.location.origin}/app/office/LookBuildingsPricePicture?${queryParams}`;

        window.open(uploadPageUrl, '_blank');
    };

    // const handleImageClick = (record) => {
    //     if (!record.previewImage) return;

    //     const reportData = {
    //         reportsID: record.reportsID,
    //         location: record.location || '？'
    //     };
    //     const queryParams = new URLSearchParams(reportData).toString();
    //     const qrCodePageUrl = `${window.location.origin}/app/office/LookHousePricePicture?${queryParams}`;
    //     window.open(qrCodePageUrl, '_blank');
    // };

    // 处理编辑操作
    // const handleEditClick = (record) => {
    //     // 这里可以打开编辑模态框或跳转到编辑页面
    //     console.log('编辑记录:', record);
    //     // 根据你的实际需求实现编辑功能
    // };

    // 无限滚动观察器
    const setupObserver = useCallback(() => {
        if (loading || loadingMore) return;

        if (observer.current) {
            observer.current.disconnect();
        }

        observer.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    const nextPage = currentPage + 1;
                    setCurrentPage(nextPage);
                    searchRecords(nextPage, true);
                }
            },
            {
                root: null,
                rootMargin: '100px',
                threshold: 0.1
            }
        );

        if (lastRecordRef.current) {
            observer.current.observe(lastRecordRef.current);
        }
    }, [loading, loadingMore, hasMore, currentPage, searchRecords]);

    // 设置/清理观察器
    useEffect(() => {
        setupObserver();
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [setupObserver]);

    // 当records变化时重新设置观察器
    useEffect(() => {
        if (records.length > 0) {
            setupObserver();
        }
    }, [records, setupObserver]);

    // 渲染单个记录卡片
    const renderRecordCard = (record, index) => {
        const isLastRecord = index === records.length - 1;

        return (
            <div
                key={`${record.id}-${index}`}
                ref={isLastRecord ? lastRecordRef : null}
                className={styles.recordCard}
            >
                <div className={styles.cardContent}>
                    {/* 左侧：图片 */}
                    <div className={styles.leftColumn}>
                        <div
                            className={`${styles.imageContainer} ${record.previewImage ? styles.hasImage : ''}`}
                            onClick={() => handleImageClick(record)}
                        >
                            {record.previewImage ? (
                                <img
                                    src={record.previewImage}
                                    alt="建筑物预览"
                                    className={styles.previewImage}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNFNUU1RTUiLz4KICA8cGF0aCBkPSJNNjUgMzVINDUuNUM0My41NzEgMzUgNDIgMzYuNTcxIDQyIDM4LjVWMzguNUM0MiA0MC40MjkgNDMuNTcxIDQyIDQ1LjUgNDJINTQuNUM1Ni40MjkgNDIgNTggNDMuNTcxIDU4IDQ1LjVWNTdDNjIgNjIgNjcgNjUgNzUgNjVDODMuMjg0IDY1IDkwIDU4LjI4NCA5MCA1MEM5MCA0NC43OTQgODcuMjcxIDQwLjA0NSA4MyAzNy4wNDZWMzguNUM4MyA0MC40MjkgODEuNDI5IDQyIDc5LjUgNDJINzAuNUM2OC41NzEgNDIgNjcgNDAuNDI5IDY3IDM4LjVWMzguNUM2NyAzNi41NzEgNjUuNDI5IDM1IDYzLjUgMzVINjVaIiBmaWxsPSIjQkJCIi8+Cjwvc3ZnPgo=';
                                    }}
                                />
                            ) : (
                                <div className={styles.noImagePlaceholder}>
                                    <div className={styles.uploadPrompt} onClick={() => handleImageClick(record)}>
                                        <svg className={styles.uploadIcon} aria-hidden="true">
                                            <use xlinkHref="#icon-shangchuan" />
                                        </svg>
                                        <span>上传图片</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 中间：主要信息 */}
                    <div className={styles.middleColumn}>
                        {/* 名称 */}
                        <div className={styles.nameSection}>
                            <span className={styles.nameValue}>{record.name || '-'}</span>
                        </div>

                        {/* 结构信息 */}
                        <div className={styles.row}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>结构：</span>
                                <span className={styles.infoValue}>{record.structure || '-'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>区域：</span>
                                <span className={styles.infoValue}>{record.area ? formatArea(record.area, record.unit) : '-'}</span>
                            </div>
                        </div>

                        {/* 备注和日期 */}
                        <div className={styles.row}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>备注：</span>
                                <span className={styles.infoValue}>{record.notes || '无'}</span>
                            </div>
                            {/* <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>创建日期：</span>
                                <span className={styles.infoValue}>{formatDate(record.createdDate)}</span>
                            </div> */}
                        </div>
                    </div>

                    {/* 右侧：价格信息 */}
                    <div className={styles.rightColumn}>
                        {/* 评估总价 */}
                        {/* <div className={styles.priceSection}>
                            <div className={styles.priceLabel}>估算总价：</div>
                            <span className={styles.totalPriceValue}>
                                {calculateTotalPrice(record.area, record.price, record.unit)}
                            </span>
                        </div> */}

                        {/* 单价 */}
                        <div className={styles.priceSection}>
                            {/* <div className={styles.priceLabel}>单价：</div> */}
                            <span className={styles.priceValue}>{formatUnitPrice(record.price, record.unit)}</span>
                        </div>

                        <div className={styles.priceSection}>
                            <span className={styles.infoValue}>{formatDate(record.createdDate)}</span>
                        </div>

                        {/* 操作按钮 */}
                        {/* <div className={styles.actionSection}>
                            <button 
                                className={styles.editButton}
                                onClick={() => handleEditClick(record)}
                                title="编辑"
                            >
                                <svg className={styles.editIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-bianji" />
                                </svg>
                                编辑
                            </button>
                            <button 
                                className={styles.uploadButton}
                                onClick={() => handleImageClick(record)}
                                title="管理图片"
                            >
                                <svg className={styles.uploadIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-tupian" />
                                </svg>
                                管理图片
                            </button>
                        </div> */}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.outContainer}>
            {/* 全屏加载蒙层 */}
            {showFullscreenLoading && (
                <div className={styles.fullscreenLoading}>
                    <Loading message="数据加载中..." />
                </div>
            )}

            <div className={styles.container}>
                {/* 搜索框 */}
                <div className={styles.searchSection}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <div className={styles.searchInputGroup}>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="请输入名称、结构、区域、单位、单价等进行搜索..."
                                className={styles.searchInput}
                            />
                            <button
                                type="submit"
                                className={styles.searchButton}
                                disabled={loading}
                            >
                                搜索
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

                {/* 初始加载状态 */}
                {loading && records.length === 0 && !showFullscreenLoading && (
                    <div className={styles.loading}>
                        <Loading message="数据加载中..." />
                    </div>
                )}

                {/* 搜索结果统计 */}
                {records.length > 0 && initialSearch && (
                    <div className={styles.stats}>
                        找到 {totalCount} 条记录，当前显示 {records.length} 条{hasMore ? '，滚动加载更多...' : ''}
                    </div>
                )}

                {/* 搜索结果列表 */}
                {records.length > 0 ? (
                    <div className={styles.resultsList}>
                        {records.map((record, index) =>
                            renderRecordCard(record, index)
                        )}

                        {/* 加载更多指示器 */}
                        {loadingMore && (
                            <div className={styles.loadingMore}>
                                <div className={styles.loadingSpinner}></div>
                                <span>正在加载更多...</span>
                            </div>
                        )}

                        {/* 没有更多数据的提示 */}
                        {!hasMore && records.length > 0 && !loadingMore && (
                            <div className={styles.noMoreData}>
                                <svg className={styles.noMoreIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-dibudaole" />
                                </svg>
                                <span className={styles.noMoreText}>没有更多数据了</span>
                            </div>
                        )}
                    </div>
                ) : (
                    !loading && initialSearch && searchTerm && !showFullscreenLoading && (
                        <div className={styles.noData}>
                            <svg className={styles.suggestIcon} aria-hidden="true">
                                <use xlinkHref="#icon-weisousuodaojieguo" />
                            </svg>
                            <span>没有找到相关记录</span>
                        </div>
                    )
                )}

                {/* 初始提示 */}
                {!loading && !initialSearch && records.length === 0 && !showFullscreenLoading && (
                    <div className={styles.tips}>
                        <svg className={styles.suggestIcon} aria-hidden="true">
                            <use xlinkHref="#icon-jianzhu" />
                        </svg>
                        <span>请输入搜索关键词查找建筑物造价信息</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Buildings;