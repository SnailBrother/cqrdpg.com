// src/context/MusicContext.js 创建音乐上下文管理播放器状态

import React, { createContext, useContext, useReducer } from 'react';

const MusicContext = createContext();//创建一个 “全局容器”，用来装要共享的状态（比如播放状态、房间信息）

// 初始状态 - 添加 progress
const initialState = {
  currentSong: null, //当前播放的歌曲对象（包含 title, artist, src, coverimage, genre 等刚开始没播歌，所以是 null
  isPlaying: false,//是否正在播放（布尔值） 刚开始没播放，所以 false
  volume: 1,//音量（0 ~ 1）初始最大声，所以是 1
  queue: [],//播放队列（数组） 播放队列（要播的所有歌按顺序存这里）刚开始没歌，所以是空数组
  currentIndex: -1,//当前歌曲在队列里的 “位置编号” 没歌时编号是 -1（无效值
  progress: 0, // 添加播放进度 刚开始没进度，所以是 0
  duration: 0, // 当前歌曲的总时长 刚开始不知道时长，所以是 0
  //playMode: 'repeat', // 播放模式：'repeat'（列表循环）、'repeat-one'（单曲循环）、'shuffle'（随机）   初始是列表循环 repeat
  playMode: 'listLoop', // 播放模式：'random'（随机播放）、'order'（顺序播放）、'singleLoop'（单曲循环）、'listLoop'（列表循环）
  // 添加房间相关状态
  currentRoom: null,// 当前所在的 “一起听歌房间” 信息 刚开始没进房间，所以 null
  isInRoom: false,//现在是不是在 “一起听歌房间” 里 刚开始没进，所以 false
  roomUsers: [], //房间里的所有用户（比如 A、B、C） 刚开始没人，所以空数组
  isHost: false,//自己是不是房间的 “房主”（实现的是所有人都能管理房间） 刚开始不是，所以 false

};

// Reducer - 添加进度更新
function musicReducer(state, action) {
  switch (action.type) {
    case 'PLAY_SONG'://播放指定歌曲
      return {
        ...state,
        currentSong: action.payload.song,//把当前歌曲改成 action.payload.song（点的那首歌）
        queue: action.payload.queue,//把播放队列改成 action.payload.queue（当前的歌单）
        currentIndex: action.payload.index,//记录这首歌在队列里的位置 action.payload.index
        isPlaying: true,//把 isPlaying 设为 true（开始播放）
        progress: 0, // 把进度 progress 重置为 0（从头开始播）
      };
    case 'TOGGLE_PLAY'://切换 “播放 / 暂停”
      if (!state.currentSong) return state;//用户点了 “播放键” 或 “暂停键”。
      return {
        ...state,
        isPlaying: !state.isPlaying,//如果当前有歌曲（state.currentSong 不是 null），就把 isPlaying 反过来（true 变 false，false 变 true）
      };
    // case 'NEXT_SONG'://下一首
    //   if (state.queue.length === 0) return state;//用户点了 “下一首” 按钮 先判断队列里有没有歌（没歌就不干活）
    //   const nextIndex = (state.currentIndex + 1) % state.queue.length;
    //   return {
    //     ...state,
    //     currentIndex: nextIndex,//计算下一首歌的位置：比如当前在第 2 首（索引 1），队列共 3 首，下一首就是 (1+1)%3 = 2（第 3 首）
    //     currentSong: state.queue[nextIndex],//更新当前歌曲为下一首，保持播放状态（isPlaying: true），进度重置为 0
    //     isPlaying: true,
    //     progress: 0, // 重置进度
    //   };
    case 'NEXT_SONG': // 下一首
      if (state.queue.length === 0) return state;

      let newIndex;
      if (state.playMode === 'random') {
        // 随机播放模式：随机选择下一首
        newIndex = Math.floor(Math.random() * state.queue.length);
      } else {
        // 顺序播放和列表循环：按顺序播放下一首
        newIndex = (state.currentIndex + 1) % state.queue.length;
      }

      return {
        ...state,
        currentIndex: newIndex,
        currentSong: state.queue[newIndex],
        isPlaying: true,
        progress: 0,
      };

    // case 'PREV_SONG'://上一首
    //   if (state.queue.length === 0) return state;//和下一首类似，但计算位置时用 “加队列长度再取余”（避免出现负数）。比如当前在第 1 首（索引 0），上一首就是 (0-1+3)%3 = 2（最后一首）
    //   const prevIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
    //   return {
    //     ...state,
    //     currentIndex: prevIndex,
    //     currentSong: state.queue[prevIndex],
    //     isPlaying: true,
    //     progress: 0, // 重置进度
    //   };
    case 'PREV_SONG': // 上一首
  if (state.queue.length === 0) return state;
  
  let prevIndex;
  if (state.playMode === 'random') {
    // 随机播放模式：随机选择上一首
    prevIndex = Math.floor(Math.random() * state.queue.length);
  } else {
    // 顺序播放和列表循环：按顺序播放上一首
    prevIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
  }
  
  return {
    ...state,
    currentIndex: prevIndex,
    currentSong: state.queue[prevIndex],
    isPlaying: true,
    progress: 0,
  };
  case 'TOGGLE_PLAY_MODE': // 切换播放模式（循环切换）
  const modes = ['random', 'order', 'singleLoop', 'listLoop'];
  const currentModeIndex = modes.indexOf(state.playMode);
  const nextModeIndex = (currentModeIndex + 1) % modes.length;
  return {
    ...state,
    playMode: modes[nextModeIndex],
  };
    case 'SET_PROGRESS': // 更新播放进度 用户拖动进度条，或歌曲自动播放时（每秒更新一次进度）
      return {
        ...state,
        progress: action.payload,//把 progress 改成 action.payload（比如拖动到 30 秒，就传 30）
      };
    case 'SET_DURATION': // 新增：设置总时长 
      return {
        ...state,
        duration: action.payload,//把 duration 改成 action.payload（比如歌曲总长 200 秒，就传 200）
      };

    // 新增：设置房间信息   用户进入一个 “一起听歌房间” 时
    //更新房间信息（房间对象、是否在房间里、房间用户、是不是房主）
    case 'SET_ROOM_INFO':
      return {
        ...state,
        currentRoom: action.payload.room,
        isInRoom: action.payload.isInRoom,
        roomUsers: action.payload.roomUsers || [],
        isHost: action.payload.isHost || false,
      };

    // 新增：清除房间信息
    //用户退出 “一起听歌房间” 时
    //把所有房间相关的状态重置（比如 currentRoom: null、roomUsers: []）
    case 'CLEAR_ROOM_INFO':
      return {
        ...state,
        currentRoom: null,
        isInRoom: false,
        roomUsers: [],
        isHost: false,
      };
    //音量调整
    case 'SET_VOLUME':
      return {
        ...state,
        volume: action.payload, // 确保 payload 是 0~1 之间的数字
      };
    // 新增：更新房间用户列表 有新用户进房间，或老用户退房间时
    //把 roomUsers 改成最新的用户列表（action.payload.users）
    case 'UPDATE_ROOM_USERS':
      return {
        ...state,
        roomUsers: action.payload.users || [],
      };

    case 'SET_PLAY_MODE': // 设置播放模式
      return {
        ...state,
        playMode: action.payload,
      };

    case 'RANDOM_SONG': // 随机播放下一首
      if (state.queue.length === 0) return state;
      const randomIndex = Math.floor(Math.random() * state.queue.length);
      return {
        ...state,
        currentIndex: randomIndex,
        currentSong: state.queue[randomIndex],
        isPlaying: true,
        progress: 0,
      };

    default:
      return state;
  }
}

// Provider组件
export const MusicProvider = ({ children }) => {
  const [state, dispatch] = useReducer(musicReducer, initialState);//useReducer：管理复杂状态的 “状态管家”。比如播放、切歌、进房间这些操作，都靠它统一修改状态，避免代码混乱。

  return (
    <MusicContext.Provider value={{ state, dispatch }}>
      {children}
    </MusicContext.Provider>
  );
};

// Hook
export const useMusic = () => {
  const context = useContext(MusicContext);//从 “全局容器” 里取数据的工具，组件用它就能拿到共享状态，不用一层层传。
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export default MusicContext;