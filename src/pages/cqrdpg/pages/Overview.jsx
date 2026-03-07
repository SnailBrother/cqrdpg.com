import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import styles from './Overview.module.css';

// 从环境变量读取 URL
// process.env.REACT_APP_SOCKET_URL 会在打包时自动替换为 .env 文件中的值
// const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || '/'; 

const Overview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const chartRef = useRef(null);

  useEffect(() => {
    // 初始化 Socket
    // 如果是开发环境，SOCKET_URL 是 http://121.4.22.55:5202
    // 如果是生产环境，SOCKET_URL 是 / (相对路径)，浏览器会自动请求当前域名的 /socket.io/
    // 生产环境下，如果使用了 Nginx 代理，通常不需要额外配置 path
      // 但如果你的 Nginx 配置了特定的 path，可以在这里指定，例如: path: '/socket.io/'
    const socket = io('/', {
      transports: ['websocket', 'polling'],
        // 生产环境下，如果使用了 Nginx 代理，通常不需要额外配置 path
      // 但如果你的 Nginx 配置了特定的 path，可以在这里指定，例如: path: '/socket.io/'
    });

    socket.on('stats-update', (data) => {
      setStats(data);
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading || !stats) {
    return <div className={styles.loading}>加载实时监控数据...</div>;
  }

  const getCurrentStats = () => {
    if (!stats) return {};
    if (timeRange === 'yesterday') return stats.yesterday;
    return stats.today;
  };

  const currentStats = getCurrentStats();

  // 格式化列表
  const formatList = (list, limit = 7) => {
    if (!list) return [];
    return list.slice(0, limit).map((item, index) => ({ ...item, key: index }));
  };

  // 生成折线图路径
  const generateLinePath = (data, width, height) => {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
      return `${x},${y}`;
    }).join(' ');
  };

  const generateAreaPath = (data, width, height) => {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    let path = '';
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
      if (index === 0) path += `M ${x},${height} L ${x},${y}`;
      else path += ` L ${x},${y}`;
    });
    const lastX = width;
    const lastY = height - ((data[data.length - 1] - min) / range) * height * 0.8 - height * 0.1;
    path += ` L ${lastX},${height} L 0,${height} Z`;
    return path;
  };

  const referrers = formatList(stats.referrers);
  const landingPages = formatList(stats.landingPages);
  const entryPages = formatList(stats.entryPages);
  const trendData = stats.trend || Array(24).fill(0);

  const maxValue = Math.max(...trendData, 1);
  const minValue = Math.min(...trendData, 0);
  const avgValue = Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length);
  const totalValue = trendData.reduce((a, b) => a + b, 0);

  // 柱状图数据
  const barChartData = [
    { label: '新访客', today: stats.today.newUsers || 0, yesterday: stats.yesterday.newUsers || 0, color: '#3b82f6' },
    { label: '老访客', today: stats.today.returningUsers || 0, yesterday: stats.yesterday.returningUsers || 0, color: '#10b981' }
  ];
  const maxBarVal = Math.max(...barChartData.flatMap(d => [d.today, d.yesterday]), 1);

  return (
    <div className={styles.overviewContainer}>
      {/* 顶部访问概况 */}
      <div className={styles.headerSection}>
        <div className={styles.activeVisitorsCard}>
          <h3>最近 15 分钟活跃</h3>
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
            <div className={styles.statLabel}>平均时长</div>
            <div className={styles.statValue}>{currentStats?.avgTime || '0s'}</div>
            <div className={styles.statSub}>跳出率：{currentStats?.bounceRate || '0%'}</div>
          </div>
          {/* <div className={styles.statItem}>
            <div className={styles.statLabel}>今日新访客</div>
            <div className={styles.statValue} style={{color: '#3b82f6'}}>{stats.today.newUsers || 0}</div>
            <div className={styles.statSub}>昨日：{stats.yesterday.newUsers || 0}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>今日老访客</div>
            <div className={styles.statValue} style={{color: '#10b981'}}>{stats.today.returningUsers || 0}</div>
            <div className={styles.statSub}>昨日：{stats.yesterday.returningUsers || 0}</div>
          </div> */}
        </div>
      </div>

      {/* 时间标签 */}
      <div className={styles.timeTabs}>
        <span className={timeRange === 'today' ? styles.activeTab : ''} onClick={() => setTimeRange('today')}>今日</span>
        <span className={timeRange === 'yesterday' ? styles.activeTab : ''} onClick={() => setTimeRange('yesterday')}>昨日</span>
        <span onClick={() => setTimeRange('7days')}>最近七日</span>
        <span onClick={() => setTimeRange('30days')}>最近 30 日</span>
      </div>

      {/* 【核心修改】左右双列布局：趋势分析 + 新老访客 */}
      <div className={styles.trendRow}>
        
        {/* 左侧：趋势折线图 */}
        <div className={styles.trendColumn}>
          <div className={styles.trendHeader}>
            <h3 className={styles.sectionTitle}>趋势分析 (每小时 PV)</h3>
            <div className={styles.trendStats}>
              <div className={styles.trendStat}><span className={styles.trendStatLabel}>最高</span><span className={styles.trendStatValue}>{maxValue}</span></div>
              <div className={styles.trendStat}><span className={styles.trendStatLabel}>最低</span><span className={styles.trendStatValue}>{minValue}</span></div>
              <div className={styles.trendStat}><span className={styles.trendStatLabel}>平均</span><span className={styles.trendStatValue}>{avgValue}</span></div>
              <div className={styles.trendStat}><span className={styles.trendStatLabel}>总计</span><span className={styles.trendStatValue}>{totalValue}</span></div>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <svg ref={chartRef} className={styles.lineChart} viewBox="0 0 800 300" preserveAspectRatio="none">
              <g className={styles.gridLines}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <line key={i} x1="0" y1={60 + i * 48} x2="800" y2={60 + i * 48} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                ))}
              </g>
              <path d={generateAreaPath(trendData, 800, 250)} fill="rgba(59, 130, 246, 0.1)" className={styles.areaFill} />
              <polyline points={generateLinePath(trendData, 800, 250)} fill="none" stroke="#3b82f6" strokeWidth="3" className={styles.linePath} />
              {trendData.map((value, index) => {
                const range = maxValue - minValue || 1;
                const x = (index / (trendData.length - 1)) * 800;
                const y = 250 - ((value - minValue) / range) * 250 * 0.8 - 25;
                return (
                  <g key={index} className={styles.dataPoint}>
                    <circle cx={x} cy={y} r="6" fill="white" stroke="#3b82f6" strokeWidth="2" />
                    <circle cx={x} cy={y} r="3" fill="#3b82f6" />
                    <title>{`${index}:00 - ${value} 次`}</title>
                  </g>
                );
              })}
            </svg>
            <div className={styles.chartXAxis}>
              {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour) => (
                <span key={hour} className={styles.axisLabel}>{hour}:00</span>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：新老访客柱状图 */}
        <div className={styles.barColumn}>
          <div className={styles.trendHeader}>
            <h3 className={styles.sectionTitle}>新老访客对比</h3>
            <div className={styles.legendBox}>
              <span className={styles.legendItem}><span className={styles.dot} style={{background:'#3b82f6'}}></span>今日</span>
              <span className={styles.legendItem}><span className={styles.dot} style={{background:'#3b82f6', opacity:0.4}}></span>昨日</span>
            </div>
          </div>

          <div className={styles.barChartWrapper}>
            {barChartData.map((item, idx) => (
              <div key={idx} className={styles.barGroup}>
                <div className={styles.barLabel}>{item.label}</div>
                <div className={styles.bars}>
                  {/* 今日柱子 */}
                  <div className={styles.barColumnItem}>
                    <div className={styles.barFill} style={{ height: `${(item.today / maxBarVal) * 100}%`, backgroundColor: item.color }}>
                      <span className={styles.barValue}>{item.today}</span>
                    </div>
                    <span className={styles.barLegendText}>今日</span>
                  </div>
                  {/* 昨日柱子 */}
                  <div className={styles.barColumnItem}>
                    <div className={styles.barFill} style={{ height: `${(item.yesterday / maxBarVal) * 100}%`, backgroundColor: item.color, opacity: 0.4 }}>
                      <span className={styles.barValue}>{item.yesterday}</span>
                    </div>
                    <span className={styles.barLegendText}>昨日</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.barSummary}>
             <div className={styles.summaryItem}>
               <span>总新访客:</span> <strong>{stats.today.newUsers + stats.yesterday.newUsers}</strong>
             </div>
             <div className={styles.summaryItem}>
               <span>总老访客:</span> <strong>{stats.today.returningUsers + stats.yesterday.returningUsers}</strong>
             </div>
          </div>
        </div>
      </div>

      {/* 底部三列表格 */}
      <div className={styles.bottomSections}>
        <div className={styles.dataTable}>
          <h3 className={styles.tableTitle}>来路 Top 5</h3>
          <div className={styles.tableHeader}><span>来源</span><span>访客数</span></div>
          <div className={styles.tableBody}>
            {referrers.length > 0 ? referrers.map((item) => (
              <div key={item.key} className={styles.tableRow}>
                <span className={styles.tableCell}>{item.name === '直接输入网址访问' ? '直接访问' : item.name}</span>
                <span className={styles.tableCellNum}>{item.count}</span>
              </div>
            )) : <div className={styles.emptyRow}>暂无数据</div>}
          </div>
        </div>

        <div className={styles.dataTable}>
          <h3 className={styles.tableTitle}>受访页 Top 7</h3>
          <div className={styles.tableHeader}><span>页面</span><span>次数</span></div>
          <div className={styles.tableBody}>
            {landingPages.length > 0 ? landingPages.map((item) => (
              <div key={item.key} className={styles.tableRow}>
                <span className={styles.tableCellUrl} title={item.url}>{item.url}</span>
                <span className={styles.tableCellNum}>{item.count}</span>
              </div>
            )) : <div className={styles.emptyRow}>暂无数据</div>}
          </div>
        </div>

        <div className={styles.dataTable}>
          <h3 className={styles.tableTitle}>入口页 Top 7</h3>
          <div className={styles.tableHeader}><span>页面</span><span>次数</span></div>
          <div className={styles.tableBody}>
            {entryPages.length > 0 ? entryPages.map((item) => (
              <div key={item.key} className={styles.tableRow}>
                <span className={styles.tableCellUrl} title={item.url}>{item.url}</span>
                <span className={styles.tableCellNum}>{item.count}</span>
              </div>
            )) : <div className={styles.emptyRow}>暂无数据</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;