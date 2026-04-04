// Sports.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import styles from './Sports.module.css';

const Sports = () => {
  const { user, isAuthenticated } = useAuth();

  const [sportsTypes, setSportsTypes] = useState([]); // 改为从API获取
  const intervalOptions = [1, 2, 3, 4, 5, 6];

  const [selectedSport, setSelectedSport] = useState('');
  const [selectedSportName, setSelectedSportName] = useState('');
  const [selectedSportIcon, setSelectedSportIcon] = useState('');
  const [intervalTime, setIntervalTime] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [counter, setCounter] = useState(0);
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(null);
  
  const [records, setRecords] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(1);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempSelectedSport, setTempSelectedSport] = useState('');
  const [tempIntervalTime, setTempIntervalTime] = useState(3);
  const [saveSuccess, setSaveSuccess] = useState(null);
  
  const lastSportRef = useRef(selectedSport);
  const timerRef = useRef(null);
  const intervalLoopRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioBuffersRef = useRef({});
  const isRunningRef = useRef(false);
  const intervalTimeRef = useRef(intervalTime);
  const timerRefValue = useRef(timer);
  const isAudioContextClosed = useRef(false);
  
  // 获取运动选项
  useEffect(() => {
    const fetchSportsOptions = async () => {
      try {
        const response = await fetch('/api/getSportsOptions');
        const data = await response.json();
        setSportsTypes(data);
        if (data.length > 0) {
          setSelectedSport(data[0].sport_type_Options);
          setSelectedSportName(data[0].sport_type_Options);
          setSelectedSportIcon(data[0].icon_Options);
          setTempSelectedSport(data[0].sport_type_Options);
        }
      } catch (error) {
        console.error('获取运动选项失败:', error);
      }
    };
    
    fetchSportsOptions();
  }, []);
  
  // 获取当前用户当天该运动的组别
  const fetchCurrentGroupNumber = useCallback(async (sportname) => {
    if (!user?.username) return 1;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/SportsAppWorkoutRecords/getMaxGroupNumber?username=${user.username}&sportname=${encodeURIComponent(sportname)}&sportdate=${today}`
      );
      const result = await response.json();
      
      if (result.success) {
        return result.maxGroupNumber + 1; // 最大组别+1
      }
      return 1;
    } catch (error) {
      console.error('获取组别失败:', error);
      return 1;
    }
  }, [user]);
  
  useEffect(() => {
    intervalTimeRef.current = intervalTime;
  }, [intervalTime]);
  
  useEffect(() => {
    timerRefValue.current = timer;
  }, [timer]);

  // 1. 预加载音频
  useEffect(() => {
    let isMounted = true;
    
    const loadAudio = async () => {
      try {
        if (audioContextRef.current && !isAudioContextClosed.current) {
          try {
            await audioContextRef.current.close();
          } catch (e) {
            console.log('关闭已有 AudioContext:', e);
          }
        }
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        isAudioContextClosed.current = false;
        
        const audioFiles = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'shi', 'bai', 'qian', 'wan'];
        
        for (const file of audioFiles) {
          if (!isMounted) return;
          try {
            const response = await fetch(`/audio/${file}.mp3`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBuffersRef.current[file] = audioBuffer;
          } catch (error) {
            console.error(`加载音频 ${file}.mp3 失败:`, error);
          }
        }
      } catch (error) {
        console.error('初始化音频失败:', error);
      }
    };
    
    loadAudio();
    
    return () => {
      isMounted = false;
      if (audioContextRef.current && !isAudioContextClosed.current) {
        try {
          audioContextRef.current.close();
          isAudioContextClosed.current = true;
        } catch (error) {
          console.log('关闭 AudioContext 时的错误:', error);
        }
      }
    };
  }, []);

  // 2. 数字解析逻辑（保持不变）
  const parseNumberToAudioParts = useCallback((number) => {
    if (number === 0) return ['0'];
    
    const parts = [];
    
    if (number >= 10000) {
      const wan = Math.floor(number / 10000);
      const remainder = number % 10000;
      parts.push(wan.toString(), 'wan');
      if (remainder > 0) {
        if (remainder < 1000) parts.push('零');
        parts.push(...parseNumberToAudioParts(remainder));
      }
      return parts;
    }

    if (number >= 1000) {
      const qian = Math.floor(number / 1000);
      const remainder = number % 1000;
      parts.push(qian.toString(), 'qian');
      if (remainder > 0) {
        if (remainder < 100) parts.push('零');
        parts.push(...parseNumberToAudioParts(remainder));
      }
      return parts;
    }

    if (number >= 100) {
      const bai = Math.floor(number / 100);
      const remainder = number % 100;
      parts.push(bai.toString(), 'bai');
      if (remainder > 0) {
        if (remainder < 10) parts.push('零');
        parts.push(...parseNumberToAudioParts(remainder));
      }
      return parts;
    }

    if (number >= 10) {
      const shi = Math.floor(number / 10);
      const ge = number % 10;
      if (shi === 1) {
        parts.push('shi');
        if (ge > 0) parts.push(ge.toString());
      } else {
        parts.push(shi.toString());
        parts.push('shi');
        if (ge > 0) parts.push(ge.toString());
      }
      return parts;
    }

    return [number.toString()];
  }, []);

  // 播放数字音频（保持不变）
  const playNumberSync = useCallback(async (number) => {
    if (!audioContextRef.current || !audioBuffersRef.current || isAudioContextClosed.current) return;
    
    const audioParts = parseNumberToAudioParts(number);
    console.log(`播放数字 ${number} 拆分为:`, audioParts);

    return new Promise((resolve) => {
      let index = 0;
      const playSequence = async () => {
        if (index >= audioParts.length || !isRunningRef.current) {
          resolve();
          return;
        }
        const part = audioParts[index];
        const buffer = audioBuffersRef.current[part];
        if (buffer && audioContextRef.current && !isAudioContextClosed.current) {
          try {
            if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => {
              index++;
              playSequence();
            };
            source.start();
          } catch (error) {
            console.warn(`播放音频 ${part} 失败:`, error);
            index++;
            playSequence();
          }
        } else {
          console.warn(`⚠️ 缺少音频缓冲区: ${part}`);
          index++;
          playSequence();
        }
      };
      playSequence();
    });
  }, [parseNumberToAudioParts]);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 运动间隔循环（保持不变）
  const startCounterLoop = useCallback(async () => {
    let localCount = 0;
    while (isRunningRef.current) {
      localCount++;
      setCounter(localCount);
      await playNumberSync(localCount);
      await sleep(intervalTimeRef.current * 1000);
    }
  }, [playNumberSync]);

  // 运动计时器（保持不变）
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isRunningRef.current) {
        setTimer(prev => prev + 1);
      }
    }, 1000);
  }, []);

  // 停止所有计时器（保持不变）
  const stopAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (intervalLoopRef.current) {
      clearTimeout(intervalLoopRef.current);
      intervalLoopRef.current = null;
    }
  }, []);

  // 开始运动（内部逻辑，无倒计时）
  const startExerciseInternal = useCallback(async () => {
    setIsRunning(true);
    setIsPaused(false);
    isRunningRef.current = true;
    
    if (audioContextRef.current && !isAudioContextClosed.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    startTimer();
    
    try {
      await startCounterLoop();
    } catch (err) {
      console.error("计数循环出错", err);
    }
  }, [startTimer, startCounterLoop]);

  // 倒计时并开始
  const startWithCountdown = useCallback(() => {
    if (isRunning || isPaused) return;
    
    // 切换运动时重置组别逻辑已在 useEffect 中处理
    setCountdown(3);
    const countdownInterval = setInterval(async () => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          startExerciseInternal();
          return null;
        }
        if (prev - 1 > 0) {
          playNumberSync(prev - 1);
        }
        return prev - 1;
      });
    }, 1000);
  }, [isRunning, isPaused, startExerciseInternal, playNumberSync]);

  // 暂停（保持不变）
  const handlePause = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    setIsPaused(true);
    isRunningRef.current = false;
    if (audioContextRef.current && !isAudioContextClosed.current) {
      audioContextRef.current.suspend();
    }
  }, [isRunning]);

  // 继续（保持不变）
  const handleResume = useCallback(() => {
    if (!isPaused) return;
    startExerciseInternal();
  }, [isPaused, startExerciseInternal]);

  // 保存记录到数据库
  const saveRecordToDatabase = async (recordData) => {
    try {
      const response = await fetch('/api/SportsAppWorkoutRecords/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData)
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      const result = await response.json();
      console.log('保存成功:', result);
      
      // 更新本地记录，标记为已保存
      setRecords(prev => prev.map(r => 
        r.tempId === recordData.tempId ? { ...r, saved: true, id: result.id } : r
      ));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('保存记录失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 停止运动并保存记录
  const handleStop = useCallback(async () => {
    setIsRunning(false);
    setIsPaused(false);
    isRunningRef.current = false;
    
    if (audioContextRef.current && !isAudioContextClosed.current) {
      audioContextRef.current.resume();
    }
    stopAllTimers();
    
    if (counter > 0) {
      // 获取当前组别（从数据库查询当天该运动的最大组别）
      const nextGroup = await fetchCurrentGroupNumber(selectedSportName);
      
      const tempId = Date.now();
      const newRecord = {
        tempId: tempId,
        username: user?.username || '匿名用户',
        sportname: selectedSportName,
        count: counter,
        durationseconds: timer,
        groupnumber: nextGroup,  // 使用从数据库获取的组别
        sportdate: new Date().toISOString().split('T')[0],
        remarks: `运动组别: 第${nextGroup}组`,
        saved: false,
        displayTime: new Date().toLocaleString()
      };
      
      setRecords(prev => [newRecord, ...prev]);
      
      // 自动保存到数据库
      await saveRecordToDatabase(newRecord);
    }
    
    setCounter(0);
    setTimer(0);
    setCountdown(null);
  }, [counter, timer, selectedSportName, stopAllTimers, user, fetchCurrentGroupNumber]);

  // 手动保存记录
  const handleSaveRecord = (record) => {
    if (record.saved) {
      alert('该记录已保存');
      return;
    }
    saveRecordToDatabase(record);
  };

  // 切换运动时，重置组别显示（但不重置数据库组别）
  useEffect(() => {
    if (!isRunning && !isPaused) {
      if (lastSportRef.current !== selectedSport) {
        setCurrentGroup(1); // 这只是显示用的，实际组别会在保存时从数据库获取
        lastSportRef.current = selectedSport;
      }
    }
  }, [selectedSport, isRunning, isPaused]);

  // 组件卸载时清理（保持不变）
  useEffect(() => {
    return () => {
      stopAllTimers();
      if (audioContextRef.current && !isAudioContextClosed.current) {
        try {
          audioContextRef.current.close();
          isAudioContextClosed.current = true;
        } catch (error) {
          console.log('组件卸载时关闭 AudioContext 错误:', error);
        }
      }
    };
  }, [stopAllTimers]);

  // 打开设置弹窗
  const openSettingsModal = () => {
    if (isRunning || isPaused) return;
    setTempSelectedSport(selectedSport);
    setTempIntervalTime(intervalTime);
    setShowSettingsModal(true);
  };

  // 保存设置
  const saveSettings = () => {
    if (tempSelectedSport !== selectedSport) {
      const selected = sportsTypes.find(s => s.sport_type_Options === tempSelectedSport);
      if (selected) {
        setSelectedSport(selected.sport_type_Options);
        setSelectedSportName(selected.sport_type_Options);
        setSelectedSportIcon(selected.icon_Options);
      }
    }
    if (tempIntervalTime !== intervalTime) {
      setIntervalTime(tempIntervalTime);
    }
    setShowSettingsModal(false);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 
      ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 获取当前运动的显示名称和图标
  const getCurrentSport = () => {
    return {
      name: selectedSportName,
      icon: selectedSportIcon
    };
  };

  // 渲染设置弹窗
  const renderSettingsModal = () => {
    if (!showSettingsModal) return null;
    
    return (
      <div className={styles.modalOverlay} onClick={() => setShowSettingsModal(false)}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalTitle}>设置</div>
          
          {/* 运动类型选择 */}
          <div className={styles.modalSection}>
            <div className={styles.modalSectionTitle}>选择运动</div>
            <div className={styles.modalSportsGrid}>
              {sportsTypes.map(sport => (
                <div 
                  key={sport.sport_type_Options}
                  className={`${styles.modalSportCard} ${tempSelectedSport === sport.sport_type_Options ? styles.selected : ''}`}
                  onClick={() => setTempSelectedSport(sport.sport_type_Options)}
                >
                  <svg className={styles.modalSportIcon} aria-hidden="true">
                    <use xlinkHref={`#${sport.icon_Options}`}></use>
                  </svg>
                  <span className={styles.modalSportName}>{sport.sport_type_Options}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 间隔时间选择 */}
          <div className={styles.modalSection}>
            <div className={styles.modalSectionTitle}>间隔时间（秒）</div>
            <div className={styles.modalIntervalGrid}>
              {intervalOptions.map(option => (
                <div 
                  key={option}
                  className={`${styles.modalIntervalCard} ${tempIntervalTime === option ? styles.selected : ''}`}
                  onClick={() => setTempIntervalTime(option)}
                >
                  {option}秒
                </div>
              ))}
            </div>
          </div>

          <div className={styles.modalButtons}>
            <button className={styles.cancelBtn} onClick={() => setShowSettingsModal(false)}>取消</button>
            <button className={styles.saveBtn} onClick={saveSettings}>保存</button>
          </div>
        </div>
      </div>
    );
  };

  const currentSportData = getCurrentSport();

  return (
    <div className={styles.container}>
      {/* 全屏倒计时遮罩 */}
      {countdown !== null && (
        <div className={styles.countdownOverlay}>
          <div className={styles.countdownNumber}>{countdown}</div>
        </div>
      )}
      
      {/* 设置弹窗 */}
      {renderSettingsModal()}
      
      {/* 保存成功提示 */}
      {saveSuccess && (
        <div className={styles.successToast}>
          ✅ 记录已保存到数据库！
        </div>
      )}
      
      {/* 控制按钮区 */}
      <div className={styles.controls}>
        {!isRunning && !isPaused && counter === 0 && (
          <button className={`${styles.btn} ${styles.btnStart}`} onClick={startWithCountdown}>开始</button>
        )}
        {isRunning && !isPaused && (
          <button className={`${styles.btn} ${styles.btnPause}`} onClick={handlePause}>暂停</button>
        )}
        {isPaused && (
          <button className={`${styles.btn} ${styles.btnResume}`} onClick={handleResume}>继续</button>
        )}
        {(isRunning || isPaused || counter > 0) && (
          <button className={`${styles.btn} ${styles.btnStop}`} onClick={handleStop}>停止</button>
        )}
        <button className={`${styles.btn} ${styles.btnSettings}`} onClick={openSettingsModal}>设置</button>
      </div>

      <div className={styles.mainContent}>
        {/* 当前运动显示 */}
        <div className={styles.currentSportSection}>
          <div className={styles.currentSportCard}>
            <svg className={styles.currentSportIcon} aria-hidden="true">
              <use xlinkHref={`#${currentSportData.icon}`}></use>
            </svg>
            <div className={styles.currentSportInfo}>
              <div className={styles.currentSportName}>{currentSportData.name}</div>
              <div className={styles.currentSportHint}>{user?.username || '请登录'}</div>
            </div>
          </div>
        </div>
  
        {/* 计数器 + 计时器 两列 */}
        <div className={styles.statsRow}>
          <div className={styles.counterSection}>
            <div className={styles.counterValue}>{counter}</div>
            <div className={styles.counterLabel}>已完成次数</div>
          </div>
          <div className={styles.timerSection}>
            <div className={styles.timerValue}>{formatTime(timer)}</div>
            <div className={styles.timerLabel}>运动时间</div>
          </div>
        </div>

        {/* 运动记录表格 */}
        <div className={styles.recordsSection}>
          <div className={styles.recordsTitle}>运动记录</div>
          <div className={styles.tableWrapper}>
            {records.length === 0 ? (
              <div className={styles.emptyRecords}>暂无记录，开始运动吧！</div>
            ) : (
              <table className={styles.recordsTable}>
                <thead>
                  <tr>
                    <th>运动类别</th>
                    <th>完成次数</th>
                    <th>运动时间</th>
                    <th>组别</th>
                    {/* <th>时间</th> */}
                    {/* <th>状态</th>
                    <th>操作</th> */}
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.tempId}>
                      <td>{record.sportname}</td>
                      <td>{record.count}</td>
                      <td>{formatTime(record.durationseconds)}</td>
                      <td>第{record.groupnumber}组</td>
                      {/* <td>{record.displayTime}</td> */}
                      {/* <td>
                        {record.saved ? (
                          <span className={styles.savedBadge}>已保存</span>
                        ) : (
                          <span className={styles.unsavedBadge}>未保存</span>
                        )}
                      </td>
                      <td>
                        {!record.saved && (
                          <button 
                            className={styles.saveRecordBtn}
                            onClick={() => handleSaveRecord(record)}
                          >
                            保存
                          </button>
                        )}
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sports;