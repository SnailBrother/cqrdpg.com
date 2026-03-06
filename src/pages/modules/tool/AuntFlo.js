import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import './AuntFlo.css';
import { useAuth } from '../../../context/AuthContext';

const AuntFlo = () => {
  const { user } = useAuth();
    const username = user?.username; // 从 user 对象中获取 username

  const [periodRecords, setPeriodRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    isPeriod: false,
    remarks: '',
    dysmenorrheaLevel: 0,
    symptoms: ''
  });

  // 格式化日期为YYYY-MM-DD
  const formatDate = useCallback((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 获取月经记录
  const fetchPeriodRecords = useCallback(async () => {
    if (!username) {
      setError('请先登录');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `http://121.4.22.55:5202/api/auntflo/records?username=${encodeURIComponent(username)}&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`
      );
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      setPeriodRecords(data);
    } catch (err) {
      console.error('获取月经记录失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username, currentDate, formatDate]);

  // 打开表单并填充已有数据
  const handleDateClick = useCallback((date) => {
    if (!date || loading) return;
    
    const dateString = formatDate(date);
    const existingRecord = periodRecords.find(record => 
      formatDate(new Date(record.RecordDate)) === dateString
    );
    
    setSelectedDate(date);
    setFormData({
      isPeriod: existingRecord ? existingRecord.IsPeriod : false,
      remarks: existingRecord ? existingRecord.Remarks || '' : '',
      dysmenorrheaLevel: existingRecord ? existingRecord.DysmenorrheaLevel || 0 : 0,
      symptoms: existingRecord ? existingRecord.Symptoms || '' : ''
    });
  }, [periodRecords, formatDate, loading]);

  // 保存记录
  const saveRecord = useCallback(async () => {
    if (!selectedDate || !username) return;
    
    setLoading(true);
    try {
      const dateString = formatDate(selectedDate);
      const response = await fetch('http://121.4.22.55:5202/api/auntflo/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          recordDate: dateString,
          isPeriod: formData.isPeriod,
          remarks: formData.remarks,
          dysmenorrheaLevel: formData.dysmenorrheaLevel,
          symptoms: formData.symptoms
        }),
      });
      
      if (!response.ok) {
        throw new Error(`保存失败: ${response.status}`);
      }
      
      await fetchPeriodRecords(); // 刷新数据
      setSelectedDate(null); // 关闭表单
    } catch (err) {
      console.error('保存月经记录失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username, selectedDate, formData, formatDate, fetchPeriodRecords]);

  // 删除记录
  const deleteRecord = useCallback(async () => {
    if (!selectedDate || !username) return;
    
    if (!window.confirm('确定要删除这条记录吗？')) return;
    
    setLoading(true);
    try {
      const dateString = formatDate(selectedDate);
      const response = await fetch('http://121.4.22.55:5202/api/auntflo/records', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          recordDate: dateString
        }),
      });
      
      if (!response.ok) {
        throw new Error(`删除失败: ${response.status}`);
      }
      
      await fetchPeriodRecords(); // 刷新数据
      setSelectedDate(null); // 关闭表单
    } catch (err) {
      console.error('删除月经记录失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username, selectedDate, formatDate, fetchPeriodRecords]);

  // 关闭表单
  const closeForm = useCallback(() => {
    setSelectedDate(null);
  }, []);

  useEffect(() => {
    fetchPeriodRecords();
  }, [fetchPeriodRecords]);

  // 生成日历
  const generateCalendar = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    let day = 1;
    
    for (let i = 0; i < 6; i++) {
      const week = [];
      
      if (i === 0) {
        for (let j = 0; j < firstDayOfWeek; j++) {
          week.push(null);
        }
      }
      
      for (let j = week.length; j < 7; j++) {
        if (day > daysInMonth) {
          week.push(null);
        } else {
          const date = new Date(year, month, day);
          week.push(date);
          day++;
        }
      }
      
      calendar.push(week);
      
      if (day > daysInMonth) break;
    }
    
    return calendar;
  }, [currentDate]);

  const calendar = useMemo(() => generateCalendar(), [generateCalendar]);

  // 判断是否是经期
  const isPeriodDay = useCallback((date) => {
    if (!date) return false;
    const dateString = formatDate(date);
    const record = periodRecords.find(r => formatDate(new Date(r.RecordDate)) === dateString);

    return record ? record.IsPeriod : false;
  }, [periodRecords, formatDate]);

  // 判断是否是今天
  const isToday = useCallback((date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  // 切换月份
  const changeMonth = useCallback((increment) => {
    setCurrentDate(prev => new Date(
      prev.getFullYear(),
      prev.getMonth() + increment,
      1
    ));
    setSelectedDate(null); // 切换月份时关闭表单
  }, []);

  // 日历日期组件
  const CalendarDay = React.memo(({ date }) => {
    if (!date) return <div className="auntflo-day empty"></div>;
    
    const dateString = formatDate(date);
    const record = periodRecords.find(r => formatDate(new Date(r.RecordDate)) === dateString);
    
    const dayClass = [
      'auntflo-day',
      isPeriodDay(date) ? 'period' : '',
      isToday(date) ? 'today' : '',
      date.getMonth() !== currentDate.getMonth() ? 'other-month' : '',
      loading ? 'loading' : ''
    ].filter(Boolean).join(' ');
    
    return (
      <div
        className={dayClass}
        onClick={() => handleDateClick(date)}
      >
        {date.getDate()}
        {isPeriodDay(date) && (
          <div className="auntflo-period-indicator"></div>
        )}
        {record && (record.Remarks || record.DysmenorrheaLevel > 0 || record.Symptoms) && (
          <div className="auntflo-has-details">•</div>
        )}
      </div>
    );
  });

  // 渲染日历
  const renderCalendar = () => {
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    return (
      <div className="auntflo-calendar">
        <div className="auntflo-header">
          <button 
            className="auntflo-nav-button" 
            onClick={() => changeMonth(-1)}
            disabled={loading}
          >
            &lt;
          </button>
          <h2 className="auntflo-month-title">
            {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
          </h2>
          <button 
            className="auntflo-nav-button" 
            onClick={() => changeMonth(1)}
            disabled={loading}
          >
            &gt;
          </button>
        </div>
        
        <div className="auntflo-weekdays">
          {dayNames.map(day => (
            <div key={day} className="auntflo-weekday">{day}</div>
          ))}
        </div>
        
        <div className="auntflo-days">
          {calendar.map((week, weekIndex) => (
            <div key={weekIndex} className="auntflo-week">
              {week.map((date, dayIndex) => (
                <CalendarDay key={dayIndex} date={date} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="auntflo-container">
      <h1 className="auntflo-title">周期记录</h1>
      
      {error && (
        <div className="auntflo-error">
          {error}
          <button onClick={fetchPeriodRecords}>重试</button>
        </div>
      )}
      
      {loading && <div className="auntflo-loading">加载中...</div>}
      <div className="auntflo-content-wrapper">
      {renderCalendar()}
      
      {/* 记录表单 - 内联显示 */}
      {selectedDate && (
        <div className="auntflo-form-inline">
          <div className="auntflo-form-header">
            <h3>{formatDate(selectedDate)}
              {/* 记录的 */}
              </h3>
            <button onClick={closeForm} className="auntflo-close-form">×</button>
          </div>
          
          <div className="auntflo-form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isPeriod}
                onChange={(e) => setFormData({...formData, isPeriod: e.target.checked})}
              />
              经期
            </label>
          </div>
          
          {formData.isPeriod && (
            <>
              <div className="auntflo-form-group">
                <label>备注</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  placeholder="可选备注"
                />
              </div>
              
              <div className="auntflo-form-group">
                <label>痛经程度 (0-10)</label>
                <div className="auntflo-range-container">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.dysmenorrheaLevel}
                    onChange={(e) => setFormData({...formData, dysmenorrheaLevel: parseInt(e.target.value)})}
                  />
                  <span className="auntflo-range-value">{formData.dysmenorrheaLevel}</span>
                </div>
              </div>
              
              <div className="auntflo-form-group">
                <label>症状</label>
                <input
                  type="text"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  placeholder="例如：腹痛、头痛等"
                />
              </div>
            </>
          )}
          
          <div className="auntflo-form-actions">
            {periodRecords.some(r => 
              formatDate(new Date(r.RecordDate)) === formatDate(selectedDate)
            ) && (
              <button onClick={deleteRecord} disabled={loading} className="auntflo-delete-btn">
                {loading ? '删除中...' : '删除记录'}
              </button>
            )}
            <button onClick={saveRecord} disabled={loading} className="auntflo-save-btn">
              {loading ? '保存中...' : '保存记录'}
            </button>
          </div>
        </div>
      )}
      </div>

      <div className="auntflo-legend">
        <div className="auntflo-legend-item">
          <span className="auntflo-legend-color period"></span>
          <span>经期</span>
        </div>
        <div className="auntflo-legend-item">
          <span className="auntflo-legend-dot"></span>
          <span>有详细记录</span>
        </div>
      </div>
    </div>
  );
};

export default AuntFlo;