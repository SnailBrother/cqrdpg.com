import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import io from 'socket.io-client';
import Chart from 'chart.js/auto';
import styles from './SportsDetails.module.css';

const SportsDetails = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [viewType, setViewType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    sportname: '',
    count: '',
    durationseconds: '',
    groupnumber: '',
    sportdate: '',
    remarks: ''
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [message, setMessage] = useState({ show: false, text: '', type: '' });
  const [sportsOptions, setSportsOptions] = useState([]);
  // 获取所有运动选项
  const fetchSportsOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/getSportsOptions');
      const data = await response.json();
      setSportsOptions(data);
    } catch (error) {
      console.error('获取运动选项失败:', error);
    }
  }, []);

  // 图表相关状态
  const [chartDataType, setChartDataType] = useState('count'); // 'count' 或 'duration'
  const [chartDays, setChartDays] = useState(7); // 默认显示近7天
  const chartRef = useRef(null);
  let chartInstance = useRef(null);

  // 格式化日期函数
  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 显示消息
  const showMessage = (text, type) => {
    setMessage({ show: true, text, type });
    setTimeout(() => setMessage({ show: false, text: '', type: '' }), 3000);
  };

  // 获取运动记录
  const fetchRecords = useCallback(async () => {
    if (!user?.username) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/SportsAppWorkoutRecords/list/${user.username}`);
      const result = await response.json();

      if (result.success) {
        setRecords(result.records);
      }
    } catch (error) {
      console.error('获取记录失败:', error);
      showMessage('获取记录失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 建立 Socket.io 连接并监听事件
  useEffect(() => {
    fetchRecords();
    fetchSportsOptions(); // 添加这行
    const socket = io('https://cqrdpg.com:5202');

    socket.on('workout-record-update', () => {
      console.log('运动记录有变化，重新获取数据');
      fetchRecords();
      fetchSportsOptions(); // 也在这里添加，确保数据同步
    });

    return () => {
      socket.off('workout-record-update');
      socket.disconnect();
    };
  }, [fetchRecords]);

  // 获取图表数据
  const getChartData = useCallback(() => {
    const days = chartDays;
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = formatDate(date);

      // 获取当天的所有记录
      const dayRecords = records.filter(record => {
        const recordDate = formatDate(record.sportdate);
        return recordDate === dateStr;
      });

      // 计算当天的统计数据
      let totalCount = 0;
      let totalDuration = 0;

      dayRecords.forEach(record => {
        totalCount += record.count;
        totalDuration += record.durationseconds;
      });

      result.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        count: totalCount,
        duration: totalDuration
      });
    }

    return result;
  }, [records, chartDays]);

  // 更新图表
  const updateChart = useCallback(() => {
    if (!chartRef.current) return;

    const chartData = getChartData();
    const labels = chartData.map(d => d.label);
    const values = chartData.map(d => chartDataType === 'count' ? d.count : d.duration);

    const yAxisLabel = chartDataType === 'count' ? '次数' : '时长(秒)';
    const datasetLabel = chartDataType === 'count' ? '运动次数' : '运动时长';

    // 创建渐变填充
    // 在 updateChart 函数中，找到创建渐变填充的部分 背景渐变
    const gradientFill = chartRef.current.getContext('2d').createLinearGradient(0, 0, 0, 250);
    gradientFill.addColorStop(0, 'rgba(34, 197, 94, 0.8)');   // 顶部：绿色，0.6透明度
    gradientFill.addColorStop(1, 'rgba(34, 197, 94, 0.1)');   // 底部：绿色，0.1透明度

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: datasetLabel,
          data: values,
          borderColor: '#43836d',
          backgroundColor: gradientFill,
          fill: true,
          tension: 0.4,
          pointRadius: 1, // 默认点的大小，改为 2 或更小（原来是 4）
          pointHoverRadius: 4,   // 鼠标悬停时点的大小，可选
          pointBackgroundColor: '#43836d',
          pointBorderColor: '#43836d',
          pointBorderWidth: 2,  // 边框宽度也可以调小
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#fff',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                let value = context.raw;
                if (chartDataType === 'duration') {
                  const hours = Math.floor(value / 3600);
                  const minutes = Math.floor((value % 3600) / 60);
                  const seconds = value % 60;
                  let timeStr = '';
                  if (hours > 0) timeStr += `${hours}小时`;
                  if (minutes > 0) timeStr += `${minutes}分钟`;
                  if (seconds > 0 || timeStr === '') timeStr += `${seconds}秒`;
                  return `${label}: ${timeStr}`;
                }
                return `${label}: ${value}次`;
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#ddd'
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              callback: function (value) {
                if (chartDataType === 'duration') {
                  const minutes = Math.floor(value / 60);
                  if (minutes >= 60) {
                    return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
                  }
                  return `${minutes}m`;
                }
                return value;
              }
            },
            beginAtZero: true,
            title: {
              display: true,
              text: yAxisLabel,
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: 12
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }, [getChartData, chartDataType]);

  // 当数据或图表设置变化时更新图表
  useEffect(() => {
    if (records.length > 0 && chartRef.current) {
      updateChart();
    }
  }, [records, chartDataType, chartDays, updateChart]);

  // 过滤数据
  const getFilteredRecords = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    return records.filter(record => {
      const recordDate = new Date(record.sportdate);
      if (viewType === 'month') {
        return recordDate.getFullYear() === year && recordDate.getMonth() === month;
      } else {
        return recordDate.getFullYear() === year;
      }
    });
  };

  // 按日期分组数据
  const groupRecordsByDate = () => {
    const filtered = getFilteredRecords();
    const grouped = {};

    filtered.forEach(record => {
      const date = formatDate(record.sportdate);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });

    const sortedDates = Object.keys(grouped).sort().reverse();
    const sortedGrouped = {};
    sortedDates.forEach(date => {
      sortedGrouped[date] = grouped[date];
    });

    return sortedGrouped;
  };

  // 获取每日统计
  const getDailyStats = () => {
    const grouped = groupRecordsByDate();
    const stats = {};

    Object.keys(grouped).forEach(date => {
      const dayRecords = grouped[date];
      stats[date] = {
        totalCount: dayRecords.reduce((sum, r) => sum + r.count, 0),
        totalDuration: dayRecords.reduce((sum, r) => sum + r.durationseconds, 0),
        totalGroups: dayRecords.length,
        sports: dayRecords.reduce((acc, r) => {
          acc[r.sportname] = (acc[r.sportname] || 0) + r.count;
          return acc;
        }, {})
      };
    });

    return stats;
  };

  // 获取月份统计
  const getMonthlyStats = () => {
    const filtered = getFilteredRecords();
    const monthlyStats = {};

    filtered.forEach(record => {
      const date = formatDate(record.sportdate);
      const month = date.substring(0, 7);
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          totalCount: 0,
          totalDuration: 0,
          totalGroups: 0
        };
      }
      monthlyStats[month].totalCount += record.count;
      monthlyStats[month].totalDuration += record.durationseconds;
      monthlyStats[month].totalGroups += 1;
    });

    return monthlyStats;
  };

  // 删除记录
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/SportsAppWorkoutRecords/delete/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        showMessage('删除成功', 'success');
        setShowEditModal(false);
        setEditingRecord(null);
        setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
      } else {
        showMessage('删除失败', 'error');
      }
    } catch (error) {
      console.error('删除失败:', error);
      showMessage('删除失败', 'error');
    }
    setDeleteConfirmId(null);
  };

  // 点击记录行 - 直接打开编辑模态框
  const handleRecordClick = (record) => {
    setEditingRecord(record);
    setEditFormData({
      sportname: record.sportname,
      count: record.count,
      durationseconds: record.durationseconds,
      groupnumber: record.groupnumber,
      sportdate: formatDate(record.sportdate),
      remarks: record.remarks || ''
    });
    setShowEditModal(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/SportsAppWorkoutRecords/update/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          count: parseInt(editFormData.count),
          durationseconds: parseInt(editFormData.durationseconds),
          groupnumber: parseInt(editFormData.groupnumber)
        })
      });

      const result = await response.json();
      if (result.success) {
        showMessage('修改成功', 'success');
        setShowEditModal(false);
        setEditingRecord(null);
        await fetchRecords();
      } else {
        showMessage('修改失败', 'error');
      }
    } catch (error) {
      console.error('修改失败:', error);
      showMessage('修改失败', 'error');
    }
  };

  // 格式化时间
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 切换月份
  const changeMonth = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  // 切换年份
  const changeYear = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(selectedDate.getFullYear() + delta);
    setSelectedDate(newDate);
  };

  const groupedRecords = groupRecordsByDate();
  const dailyStats = getDailyStats();
  const monthlyStats = getMonthlyStats();
  const filteredRecords = getFilteredRecords();

  // 计算总统计
  const totalStats = {
    totalCount: filteredRecords.reduce((sum, r) => sum + r.count, 0),
    totalDuration: filteredRecords.reduce((sum, r) => sum + r.durationseconds, 0),
    totalGroups: filteredRecords.length
  };

  return (
    <div className={styles.container}>
      {/* 消息提示 */}
      {message.show && (
        <div className={`${styles.toast} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* 标题 */}
      {/* <div className={styles.header}>
        <h1>运动详情</h1>
        <p>{user?.username} 的运动记录</p>
      </div> */}

      {/* 视图切换和日期选择 */}
      <div className={styles.controls}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${viewType === 'month' ? styles.active : ''}`}
            onClick={() => setViewType('month')}
          >
            按月
          </button>
          <button
            className={`${styles.viewBtn} ${viewType === 'year' ? styles.active : ''}`}
            onClick={() => setViewType('year')}
          >
            按年
          </button>
        </div>

        <div className={styles.dateControls}>
          {viewType === 'month' ? (
            <>
              <button onClick={() => changeMonth(-1)} className={styles.dateBtn}>◀ 上月</button>
              <span className={styles.currentDate}>
                {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月
              </span>
              <button onClick={() => changeMonth(1)} className={styles.dateBtn}>下月 ▶</button>
            </>
          ) : (
            <>
              <button onClick={() => changeYear(-1)} className={styles.dateBtn}>◀ 去年</button>
              <span className={styles.currentDate}>
                {selectedDate.getFullYear()}年
              </span>
              <button onClick={() => changeYear(1)} className={styles.dateBtn}>明年 ▶</button>
            </>
          )}
        </div>
      </div>

      {/* 总统计卡片 */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalStats.totalCount}</div>
          <div className={styles.statLabel}>总完成次数</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatDuration(totalStats.totalDuration)}</div>
          <div className={styles.statLabel}>总运动时间</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalStats.totalGroups}</div>
          <div className={styles.statLabel}>总运动组数</div>
        </div>
      </div>

      {/* 图表区域 - 新增 */}
      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>

          <div className={styles.chartControls}>
            {/* 日期范围选择 */}
            <div className={styles.chartDateSelect}>
              <button
                className={`${styles.chartDateBtn} ${chartDays === 7 ? styles.active : ''}`}
                onClick={() => setChartDays(7)}
              >
                近7天
              </button>
              <button
                className={`${styles.chartDateBtn} ${chartDays === 14 ? styles.active : ''}`}
                onClick={() => setChartDays(14)}
              >
                近14天
              </button>
              <button
                className={`${styles.chartDateBtn} ${chartDays === 30 ? styles.active : ''}`}
                onClick={() => setChartDays(30)}
              >
                近30天
              </button>
            </div>
            {/* 数据类型选择 */}
            <div className={styles.chartTypeSelect}>
              <button
                className={`${styles.chartTypeBtn} ${chartDataType === 'count' ? styles.active : ''}`}
                onClick={() => setChartDataType('count')}
              >
                📊 次数
              </button>
              <button
                className={`${styles.chartTypeBtn} ${chartDataType === 'duration' ? styles.active : ''}`}
                onClick={() => setChartDataType('duration')}
              >
                ⏱️ 时长
              </button>
            </div>
          </div>
        </div>
        <div className={styles.chartContainer}>
          <canvas ref={chartRef} className={styles.chartCanvas}></canvas>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && <div className={styles.loading}>加载中...</div>}

      {/* 按日期显示数据 */}
      {!loading && Object.keys(groupedRecords).length === 0 ? (
        <div className={styles.emptyState}>暂无运动记录</div>
      ) : (
        <div className={styles.recordsContainer}>
          {Object.keys(groupedRecords).map(date => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateHeader}>
                <h3>{date}</h3>
                <div className={styles.dateStats}>
                  <span>🏋️ 总次数: {dailyStats[date].totalCount}</span>
                  <span>⏱️ 总时长: {formatDuration(dailyStats[date].totalDuration)}</span>
                  <span>📊 组数: {dailyStats[date].totalGroups}</span>
                </div>
              </div>

              <div className={styles.recordsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>运动类别</th>
                      <th>完成次数</th>
                      <th>运动时长</th>
                      {/* <th>组别</th> */}
                      {/* <th>备注</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRecords[date].map(record => (
                      <tr
                        key={record.id}
                        onClick={() => handleRecordClick(record)}
                        className={styles.clickableRow}
                      >
                        <td>{record.sportname}</td>
                        <td>{record.count}</td>
                        <td>{formatDuration(record.durationseconds)}</td>
                        {/* <td>第{record.groupnumber}组</td> */}
                        {/* <td>{record.remarks || '-'}</td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 按年显示月份统计 */}
      {viewType === 'year' && Object.keys(monthlyStats).length > 0 && (
        <div className={styles.monthlyStats}>
          <h3>月度统计</h3>
          <div className={styles.monthlyGrid}>
            {Object.keys(monthlyStats).map(month => (
              <div key={month} className={styles.monthlyCard}>
                <div className={styles.monthName}>{month}</div>
                <div className={styles.monthStats}>
                  <div>总次数: {monthlyStats[month].totalCount}</div>
                  <div>总时长: {formatDuration(monthlyStats[month].totalDuration)}</div>
                  <div>运动组数: {monthlyStats[month].totalGroups}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 编辑模态框（带删除按钮） */}
      {showEditModal && editingRecord && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>修改运动记录</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <div className={styles.formGroup}>
              <label>运动类别</label>
              <select
                value={editFormData.sportname}
                onChange={(e) => setEditFormData({ ...editFormData, sportname: e.target.value })}
              >
                {sportsOptions.length === 0 ? (
                  <option value="">加载中...</option>
                ) : (
                  sportsOptions.map(sport => (
                    <option key={sport.sport_type_Options} value={sport.sport_type_Options}>
                      {sport.sport_type_Options}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>完成次数</label>
              <input
                type="number"
                value={editFormData.count}
                onChange={(e) => setEditFormData({ ...editFormData, count: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>运动时长(秒)</label>
              <input
                type="number"
                value={editFormData.durationseconds}
                onChange={(e) => setEditFormData({ ...editFormData, durationseconds: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>组别</label>
              <input
                type="number"
                value={editFormData.groupnumber}
                onChange={(e) => setEditFormData({ ...editFormData, groupnumber: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>运动日期</label>
              <input
                type="date"
                value={editFormData.sportdate}
                onChange={(e) => setEditFormData({ ...editFormData, sportdate: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>备注</label>
              <textarea
                value={editFormData.remarks}
                onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                rows="3"
              />
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={() => setDeleteConfirmId(editingRecord.id)}
                className={styles.deleteBtn}
              >
                删除
              </button>
              <button onClick={() => setShowEditModal(false)} className={styles.cancelBtn}>
                取消
              </button>
              <button onClick={handleSaveEdit} className={styles.saveBtn}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {deleteConfirmId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirmId(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>确认删除</h3>
            <p>确定要删除这条运动记录吗？</p>
            <div className={styles.modalButtons}>
              <button onClick={() => setDeleteConfirmId(null)} className={styles.cancelBtn}>取消</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className={styles.deleteBtn}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsDetails;