// src/components/modules/music/MusicGridView.js
import React from 'react';
import styles from './MusicGridView.module.css';

const MusicGridView = ({ musics, onPlayMusic, onPlaySingle, onLike, lastMusicElementRef, showLikeButton, showRank, currentSong }) => {
    return (
        <div className={styles.musicGrid}>
            {musics.map((music, index) => {
                const isPlaying = currentSong?.id === music.id;
                return (
                    <div
                        key={music.id}
                        ref={musics.length === index + 1 ? lastMusicElementRef : null}
                        className={`${styles.musicCard} ${isPlaying ? styles.playing : ''}`}
                        onClick={() => onPlayMusic(music)}
                    >
                        <div className={styles.musicCover}>
                            <img
                                src={music.coverimage}
                                alt={music.title}
                                className={styles.coverImage}
                                loading="lazy"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'http://121.4.22.55:80/backend/musics/default.jpg'
                                }}
                            />
                            <div className={styles.playIconOverlay}>
                                {/* 如果正在播放，显示音量条，否则显示播放图标 */}
                                {isPlaying ? (
                                    <div className={styles.volumeBars}>
                                        <span className={styles.bar}></span>
                                        <span className={styles.bar}></span>
                                        <span className={styles.bar}></span>
                                    </div>
                                ) : (
                                    <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 6v12l10-6z"></path>
                                    </svg>
                                )}
                            </div>
                            
                            {/* 【修改】: 添加一个容器来包裹所有操作按钮 */}
                            <div className={styles.actionButtons}>
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
                                {/* 【新增】下载按钮 */}
                                <button
                                    className={`${styles.iconButton} ${styles.downloadButton}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('下载歌曲:', music.id, music.src);
                                    }}
                                    title="下载"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className={styles.musicInfo}>
                            <div className={`${styles.musicTitle} ${isPlaying ? styles.playingTitle : ''}`} title={music.title}>{music.title}</div>
                            <div className={styles.musicArtist} title={music.artist}>{music.artist}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default MusicGridView;