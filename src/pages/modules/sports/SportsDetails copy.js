import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import io from 'socket.io-client';
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

    const socket = io('https://cqrdpg.com:5202');
    
    socket.on('workout-record-update', () => {
      console.log('运动记录有变化，重新获取数据');
      fetchRecords();
    });
    
    return () => {
      socket.off('workout-record-update');
      socket.disconnect();
    };
  }, [fetchRecords]);

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
            按月查看
          </button>
          <button 
            className={`${styles.viewBtn} ${viewType === 'year' ? styles.active : ''}`}
            onClick={() => setViewType('year')}
          >
            按年查看
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
                      <th>组别</th>
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
                        <td>第{record.groupnumber}组</td>
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
                onChange={(e) => setEditFormData({...editFormData, sportname: e.target.value})}
              >
                <option value="俯卧撑">俯卧撑</option>
                <option value="倒立">倒立</option>
                <option value="仰卧起坐">仰卧起坐</option>
                <option value="平板撑">平板撑</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>完成次数</label>
              <input 
                type="number"
                value={editFormData.count}
                onChange={(e) => setEditFormData({...editFormData, count: e.target.value})}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>运动时长(秒)</label>
              <input 
                type="number"
                value={editFormData.durationseconds}
                onChange={(e) => setEditFormData({...editFormData, durationseconds: e.target.value})}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>组别</label>
              <input 
                type="number"
                value={editFormData.groupnumber}
                onChange={(e) => setEditFormData({...editFormData, groupnumber: e.target.value})}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>运动日期</label>
              <input 
                type="date"
                value={editFormData.sportdate}
                onChange={(e) => setEditFormData({...editFormData, sportdate: e.target.value})}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>备注</label>
              <textarea 
                value={editFormData.remarks}
                onChange={(e) => setEditFormData({...editFormData, remarks: e.target.value})}
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