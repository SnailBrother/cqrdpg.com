// //src/utils/jsconstants
export const APP_CONFIG = {
  NAME: 'React DEMO',
  VERSION: '1.0.0',
  DESCRIPTION: 'A modern React application demo',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  USERS: {
    LIST: '/users',
    DETAIL: '/users/:id',
    UPDATE: '/users/:id',
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,}$/,
};

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED: '此字段为必填项',
  EMAIL: '请输入有效的邮箱地址',
  PASSWORD: '密码必须包含大小写字母和数字，至少8位',
  CONFIRM_PASSWORD: '两次输入的密码不一致',
  NETWORK: '网络错误，请检查网络连接',
  UNAUTHORIZED: '未授权访问，请重新登录',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: '登录成功',
  REGISTER: '注册成功',
  UPDATE: '更新成功',
  DELETE: '删除成功',
};