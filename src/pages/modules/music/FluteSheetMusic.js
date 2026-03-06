
// FluteSheetMusic.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './FluteSheetMusic.module.css';

const FLUTE_NOTES = [
    // 平吹（缓吹）
    { range: '低音', number: '5', solfege: 'so', dot: '·', fingering: '● ● ● ● ● ●', breath: '平吹（缓吹）' },
    { range: '低音', number: '6', solfege: 'la', dot: '·', fingering: '● ● ● ● ● ○', breath: '平吹（缓吹）' },
    { range: '低音', number: '7', solfege: 'si', dot: '·', fingering: '● ● ● ● ○ ○', breath: '平吹（缓吹）' },
    { range: '中音', number: '1', solfege: 'do', dot: '',   fingering: '● ● ● ○ ○ ○', breath: '平吹（缓吹）' },
    { range: '中音', number: '2', solfege: 're', dot: '',   fingering: '● ● ○ ○ ○ ○', breath: '平吹（缓吹）' },
    { range: '中音', number: '3', solfege: 'mi', dot: '',   fingering: '● ○ ○ ○ ○ ○', breath: '平吹（缓吹）' },
    { range: '中音', number: '4', solfege: 'fa', dot: '',   fingering: '○ ● ● ○ ○ ○', breath: '平吹（缓吹）' },
    { range: '中音', number: '4', solfege: 'fa', dot: '',   fingering: '◎ ○ ○ ○ ○ ○', breath: '平吹（缓吹）' },
    // 超吹（急吹）
    { range: '高音', number: '5', solfege: 'so', dot: '·', fingering: '○ ● ● ● ● ●', breath: '超吹（急吹）' },
    { range: '高音', number: '6', solfege: 'la', dot: '·', fingering: '● ● ● ● ● ○', breath: '超吹（急吹）' },
    { range: '高音', number: '7', solfege: 'si', dot: '·', fingering: '● ● ● ● ○ ○', breath: '超吹（急吹）' },
    { range: '高音', number: '1', solfege: 'do', dot: '·', fingering: '● ● ● ○ ○ ○', breath: '超吹（急吹）' },
    { range: '高音', number: '2', solfege: 're', dot: '·', fingering: '● ● ○ ○ ○ ○', breath: '超吹（急吹）' },
    { range: '高音', number: '3', solfege: 'mi', dot: '·', fingering: '● ○ ○ ○ ○ ○', breath: '超吹（急吹）' },
    { range: '高音', number: '4', solfege: 'fa', dot: '·', fingering: '○ ● ● ○ ○ ○', breath: '超吹（急吹）' },
    { range: '高音', number: '4', solfege: 'fa', dot: '·', fingering: '◎ ○ ○ ○ ○ ○', breath: '超吹（急吹）' },
    { range: '倍高音', number: '5', solfege: 'so', dot: '··', fingering: '○ ● ● ○ ○ ○', breath: '超吹（急吹）' },
    { range: '倍高音', number: '5', solfege: 'so', dot: '··', fingering: '○ ● ● ● ● ●', breath: '超吹（急吹）' },
    { range: '倍高音', number: '6', solfege: 'la', dot: '··', fingering: '● ● ○ ● ● ○', breath: '超吹（急吹）' }
  ];

const FluteSheetMusic = () => {
  const [currentNote, setCurrentNote] = useState(null);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [showSolfege, setShowSolfege] = useState(true);
  const [intervalSec, setIntervalSec] = useState(2); // 默认 2 秒
  const [showSettings, setShowSettings] = useState(false);

  const settingsPanelRef = useRef(null);

  const getRandomNote = useCallback(() => {
    const idx = Math.floor(Math.random() * FLUTE_NOTES.length);
    return FLUTE_NOTES[idx];
  }, []);

  // 初始化
  useEffect(() => {
    setCurrentNote(getRandomNote());
  }, [getRandomNote]);

  // 自动播放逻辑
  useEffect(() => {
    if (!isAutoPlay) return;

    const id = setInterval(() => {
      setCurrentNote(getRandomNote());
    }, intervalSec * 1000);

    return () => clearInterval(id);
  }, [isAutoPlay, intervalSec, getRandomNote]);

  // 点击外部关闭设置面板
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettings && settingsPanelRef.current && !settingsPanelRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  const handleManualNext = () => {
    setCurrentNote(getRandomNote());
  };

  if (!currentNote) return null;

  return (
    <div className={styles.container}>
      {/* 设置按钮 */}
      <button
        className={styles.settingsBtn}
        onClick={() => setShowSettings(!showSettings)}
        aria-label="设置"
      >
        ⚙️
      </button>

      {/* 设置面板 */}
      {showSettings && (
        <div className={styles.settingsPanel} ref={settingsPanelRef}>
          <div>
            <label>
              <input
                type="checkbox"
                checked={isAutoPlay}
                onChange={(e) => setIsAutoPlay(e.target.checked)}
              />
              自动切换
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={showSolfege}
                onChange={(e) => setShowSolfege(e.target.checked)}
              />
              显示英文唱名（如 mi, so）
            </label>
          </div>
          <div>
            <label>
              切换间隔：
              <select
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
                disabled={!isAutoPlay}
              >
                {[1, 2, 3, 4, 5].map(sec => (
                  <option key={sec} value={sec}>{sec} 秒</option>
                ))}
              </select>
            </label>
          </div>
          {!isAutoPlay && (
            <button className={styles.manualBtn} onClick={handleManualNext}>
              手动切换
            </button>
          )}
        </div>
      )}

      {/* 主内容 */}
      <div className={styles.mainContent}>
        <div className={styles.range}>{currentNote.range}：</div>

        {/* 音符显示：点 + 数字 + (可选)唱名 */}
        <div className={styles.noteWrapper}>
          {currentNote.dot && <div className={styles.dot}>{currentNote.dot}</div>}
          <div className={styles.numberContainer}>
            <span className={styles.numberOnly}>{currentNote.number}</span>
            {showSolfege && <span className={styles.solfege}> ({currentNote.solfege})</span>}
            {!showSolfege && <span className={styles.placeholder}> (mi)</span>} {/* 占位 */}
          </div>
        </div>

        <div className={styles.fingeringLabel}>指法：</div>
        <div className={styles.fingering}>{currentNote.fingering}</div>
        <div className={styles.breath}>气息：{currentNote.breath}</div>
      </div>
    </div>
  );
};

export default FluteSheetMusic;