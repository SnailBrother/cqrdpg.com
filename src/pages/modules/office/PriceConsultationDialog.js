// src/pages/modules/office/PriceConsultationDialog.js
import React, { useState, useEffect, useRef } from 'react';
import styles from './PriceConsultationDialog.module.css';

const PriceConsultationDialog = () => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [searchCases, setSearchCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  
  const inputRef = useRef(null);

  // 模拟小区数据
  const mockNeighborhoods = [
    { id: '1', name: '碧桂园凤凰城', district: '天河区', averagePrice: 85000, priceChange: 2.5 },
    { id: '2', name: '万科城市花园', district: '越秀区', averagePrice: 92000, priceChange: 1.8 },
    { id: '3', name: '保利心语花园', district: '海珠区', averagePrice: 78000, priceChange: -0.5 },
    { id: '4', name: '中海锦城', district: '荔湾区', averagePrice: 65000, priceChange: 1.2 },
    { id: '5', name: '华润置地悦府', district: '白云区', averagePrice: 55000, priceChange: 3.1 },
    { id: '6', name: '龙湖天宸原著', district: '黄埔区', averagePrice: 48000, priceChange: 2.3 },
    { id: '7', name: '金地自在城', district: '番禺区', averagePrice: 42000, priceChange: 1.5 },
    { id: '8', name: '招商雍华府', district: '南沙区', averagePrice: 38000, priceChange: 4.2 },
  ];

  // 模拟搜索案例数据
  const mockSearchCases = [
    { id: '1', neighborhoodName: '碧桂园凤凰城', propertyType: '三室两厅', area: 98, price: 8350000, transactionDate: '2024-03-15', description: '中层，南北通透，精装修' },
    { id: '2', neighborhoodName: '碧桂园凤凰城', propertyType: '四室两厅', area: 128, price: 11200000, transactionDate: '2024-03-10', description: '高层，湖景房，豪华装修' },
    { id: '3', neighborhoodName: '碧桂园凤凰城', propertyType: '两室一厅', area: 75, price: 6375000, transactionDate: '2024-02-28', description: '低层，简单装修，采光好' },
    { id: '4', neighborhoodName: '万科城市花园', propertyType: '三室两厅', area: 105, price: 9660000, transactionDate: '2024-03-20', description: '中层，安静，学区房' },
  ];

  useEffect(() => {
    // 组件挂载时自动聚焦输入框
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 处理搜索输入变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setError('');

    if (value.trim() === '') {
      setSuggestions([]);
      return;
    }

    const filtered = mockNeighborhoods.filter(neighborhood =>
      neighborhood.name.toLowerCase().includes(value.toLowerCase()) ||
      neighborhood.district.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5);

    setSuggestions(filtered);
  };

  // 选择小区
  const handleSelectNeighborhood = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setSearchInput(neighborhood.name);
    setSuggestions([]);
    fetchPriceData(neighborhood.id);
    fetchSearchCases(neighborhood.name);
  };

  // 模拟获取价格数据
  const fetchPriceData = async (neighborhoodId) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const neighborhood = mockNeighborhoods.find(n => n.id === neighborhoodId);
      if (neighborhood) {
        const mockPriceData = {
          neighborhoodId: neighborhood.id,
          neighborhoodName: neighborhood.name,
          averagePrice: neighborhood.averagePrice,
          monthOnMonth: neighborhood.priceChange,
          yearOnYear: neighborhood.priceChange * 0.8,
          priceRange: {
            min: neighborhood.averagePrice * 0.85,
            max: neighborhood.averagePrice * 1.15
          },
          caseCount: Math.floor(Math.random() * 20) + 5
        };
        setPriceData(mockPriceData);
      }
    } catch (err) {
      setError('获取价格数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 模拟获取搜索案例
  const fetchSearchCases = async (neighborhoodName) => {
    setSearchLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const filteredCases = mockSearchCases.filter(
        c => c.neighborhoodName === neighborhoodName
      );
      setSearchCases(filteredCases);
    } catch (err) {
      setError('获取搜索案例失败');
    } finally {
      setSearchLoading(false);
    }
  };

  // 格式化价格显示
  const formatPrice = (price) => {
    return (price / 10000).toFixed(1) + '万/㎡';
  };

  // 格式化总价
  const formatTotalPrice = (price) => {
    return (price / 10000).toFixed(1) + '万';
  };

  // 处理搜索提交
  const handleSubmit = () => {
    if (!searchInput.trim()) {
      setError('请输入小区名称');
      return;
    }

    const foundNeighborhood = mockNeighborhoods.find(
      n => n.name === searchInput.trim()
    );

    if (foundNeighborhood) {
      handleSelectNeighborhood(foundNeighborhood);
    } else {
      setError('未找到该小区，请尝试其他名称');
    }
  };

 

  return (
    <div className={styles.pageContainer}>
    
      <div className={styles.contentContainer}>
        {/* 搜索区域 */}
        <div className={styles.searchSection}>
          <div className={styles.searchCard}>
            <div className={styles.searchInputGroup}>
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="输入小区名称，如：碧桂园凤凰城"
                className={styles.searchInput}
              />
              <button 
                onClick={handleSubmit}
                className={styles.searchButton}
                disabled={loading}
              >
              搜索
              </button>
              
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* 搜索建议 */}
            {suggestions.length > 0 && (
              <div className={styles.suggestionsContainer}>
                {suggestions.map(neighborhood => (
                  <div
                    key={neighborhood.id}
                    className={styles.suggestionItem}
                    onClick={() => handleSelectNeighborhood(neighborhood)}
                  >
                    <div className={styles.suggestionName}>{neighborhood.name}</div>
                    <div className={styles.suggestionDistrict}>{neighborhood.district}</div>
                    <div className={styles.suggestionPrice}>
                      {formatPrice(neighborhood.averagePrice)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 价格信息区域 */}
        {selectedNeighborhood && priceData && (
          <div className={styles.priceSection}>
            <div className={styles.sectionHeader}>
              <h3>{priceData.neighborhoodName} 价格详情</h3>
              <span className={styles.updateTime}>最近更新：2024年3月</span>
            </div>

            <div className={styles.priceOverview}>
              <div className={`${styles.priceCard} ${styles.mainPrice}`}>
                <div className={styles.priceLabel}>参考均价</div>
                <div className={styles.priceValue}>
                  {formatPrice(priceData.averagePrice)}
                </div>
                <div className={styles.priceChange}>
                  <span className={priceData.monthOnMonth >= 0 ? styles.positive : styles.negative}>
                    {priceData.monthOnMonth >= 0 ? '↑' : '↓'} 
                    {Math.abs(priceData.monthOnMonth)}%
                  </span>
                  <span>环比上月</span>
                </div>
              </div>

              <div className={`${styles.priceCard} ${styles.priceRange}`}>
                <div className={styles.priceLabel}>价格区间</div>
                <div className={styles.priceValue}>
                  {formatPrice(priceData.priceRange.min)} - {formatPrice(priceData.priceRange.max)}
                </div>
                <div className={styles.priceSubtext}>
                  近30天成交{priceData.caseCount}套
                </div>
              </div>

              <div className={`${styles.priceCard} ${styles.yearChange}`}>
                <div className={styles.priceLabel}>同比去年</div>
                <div className={`${styles.priceValue} ${priceData.yearOnYear >= 0 ? styles.positive : styles.negative}`}>
                  {priceData.yearOnYear >= 0 ? '+' : ''}{priceData.yearOnYear}%
                </div>
                <div className={styles.priceSubtext}>
                  年度变化
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 搜索案例区域 */}
        {selectedNeighborhood && (
          <div className={styles.casesSection}>
            <div className={styles.sectionHeader}>
              <h3>近期成交案例</h3>
              {searchLoading && <span className={styles.loadingText}>加载中...</span>}
            </div>

            {searchCases.length > 0 ? (
              <div className={styles.casesList}>
                {searchCases.map(caseItem => (
                  <div key={caseItem.id} className={styles.caseCard}>
                    <div className={styles.caseHeader}>
                      <span className={styles.propertyType}>{caseItem.propertyType}</span>
                      <span className={styles.transactionDate}>{caseItem.transactionDate}</span>
                    </div>
                    <div className={styles.caseDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.label}>面积：</span>
                        <span className={styles.value}>{caseItem.area}㎡</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.label}>成交价：</span>
                        <span className={`${styles.value} ${styles.price}`}>{formatTotalPrice(caseItem.price)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.label}>单价：</span>
                        <span className={styles.value}>
                          {formatPrice(caseItem.price / caseItem.area)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.caseDescription}>
                      {caseItem.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !searchLoading && (
                <div className={styles.noCases}>
                  暂无近期成交案例
                </div>
              )
            )}
          </div>
        )}

 
        
      </div>
    </div>
  );
};

export default PriceConsultationDialog;