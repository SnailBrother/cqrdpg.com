// src/pages/modules/office/NeighborhoodFinder.js
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import styles from './NeighborhoodFinder.module.css';
import { useAuth } from '../../../../context/AuthContext';

//const API_CONFIG_URL = '/api/getApiDatabas';
const SEARCH_NEIGHBORHOODS_API = '/api/SearchNeighborhoodsByArea';
//const BATCH_SEARCH_API = '/api/BatchSearchNeighborhoods';
const NEIGHBORHOOD_STATS_API = '/api/NeighborhoodStatistics';
const QUERY_DELAY = 500;
const SEARCH_RADIUS = 2000;

const NeighborhoodFinder = () => {
  const [searchInput, setSearchInput] = useState('');
  const [location, setLocation] = useState('');
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [baiduMapAK, setBaiduMapAK] = useState(null);
  const [currentProgress, setCurrentProgress] = useState('');
  const [searchStats, setSearchStats] = useState(null); // 搜索结果统计
  const [expandedReports, setExpandedReports] = useState({}); // 展开的报告ID

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const { user } = useAuth();
  const username = user?.username;

  // 获取百度地图API密钥
  useEffect(() => {
    const fetchBaiduMapAK = async () => {
      try {
        const response = await axios.get('https://cqrdpg.com:5202/api/getApiDatabas');
        const activeApi = response.data.find(item =>
          item.apiUsername === username && item.remark === '正在使用'
        );

        if (activeApi && activeApi.apiKey) {
          setBaiduMapAK(activeApi.apiKey);
        } else {
          setErrorMsg('未找到可用的百度地图API密钥');
        }
      } catch (error) {
        setErrorMsg(`获取API配置失败: ${error.message}`);
      }
    };

    if (username) {
      fetchBaiduMapAK();
    }
  }, [username]);

  // 初始化地图
  useEffect(() => {
    if (!baiduMapAK) return;

    if (!window.BMap) {
      const script = document.createElement("script");
      script.src = `https://api.map.baidu.com/api?v=3.0&ak=${baiduMapAK}&callback=initNeighborhoodMap`;
      script.async = true;
      document.head.appendChild(script);
      window.initNeighborhoodMap = () => {
        setMapReady(true);
        initializeMap();
      };
    } else {
      setMapReady(true);
      initializeMap();
    }

    return () => {
      if (window.initNeighborhoodMap) delete window.initNeighborhoodMap;
      clearMarkers();
    };
  }, [baiduMapAK]);

  // 初始化地图
  const initializeMap = () => {
    if (!window.BMap || !mapRef.current) return;

    const map = new window.BMap.Map(mapRef.current);
    mapInstanceRef.current = map;

    // 添加控件
    map.addControl(new window.BMap.NavigationControl());
    map.addControl(new window.BMap.ScaleControl());
    map.addControl(new window.BMap.OverviewMapControl());
    map.addControl(new window.BMap.MapTypeControl());

    // 默认显示重庆市
    const point = new window.BMap.Point(106.551556, 29.563009);
    map.centerAndZoom(point, 12);
    map.enableScrollWheelZoom(true);
  };

  // 清除地图标记
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (mapInstanceRef.current && marker) {
        mapInstanceRef.current.removeOverlay(marker);
      }
    });
    markersRef.current = [];
  };

  // 查询指定地点本身的数据（新增功能）
  const searchExactLocationData = async (locationName) => {
    try {
      setCurrentProgress('正在查询指定地点数据...');

      const response = await axios.post('https://cqrdpg.com:5202/api/BatchSearchNeighborhoods', {
        neighborhoods: [], // 传空数组表示只按location查询
        location: locationName
      });

      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('查询指定地点数据失败:', error);
      return [];
    }
  };

  // 批量查询小区数据
  const batchSearchNeighborhoods = async (neighborhoodNames, locationName = null) => {
    try {
      setCurrentProgress('正在查询数据...');

      const response = await axios.post('https://cqrdpg.com:5202/api/BatchSearchNeighborhoods', {
        neighborhoods: neighborhoodNames,
        location: locationName
      });

      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('批量查询失败:', error);
      return [];
    }
  };

  // 搜索周边小区
  const searchNeighborhoods = async () => {
    if (!searchInput.trim()) {
      setErrorMsg('请输入搜索地点');
      return;
    }

    if (!window.BMap || !mapInstanceRef.current) {
      setErrorMsg('地图未初始化完成，请稍后再试');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setNeighborhoods([]);
    setSearchStats(null);
    setExpandedReports({});
    clearMarkers();

    try {
      const geocoder = new window.BMap.Geocoder();

      // 添加重庆市限定
      const searchLocation = searchInput.includes('重庆') ? searchInput : `${searchInput}, 重庆`;

      const point = await new Promise((resolve, reject) => {
        geocoder.getPoint(searchLocation, (point) => {
          if (!point) {
            reject("地点定位失败，请检查输入或确认是否为重庆市地点");
          } else {
            resolve(point);
          }
        }, "重庆市");
      });

      // 更新位置
      setLocation(searchInput);

      // 定位到搜索地点
      mapInstanceRef.current.centerAndZoom(point, 16);
      mapInstanceRef.current.panTo(point);

      // 添加中心点标记
      const centerMarker = new window.BMap.Marker(point);
      mapInstanceRef.current.addOverlay(centerMarker);
      centerMarker.setAnimation(window.BMAP_ANIMATION_BOUNCE);

      // 第一步：搜索指定地点本身的数据
      setCurrentProgress('正在查询指定地点数据...');
      const exactLocationReports = await searchExactLocationData(searchInput);

      // 第二步：搜索周边小区
      setCurrentProgress('正在搜索周边小区...');
      const foundNeighborhoods = await searchNearbyNeighborhoods(point);

      // 第三步：合并所有需要查询的小区名
      const allNeighborhoodNames = [
        // 从指定地点数据中提取小区名
        ...exactLocationReports.map(report => report.communityName || report.location).filter(Boolean),
        // 从周边搜索结果中获取小区名
        ...foundNeighborhoods.map(n => n.name)
      ];

      // 去重
      const uniqueNeighborhoodNames = [...new Set(allNeighborhoodNames)];

      if (uniqueNeighborhoodNames.length === 0) {
        setLoading(false);
        setCurrentProgress('未找到任何小区数据');
        return;
      }

      // 第四步：从数据库中批量查询所有小区数据（包括指定地点和周边）
      const allApiReports = await batchSearchNeighborhoods(uniqueNeighborhoodNames, searchInput);

      // 统计信息
      const neighborhoodsWithData = [];
      const neighborhoodsWithoutData = [];

      // 第五步：处理指定地点本身的报告数据
      if (exactLocationReports.length > 0) {
        // 将指定地点的报告转换为小区格式
        const processedLocations = new Set();

        exactLocationReports.forEach((report, index) => {
          // 使用小区名或坐落作为标识
          const locationKey = report.communityName || report.location;

          // 避免重复处理同一小区
          if (locationKey && !processedLocations.has(locationKey)) {
            processedLocations.add(locationKey);

            neighborhoodsWithData.push({
              id: `exact-${index}`,
              name: report.communityName || report.location,
              originalName: report.location,
              address: report.location || '地址信息缺失',
              distance: '当前位置',
              exactDistance: 0,
              point: point, // 使用搜索点的坐标
              hasReportData: true,
              reports: [report], // 这里只放当前报告，后面会合并所有相关报告
              latestReport: report,
              reportCount: exactLocationReports.filter(r =>
                (r.communityName === report.communityName) ||
                (r.location === report.location)
              ).length,
              actualPrice: report.valuationPrice ?
                (report.valuationPrice / 10000).toFixed(1) : '无',
              actualYearBuilt: report.yearBuilt || '无',
              isExactLocation: true // 标记为指定地点数据
            });
          }
        });
      }

      // 第六步：处理周边小区数据
      foundNeighborhoods.forEach((neighborhood) => {
        // 在API结果中查找匹配的报告
        const matchedReports = allApiReports.filter(report =>
          report.communityName && neighborhood.name && (
            report.communityName.includes(neighborhood.name) ||
            neighborhood.name.includes(report.communityName) ||
            (neighborhood.originalName && report.communityName.includes(neighborhood.originalName)) ||
            report.location.includes(neighborhood.name) ||
            neighborhood.name.includes(report.location)
          )
        );

        if (matchedReports.length > 0) {
          // 检查是否已经存在相同的小区（避免与指定地点数据重复）
          const existingIndex = neighborhoodsWithData.findIndex(item =>
            item.name === neighborhood.name ||
            (item.reports.some(r => r.communityName === matchedReports[0].communityName))
          );

          if (existingIndex >= 0) {
            // 合并报告数据
            const existingItem = neighborhoodsWithData[existingIndex];
            const allReports = [...existingItem.reports, ...matchedReports]
              .filter((report, index, self) =>
                index === self.findIndex(r =>
                  r.reportsID === report.reportsID ||
                  r.documentNo === report.documentNo
                )
              );

            neighborhoodsWithData[existingIndex] = {
              ...existingItem,
              reports: allReports,
              latestReport: allReports[0],
              reportCount: allReports.length
            };
          } else {
            // 新的小区数据
            neighborhoodsWithData.push({
              ...neighborhood,
              id: neighborhoodsWithData.length + neighborhoodsWithoutData.length + 1,
              hasReportData: true,
              reports: matchedReports.sort((a, b) =>
                new Date(b.reportDate || b.valueDate) - new Date(a.reportDate || a.valueDate)
              ),
              latestReport: matchedReports[0],
              reportCount: matchedReports.length,
              actualPrice: matchedReports[0].valuationPrice ?
                (matchedReports[0].valuationPrice / 10000).toFixed(1) : '无',
              actualYearBuilt: matchedReports[0].yearBuilt || '无',
              isExactLocation: false
            });
          }
        } else {
          // 没有数据的排在后面
          neighborhoodsWithoutData.push({
            ...neighborhood,
            id: neighborhoodsWithData.length + neighborhoodsWithoutData.length + 1,
            hasReportData: false,
            reports: [],
            latestReport: null,
            actualPrice: '无',
            actualYearBuilt: '无',
            isExactLocation: false
          });
        }
      });

      // 组合结果：指定地点数据在前，然后是有数据的周边小区，最后是无数据的小区
      const allNeighborhoods = [
        // 指定地点数据（标记为当前位置的）
        ...neighborhoodsWithData.filter(item => item.isExactLocation),
        // 有数据的周边小区
        ...neighborhoodsWithData.filter(item => !item.isExactLocation),
        // 无数据的周边小区
        ...neighborhoodsWithoutData
      ];

      // 重新分配ID
      allNeighborhoods.forEach((item, index) => {
        item.id = index + 1;
      });

      setNeighborhoods(allNeighborhoods);

      // 计算统计信息
      const stats = {
        total: allNeighborhoods.length,
        withData: neighborhoodsWithData.length,
        withoutData: neighborhoodsWithoutData.length,
        exactLocationCount: neighborhoodsWithData.filter(item => item.isExactLocation).length,
        // 如果有数据，计算平均价格
        avgPrice: neighborhoodsWithData.length > 0 ?
          (neighborhoodsWithData.reduce((sum, item) => {
            const price = item.latestReport?.valuationPrice;
            return sum + (price ? parseFloat(price) : 0);
          }, 0) / neighborhoodsWithData.length).toFixed(0) : 0,
        // 最近报告日期
        latestReportDate: neighborhoodsWithData.length > 0 ?
          neighborhoodsWithData[0].latestReport?.reportDate ||
          neighborhoodsWithData[0].latestReport?.valueDate : null
      };
      setSearchStats(stats);

      // 在地图上标记小区
      allNeighborhoods.forEach((neighborhood, index) => {
        markNeighborhoodOnMap(neighborhood, index);
      });

      setLoading(false);
      setCurrentProgress(`搜索完成，找到 ${stats.total} 个小区（${stats.exactLocationCount} 个指定地点数据，${stats.withData - stats.exactLocationCount} 个周边有数据小区）`);

    } catch (error) {
      setErrorMsg(error.message || error);
      setLoading(false);
    }
  };

  // 搜索附近的小区（百度地图API）
  const searchNearbyNeighborhoods = (point) => {
    return new Promise((resolve) => {
      const localSearch = new window.BMap.LocalSearch(point, {
        pageCapacity: 50,
        onSearchComplete: function (results) {
          if (localSearch.getStatus() === window.BMAP_STATUS_SUCCESS) {
            const neighborhoods = [];
            const seenNames = new Set();

            for (let i = 0; i < results.getCurrentNumPois(); i++) {
              const poi = results.getPoi(i);

              // 只处理小区类型的POI
              if (!poi.title.includes('小区') && !poi.title.includes('花园') &&
                !poi.title.includes('苑') && !poi.title.includes('城') &&
                !poi.title.includes('大厦') && !poi.title.includes('广场')) {
                continue;
              }

              // 计算距离
              const distance = getDistanceSimple(point, poi.point);
              if (distance > SEARCH_RADIUS) continue;

              // 去重
              const cleanName = cleanNeighborhoodName(poi.title);
              if (seenNames.has(cleanName)) continue;
              seenNames.add(cleanName);

              // 提取基本信息
              const neighborhood = {
                name: cleanName,
                originalName: poi.title,
                address: poi.address || '地址信息缺失',
                distance: formatDistance(distance),
                exactDistance: distance,
                point: poi.point
              };

              neighborhoods.push(neighborhood);
            }

            // 按距离排序
            neighborhoods.sort((a, b) => a.exactDistance - b.exactDistance);

            // 限制数量
            resolve(neighborhoods.slice(0, 20));
          } else {
            resolve([]);
          }
        }
      });
      localSearch.searchNearby("小区", point, SEARCH_RADIUS);
    });
  };

  // 在地图上标记小区
  // 在地图上标记小区
  const markNeighborhoodOnMap = (neighborhood, index) => {
    if (!mapInstanceRef.current || !window.BMap) return;

    // 创建标记点（添加一点随机偏移，避免重叠）
    const offsetLng = (Math.random() - 0.5) * 0.002;
    const offsetLat = (Math.random() - 0.5) * 0.002;
    const point = new window.BMap.Point(
      neighborhood.point.lng + offsetLng,
      neighborhood.point.lat + offsetLat
    );

    // 根据小区类型选择不同的SVG图标
    const getIconUrlForMarker = () => {
      if (neighborhood.isExactLocation) return '/images/dingwei.svg';  // 当前位置
      if (neighborhood.hasReportData) return '/images/youshuju.svg';   // 有数据的小区
      return '/images/wushuju.svg';  // 无数据的小区
    };

    // 创建图标
    const icon = new window.BMap.Icon(
      getIconUrlForMarker(),
      new window.BMap.Size(32, 32),  // 图标大小
      {
        anchor: new window.BMap.Size(16, 32),  // 锚点位置（图标底部中心）
        imageSize: new window.BMap.Size(32, 32)  // 图片显示大小
      }
    );

    // 创建标记
    const marker = new window.BMap.Marker(point, { icon: icon });
    mapInstanceRef.current.addOverlay(marker);
    markersRef.current.push(marker);

    // 创建信息窗口内容
    const locationType = neighborhood.isExactLocation ? '当前位置' : '';
    const reportInfo = neighborhood.hasReportData ? `
    <div style="border-top: 1px solid #f0f0f0; margin-top: 8px; padding-top: 8px;">
      ${locationType ? `<p style="margin: 4px 0; font-size: 11px; color: #52c41a;"><strong>${locationType}</strong></p>` : ''}
      <p style="margin: 4px 0; font-size: 11px;"><strong>评估单价：</strong>${neighborhood.actualPrice}万/㎡</p>
      <p style="margin: 4px 0; font-size: 11px;"><strong>建成年份：</strong>${neighborhood.actualYearBuilt}</p>
      <p style="margin: 4px 0; font-size: 11px;"><strong>报告数量：</strong>${neighborhood.reportCount}份</p>
    </div>
  ` : '';

    const content = `
    <div class="${styles.mapInfoWindow}">
      <h4 style="margin: 0 0 8px 0; color: #1890ff;">${neighborhood.name}</h4>
      ${neighborhood.hasReportData ?
        `<span style="background: ${neighborhood.isExactLocation ? '#52c41a' : '#1890ff'}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
          ${neighborhood.isExactLocation ? '当前位置' : '有数据'}
        </span>` :
        `<span style="background: #f5f5f5; color: #666; padding: 2px 6px; border-radius: 3px; font-size: 11px;">无数据</span>`}
      <p style="margin: 4px 0; font-size: 12px;"><strong>距离：</strong>${neighborhood.distance}</p>
      <p style="margin: 4px 0; font-size: 12px;"><strong>地址：</strong>${neighborhood.address}</p>
      ${reportInfo}
    </div>
  `;

    const infoWindow = new window.BMap.InfoWindow(content, {
      width: 280,
      height: neighborhood.hasReportData ? 180 : 140
    });

    // 添加点击事件
    marker.addEventListener('click', () => {
      marker.openInfoWindow(infoWindow);
      mapInstanceRef.current.panTo(point);

      // 在列表中高亮显示
      setNeighborhoods(prev =>
        prev.map(item => ({
          ...item,
          active: item.id === neighborhood.id
        }))
      );
    });
  };

  // 辅助函数
  const getDistanceSimple = (p1, p2) => {
    if (!p1 || !p2) return 99999;
    const R = 6371000;
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const a = lat1 - lat2;
    const b = (p1.lng - p2.lng) * Math.PI / 180;
    const s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(b / 2), 2)));
    return R * s;
  };

  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}米`;
    }
    return `${(distance / 1000).toFixed(1)}公里`;
  };

  const cleanNeighborhoodName = (name) => {
    return name
      .replace(/-[东南西北]+门$/, '')
      .replace(/\(.*?\)/g, '')
      .replace(/（.*?）/g, '')
      .trim();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchNeighborhoods();
    }
  };

  const handleClear = () => {
    setSearchInput('');
    setLocation('');
    setNeighborhoods([]);
    setSearchStats(null);
    setErrorMsg('');
    setExpandedReports({});
    clearMarkers();

    if (mapInstanceRef.current) {
      const point = new window.BMap.Point(106.551556, 29.563009);
      mapInstanceRef.current.centerAndZoom(point, 12);
    }
  };

  // 切换报告详情展开/折叠
  const toggleReportDetails = (neighborhoodId, reportId) => {
    setExpandedReports(prev => ({
      ...prev,
      [`${neighborhoodId}-${reportId}`]: !prev[`${neighborhoodId}-${reportId}`]
    }));
  };

  // 展开/折叠所有报告
  const toggleAllReports = (neighborhoodId, expand) => {
    const newExpanded = { ...expandedReports };
    neighborhoods
      .find(n => n.id === neighborhoodId)
      ?.reports
      .forEach((report, index) => {
        const key = `${neighborhoodId}-${index}`;
        newExpanded[key] = expand;
      });
    setExpandedReports(newExpanded);
  };

  const exportData = () => {
    if (neighborhoods.length === 0) {
      setErrorMsg('没有可导出的数据');
      return;
    }

    const csvData = neighborhoods.map(item => ({
      小区名称: item.name,
      距离: item.distance,
      地址: item.address,
      数据来源: item.isExactLocation ? '当前位置' : '周边小区',
      评估均价: item.actualPrice,
      建成时间: item.actualYearBuilt,
      数据状态: item.hasReportData ? '有数据' : '无数据',
      报告数量: item.reportCount || 0,
      最新报告日期: item.latestReport?.reportDate || '无'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `重庆市周边小区查询_${location || '未知地点'}_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '无';
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch {
      return dateString;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentContainer}>
        {/* 搜索区域 */}
        <div className={styles.searchSection}>
          <div className={styles.searchCard}>
            {/* <div className={styles.searchHeader}>
              <h3>查询</h3>
            </div> */}

            <div className={styles.searchInputGroup}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="请输入重庆市地点名称"
                className={styles.searchInput}
              />
              <button
                onClick={searchNeighborhoods}
                className={styles.searchButton}
                disabled={loading || !mapReady}
              >
                搜索
              </button>
            </div>

            {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}
            {loading && currentProgress && <div className={styles.progressInfo}>{currentProgress}</div>}

            {/* 搜索结果统计信息 */}
            {searchStats && (
              <div className={styles.searchStats}>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{searchStats.total}</div>
                    <div className={styles.statLabel}>小区数量</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={`${styles.statValue} ${styles.hasData}`}>{searchStats.exactLocationCount}</div>
                    <div className={styles.statLabel}>当前数据</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={`${styles.statValue} ${styles.hasData}`}>{searchStats.withData - searchStats.exactLocationCount}</div>
                    <div className={styles.statLabel}>周边数据</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={`${styles.statValue} ${styles.noData}`}>{searchStats.withoutData}</div>
                    <div className={styles.statLabel}>无数据</div>
                  </div>
                  {searchStats.avgPrice > 0 && (
                    <div className={styles.statItem}>
                      <div className={`${styles.statValue} ${styles.price}`}>
                        {searchStats.avgPrice}元/㎡
                      </div>
                      <div className={styles.statLabel}>均价</div>
                    </div>
                  )}
                </div>
                {searchStats.withData === 0 && (
                  <div className={styles.noDataWarning}>
                    ⚠️ 未在数据库中查询到相关数据
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.mainContent}>
          {/* 地图区域 */}
          <div className={styles.mapSection}>
            <div className={styles.mapHeader}>
              <h3>地图</h3>
              <div className={styles.mapLegend}>
                <div className={styles.legendItem}>
                  <img
                    src="/images/dingwei.svg"
                    alt="当前位置"
                    style={{ width: '20px', height: '20px', marginRight: '6px' }}
                  />
                  <span>当前位置</span>
                </div>
                <div className={styles.legendItem}>
                  <img
                    src="/images/youshuju.svg"
                    alt="有数据"
                    style={{ width: '20px', height: '20px', marginRight: '6px' }}
                  />
                  <span>周边有数据</span>
                </div>
                <div className={styles.legendItem}>
                  <img
                    src="/images/wushuju.svg"
                    alt="无数据"
                    style={{ width: '20px', height: '20px', marginRight: '6px' }}
                  />
                  <span>无数据</span>
                </div>
              </div>
            </div>
            <div className={styles.mapContainer} ref={mapRef} />
          </div>

          {/* 结果列表 */}
          <div className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <h3>小区列表</h3>
              <div className={styles.resultsActions}>
                <span className={styles.resultsCount}>
                  {searchStats ? `${searchStats.total} 个小区` : '搜索结果'}
                </span>
                {neighborhoods.length > 0 && (
                  <button
                    onClick={exportData}
                    className={styles.exportButton}
                  >
                    导出
                  </button>
                )}
              </div>
            </div>

            {neighborhoods.length > 0 ? (
              <div className={styles.neighborhoodsList}>
                {neighborhoods.map(neighborhood => (
                  <div
                    key={neighborhood.id}
                    className={`${styles.neighborhoodCard} ${neighborhood.active ? styles.active : ''} ${neighborhood.hasReportData ? styles.hasReport : styles.noReport} ${neighborhood.isExactLocation ? styles.exactLocation : ''}`}
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo(neighborhood.point);
                        mapInstanceRef.current.setZoom(16);
                      }
                    }}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.nameSection}>
                        <span className={styles.neighborhoodName}>
                          {neighborhood.name}
                          {neighborhood.isExactLocation && (
                            <span className={styles.exactLocationBadge}>当前位置</span>
                          )}
                          {neighborhood.hasReportData && !neighborhood.isExactLocation && (
                            <span className={styles.reportBadge}>
                              有数据 ({neighborhood.reportCount}条)
                            </span>
                          )}
                          {!neighborhood.hasReportData && (
                            <span className={styles.noReportBadge}>无数据</span>
                          )}
                        </span>
                      </div>
                      <span className={styles.distanceBadge}>
                        {neighborhood.distance}
                      </span>
                    </div>

                    <div className={styles.cardContent}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>地址：</span>
                        <span className={styles.infoValue}>{neighborhood.address}</span>
                      </div>

                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>参考均价：</span>
                          <span className={`${styles.infoValue} ${styles.price}`}>
                            {
                              neighborhood.actualPrice && neighborhood.actualPrice !== '无'
                                ? neighborhood.actualPrice + '万元/平方米'
                                : '无'
                            }
                          </span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>建成时间：</span>
                          <span className={styles.infoValue}>{neighborhood.actualYearBuilt}</span>
                        </div>
                      </div>

                      {/* 折叠式报告详情 */}
                      {neighborhood.hasReportData && neighborhood.reports.length > 0 && (
                        <div className={styles.reportsSection}>
                          <div className={styles.reportsHeader}>
                            <span className={styles.reportsTitle}>数据 ({neighborhood.reportCount}条)</span>
                            <button
                              className={styles.toggleAllButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                const areAllExpanded = neighborhood.reports.every((_, index) =>
                                  expandedReports[`${neighborhood.id}-${index}`]
                                );
                                toggleAllReports(neighborhood.id, !areAllExpanded);
                              }}
                            >
                              {neighborhood.reports.every((_, index) =>
                                expandedReports[`${neighborhood.id}-${index}`]
                              ) ? '折叠所有' : '展开所有'}
                            </button>
                          </div>

                          <div className={styles.reportsList}>
                            {neighborhood.reports.map((report, index) => {
                              const isExpanded = expandedReports[`${neighborhood.id}-${index}`];
                              return (
                                <div key={index} className={styles.reportItem}>
                                  <div
                                    className={styles.reportSummary}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReportDetails(neighborhood.id, index);
                                    }}
                                  >
                                    <div className={styles.reportHeader}>
                                      <span className={styles.reportName}>
                                        {report.location || '无'}
                                      </span>
                                      <span className={styles.expandIcon}>
                                        {isExpanded ? '▼' : '▶'}
                                      </span>
                                    </div>
                                    <div className={styles.reportBrief}>
                                      <span className={styles.reportPrice}>
                                        评估价: {report.valuationPrice ? `${(report.valuationPrice / 10000).toFixed(1)}万/㎡` : '无'}
                                      </span>
                                      <span className={styles.reportArea}>
                                        面积: {report.buildingArea ? `${report.buildingArea}㎡` : '无'}
                                      </span>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className={styles.reportDetails}>
                                      <div className={styles.detailGrid}>
                                        <div className={styles.detailItem}>
                                          <div className={styles.detailItemrow}>
                                            <span className={styles.detailLabel}>评估单价:</span>
                                            <span className={styles.detailValue}>
                                              {report.valuationPrice ? `${(report.valuationPrice / 10000).toFixed(1)}万/㎡` : '无'}
                                            </span>
                                          </div>
                                          <div className={styles.detailItemrow}>
                                            <span className={styles.detailLabel}>时间:</span>
                                            <span className={styles.detailValue}>
                                              {formatDate(report.reportDate || report.valueDate)}
                                            </span>
                                          </div>
                                        </div>

                                        <div className={styles.detailItem}>
                                          <div className={styles.detailItemrow}>
                                            <span className={styles.detailLabel}>建筑面积:</span>
                                            <span className={styles.detailValue}>{report.buildingArea ? `${report.buildingArea}㎡` : '无'}</span>
                                          </div>
                                          <div className={styles.detailItemrow}>
                                            <span className={styles.detailLabel}>套内面积:</span>
                                            <span className={styles.detailValue}>{report.interiorArea ? `${report.interiorArea}㎡` : '无'}</span>
                                          </div>
                                        </div>

                                        <div className={styles.detailItem}>
                                          <div className={styles.detailItemrow}>
                                            <span className={styles.detailLabel}>总层数:</span>
                                            <span className={styles.detailValue}>{report.totalFloors || '无'}</span>
                                          </div>
                                          <div className={styles.detailItemrow}>
                                            <span className={styles.detailLabel}>所在楼层:</span>
                                            <span className={styles.detailValue}>{report.floorNumber || '无'}</span>
                                          </div>
                                        </div>

                                        <div className={styles.detailItem}>
                                          <div className={styles.detailItemrow}>
                                            <span className={styles.detailLabel}>房屋用途:</span>
                                            <span className={styles.detailValue}>{report.housePurpose || '无'}</span>
                                          </div>
                                          <div className={styles.detailItemrow}>
                                            <span className={styles.detailLabel}>建筑结构:</span>
                                            <span className={styles.detailValue}>{report.houseStructure || '无'}</span>
                                          </div>
                                        </div>

                                        <div className={styles.detailItem}>
                                          <span className={styles.detailLabel}>装修状况:</span>
                                          <span className={styles.detailValue}>{report.decorationStatus || '无'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                {loading ? (
                  <div className={styles.loadingIndicator}>
                    <div className={styles.spinner}></div>
                    <p>正在搜索周边小区，请稍候...</p>
                  </div>
                ) : (
                  <div className={styles.emptyIllustration}>
                    <div className={styles.emptyIcon}>🏘️</div>
                    <h4>暂无搜索结果</h4>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodFinder;