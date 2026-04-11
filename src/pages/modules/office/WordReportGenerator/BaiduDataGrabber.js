//百度地图公交线路查询功能优化版
/* global BMap */
import React, { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';
import './BaiduDataGrabber.css';
import { useAuth } from '../../../../context/AuthContext';

const API_CONFIG_URL = 'https://www.cqrdpg.com:5202/api/getApiDatabas';

const CATEGORY_LIST = [
  { key: "bank", label: "银行" },
  { key: "supermarket", label: "超市" },
  { key: "hospital", label: "医院" },
  { key: "school", label: "学校" },
  { key: "nearbyCommunity", label: "周边小区", query: "小区" }
];

const BUS_STOP_KEY = 'busStopName';
const BUS_ROUTES_KEY = 'busRoutes';
const ROAD_KEY = 'areaRoad';

const DEFAULT_FORM = {
  location: "",
  bank: "",
  supermarket: "",
  hospital: "",
  school: "",
  nearbyCommunity: "",
  busStopName: "",
  busRoutes: "",
  areaRoad: "",
  boundaries: "",  // 新增四至字段
  streetStatus: "",  // 新增临街状况字段
  direction: "",  // 新增方位字段
  orientation: "",  // 新增朝向字段
  distance: ""  // 新增距离字段（重要场所）
};

// 查询延迟时间(毫秒)，避免触发QPS限制
const QUERY_DELAY = 500;

const BaiduDataGrabber = ({ location, initialData = {}, onSave, onClose }) => {
  const mapRef = useRef(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM, ...initialData, location: location || '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mapObj, setMapObj] = useState(null);
  const [centerPoint, setCenterPoint] = useState(null);
  const [currentProgress, setCurrentProgress] = useState('');
  const [baiduMapAK, setBaiduMapAK] = useState(null);

  const { user } = useAuth();
  const username = user?.username; // 从 user 对象中获取 username


  useEffect(() => {
    setFormData(prev => ({
      ...DEFAULT_FORM,
      ...initialData,
      location: location || ''
    }));
  }, [location, initialData]);

  // 获取百度地图AK
  useEffect(() => {
    const fetchBaiduMapAK = async () => {
      try {
        const response = await axios.get(API_CONFIG_URL);
        // 修改为查找当前用户且正在使用的API密钥
        const activeApi = response.data.find(item =>
          item.apiUsername === username && item.remark === '正在使用'
        );

        if (activeApi && activeApi.apiKey) {
          setBaiduMapAK(activeApi.apiKey);
        } else {
          setErrorMsg('未找到当前用户可用的百度地图API密钥');
        }
      } catch (error) {
        setErrorMsg(`获取API配置失败: ${error.message}`);
      }
    };

    if (username) { // 确保有用户名时才执行
      fetchBaiduMapAK();
    }
  }, [username]);

  // 地图和数据自动采集
  useEffect(() => {
    if (!location || !baiduMapAK) return;

    setLoading(true);
    setErrorMsg('');
    // 加载百度地图API
    if (!window.BMap) {
      const script = document.createElement("script");
      script.src = `https://api.map.baidu.com/api?v=3.0&ak=${baiduMapAK}&callback=initMapGrabber`;
      script.async = true;
      document.head.appendChild(script);
      window.initMapGrabber = () => initializeMapAndFetch(location);
    } else {
      initializeMapAndFetch(location);
    }
    return () => {
      if (window.initMapGrabber) delete window.initMapGrabber;
    };
    // eslint-disable-next-line
  }, [location, baiduMapAK]);

  // 初始化地图+自动采集
  const initializeMapAndFetch = async (loc) => {
    if (!window.BMap) {
      setLoading(false);
      setErrorMsg("百度地图API未加载成功，请检查AK和网络。");
      return;
    }

    // 创建地图
    const map = new window.BMap.Map(mapRef.current);
    const geocoder = new window.BMap.Geocoder();
    // 添加方位指示
    addDirectionIndicators(map);
    try {
      const point = await new Promise((resolve, reject) => {
        geocoder.getPoint(loc, (point) => {
          if (!point) {
            reject("坐落地址定位失败，请检查地址或网络。");
          } else {
            resolve(point);
          }
        }, "全国");
      });

      setCenterPoint(point);
      map.centerAndZoom(point, 16);
      map.panTo(point);
      map.enableScrollWheelZoom();
      const marker = new window.BMap.Marker(point);
      map.addOverlay(marker);
      marker.setAnimation(window.BMAP_ANIMATION_BOUNCE);
      setMapObj(map);

      // 顺序执行数据采集
      await sequentialDataCollection(point);

    } catch (error) {
      setErrorMsg(error);
      setLoading(false);
    }
  };

  // 添加方位指示函数
  const addDirectionIndicators = (map) => {
    // 创建方位指示的DOM元素
    const directionsContainer = document.createElement('div');
    directionsContainer.className = 'baidu-map-directions';

    // 创建四个方向的元素
    const directions = ['north', 'east', 'south', 'west'];
    directions.forEach(dir => {
      const dirElement = document.createElement('div');
      dirElement.className = `direction direction-${dir}`;
      dirElement.textContent =
        dir === 'north' ? '北' :
          dir === 'east' ? '东' :
            dir === 'south' ? '南' : '西';
      directionsContainer.appendChild(dirElement);
    });

    // 将方位指示添加到地图容器中
    mapRef.current.appendChild(directionsContainer);
  };

  // 顺序执行数据采集
  const sequentialDataCollection = async (point) => {
    try {
      // 1. 采集周边POI数据
      for (const cat of CATEGORY_LIST) {
        setCurrentProgress(`正在采集${cat.label}数据...`);
        const result = await searchNearbyWithRetry(cat.query || cat.label, point, 1600);//查找范围
        if (result || !formData[cat.key]) {
          setFormData(prev => ({ ...prev, [cat.key]: result }));
          await delay(QUERY_DELAY);
        }
      }

      // 2. 采集公交站数据
      setCurrentProgress("正在采集公交站数据...");
      const [busStop, busRoutes] = await searchBusStopWithRetry(point, 1600);//查找范围
      if (busStop || !formData[BUS_STOP_KEY]) {
        setFormData(prev => ({ ...prev, [BUS_STOP_KEY]: busStop }));
      }
      if (busRoutes || !formData[BUS_ROUTES_KEY]) {
        setFormData(prev => ({ ...prev, [BUS_ROUTES_KEY]: busRoutes }));
      }
      await delay(QUERY_DELAY);

      // 3. 采集道路数据
      setCurrentProgress("正在采集道路数据...");
      const roadName = await searchRoadWithRetry(point, 1600);//查找范围
      if (roadName || !formData[ROAD_KEY]) {
        setFormData(prev => ({ ...prev, [ROAD_KEY]: roadName }));
      }

      setLoading(false);
      setCurrentProgress("数据采集完成");
    } catch (error) {
      setErrorMsg(`数据采集出错: ${error}`);
      setLoading(false);
    }
  };

  // 带重试的POI搜索
  const searchNearbyWithRetry = async (keyword, point, radius, retries = 2) => {
    try {
      const result = await searchNearby(keyword, point, radius);
      if (result || retries === 0) return result;

      await delay(QUERY_DELAY * (3 - retries)); // 重试延迟逐渐增加
      return searchNearbyWithRetry(keyword, point, radius, retries - 1);
    } catch (error) {
      if (retries > 0) {
        await delay(QUERY_DELAY * (3 - retries));
        return searchNearbyWithRetry(keyword, point, radius, retries - 1);
      }
      throw error;
    }
  };

  // 带重试的公交站搜索
  const searchBusStopWithRetry = async (point, radius, retries = 2) => {
    try {
      const result = await searchBusStop(point, radius);
      if ((result[0] && result[1]) || retries === 0) return result;

      await delay(QUERY_DELAY * (3 - retries));
      return searchBusStopWithRetry(point, radius, retries - 1);
    } catch (error) {
      if (retries > 0) {
        await delay(QUERY_DELAY * (3 - retries));
        return searchBusStopWithRetry(point, radius, retries - 1);
      }
      throw error;
    }
  };

  // 带重试的道路搜索
  const searchRoadWithRetry = async (point, radius, retries = 2) => {
    try {
      const result = await searchRoad(point, radius);
      if (result || retries === 0) return result;

      await delay(QUERY_DELAY * (3 - retries));
      return searchRoadWithRetry(point, radius, retries - 1);
    } catch (error) {
      if (retries > 0) {
        await delay(QUERY_DELAY * (3 - retries));
        return searchRoadWithRetry(point, radius, retries - 1);
      }
      throw error;
    }
  };

  // 通用POI采集（优先有名的，最多4个）
  function searchNearby(keyword, point, radius) {
    return new Promise((resolve) => {
      const localSearch = new window.BMap.LocalSearch(point, {
        pageCapacity: 30,
        onSearchComplete: function (results) {
          if (localSearch.getStatus() === window.BMAP_STATUS_SUCCESS) {
            let pois = [];
            for (let i = 0; i < results.getCurrentNumPois(); i++) {
              const poi = results.getPoi(i);
              const dist = getDistanceSimple(point, poi.point);
              if (dist > radius) continue;
              pois.push(poi);
            }
            // 优先出名的
            pois.sort((a, b) => getStarRank(a) - getStarRank(b) || getDistanceSimple(point, a.point) - getDistanceSimple(point, b.point));

            // 处理名称
            const processName = (name, type) => {
              // 处理医院、小区、学校的"-XX门"后缀
              if (["医院", "小区", "学校"].includes(type)) {
                name = name.replace(/-[东南西北12]+门$/, "").trim();
              }
              // 处理银行的"24小时自助银行"后缀（仅去掉自助银行，保留支行信息）
              if (type === "银行") {
                name = name.replace(/24小时自助银行/g, "").trim();
              }
              return name;
            };

            // 去重后最多4个
            const names = [];
            pois.forEach(poi => {
              const processedName = processName(poi.title, keyword);
              if (names.length < 4 && !names.includes(processedName)) {
                names.push(processedName);
              }
            });
            resolve(names.join("、"));
          } else {
            resolve("");
          }
        }
      });
      localSearch.searchNearby(keyword, point, radius);
    });
  }

  // 公交站采集
  // 公交站采集
  function searchBusStop(point, radius) {
    return new Promise((resolve) => {
      const localSearch = new window.BMap.LocalSearch(point, {
        pageCapacity: 30,
        onSearchComplete: function (results) {
          if (localSearch.getStatus() === window.BMAP_STATUS_SUCCESS) {
            let busStops = []; // 存储公交站及其线路

            for (let i = 0; i < results.getCurrentNumPois(); i++) {
              const poi = results.getPoi(i);
              const dist = getDistanceSimple(point, poi.point);
              if (dist > radius) continue;

              // 提取公交线路信息
              let routes = [];
              if (poi.address) {
                // 匹配"数字/字母+路"，支持; , 、空格多种分隔
                routes = (poi.address.match(/[\dA-Za-z]+路/g) || []);
              }

              busStops.push({
                name: poi.title,
                routes: routes
              });
            }

            // 按距离排序，最多取4个
            busStops.sort((a, b) => getDistanceSimple(point, a.point) - getDistanceSimple(point, b.point));

            // 格式化输出
            let stopNames = [];
            let routeDetails = [];

            busStops.slice(0, 4).forEach(stop => {
              stopNames.push(stop.name);
              if (stop.routes.length > 0) {
                routeDetails.push(stop.routes.join("、"));
              } else {
                routeDetails.push("");
              }
            });

            // 使用分号分隔不同公交站
            resolve([stopNames.join("；"), routeDetails.join("；")]);
          } else {
            resolve(["", ""]);
          }
        }
      });
      localSearch.searchNearby("公交站", point, radius);
    });
  }

  // 道路采集，最近一个
  function searchRoad(point, radius) {
    return new Promise((resolve) => {
      const localSearch = new window.BMap.LocalSearch(point, {
        pageCapacity: 10,
        onSearchComplete: function (results) {
          if (localSearch.getStatus() === window.BMAP_STATUS_SUCCESS) {
            let roadPois = [];
            for (let i = 0; i < results.getCurrentNumPois(); i++) {
              const poi = results.getPoi(i);
              const dist = getDistanceSimple(point, poi.point);
              if (dist > radius) continue;
              roadPois.push(poi);
            }
            // 按距离排序
            roadPois.sort((a, b) => getDistanceSimple(point, a.point) - getDistanceSimple(point, b.point));

            // 提取道路名称，去重
            const roadNames = [];
            const seen = new Set();
            for (const poi of roadPois) {
              if (!seen.has(poi.title)) {
                seen.add(poi.title);
                roadNames.push(poi.title);
                // 如果已经收集到2条不同的道路，就停止
                if (roadNames.length >= 2) break;
              }
            }

            // 返回结果，用顿号分隔
            resolve(roadNames.join("、"));
          } else {
            resolve("");
          }
        }
      });
      localSearch.searchNearby("道路", point, radius);
    });
  }

  // 距离计算
  function getDistanceSimple(p1, p2) {
    if (!p1 || !p2) return 99999;
    const R = 6371000;
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const a = lat1 - lat2;
    const b = (p1.lng - p2.lng) * Math.PI / 180;
    const s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(b / 2), 2)));
    return R * s;
  }

  // "出名度"评分
  function getStarRank(poi) {
    let star = 0;
    const title = poi.title || "";

    // 一线开发商优先
    if (/万科|金科|龙湖|招商|保利|华润|中海/.test(title)) {
      star += 8;
    } else if (/协信|融创|金地|花园城|国际城|中央公园|都会|御|国际|公园|花园|绿城/.test(title)) {
      star += 6;
    } else if (/小区|花园|苑|府/.test(title)) {
      star += 2;
    }

    // 其它"出名度"规则
    if (/总|中心|人民|医院|旗舰|大型|大厦/.test(title)) star += 4;
    if (/建设|招商|中国|工商|农业|交通|中信|华夏|兴业/.test(title)) star += 2;
    if (/沃尔玛|永辉|家乐福|新世纪|万达|盒马/.test(title)) star += 3;
    if (/附属|三甲|大学|实验|重点/.test(title)) star += 2;
    if (poi.address && /主干道|大道|路|街/.test(poi.address)) star += 1;

    return -star; // sort用，分值高排前
  }

  // 延迟函数
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const { location, ...dataToSave } = formData;

    // 确保公交站和线路使用分号分隔
    if (dataToSave.busStopName) {
      dataToSave.busStopName = dataToSave.busStopName.replace(/、/g, "；");
    }
    if (dataToSave.busRoutes) {
      dataToSave.busRoutes = dataToSave.busRoutes.replace(/、/g, "；");
    }

    onSave(dataToSave);
    onClose();
  };

  return (
    <div className="app-container baidu-data-grabber-modal">
      <div className="baidu-data-grabber-content">
        <div className="baidu-data-grabber-header">
          <h3>周边配套：</h3>
          <button className="baidu-data-grabber-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="baidu-data-grabber-main">


          <div className="baidu-data-grabber-form-container">
            <div className="baidu-data-grabber-form">
              <div className="baidu-data-grabber-field">
                <label>坐落:</label>
                <input
                  type="text"
                  value={formData.location}
                  readOnly
                  className="baidu-data-grabber-location-input"
                />
              </div>

              <div className="baidu-data-grabber-field">
                <label>临街:</label>
                <textarea
                  value={formData.streetStatus}
                  onChange={(e) => handleChange('streetStatus', e.target.value)}
                  placeholder="请输入临街状况"
                />
              </div>
              <div className="baidu-data-grabber-field">
                <label>方位:</label>
                <textarea
                  value={formData.direction}
                  onChange={(e) => handleChange('direction', e.target.value)}
                  placeholder="请输入方位"
                />
              </div>
              <div className="baidu-data-grabber-field">
                <label>朝向:</label>
                <textarea
                  value={formData.orientation}
                  onChange={(e) => handleChange('orientation', e.target.value)}
                  placeholder="请输入朝向"
                />
              </div>
              <div className="baidu-data-grabber-field">
                <label>距离:</label>
                <textarea
                  value={formData.distance}
                  onChange={(e) => handleChange('distance', e.target.value)}
                  placeholder="请输入距离重要场所距离"
                />
              </div>
              <div className="baidu-data-grabber-field">
                <label>四至:</label>
                <textarea
                  value={formData.boundaries}
                  onChange={(e) => handleChange('boundaries', e.target.value)}
                  placeholder="请输入四至信息（如：东至XX路，南至XX小区）"
                />
              </div>

              <div className="baidu-data-grabber-field">
                <label>银行:</label>
                <textarea
                  value={formData.bank}
                  className="baidu-data-grabber-field-textarea"
                  onChange={(e) => handleChange('bank', e.target.value)}
                  placeholder="自动采集或手动输入周边银行信息"
                />
              </div>

              <div className="baidu-data-grabber-field">
                <label>超市:</label>
                <textarea
                  value={formData.supermarket}
                  onChange={(e) => handleChange('supermarket', e.target.value)}
                  placeholder="自动采集或手动输入周边超市信息"
                />
              </div>

              <div className="baidu-data-grabber-field">
                <label>医院:</label>
                <textarea
                  value={formData.hospital}
                  onChange={(e) => handleChange('hospital', e.target.value)}
                  placeholder="自动采集或手动输入周边医院信息"
                />
              </div>

              <div className="baidu-data-grabber-field">
                <label>学校:</label>
                <textarea
                  value={formData.school}
                  onChange={(e) => handleChange('school', e.target.value)}
                  placeholder="自动采集或手动输入周边学校信息"
                />
              </div>

              <div className="baidu-data-grabber-field">
                <label>小区:</label>
                <textarea
                  value={formData.nearbyCommunity}
                  onChange={(e) => handleChange('nearbyCommunity', e.target.value)}
                  placeholder="自动采集或手动输入周边小区信息"
                />
              </div>

              <div className="baidu-data-grabber-field">
                <label>公交站:</label>
                <textarea
                  value={formData.busStopName}
                  onChange={(e) => handleChange('busStopName', e.target.value)}
                  placeholder="自动采集或手动输入公交站名，不同站用分号分隔"
                />
              </div>

              <div className="baidu-data-grabber-field">
                <label>公交线路:</label>
                <textarea
                  value={formData.busRoutes}
                  onChange={(e) => handleChange('busRoutes', e.target.value)}
                  placeholder="自动采集或手动输入公交线路，同一站的线路用顿号分隔，不同站用分号分隔"
                />
              </div>

              <div className="baidu-data-grabber-field">
                <label>道路:</label>
                <textarea
                  value={formData.areaRoad}
                  onChange={(e) => handleChange('areaRoad', e.target.value)}
                  placeholder="自动采集或手动输入周边道路信息"
                />
              </div>
            </div>

            {loading && (
              <div className="baidu-data-grabber-loading">
                {currentProgress || "采集中，请稍等..."}
              </div>
            )}
            {errorMsg && <div className="baidu-data-grabber-error">{errorMsg}</div>}

            <div className="baidu-data-grabber-actions">
              <button className="baidu-data-grabber-cancel" onClick={onClose}>
                取消
              </button>
              <button className="baidu-data-grabber-save" onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
          <div className="map-container" ref={mapRef} />

        </div>
      </div>
    </div>
  );
};

export default BaiduDataGrabber;