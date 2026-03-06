import React, { useState, useEffect } from 'react';
import styles from './MusicPlaylist.module.css';
import { useMusic } from '../../../context/MusicContext';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';

const MusicPlaylist = () => {
    const { state, dispatch } = useMusic();
    // 【【【 核心修正点：使用 queue 替代 playlist 】】】
    const { currentSong, isPlaying, queue } = state; 
    
    const [musics, setMusics] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [error, setError] = useState(null); // 添加 error 状态

    // 从 Context 的播放列表 (queue) 获取数据
    useEffect(() => {
        // 当 queue 存在且是一个数组时才设置
        if (Array.isArray(queue)) {
            setMusics(queue);
        }
    }, [queue]);

    // 搜索功能
    useEffect(() => {
        if (!Array.isArray(queue)) return; // 安全检查

        if (searchTerm) {
            const filtered = queue.filter(song => 
                song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                song.artist.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setMusics(filtered);
        } else {
            setMusics(queue); // 搜索词为空时，显示完整的播放列表
        }
    }, [searchTerm, queue]);

    const handlePlayMusic = (songToPlay) => {
        const actualIndex = queue.findIndex(music => music.id === songToPlay.id);
        dispatch({
            type: 'PLAY_SONG',
            payload: { 
                song: songToPlay, 
                queue: queue, // 使用正确的 queue
                index: actualIndex 
            }
        });
    };

    const handleLike = (e, musicId) => {
        e.stopPropagation();
        console.log('喜欢歌曲:', musicId);
        // ... 喜欢逻辑
    };

    const handleRemoveFromPlaylist = (e, musicId) => {
        e.stopPropagation();
        console.log('从播放列表移除:', musicId);
        dispatch({ type: 'REMOVE_FROM_PLAYLIST', payload: musicId });
    };

    // 如果没有播放列表数据，显示提示
    if (!Array.isArray(queue) || queue.length === 0) {
        return (
            <div className={styles.playlist}>
                <div className={styles.playlistSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>播放列表 (0)</h2>
                    </div>
                    <div className={styles.noData}>
                        <p>播放列表为空</p>
                        <p className={styles.noDataHint}>您可以在音乐库中将歌曲添加到播放列表</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.playlist}>
            <div className={styles.playlistSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>播放列表 ({queue.length})</h2>
                    <div className={styles.sectionHeaderRight}>
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path></svg>
                            <input
                                type="text"
                                placeholder="在播放列表中搜索..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className={styles.viewModeToggle}>
                            <button className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.active : ''}`} onClick={() => setViewMode('table')} title="列表视图"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" /></svg></button>
                            <button className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`} onClick={() => setViewMode('grid')} title="网格视图"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8zm0-10h8v8h-8V3z" /></svg></button>
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.contentArea}>
                    {viewMode === 'table' ? (
                        <MusicTableView musics={musics} onPlayMusic={handlePlayMusic} onLike={handleLike} onRemoveFromPlaylist={handleRemoveFromPlaylist} currentSong={currentSong} isPlaying={isPlaying} />
                    ) : (
                        <MusicGridView musics={musics} onPlayMusic={handlePlayMusic} onLike={handleLike} onRemoveFromPlaylist={handleRemoveFromPlaylist} currentSong={currentSong} isPlaying={isPlaying} />
                    )}
                </div>

                {musics.length === 0 && searchTerm && (
                    <div className={styles.noData}>
                        播放列表中没有找到与 "{searchTerm}" 相关的歌曲
                    </div>
                )}
            </div>
        </div>
    );
};

export default MusicPlaylist;