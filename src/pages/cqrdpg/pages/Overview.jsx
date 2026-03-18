import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import styles from './Overview.module.css';
import { UAParser } from 'ua-parser-js';  // 修改这里的导入方式
const Overview = () => {
  // --- 全局统计状态 ---
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const chartRef = useRef(null);

  // --- 实时访问列表状态 ---
  const [visitorList, setVisitorList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
    // 【配置】
  const INITIAL_LOAD_LIMIT = 200; // 初始化拉取 200 条
  const MAX_LIST_SIZE = 200;      // 内存中最大保留 200 条

  // 或者使用更详细的解析函数
  const parseUserAgent = (userAgent) => {
    if (!userAgent) return { type: '未知', icon: '❓', os: '未知', browser: '未知' };

    try {
      const parser = new UAParser(userAgent);
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const device = parser.getDevice();

      let type = '电脑';
      let icon = '💻';

      if (device.type === 'mobile') {
        type = '手机';
        icon = '📱';
      } else if (device.type === 'tablet') {
        type = '平板';
        icon = '📟';
      } else if (device.type === 'wearable') {
        type = '穿戴设备';
        icon = '⌚';
      } else if (device.type === 'console') {
        type = '游戏机';
        icon = '🎮';
      } else if (device.type === 'smarttv') {
        type = '智能电视';
        icon = '📺';
      }

      return {
        type,
        icon,
        os: os.name || '未知系统',
        browser: browser.name || '未知浏览器'
      };
    } catch (error) {
      console.error('解析 UserAgent 失败:', error);
      return { type: '未知', icon: '❓', os: '未知', browser: '未知' };
    }
  };
  // 1. Socket 连接与事件监听
  useEffect(() => {
    // 连接 Socket
    const socket = io('/', {
      transports: ['websocket', 'polling'],
    });

    // 监听统计数据更新 (PV, UV, 趋势图等)
    socket.on('stats-update', (data) => {
      setStats(data);
      setLoading(false);
    });

    // 【核心】监听新访问记录事件 (实时插入列表)
    // 【核心】监听新访问记录事件 (实时插入列表)
    socket.on('new-visit-record', (newRecord) => {
      setVisitorList((prevList) => {
        // 1. 定义唯一标识符：优先用 sessionid，如果没有，则组合 username+email
        // 对于特殊用户，sessionid 可能会变（如果是新会话），但 username/email 不变
        // 为了稳妥，我们主要依赖 sessionid，但如果业务上认为同一人就是同一条，可以用 username+email
        // 这里假设：只要 sessionid 相同，就是同一次会话的更新。
        // 如果你的逻辑是：李中敬不管 sessionid 变不变，都只保留最新的一条，那需要用 username 作为 key。
        
        // 方案 A：严格基于 sessionid (推荐，符合常规会话逻辑)
        const uniqueKey = newRecord.sessionid; 
        
        // 方案 B (备选)：如果是特殊用户，忽略 sessionid，只用 username 去重
        // const isSpecial = ['李中敬', '陈彦羽'].includes(newRecord.username) || ['471883209@qq.com'].includes(newRecord.email);
        // const uniqueKey = isSpecial ? `${newRecord.username}-${newRecord.email}` : newRecord.sessionid;

        // 2. 在现有列表中查找是否已经存在该 Key 的记录
        const existingIndex = prevList.findIndex(item => item.sessionid === uniqueKey);

        let newList;

        if (existingIndex !== -1) {
          // 【情况 1：找到了旧记录】-> 执行更新操作
          // 创建新列表：把旧的那条删掉，把新的这条放到最前面
          // 或者直接修改该位置的数据并移动到头部
          
          // 方法：过滤掉旧的，然后把新的 unshift
          const filteredList = prevList.filter(item => item.sessionid !== uniqueKey);
          newList = [newRecord, ...filteredList];
          
          console.log(`🔄 更新列表中的记录: ${newRecord.username}`);
        } else {
          // 【情况 2：没找到】-> 执行插入操作
          newList = [newRecord, ...prevList];
          console.log(`➕ 新增列表记录: ${newRecord.username}`);
        }

        // 3. 限制列表长度，防止内存泄漏
        return newList.slice(0, MAX_LIST_SIZE);
      });

      if (listLoading) {
        setListLoading(false);
      }
    });

    // 清理函数
    return () => {
      socket.off('stats-update');
      socket.off('new-visit-record');
      socket.disconnect();
    };
  }, [listLoading]);

  useEffect(() => {
    const fetchInitialHistory = async () => {
      try {
        // 调用刚才后端新建的 /api/website/records-history 接口
        const response = await fetch(`/api/website/records-history?limit=${INITIAL_LOAD_LIMIT}`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();

        if (result.success) {
          setVisitorList(result.data);
        }
      } catch (error) {
        console.error('获取历史访问列表失败:', error);
      } finally {
        setListLoading(false);
      }
    };

    fetchInitialHistory();
  }, []); // 只执行一次

  // 加载状态判断
  if (loading || !stats) {
    return <div className={styles.loading}>加载实时监控数据...</div>;
  }

  // --- 辅助函数 ---

  const getCurrentStats = () => {
    if (!stats) return {};
    if (timeRange === 'yesterday') return stats.yesterday;
    return stats.today;
  };

  const currentStats = getCurrentStats();

  const formatList = (list, limit = 7) => {
    if (!list) return [];
    return list.slice(0, limit).map((item, index) => ({ ...item, key: index }));
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const truncate = (str, length) => {
    if (!str) return '-';
    return str.length > length ? str.substring(0, length) + '...' : str;
  };

  // --- 图表数据生成 ---

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

  // --- 数据准备 ---

  const referrers = formatList(stats.referrers);
  const landingPages = formatList(stats.landingPages);
  const entryPages = formatList(stats.entryPages);
  const trendData = stats.trend || Array(24).fill(0);

  const maxValue = Math.max(...trendData, 1);
  const minValue = Math.min(...trendData, 0);
  const avgValue = Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length);
  const totalValue = trendData.reduce((a, b) => a + b, 0);

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
        </div>
      </div>

      {/* 时间标签 */}
      <div className={styles.timeTabs}>
        <span className={timeRange === 'today' ? styles.activeTab : ''} onClick={() => setTimeRange('today')}>今日</span>
        <span className={timeRange === 'yesterday' ? styles.activeTab : ''} onClick={() => setTimeRange('yesterday')}>昨日</span>
        <span onClick={() => setTimeRange('7days')}>最近七日</span>
        <span onClick={() => setTimeRange('30days')}>最近 30 日</span>
      </div>

      {/* 左右双列布局：趋势分析 + 新老访客 */}
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
              <span className={styles.legendItem}><span className={styles.dot} style={{ background: '#3b82f6' }}></span>今日</span>
              <span className={styles.legendItem}><span className={styles.dot} style={{ background: '#3b82f6', opacity: 0.4 }}></span>昨日</span>
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

     {/* ========================================== */}
      {/* 实时访问记录列表 (调用独立 API) */}
      {/* ========================================== */}
      <div className={styles.visitorListSection}>
        <div className={styles.listHeader}>
          <h3 className={styles.sectionTitle}>
            实时访问明细 (最近 {MAX_LIST_SIZE} 条)
            <span style={{ fontSize: '0.8em', color: '#10b981', marginLeft: '10px', fontWeight: 'normal' }}>
              {listLoading ? '加载中...' : '● 实时监听中'}
            </span>
          </h3>
          <button
            className={styles.refreshBtn}
            onClick={() => {
              setListLoading(true);
              // 刷新时也调用独立的历史 API
              fetch(`/api/website/records-history?limit=${MAX_LIST_SIZE}`)
                .then(res => res.json())
                .then(data => {
                  if (data.success) setVisitorList(data.data);
                })
                .catch(err => console.error(err))
                .finally(() => setListLoading(false));
            }}
          >
            刷新列表
          </button>
        </div>

        <div className={styles.visitorlist}>
          {listLoading && visitorList.length === 0 ? (
            <div className={styles.loading}>加载记录...</div>
          ) : visitorList.length === 0 ? (
            <div className={styles.emptyRow}>暂无访问记录</div>
          ) : (
            <table className={styles.recordTable}>
              <thead>
                <tr>
                  <th className={styles.thTime}>时间</th>
                  <th className={styles.thUser}>用户</th>
                  <th className={styles.thEmail}>邮箱</th>
                  <th className={styles.thUrl}>页面</th>
                  <th className={styles.thAgent}>设备</th>
                </tr>
              </thead>
              <tbody>
                {visitorList.map((record, index) => {
                  const device = parseUserAgent(record.useragent);
                  return (
                    <tr key={`${record.sessionid}-${index}`} className={styles.trRow}>
                      <td className={styles.tdTime}>{formatTime(record.visittime)}</td>
                      <td className={styles.tdUser}>
                        <span className={record.username === 'unknowusername' ? styles.anonTag : styles.userTag}>
                          {record.username === 'unknowusername' ? '匿名' : record.username}
                        </span>
                      </td>
                      <td className={styles.tdEmail}>{record.email === 'unknowemail' ? '-' : record.email}</td>
                      <td className={styles.tdUrl} title={record.currenturl}>{truncate(record.currenturl, 50)}</td>
                      <td className={styles.tdAgent} title={record.useragent}>
                        <span className={`${styles.deviceTag} ${styles[device.type] || ''}`}>
                          <span className={styles.deviceIcon}>{device.icon}</span>
                          <span className={styles.deviceType}>{device.type}</span>
                          <span className={styles.deviceDetail}>{device.os} · {device.browser}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;