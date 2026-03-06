//src/utils/helpers.js
import { ERROR_MESSAGES, VALIDATION_PATTERNS } from './constants';


// 辅助函数：确保颜色为8位带透明度的格式
export const ensure8DigitHex = (color) => {
  if (!color) return '#FFFFFFFF';

  if (color.startsWith('#') && color.length === 7) {
    return `${color}FF`;
  }

  if (color.startsWith('#') && color.length === 4) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}FF`;
  }

  if (color.startsWith('#') && color.length === 9) {
    return color;
  }

  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      const alpha = match[4] ? Math.round(parseFloat(match[4]) * 255).toString(16).padStart(2, '0') : 'FF';
      return `#${r}${g}${b}${alpha}`;
    }
  }

  return '#FFFFFFFF';
};

// 辅助函数：从Ant Design颜色对象获取8位十六进制
export const get8DigitHexFromColor = (color) => {
  if (!color) return '#FFFFFFFF';
  if (color && typeof color.toHexString === 'function') return ensure8DigitHex(color.toHexString());
  if (typeof color === 'string') return ensure8DigitHex(color);
  return '#FFFFFFFF';
};

// Format date
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Validate email
export const validateEmail = (email) => {
  if (!email) return ERROR_MESSAGES.REQUIRED;
  if (!VALIDATION_PATTERNS.EMAIL.test(email)) return ERROR_MESSAGES.EMAIL;
  return '';
};

// Validate password
export const validatePassword = (password) => {
  if (!password) return ERROR_MESSAGES.REQUIRED;
  if (password.length < 6) return '密码至少6位';
  return '';
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    Object.keys(obj).forEach(key => {
      clonedObj[key] = deepClone(obj[key]);
    });
    return clonedObj;
  }
};



//辅助函数 北京时间 👇
/**
 * 将日期转换为北京时间
 * @param {Date|string} date - 日期对象或日期字符串
 * @param {string} format - 格式类型：'datetime' | 'date' | 'time' | 'full'
 * @returns {string} 北京时间字符串
 */
export const toBeijingTime = (date, format = 'datetime') => {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = new Date(date);
  }

  // 转换为北京时间 (UTC+8)
  const beijingTime = new Date(dateObj.getTime() + (8 * 60 * 60 * 1000));
  
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
  const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    case 'full':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'datetime':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
};

/**
 * 获取当前北京时间
 * @param {string} format - 格式类型
 * @returns {string} 当前北京时间字符串
 */
export const getCurrentBeijingTime = (format = 'datetime') => {
  return toBeijingTime(new Date(), format);
};

/**
 * 格式化相对时间（如：刚刚、5分钟前等）
 * @param {Date|string} date - 日期
 * @returns {string} 相对时间字符串
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const beijingTime = new Date(new Date(date).getTime() + (8 * 60 * 60 * 1000));
  const now = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));
  const diffInSeconds = Math.floor((now - beijingTime) / 1000);
  
  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`;
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  } else {
    return toBeijingTime(date, 'date');
  }
};

//辅助函数 北京时间 👆