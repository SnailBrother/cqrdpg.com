import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import styles from './Overview.module.css';
const SOCKET_URL = 'http://121.4.22.55:5202';
const Overview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today'); // 'today', 'yesterday', '7days', '30days'
  const chartRef = useRef(null);

  useEffect(() => {
     const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('stats-update', (data) => {
      setStats(data);
      setLoading(false);
      console.log('Real-time stats updated:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 根据时间范围获取对应的数据
  const getStatsByTimeRange = () => {
    if (!stats) return null;
    
    switch(timeRange) {
      case 'yesterday':
        return stats.yesterday;
      case '7days':
        return stats.last7Days || stats.yesterday;
      case '30days':
        return stats.last30Days || stats.yesterday;
      default:
        return stats.today;
    }
  };

  const formatList = (list, limit = 7) => {
    if (!list) return [];
    return list.slice(0, limit).map((item, index) => ({
      ...item,
      key: index
    }));
  };

  // 生成折线图路径
  const generateLinePath = (data, width, height) => {
    if (!data || data.length === 0) return '';
    
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      // 反转Y轴：SVG的Y轴从上到下增加
      const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
      return `${x},${y}`;
    }).join(' ');
    
    return points;
  };

  // 生成面积图路径（填充）
  const generateAreaPath = (data, width, height) => {
    if (!data || data.length === 0) return '';
    
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    
    let path = '';
    
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
      
      if (index === 0) {
        path += `M ${x},${height} L ${x},${y}`;
      } else {
        path += ` L ${x},${y}`;
      }
    });
    
    // 闭合到起点
    const lastX = width;
    const lastY = height - ((data[data.length - 1] - min) / range) * height * 0.8 - height * 0.1;
    path += ` L ${lastX},${height} L 0,${height} Z`;
    
    return path;
  };

  if (loading || !stats) {
    return <div className={styles.loading}>加载实时监控数据...</div>;
  }

  const currentStats = getStatsByTimeRange();
  const referrers = formatList(stats.referrers);
  const landingPages = formatList(stats.landingPages);
  const entryPages = formatList(stats.entryPages);
  const trendData = stats.trend || Array(24).fill(0).map(() => Math.floor(Math.random() * 100));
  
  // 计算趋势数据统计
  const maxValue = Math.max(...trendData);
  const minValue = Math.min(...trendData);
  const avgValue = Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length);
  const totalValue = trendData.reduce((a, b) => a + b, 0);

  // 处理时间标签切换
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  return (
    <div className={styles.overviewContainer}>
      {/* 顶部访问概况 */}
      <div className={styles.headerSection}>
        <div className={styles.activeVisitorsCard}>
          <h3>最近 15 分钟活跃访客数</h3>
          <div className={styles.activeNumber}>{stats.recentActive || 0}</div>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>IP 数</div>
            <div className={styles.statValue}>{currentStats?.ip || 0}</div>
            <div className={styles.statSub}>昨日：{stats.yesterday?.ip || 0}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>浏览量 (PV)</div>
            <div className={styles.statValue}>{currentStats?.pv || 0}</div>
            <div className={styles.statSub}>昨日：{stats.yesterday?.pv || 0}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>访客数 (UV)</div>
            <div className={styles.statValue}>{currentStats?.uv || 0}</div>
            <div className={styles.statSub}>昨日：{stats.yesterday?.uv || 0}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>平均访问时长</div>
            <div className={styles.statValue}>{currentStats?.avgTime || '0s'}</div>
            <div className={styles.statSub}>跳出率：{currentStats?.bounceRate || '0%'}</div>
          </div>
        </div>
      </div>

      {/* 时间标签 */}
      <div className={styles.timeTabs}>
        <span 
          className={timeRange === 'today' ? styles.activeTab : ''}
          onClick={() => handleTimeRangeChange('today')}
        >
          今日
        </span>
        <span 
          className={timeRange === 'yesterday' ? styles.activeTab : ''}
          onClick={() => handleTimeRangeChange('yesterday')}
        >
          昨日
        </span>
        <span 
          className={timeRange === '7days' ? styles.activeTab : ''}
          onClick={() => handleTimeRangeChange('7days')}
        >
          最近七日
        </span>
        <span 
          className={timeRange === '30days' ? styles.activeTab : ''}
          onClick={() => handleTimeRangeChange('30days')}
        >
          最近 30 日
        </span>
      </div>

      {/* 趋势分析 - 折线图 */}
      <div className={styles.trendSection}>
        <div className={styles.trendHeader}>
          <h3 className={styles.sectionTitle}>
            趋势分析 (每小时 PV)
            <span className={styles.trendSubtitle}>{new Date().toLocaleDateString()}</span>
          </h3>
          <div className={styles.trendStats}>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>最高</span>
              <span className={styles.trendStatValue}>{maxValue}</span>
            </div>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>最低</span>
              <span className={styles.trendStatValue}>{minValue}</span>
            </div>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>平均</span>
              <span className={styles.trendStatValue}>{avgValue}</span>
            </div>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>总计</span>
              <span className={styles.trendStatValue}>{totalValue}</span>
            </div>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <svg 
            ref={chartRef}
            className={styles.lineChart} 
            viewBox="0 0 800 300" 
            preserveAspectRatio="none"
          >
            {/* 网格线 */}
            <g className={styles.gridLines}>
              {[0, 1, 2, 3, 4].map((i) => (
                <line 
                  key={i}
                  x1="0" 
                  y1={60 + i * 48} 
                  x2="800" 
                  y2={60 + i * 48}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
            </g>

            {/* 面积填充 */}
            <path
              d={generateAreaPath(trendData, 800, 250)}
              fill="rgba(59, 130, 246, 0.1)"
              className={styles.areaFill}
            />

            {/* 折线 */}
            <polyline
              points={generateLinePath(trendData, 800, 250)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              className={styles.linePath}
            />

            {/* 数据点 */}
            {trendData.map((value, index) => {
              const max = Math.max(...trendData, 1);
              const min = Math.min(...trendData, 0);
              const range = max - min || 1;
              const x = (index / (trendData.length - 1)) * 800;
              const y = 250 - ((value - min) / range) * 250 * 0.8 - 25;
              
              return (
                <g key={index} className={styles.dataPoint}>
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="white"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    className={styles.pointCircle}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#3b82f6"
                    className={styles.pointDot}
                  />
                  <title>{`${index}:00 - ${value} 次访问`}</title>
                </g>
              );
            })}
          </svg>

          {/* X轴标签 */}
          <div className={styles.chartXAxis}>
            {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour) => (
              <span key={hour} className={styles.axisLabel}>
                {hour}:00
              </span>
            ))}
          </div>

          {/* Y轴标签 */}
          <div className={styles.chartYAxis}>
            <span className={styles.axisLabel}>{maxValue}</span>
            <span className={styles.axisLabel}>{Math.round((maxValue + minValue) / 2)}</span>
            <span className={styles.axisLabel}>{minValue}</span>
          </div>
        </div>

        {/* 图例 */}
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#3b82f6' }}></span>
            PV趋势
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendLine}></span>
            平均值线
          </span>
        </div>
      </div>

      {/* 底部三列表格 */}
      <div className={styles.bottomSections}>
        {/* 来路 */}
        <div className={styles.dataTable}>
          <h3 className={styles.tableTitle}>来路</h3>
          <div className={styles.tableHeader}>
            <span>来源网站</span>
            <span>访客数</span>
          </div>
          <div className={styles.tableBody}>
            {referrers.length > 0 ? referrers.map((item) => (
              <div key={item.key} className={styles.tableRow}>
                <span className={styles.tableCell}>
                  {item.name === '直接输入网址访问' || !item.name ? '直接访问' : item.name}
                </span>
                <span className={styles.tableCell}>{item.count}</span>
              </div>
            )) : <div className={styles.emptyRow}>暂无数据</div>}
          </div>
        </div>

        {/* 受访页 */}
        <div className={styles.dataTable}>
          <h3 className={styles.tableTitle}>受访页</h3>
          <div className={styles.tableHeader}>
            <span>页面地址</span>
            <span>查看次数</span>
          </div>
          <div className={styles.tableBody}>
            {landingPages.length > 0 ? landingPages.map((item) => (
              <div key={item.key} className={styles.tableRow}>
                <span className={styles.tableCellUrl} title={item.url}>
                  {item.url || '/'}
                </span>
                <span className={styles.tableCell}>{item.count}</span>
              </div>
            )) : <div className={styles.emptyRow}>暂无数据</div>}
          </div>
        </div>

        {/* 入口页 */}
        <div className={styles.dataTable}>
          <h3 className={styles.tableTitle}>入口页</h3>
          <div className={styles.tableHeader}>
            <span>页面地址</span>
            <span>入口次数</span>
          </div>
          <div className={styles.tableBody}>
            {entryPages.length > 0 ? entryPages.map((item) => (
              <div key={item.key} className={styles.tableRow}>
                <span className={styles.tableCellUrl} title={item.url}>
                  {item.url || '/'}
                </span>
                <span className={styles.tableCell}>{item.count}</span>
              </div>
            )) : <div className={styles.emptyRow}>暂无数据</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;