// src/components/modules/music/Home.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import styles from './Home.module.css';
import { useMusic } from '../../../context/MusicContext';
import { useAuth } from '../../../context/AuthContext';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';
import { Loading } from '../../../components/UI';
import io from 'socket.io-client';

// 创建 Socket.IO 实例
const socket = io('https://www.cqrdpg.com:5202');

// 编码处理辅助函数
const encodeForURL = (str) => {
    if (!str) return str;
    return encodeURIComponent(str);
};

// 根据日期获取默认视图模式
 
const getDefaultViewMode = () => {
    const today = new Date();
    const day = today.getDate(); // 获取当前日期（1-31）
    return day % 2 === 1 ? 'grid' : 'table'; // 单数：网格视图，双数：列表视图
};

const Home = () => {
    const { state, dispatch } = useMusic();
    const { user, isAuthenticated } = useAuth();
    const { currentSong, isPlaying, queue, volume = 1, playMode = 'repeat', currentRoom, isInRoom, roomUsers, isHost } = state;
    const [musics, setMusics] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState(''); // 新增：用于输入框的临时值
    const [viewMode, setViewMode] = useState(() => {
        // 尝试从 localStorage 获取用户保存的偏好
        const savedViewMode = localStorage.getItem('musicViewMode');
        if (savedViewMode && (savedViewMode === 'table' || savedViewMode === 'grid')) {
            return savedViewMode;
        }
        // 如果没有保存的偏好，则根据日期返回默认值
        return getDefaultViewMode();
    });

    // 保存用户手动切换的视图模式
    useEffect(() => {
        localStorage.setItem('musicViewMode', viewMode);
    }, [viewMode]);

    // 处理搜索提交
    const handleSearchSubmit = () => {
        setSearchTerm(searchInput); // 只有按下回车时才更新实际的搜索词
        setPage(1);
        setMusics([]);
        setHasMore(true);
    };

    // 处理输入框按键事件
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };


    const observer = useRef();


    // 发送播放歌曲变更通知到后端
    const sendPlaySongChange = async (songToPlay) => {
        if (!isInRoom || !currentRoom) return; // 只有在房间内才发送通知

        try {
            // 对可能包含特殊字符和多语言字符的字段进行编码处理
            const requestData = {
                room_name: currentRoom.room_name,
                title: songToPlay.title, // 后端使用 NVARCHAR，不需要编码
                host: currentRoom.host,
                artist: songToPlay.artist,
                coverimage: songToPlay.coverimage,
                src: songToPlay.src,
                genre: songToPlay.genre,
                is_playing: true,
                play_mode: playMode,
                email: user.email,
                is_host: isHost,

                isPlaying: true,

                volume: volume,
                currentRoom: currentRoom,
                isInRoom: isInRoom,
                roomUsers: roomUsers,
                isHost: isHost,
                // 添加 queue 字段，传递完整的歌单
                queue: musics,  // 这是关键，要把歌单传到后端
                // 其他状态信息（可选）
                currentSong: songToPlay,
                currentIndex: musics.findIndex(music => music.id === songToPlay.id)
            };

            console.log('发送播放歌曲变更，包含歌单:', {
                title: songToPlay.title,
                queueLength: musics.length,
                queue: musics.map(m => m.title)
            });

            // 设置请求头，确保支持UTF-8编码
            await axios.post('/api/ListenTogetherMusic/ChangePlaySong', requestData, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            });
        } catch (error) {
            console.error('发送播放歌曲变更通知失败:', error);
            if (error.response) {
                console.error('错误响应:', error.response.data);
            }
        }
    };

    const handlePlayMusic = async (songToPlay) => {
        console.log('【当前音乐播放状态】', {
            currentSong: state.currentSong,
            isPlaying: state.isPlaying,
            queue: state.queue,
            volume: state.volume,
            playMode: state.playMode,
            currentRoom: state.currentRoom,
            isInRoom: state.isInRoom,
            roomUsers: state.roomUsers,
            isHost: state.isHost
        });

        const actualIndex = musics.findIndex(music => music.id === songToPlay.id);
        // 更新本地状态
        dispatch({
            type: 'PLAY_SONG',
            payload: {
                song: songToPlay,
                queue: musics,  // 使用 musics 作为队列
                index: actualIndex
            }
        });

        // 发送播放变更通知
        await sendPlaySongChange(songToPlay);
    };

    // 监听 socket 广播消息
    useEffect(() => {
        const handleTogetherMusicRoomUsersChangePlaySong = async (data) => {
            // 检查是否是自己的操作，如果是则忽略
            if (data.email === user.email && data.room_name === currentRoom?.room_name) {
                return;
            }

            // 检查当前房间是否匹配
            if (data.room_name !== currentRoom?.room_name) {
                return;
            }

            try {
                console.log('接收到播放变更广播:', data);
    
                const response = await axios.get('/api/ListenTogetherMusic/ChangePlaySong', {
                    params: {
                        room_name: data.room_name,
                        email: user.email
                    },
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                });
    
                const roomData = response.data;
                console.log('从数据库获取的房间数据，包含歌单:', roomData);
    
                if (roomData) {
                    // 创建歌曲对象
                    const newSong = {
                        title: roomData.title,
                        artist: roomData.artist,
                        coverimage: roomData.coverimage,
                        src: roomData.src,
                        genre: roomData.genre,
                        id: roomData.id || Date.now()
                    };
    
                    // 从后端获取歌单（queue）
                    const receivedQueue = roomData.queue || [];
                    console.log('接收到的歌单:', receivedQueue.length, '首歌');
    
                    // 找到当前歌曲在歌单中的索引
                    const songIndex = receivedQueue.findIndex(song => 
                        song.title === newSong.title && 
                        song.artist === newSong.artist
                    );
                    
                    const indexToUse = songIndex !== -1 ? songIndex : 0;
    
                    // 更新播放状态，包括歌单
                    dispatch({
                        type: 'PLAY_SONG',
                        payload: {
                            song: newSong,
                            queue: receivedQueue,  // 使用从后端获取的歌单
                            index: indexToUse
                        }
                    });
    
                    // 可选：如果需要同步歌单到本地状态
                    if (receivedQueue.length > 0) {
                        console.log('同步歌单到本地状态');
                        // 这里可以更新本地的 musics 状态
                        // setMusics(receivedQueue);
                    }
                }
            } catch (error) {
                console.error('同步播放状态失败:', error);
            }
        };
    
        socket.on('TogetherMusicRoomUsersChangePlaySong', handleTogetherMusicRoomUsersChangePlaySong);
    
        return () => {
            socket.off('TogetherMusicRoomUsersChangePlaySong', handleTogetherMusicRoomUsersChangePlaySong);
        };
    }, [user.email, currentRoom, dispatch, playMode]);

    const lastMusicElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // 搜索时重置状态
    useEffect(() => {
        setMusics([]);
        setPage(1);
        setHasMore(true);
    }, [searchTerm]);

    // 获取音乐数据
    useEffect(() => {
        const fetchMusics = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/getallmusics', {
                    params: {
                        page: page,
                        pageSize: 100,
                        search: searchTerm
                    },
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                });
                const newMusics = response.data.data.map(song => ({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    genre: song.genre,
                    liked: song.liked || false,
                    src: `https://www.cqrdpg.com/backend/musics/${song.src}`,
                    coverimage: song.coverimage
                        ? `https://www.cqrdpg.com/backend/musics/${song.coverimage}`
                        : 'https://www.cqrdpg.com/backend/musics/default.jpg',
                }));
                setMusics(prev => {
                    const all = page === 1 ? newMusics : [...prev, ...newMusics];
                    const unique = Array.from(new Set(all.map(m => m.id))).map(id => all.find(m => m.id === id));
                    return unique;
                });
                setHasMore(response.data.data.length > 0 && response.data.page < response.data.totalPages);
            } catch (err) {
                console.error('获取音乐数据失败:', err);
                setError('获取音乐数据失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };
        fetchMusics();
    }, [page, searchTerm]);

    const handleLike = (e, musicId) => {
        e.stopPropagation();
        console.log('喜欢歌曲:', musicId);
        setMusics(prevMusics => prevMusics.map(music =>
            music.id === musicId ? { ...music, liked: !music.liked } : music
        ));
    };

    // 初始加载时显示全屏加载动画
    const isInitialLoading = loading && musics.length === 0 && page === 1;
    if (isInitialLoading) {
        return (
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <Loading message="音乐库加载中..." />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.home}>
            <div className={styles.allMusicSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>音乐 ({musics.length})</h2>
                    <div className={styles.sectionHeaderRight}>
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="搜索歌曲、艺术家..."
                                className={styles.searchInput}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                            />
                        </div>

                        <div className={styles.viewModeToggle}>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.active : ''}`}
                                onClick={() => setViewMode('table')}
                                title="列表视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" /></svg>
                            </button>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="网格视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8zm0-10h8v8h-8V3z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {loading && musics.length === 0 && (
                    <div className={styles.loadingOverlay}>
                        <Loading message={searchTerm ? `正在搜索 "${searchTerm}"...` : "正在加载音乐..."} />
                    </div>
                )}

                <div className={styles.contentArea}>
                    {viewMode === 'table' ? (
                        <MusicTableView
                            musics={musics}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            currentSong={currentSong}
                        />
                    ) : (
                        <MusicGridView
                            musics={musics}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            currentSong={currentSong}
                        />
                    )}
                </div>

                {loading && musics.length > 0 && (
                    <div className={styles.loadingMore}>
                        <Loading message="正在加载更多音乐..." />
                    </div>
                )}

                {!hasMore && musics.length > 0 && (
                    <div className={styles.noMoreData}>已加载全部音乐</div>
                )}

                {!loading && musics.length === 0 && (
                    <div className={styles.noData}>
                        {searchTerm ? `没有找到与 "${searchTerm}" 相关的音乐` : '曲库中暂无音乐'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;