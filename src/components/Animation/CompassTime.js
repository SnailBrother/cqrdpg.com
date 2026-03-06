//时间罗盘
import React, { useState, useEffect, useRef } from 'react';
import './CompassTime.css';

const CompassTime = () => {
  const [time, setTime] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState(31);
  const [degPerDay, setDegPerDay] = useState(360 / 31);
  
  const secondBoxRef = useRef(null);
  const minuteBoxRef = useRef(null);
  const hourBoxRef = useRef(null);
  const dayBoxRef = useRef(null);
  const monthBoxRef = useRef(null);
  const yearBoxRef = useRef(null);
  
  const rotationRef = useRef({
    second360: 0,
    minute360: 0,
    hour360: 0,
    day360: 0,
    month360: 0,
    oldSecond: 0,
    oldMinute: 0,
    oldHour: 0,
    oldDay: 0,
    oldMonth: 0
  });

  // 初始化刻度
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // 计算当月天数
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
      days[1] = 29;
    }
    
    const currentDays = days[month];
    setDaysInMonth(currentDays);
    setDegPerDay(360 / currentDays);
    
    // 初始化秒刻度
    let secondHtml = '';
    for (let i = 0; i < 60; i++) {
      secondHtml += `<div id="compass-second${i + 1}" class="compass-scale" style="transform:rotate(${(i - 1) * -6}deg)">${i + 1} 秒</div>`;
    }
    if (secondBoxRef.current) {
      secondBoxRef.current.innerHTML = secondHtml;
    }
    
    // 初始化分钟刻度
    let minuteHtml = '';
    for (let i = 0; i < 60; i++) {
      minuteHtml += `<div id="compass-minute${i + 1}" class="compass-scale" style="transform:rotate(${i * -6}deg)">${i + 1} 分</div>`;
    }
    if (minuteBoxRef.current) {
      minuteBoxRef.current.innerHTML = minuteHtml;
    }
    
    // 初始化小时刻度
    let hourHtml = '';
    for (let i = 0; i < 24; i++) {
      hourHtml += `<div id="compass-hour${i + 1}" class="compass-scale" style="transform:rotate(${i * -15}deg)">${i + 1} 时</div>`;
    }
    if (hourBoxRef.current) {
      hourBoxRef.current.innerHTML = hourHtml;
    }
    
    // 初始化日期刻度
    let dayHtml = '';
    for (let i = 0; i < currentDays; i++) {
      dayHtml += `<div id="compass-day${i + 1}" class="compass-scale" style="transform:rotate(${i * -degPerDay}deg)">${i + 1} 日</div>`;
    }
    if (dayBoxRef.current) {
      dayBoxRef.current.innerHTML = dayHtml;
    }
    
    // 初始化月份刻度
    let monthHtml = '';
    for (let i = 0; i < 12; i++) {
      monthHtml += `<div id="compass-month${i + 1}" class="compass-scale" style="transform:rotate(${i * -30}deg)">${i + 1} 月</div>`;
    }
    if (monthBoxRef.current) {
      monthBoxRef.current.innerHTML = monthHtml;
    }
    
    // 初始更新时间
    updateTime();
  }, [degPerDay]);
  
  // 设置定时器更新时钟
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      updateTime();
    }, 1000);
    
    return () => clearInterval(timer);
  }, [daysInMonth, degPerDay]);
  
  // 更新时间函数
  const updateTime = () => {
    const now = new Date();
    const second = now.getSeconds();
    const minute = now.getMinutes();
    const hour = now.getHours();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    const rotation = rotationRef.current;
    
    // 检查是否需要增加完整旋转
    if (second === 0 && rotation.oldSecond !== second) {
      rotation.second360 += 1;
    }
    if (minute === 0 && rotation.oldMinute !== minute) {
      rotation.minute360 += 1;
    }
    if (hour === 0 && rotation.oldHour !== hour) {
      rotation.hour360 += 1;
    }
    if (day === 1 && rotation.oldDay !== day) {
      rotation.day360 += 1;
    }
    if (month === 0 && rotation.oldMonth !== month) {
      rotation.month360 += 1;
    }
    
    // 应用旋转
    if (secondBoxRef.current) {
      secondBoxRef.current.style.transform = `rotate(${rotation.second360 * 360 + (second - 1) * 6}deg)`;
    }
    if (minuteBoxRef.current) {
      minuteBoxRef.current.style.transform = `rotate(${rotation.minute360 * 360 + (minute - 1) * 6}deg)`;
    }
    if (hourBoxRef.current) {
      hourBoxRef.current.style.transform = `rotate(${rotation.hour360 * 360 + (hour - 1) * 15}deg)`;
    }
    if (dayBoxRef.current) {
      dayBoxRef.current.style.transform = `rotate(${rotation.day360 * 360 + (day - 1) * degPerDay}deg)`;
    }
    if (monthBoxRef.current) {
      monthBoxRef.current.style.transform = `rotate(${rotation.month360 * 360 + month * 30}deg)`;
    }
    if (yearBoxRef.current) {
      yearBoxRef.current.innerHTML = `${year} 年`;
    }
    
    // 更新高亮显示
    document.querySelectorAll('.compass-now-date').forEach(ele => {
      ele.classList.remove('compass-now-date');
    });
    
    const secondElement = document.getElementById(`compass-second${second + 1}`);
    const minuteElement = document.getElementById(`compass-minute${minute === 0 ? 60 : minute}`);
    const hourElement = document.getElementById(`compass-hour${hour === 0 ? 24 : hour}`);
    const dayElement = document.getElementById(`compass-day${day}`);
    const monthElement = document.getElementById(`compass-month${month + 1}`);
    
    if (secondElement) secondElement.classList.add('compass-now-date');
    if (minuteElement) minuteElement.classList.add('compass-now-date');
    if (hourElement) hourElement.classList.add('compass-now-date');
    if (dayElement) dayElement.classList.add('compass-now-date');
    if (monthElement) monthElement.classList.add('compass-now-date');
    
    // 保存旧值
    rotation.oldSecond = second;
    rotation.oldMinute = minute;
    rotation.oldHour = hour;
    rotation.oldDay = day;
    rotation.oldMonth = month;
  };
  
  return (
    <div className="compass-clock">
      <div className="compass-second-box" ref={secondBoxRef}></div>
      <div className="compass-minute-box" ref={minuteBoxRef}></div>
      <div className="compass-hour-box" ref={hourBoxRef}></div>
      <div className="compass-day-box" ref={dayBoxRef}></div>
      <div className="compass-month-box" ref={monthBoxRef}></div>
      <div className="compass-year-box" ref={yearBoxRef}></div>
    </div>
  );
};

export default CompassTime;