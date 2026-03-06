import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import styles from './AddBuildingsPriceData.module.css';

const AddBuildingsPriceData = () => {
  const [activeTab, setActiveTab] = useState('add'); // 'add' 或 'search'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUploadImage = (item) => {
    // 检查是否有数据
    if (!item || !item.id) {
      setMessage({ type: 'error', text: '数据不完整，无法上传图片' });
      return;
    }
    // 准备要传递的数据
    const dataToPass = {
      buildingsPriceid: item.id,
      name: item.name || '',
      structure: item.structure || '',
      area: item.area || '',
      unit: item.unit || '',
      price: item.price || ''
    };
    // 将数据编码为URL参数
    const queryParams = new URLSearchParams(dataToPass).toString();
    // 这里假设 UploadBuildingsPricePicture 页面的路径是当前项目下的某个路由 app/system/UploadBuildingsPricePicture
    const uploadPageUrl = `${window.location.origin}/app/system/UploadBuildingsPricePicture?${queryParams}`;

    // 新开页面跳转
    window.open(uploadPageUrl, '_blank');
  };

  // 添加表单状态
  const [formData, setFormData] = useState({
    name: '',
    structure: '',
    area: '',
    unit: '',
    price: '',
    notes: ''
  });

  // 搜索状态
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();
  const [isSearching, setIsSearching] = useState(false);

  // 添加数据
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/AddBuildingsPriceData', formData);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: '数据添加成功！'
        });
        setFormData({
          name: '',
          structure: '',
          area: '',
          unit: '',
          price: '',
          notes: ''
        });
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || '添加失败'
        });
      }
    } catch (error) {
      console.error('添加数据时出错:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '网络错误，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 搜索数据
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    await fetchSearchResults(1, true);
  };

  const fetchSearchResults = useCallback(async (page = 1, reset = false) => {
    if (searchLoading) return;

    setSearchLoading(true);
    try {
      const response = await axios.get('/api/QueryBuildingsPrice', {
        params: {
          searchText,
          page,
          pageSize: 20
        }
      });

      if (response.data.success) {
        const { data, pagination: newPagination } = response.data;

        setPagination(newPagination);
        setHasMore(newPagination.hasNextPage);

        if (reset) {
          setSearchResults(data);
        } else {
          setSearchResults(prev => [...prev, ...data]);
        }
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || '查询失败'
        });
      }
    } catch (error) {
      console.error('查询数据时出错:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '网络错误，请稍后重试'
      });
    } finally {
      setSearchLoading(false);
      setIsSearching(false);
    }
  }, [searchText, searchLoading]);

  // 无限滚动
  const lastItemRef = useCallback(node => {
    if (searchLoading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isSearching) {
        fetchSearchResults(pagination.currentPage + 1);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [searchLoading, hasMore, pagination.currentPage, isSearching, fetchSearchResults]);

  // 重置表单
  const handleReset = () => {
    setFormData({
      name: '',
      structure: '',
      area: '',
      unit: '',
      price: '',
      notes: ''
    });
    setMessage({ type: '', text: '' });
  };

  // 切换选项卡时重置搜索
  useEffect(() => {
    if (activeTab === 'search') {
      fetchSearchResults(1, true);
    }
  }, [activeTab]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>建筑造价数据管理</h1>
        <p className={styles.subtitle}>添加和查询建筑造价信息</p>
      </div>

      {/* 选项卡 */}
      <div className={styles.tabContainer}>
        <div className={styles.tabHeader}>
          <button
            className={`${styles.tabButton} ${activeTab === 'add' ? styles.active : ''}`}
            onClick={() => setActiveTab('add')}
          >
            添加数据
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'search' ? styles.active : ''}`}
            onClick={() => setActiveTab('search')}
          >
            查找数据
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* 消息提示 */}
          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          {/* 添加数据面板 */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    名称 <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleAddChange}
                    className={styles.input}
                    placeholder="请输入建筑名称"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="structure" className={styles.label}>
                    结构
                  </label>
                  <input
                    type="text"
                    id="structure"
                    name="structure"
                    value={formData.structure}
                    onChange={handleAddChange}
                    className={styles.input}
                    placeholder="如：钢筋混凝土结构"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="area" className={styles.label}>
                    区域
                  </label>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleAddChange}
                    className={styles.input}
                    placeholder="如：华东地区"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="unit" className={styles.label}>
                    单位
                  </label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleAddChange}
                    className={styles.input}
                    placeholder="如：元/平方米"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="price" className={styles.label}>
                    价格
                  </label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleAddChange}
                    className={styles.input}
                    placeholder="如：1500"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.label}>
                  备注
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleAddChange}
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="请输入备注信息"
                  rows="4"
                />
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      添加中...
                    </>
                  ) : (
                    '添加数据'
                  )}
                </button>

                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={handleReset}
                  disabled={loading}
                >
                  重置
                </button>
              </div>
            </form>
          )}

          {/* 查找数据面板 */}
          {activeTab === 'search' && (
            <div className={styles.searchContainer}>
              {/* 搜索框 */}
              <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                <div className={styles.searchInputGroup}>
                  <input
                    type="text"
                    value={searchText}
                    onChange={handleSearchChange}
                    className={`${styles.input} ${styles.searchInput}`}
                    placeholder="输入关键词搜索（名称、结构、区域、价格等）"
                  />
                  <button
                    type="submit"
                    className={styles.searchButton}
                    disabled={searchLoading}
                  >
                    {searchLoading ? '搜索中...' : '搜索'}
                  </button>
                </div>
              </form>

              {/* 统计信息 */}
              {searchResults.length > 0 && (
                <div className={styles.stats}>
                  共找到 <span className={styles.highlight}>{pagination.totalCount}</span> 条记录，
                  当前显示 <span className={styles.highlight}>{searchResults.length}</span> 条
                </div>
              )}

              {/* 搜索结果列表 */}
              <div className={styles.resultsContainer}>
                {searchResults.length === 0 && !searchLoading ? (
                  <div className={styles.emptyState}>
                    {searchText ? '未找到相关记录' : '暂无数据，请添加或搜索'}
                  </div>
                ) : (
                  <div className={styles.resultsList}>
                    {/* 然后在搜索结果列表的渲染部分，修改每个resultItem，添加图片上传按钮 */}
                    {searchResults.map((item, index) => {
                      const isLastItem = index === searchResults.length - 1;
                      return (
                        <div
                          key={item.id}
                          ref={isLastItem ? lastItemRef : null}
                          className={styles.resultItem}
                        >
                          <div className={styles.resultHeader}>
                            <h3 className={styles.resultTitle}>{item.name}</h3>
                            <span className={styles.resultDate}>{item.formattedDate}</span>
                          </div>

                          <div className={styles.resultDetails}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>结构:</span>
                              <span className={styles.detailValue}>{item.structure || '未设置'}</span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>区域:</span>
                              <span className={styles.detailValue}>{item.area || '未设置'}</span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>价格:</span>
                              <span className={styles.detailValue}>{item.formattedPrice}</span>
                            </div>
                            {item.notes && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>备注:</span>
                                <span className={styles.detailValue}>{item.notes}</span>
                              </div>
                            )}

                            {/* 判断是否有图片，显示不同的按钮样式 */}
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>图片:</span>
                              <div className={styles.imageActions}>
                                {item.hasImage ? (
                                  <>
                                    <button
                                      className={`${styles.uploadButton} ${styles.hasImage}`}
                                      onClick={() => handleUploadImage(item)}
                                      title="查看或重新上传图片"
                                    >
                                      <span className={styles.icon}>🖼️</span>
                                      查看图片
                                    </button>
                                    <span className={styles.imageStatus}>
                                      （已上传）
                                    </span>
                                  </>
                                ) : (
                                  <button
                                    className={styles.uploadButton}
                                    onClick={() => handleUploadImage(item)}
                                    title="上传图片"
                                  >
                                    <span className={styles.icon}>📷</span>
                                    上传图片
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {searchLoading && (
                      <div className={styles.loadingMore}>
                        <div className={styles.spinner}></div>
                        加载更多...
                      </div>
                    )}

                    {!hasMore && searchResults.length > 0 && (
                      <div className={styles.noMore}>
                        没有更多数据了
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBuildingsPriceData;