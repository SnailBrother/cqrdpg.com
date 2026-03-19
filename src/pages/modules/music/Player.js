import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../../../context/MusicContext';
import { useAuth } from '../../../context/AuthContext'; // 导入 AuthContext
import axios from 'axios';
import styles from './Player.module.css';
import { useNavigate } from 'react-router-dom'; // 添加导入
import io from 'socket.io-client';

// 创建 Socket.IO 实例
const socket = io('http://121.4.22.55:5202');

// 辅助函数：格式化时间
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 辅助函数：生成文件名（移除特殊字符）
const generateFileName = (title, artist, extension) => {
  // 移除文件名中的非法字符
  const cleanTitle = title.replace(/[<>:"/\\|?*]/g, '');
  const cleanArtist = artist.replace(/[<>:"/\\|?*]/g, '');
  return `${cleanTitle}-${cleanArtist}.${extension}`;
};

// 播放模式配置
const PLAY_MODES = {
  'random': {
    name: '随机播放',
    icon: '#icon-zujian-bofangmoshi-suijibofang',
    description: '随机播放队列中的歌曲'
  },
  'order': {
    name: '顺序播放',
    icon: '#icon-liebiaobofang',
    description: '按顺序播放队列中的歌曲'
  },
  'singleLoop': {
    name: '单曲循环',
    icon: '#icon-zujian-bofangmoshi-danquxunhuan',
    description: '循环播放当前歌曲'
  },
  'listLoop': {
    name: '列表循环',
    icon: '#icon-liebiaoxunhuan6',
    description: '循环播放整个队列'
  }
};

const Player = ({ className = '' }) => {
  const navigate = useNavigate(); // 添加导航hook
  const { state, dispatch } = useMusic();
  const { user, isAuthenticated } = useAuth(); // 获取用户信息
  const { currentSong, isPlaying, queue, volume = 1, playMode = 'listLoop', currentRoom, isInRoom, roomUsers, isHost } = state;
  const audioRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- 播放模式控制 ---
  const [showPlayModeControl, setShowPlayModeControl] = useState(false);
  const playModeControlRef = useRef(null);

  // --- 第四列：附加控件 ---
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeSliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const volumeTrackRef = useRef(null); // 用于获取轨道 DOM

  // 点击外部关闭播放模式控制
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playModeControlRef.current && !playModeControlRef.current.contains(event.target)) {
        setShowPlayModeControl(false);
      }
    };

    if (showPlayModeControl) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPlayModeControl]);

  // 点击外部关闭音量控制
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(event.target)) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePlayModeControl = () => {
    setShowPlayModeControl(!showPlayModeControl);
    setShowVolumeSlider(false); // 关闭音量控制
  };

  const toggleVolumeSlider = () => {
    setShowVolumeSlider(!showVolumeSlider);
    setShowPlayModeControl(false); // 关闭播放模式控制
  };

  // 处理播放模式切换
  const handlePlayModeChange = (mode) => {
    dispatch({ type: 'SET_PLAY_MODE', payload: mode });
    setShowPlayModeControl(false);
    console.log('切换播放模式:', mode, PLAY_MODES[mode].name);
  };

  // 根据鼠标位置计算并设置音量
  const updateVolumeFromMouseEvent = (clientY) => {
    if (!volumeTrackRef.current) return;

    const trackRect = volumeTrackRef.current.getBoundingClientRect();
    let relativeY = (trackRect.bottom - clientY) / trackRect.height;
    relativeY = Math.max(0, Math.min(1, relativeY)); // 限制在 [0, 1]

    dispatch({ type: 'SET_VOLUME', payload: relativeY });
  };

  // 开始拖动
  const handleThumbMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.userSelect = 'none'; // 禁止文字选中
    updateVolumeFromMouseEvent(e.clientY);
  };

  // 拖动中
  const handleMouseMove = (e) => {
    if (isDragging) {
      updateVolumeFromMouseEvent(e.clientY);
    }
  };

  // 停止拖动
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
    }
  };

  // 绑定全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // --- 记录播放历史 ---
  const recordPlayHistory = async (song) => {
    if (!isAuthenticated || !user?.email || !song) {
      return;
    }

    try {
      // 生成正确的文件名
      const coverimageFileName = generateFileName(song.title, song.artist, 'jpg');
      const srcFileName = generateFileName(song.title, song.artist, 'mp3');

      await axios.post('/api/reactdemoRecentlyPlayedmusic', {
        email: user.email,
        title: song.title,
        artist: song.artist,
        coverimage: coverimageFileName, // 使用生成的文件名
        src: srcFileName, // 使用生成的文件名
        genre: song.genre || ''   // 如果有歌曲类型就传，没有就传空字符串
      });
      console.log('播放记录保存成功', {
        coverimage: coverimageFileName,
        src: srcFileName
      });
    } catch (err) {
      console.error('保存播放记录失败:', err);
      // 这里可以选择不提示用户，避免影响播放体验
    }
  };


  // --- 增加播放量 ---
  const increasePlayCount = async (song) => {
    if (!song) {
      return;
    }

    try {
      await axios.post('/api/reactdemoIncreasePlayCount', {
        title: song.title,
        artist: song.artist
      });
      console.log('播放量统计请求已发送:', { title: song.title, artist: song.artist });
    } catch (err) {
      console.error('增加播放量失败:', err);
      // 这里可以选择不提示用户，避免影响播放体验
    }
  };

  // --- 检查歌曲是否已被收藏 ---
  useEffect(() => {
    if (currentSong && isAuthenticated && user?.username) {
      checkIfLiked();
    } else {
      setIsLiked(false);
    }
  }, [currentSong, isAuthenticated, user?.username]);

  const checkIfLiked = async () => {
    try {
      const response = await axios.get('http://121.4.22.55:5202/backend/api/reactdemofavorites', {
        params: {
          username: user.username,
          search: currentSong.title // 通过歌曲名搜索
        }
      });

      // 检查当前歌曲是否在收藏列表中
      const isSongLiked = response.data.data.some(favorite =>
        favorite.title === currentSong.title && favorite.artist === currentSong.artist
      );
      setIsLiked(isSongLiked);
    } catch (err) {
      console.error('检查收藏状态失败:', err);
    }
  };

  // --- 核心播放逻辑 ---
  useEffect(() => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.play().catch(console.error) : audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.src;
      setProgress(0);
      setDuration(0);

      // 当歌曲切换时，记录播放历史和增加播放量
      if (isAuthenticated && user?.email) {
        recordPlayHistory(currentSong);
      }

      // 每次切换歌曲时增加播放量
      increasePlayCount(currentSong);

      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // --- 事件处理函数 ---
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentProgress = audioRef.current.currentTime;
      setProgress(currentProgress);
      // 更新到 Context，让歌词页面也能获取
      dispatch({ type: 'SET_PROGRESS', payload: currentProgress });
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const totalDuration = audioRef.current.duration;
      setDuration(totalDuration);
      // 更新到 Context
      dispatch({ type: 'SET_DURATION', payload: totalDuration });
    }
  };

  const handleSongEnd = () => {
    // 歌曲播放结束时也增加播放量（确保完整播放）
    if (currentSong && progress > duration * 0.5) { // 播放超过50%才计数
      increasePlayCount(currentSong);
    }

    // 根据播放模式处理下一首歌曲
    if (playMode === 'singleLoop') {
      // 单曲循环：重新播放当前歌曲
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else if (playMode === 'random') {
      // 随机播放：从队列中随机选择一首
      dispatch({ type: 'RANDOM_SONG' });
    } else {
      // 顺序播放和列表循环：播放下一首
      dispatch({ type: 'NEXT_SONG' });
    }
  };

  // --- 控制函数 ---
  const togglePlay = () => dispatch({ type: 'TOGGLE_PLAY' });
  const playNext = () => dispatch({ type: 'NEXT_SONG' });
  const playPrev = () => dispatch({ type: 'PREV_SONG' });
  const togglePlayMode = () => {
    // 旧的切换逻辑，现在改为打开控制面板
    togglePlayModeControl();
  };

  const handleProgressChange = (e) => {
    if (audioRef.current) audioRef.current.currentTime = e.target.value;
  };


  // --- 修改喜欢功能 ---
  const handleLike = async () => {
    if (!isAuthenticated || !user?.username) {
      alert('请先登录');
      return;
    }

    if (!currentSong) return;

    setLoading(true);
    try {
      if (isLiked) {
        // 取消收藏
        await axios.delete('http://121.4.22.55:5202/backend/api/favorites', {
          data: {
            user_name: user.username,  // 对应数据库的 user_name
            song_name: currentSong.title  // 对应数据库的 song_name
          }
        });
        setIsLiked(false);
        console.log('取消收藏成功');
      } else {
        // 添加收藏
        await axios.post('http://121.4.22.55:5202/backend/api/favorites', {
          user_name: user.username,    // 对应数据库的 user_name
          song_name: currentSong.title, // 对应数据库的 song_name
          artist: currentSong.artist,  // 对应数据库的 artist
          play_count: 1                // 初始播放次数
        });
        setIsLiked(true);
        console.log('添加收藏成功');
      }
    } catch (err) {
      console.error('操作收藏失败:', err);
      alert('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  //歌曲评论
  const showComments = () => {
    if (!currentSong) {
      alert('请先选择一首歌曲');
      return;
    }
    navigate('/app/music/musicsongreview');
  };

  // 修改 showLyrics 函数
  const showLyrics = () => {
    if (!currentSong) {
      alert('请先选择一首歌曲');
      return;
    }
    navigate('/app/music/musicplayerlyrics');
  };

  const showPlaylist = () => {
    if (!currentSong) {
      alert('请先选择一首歌曲');
      return;
    }
    navigate('/app/music/musicplaylist');
  };

  if (!currentSong) return null; // 如果没有当前歌曲，不渲染播放器

  const getPlayModeIcon = () => {
    return PLAY_MODES[playMode]?.icon || '#icon-xunhuan5';
  };

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSongEnd}
        loop={playMode === 'singleLoop'} // 单曲循环时启用audio元素的loop
      />

      <div className={`${styles.player} ${className}`}>
        {/* --- 第一列：歌曲封面 --- */}
        <div className={styles.column1}>
          <img
            src={currentSong.coverimage || 'http://121.4.22.55:80/backend/musics/default.jpg'}
            alt={currentSong.title}
            className={styles.playerArtwork}
            onError={(e) => { e.target.onerror = null; e.target.src = 'http://121.4.22.55:80/backend/musics/default.jpg' }}
          />
        </div>

        {/* --- 第二列：歌曲信息与操作 --- */}
        <div className={styles.column2}>
          <div className={styles.songDetails}>
            <span className={styles.songTitle}>{currentSong.title}</span>
            <span className={styles.songArtist}>{currentSong.artist}</span>

            {/* 一起听歌的房间 */}
            {/* {isInRoom && currentRoom && (
              <span className={styles.roomNameLabel}>
               {currentRoom?.room_name}  {isInRoom ? '在房间' : '不在房间'}
              </span>
            )} */}

          </div>
          <div className={styles.songActions}>
            <button
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
              onClick={handleLike}
              title={isLiked ? "取消喜欢" : "喜欢"}
              disabled={loading}
            >
              {loading ? '⏳' : (isLiked ? '❤️' : '♡')}
            </button>
            <button className={styles.actionButton} onClick={showComments} title="评论">
              💬
            </button>
          </div>
        </div>

        {/* --- 第三列：主要控件和进度条 --- */}
        <div className={styles.column3}>
          <div className={styles.topControls}>
            {/* 播放模式控制 */}
            <div className={styles.playModeControlWrapper} ref={playModeControlRef}>
              <button
                className={`${styles.controlButton} ${styles.playModeButton} ${showPlayModeControl ? styles.active : ''}`}
                onClick={togglePlayModeControl}
                title={`播放模式: ${PLAY_MODES[playMode]?.name || playMode}`}
              >
                <svg className={styles.playModeIcon} aria-hidden="true">
                  <use xlinkHref={getPlayModeIcon()}></use>
                </svg>
              </button>

              {showPlayModeControl && (
                <div className={styles.playModeDropdown}>
                  {Object.entries(PLAY_MODES).map(([mode, config]) => (
                    <button
                      key={mode}
                      className={`${styles.playModeOption} ${playMode === mode ? styles.active : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayModeChange(mode);
                      }}
                      title={config.description}
                    >
                      <svg className={styles.playModeOptionIcon} aria-hidden="true">
                        <use xlinkHref={config.icon}></use>
                      </svg>
                      <span className={styles.playModeOptionText}>{config.name}</span>
                      {playMode === mode && (
                        <svg className={styles.playModeCheckIcon} aria-hidden="true">
                          <use xlinkHref="#icon-check"></use>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className={styles.controlButton} onClick={playPrev} title="上一首" disabled={queue.length === 0}>⏮</button>

            <button className={`${styles.controlButton} ${styles.playButton}`} onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button className={styles.controlButton} onClick={playNext} title="下一首" disabled={queue.length === 0}>⏭</button>
            <div className={styles.volumeControlWrapper} ref={volumeSliderRef}>
              <button
                className={styles.controlButton}
                onClick={toggleVolumeSlider}
                title="音量"
              >
                {volume === 0 ? '🔇' : volume < 0.5 ? '🔈' : '🔊'}
              </button>

              {showVolumeSlider && (
                <div className={styles.verticalVolumeSlider}>
                  <div
                    className={styles.volumeTrack}
                    ref={volumeTrackRef} // 关键：绑定 ref
                  >
                    <div
                      className={styles.volumeProgress}
                      style={{ height: `${volume * 100}%` }}
                    >
                      <div
                        className={styles.volumeThumb}
                        onMouseDown={handleThumbMouseDown}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={styles.bottomControls}>
            <span className={styles.timeDisplay}>{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration || 1}
              value={progress}
              onChange={handleProgressChange}
              className={styles.progressBar}
              style={{
                '--progress-percent': `${(progress / (duration || 1)) * 100}%`,
                '--progress-color': 'rgb(46, 46, 46)',  // 已播放颜色
                '--track-color': '#e5e7eb'              // 未播放颜色
              }}
            />
            <span className={styles.timeDisplay}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* --- 第四列：附加控件 --- */}
        <div className={styles.column4}>
          <button className={styles.controlButton} onClick={showLyrics} title="歌词">詞</button>

          <button className={styles.controlButton} onClick={showPlaylist} title="播放列表">☰</button>
        </div>
      </div>
    </>
  );
};

export default Player;