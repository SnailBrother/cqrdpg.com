// src/components/modules/music/MusicplayerLyrics.js
// src/components/modules/music/MusicplayerLyrics.js
import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../../context/MusicContext';
import axios from 'axios';
import styles from './MusicplayerLyrics.module.css';

const MusicplayerLyrics = () => {
    const { state } = useMusic();
    const { currentSong, progress } = state;
    const [lyrics, setLyrics] = useState([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const lyricsContainerRef = useRef(null);

    // 解析LRC歌词
    const parseLRC = (lrcText) => {
        if (!lrcText) return [{ time: 0, text: '暂无歌词' }];

        const lines = lrcText.split('\n');
        const lyrics = [];
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/g;

        lines.forEach(line => {
            const matches = [...line.matchAll(timeRegex)];
            const text = line.replace(timeRegex, '').trim();

            if (matches.length > 0 && text) {
                matches.forEach(match => {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3]) / 100;
                    const time = minutes * 60 + seconds + milliseconds;
                    lyrics.push({ time, text });
                });
            }
        });

        return lyrics.length > 0
            ? lyrics.sort((a, b) => a.time - b.time)
            : [{ time: 0, text: '暂无歌词' }];
    };
const handleBack = () => {
  // 直接返回，如果还在当前页面说明没有历史记录，再跳转首页
  window.history.back();
  
  // 设置一个延时检查，如果还在当前页面就跳转首页
  setTimeout(() => {
    if (window.location.pathname.includes('/app/music/musicplayerlyrics')) {
      window.location.href = '/app/music/home';
    }
  }, 100);
};
    // 加载歌词
    useEffect(() => {
        const loadLyrics = async () => {
            if (!currentSong || !currentSong.src) {
                setLyrics([{ time: 0, text: '暂无歌词' }]);
                return;
            }

            let baseFilename;
            try {
                baseFilename = currentSong.src.split('/').pop().replace(/\.[^/.]+$/, '');
            } catch (error) {
                setLyrics([{ time: 0, text: '暂无歌词' }]);
                return;
            }

            const lrcFilename = `${baseFilename}.lrc`;

            try {
                const response = await axios.get(
                    `http://121.4.22.55:5202/backend/api/lyrics/${encodeURIComponent(lrcFilename)}`,
                    { responseType: 'text' }
                );

                const parsedLyrics = parseLRC(response.data);
                setLyrics(parsedLyrics.length > 0 ? parsedLyrics : [{ time: 0, text: '暂无歌词' }]);
                setCurrentLyricIndex(-1);
            } catch (error) {
                setLyrics([{ time: 0, text: '暂无歌词' }]);
            }
        };

        if (currentSong) {
            loadLyrics();
        }
    }, [currentSong]);

    // 更新当前歌词并滚动到对应位置
    useEffect(() => {
        if (lyrics.length === 0 || !lyricsContainerRef.current) return;

        let currentIndex = -1;
        for (let i = 0; i < lyrics.length; i++) {
            if (progress >= lyrics[i].time) {
                currentIndex = i;
            } else {
                break;
            }
        }

        if (currentIndex !== currentLyricIndex) {
            setCurrentLyricIndex(currentIndex);

            // 滚动到当前歌词，确保在容器中间
            if (currentIndex >= 0) {
                const container = lyricsContainerRef.current;
                const lyricElements = container.getElementsByClassName(styles.lyricLine);
                if (lyricElements[currentIndex]) {
                    const element = lyricElements[currentIndex];
                    
                    // 计算元素相对于容器的位置
                    const elementTop = element.offsetTop;
                    const elementHeight = element.offsetHeight;
                    const containerHeight = container.clientHeight;
                    
                    // 计算滚动位置：元素顶部 - 容器一半高度 + 元素一半高度
                    const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);
                    
                    container.scrollTo({
                        top: scrollTo,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }, [progress, lyrics]);

    if (!currentSong) {
        return (
            <div className={styles.lyricsPage}>
                <div className={styles.noSong}>
                    <h2>暂无播放的歌曲</h2>
                    <p>请先选择一首歌曲播放</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.lyricsPage}>
            {/* 顶部歌曲信息和返回按钮 */}
            <div className={styles.songHeader}>
                <button 
                    className={styles.backButton}
                    // onClick={() => window.history.back()}
                     onClick={handleBack}
                >
                    {/* 返回 */}
                    <svg  className={styles.backButtonicon} aria-hidden="true">
                                <use xlinkHref="#icon-quxiaoquanping" />
                            </svg>
                </button>

                <div className={styles.headerLeft}>
                    <img 
                        src={currentSong.coverimage || 'https://121.4.22.55:80/backend/musics/default.jpg'} 
                        alt={currentSong.title}
                        className={styles.coverImage}
                    />
                    <div className={styles.songInfo}>
                        <h1 className={styles.songTitle}>{currentSong.title}</h1>
                        <p className={styles.songArtist}>{currentSong.artist}</p>
                        {/* <div className={styles.timeInfo}>
                            <span>{formatTime(progress)}</span>
                        </div> */}
                    </div>
                </div>
                
            </div>

            {/* 歌词显示区域 - 占据剩余全部空间 */}
            <div className={styles.lyricsContainer}>
                <div className={styles.lyricsWrapper} ref={lyricsContainerRef}>
                    {lyrics.map((line, index) => (
                        <div
                            key={index}
                            className={`${styles.lyricLine} ${index === currentLyricIndex ? styles.active : ''}`}
                        >
                            {line.text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 格式化时间函数
const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default MusicplayerLyrics;