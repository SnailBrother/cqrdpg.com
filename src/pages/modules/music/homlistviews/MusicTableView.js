// src/components/modules/music/homlistviews/MusicTableView.js
import React from 'react';
import styles from './MusicTableView.module.css';

const MusicTableView = ({ musics, onPlayMusic, onPlaySingle, onLike, lastMusicElementRef, showLikeButton, showRank, currentSong }) => {
    return (
        <div className={styles.musicTableContainer}>
            <table className={styles.musicTable}>
                <thead>
                    <tr>
                        <th className={styles.thIndex}>#</th>
                        <th className={styles.thInfo}>歌曲信息</th>
                        <th className={styles.thAction}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {musics.map((music, index) => {
                        const isPlaying = currentSong?.id === music.id;
                        return (
                            <tr
                                key={music.id}
                                ref={musics.length === index + 1 ? lastMusicElementRef : null}
                                className={`${styles.musicRow} ${isPlaying ? styles.playing : ''}`}
                                // 保留整行点击播放的功能，方便用户
                                onClick={() => onPlayMusic(music)}
                            >
                                <td className={styles.tdIndex}>
                                    <div className={styles.indexContainer}>
                                        <span className={styles.indexNumber}>{showRank ? (music.rank ?? index + 1) : index + 1}</span>
                                        <div className={styles.playIndicator}>
                                            {/* 如果是当前播放的歌曲，显示音量波形，否则显示播放按钮 */}
                                            {isPlaying ? (
                                                <div className={styles.volumeBars}>
                                                    <span className={styles.bar}></span>
                                                    <span className={styles.bar}></span>
                                                    <span className={styles.bar}></span>
                                                </div>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M7 6v12l10-6z"></path>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.tdInfo}>
                                    <div className={styles.songInfo}>
                                        <div className={styles.albumCover}>
                                            <img
                                                src={music.coverimage}
                                                alt={music.title}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'http://121.4.22.55:80/backend/musics/default.jpg'
                                                }}
                                            />
                                        </div>
                                        <div className={styles.songDetails}>
                                            <div className={styles.songTitle}>{music.title}</div>
                                            <div className={styles.songArtist}>{music.artist}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.tdAction}>
                                    {/* 【修改】: 添加一个容器来包裹所有操作按钮 */}
                                    <div className={styles.actionButtons}>
                                        {/* 播放/暂停 按钮 */}
                                        <button
                                            className={`${styles.iconButton} ${styles.playPauseButton}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // 防止触发整行的点击事件
                                                onPlayMusic(music);
                                            }}
                                            title={isPlaying ? "暂停" : "播放"}
                                        >
                                            {isPlaying ? (
                                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                            )}
                                        </button>

                                        {/* 喜欢/不喜欢 按钮 */}
                                        <button
                                            className={`${styles.iconButton} ${styles.likeButton} ${music.liked ? styles.liked : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLike(e, music.id);
                                            }}
                                            title={music.liked ? "取消喜欢" : "喜欢"}
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                            </svg>
                                        </button>

                                        {/* 下载 按钮 */}
                                        <button
                                            className={`${styles.iconButton} ${styles.downloadButton}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('下载歌曲:', music.id, music.src);
                                                // 实际的下载逻辑可以后续添加
                                            }}
                                            title="下载"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default MusicTableView;