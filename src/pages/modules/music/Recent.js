// src/components/modules/music/Recent.js 最近播放
// src/components/modules/music/Recent.js 最近播放
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useMusic } from '../../../context/MusicContext';
import styles from './Recent.module.css';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';
import { Loading } from '../../../components/UI';

const Recent = () => {
    const { user, isAuthenticated } = useAuth();
    const { state, dispatch } = useMusic();
    const { currentSong } = state;
    const [recentMusics, setRecentMusics] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState(''); // 新增：输入框临时值
    const [viewMode, setViewMode] = useState('table');

    const observer = useRef();
    // 处理搜索提交
    const handleSearchSubmit = () => {
        setSearchTerm(searchInput); // 只有提交时才更新搜索词
        setPage(1);
        setRecentMusics([]);
        setHasMore(true);
    };

    // 处理回车键
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };
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

    useEffect(() => {
        setRecentMusics([]);
        setPage(1);
        setHasMore(true);
    }, [searchTerm]);

    useEffect(() => {
        if (isAuthenticated && user?.email) { // 修改：改为检查 email
            fetchRecentMusics();
        }
    }, [page, searchTerm, isAuthenticated, user?.email]); // 修改：依赖改为 email

    const fetchRecentMusics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/reactdemoRecentlyPlayedmusic', {
                params: {
                    email: user.email, // 修改：改为传递 email
                    page: page,
                    pageSize: 20,
                    search: searchTerm
                }
            });

            const newRecentMusics = response.data.data.map(song => ({
                id: song.id,
                title: song.title,
                artist: song.artist,
                genre: song.genre,
                src: `http://www.cqrdpg.com/backend/musics/${song.src}`,
                coverimage: song.coverimage
                    ? `http://www.cqrdpg.com/backend/musics/${song.coverimage}`
                    : 'http://www.cqrdpg.com/backend/musics/default.jpg',
                playtime: song.playtime,
                play_count: song.play_count || 0
            }));

            console.log('最近播放数据:', newRecentMusics);

            setRecentMusics(prev => {
                const all = page === 1 ? newRecentMusics : [...prev, ...newRecentMusics];
                const unique = Array.from(new Set(all.map(m => m.id))).map(id => all.find(m => m.id === id));
                return unique;
            });

            setHasMore(response.data.data.length > 0 && response.data.page < response.data.totalPages);

        } catch (err) {
            console.error('获取最近播放列表失败:', err);
            setError('获取最近播放列表失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const handlePlayMusic = (songToPlay) => {
        const actualIndex = recentMusics.findIndex(music => music.id === songToPlay.id);

        dispatch({
            type: 'PLAY_SONG',
            payload: {
                song: songToPlay,
                queue: recentMusics,
                index: actualIndex,
            }
        });
    };

    const handleLike = (e, musicId) => {
        e.stopPropagation();
        console.log('喜欢歌曲:', musicId);
    };

    const handleRemoveRecent = async (e, musicId) => {
        e.stopPropagation();
        try {
            // 注意：这里需要创建对应的删除 API，也需要改为使用 email
            await axios.delete('/api/reactdemoRecentlyPlayedmusic', {
                data: {
                    email: user.email, // 修改：改为传递 email
                    musicId: musicId
                }
            });
            setRecentMusics(prev => prev.filter(music => music.id !== musicId));
        } catch (err) {
            console.error('移除最近播放记录失败:', err);
            setError('移除记录失败，请稍后重试');
        }
    };

    // 初始加载时显示全屏加载动画
    const isInitialLoading = loading && recentMusics.length === 0 && page === 1;
    if (isInitialLoading) {
        return (
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <Loading message="最近播放记录加载中..." />
                </div>
            </div>
        );
    }

    // 如果未登录，显示提示
    if (!isAuthenticated) {
        return (
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <div className={styles.notLoggedIn}>
                        请先登录以查看您的最近播放记录
                    </div>
                </div>
            </div>
        );
    }

    // 如果用户没有邮箱信息，显示提示
    if (!user?.email) {
        return (
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <div className={styles.notLoggedIn}>
                        无法获取用户信息，请重新登录
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.home}>
            <div className={styles.allMusicSection}>
                {/* 【修改】: 使用和 Home.js 相同的顶部布局结构 */}
                <div className={styles.sectionHeader}>
                    {/* 1. 标题 - 固定在左侧 */}
                    <h2 className={styles.sectionTitle}>最近播放 ({recentMusics.length})</h2>

                    {/* 2. 右侧容器 - 搜索框和视图切换右对齐 */}
                    <div className={styles.sectionHeaderRight}>
                        {/* 搜索框 */}
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="搜索最近播放的歌曲、艺术家..."
                                className={styles.searchInput}
                                value={searchInput} // 绑定临时值
                                onChange={(e) => setSearchInput(e.target.value)} // 只更新临时值
                                onKeyDown={handleKeyDown} // 监听回车键
                            />
                            {/* <button
                                className={styles.searchButton}
                                onClick={handleSearchSubmit}
                            >
                                搜索
                            </button> */}
                        </div>

                        {/* 视图切换 */}
                        <div className={styles.viewModeToggle}>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.active : ''}`}
                                onClick={() => setViewMode('table')}
                                title="列表视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                                </svg>
                            </button>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="网格视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8zm0-10h8v8h-8V3z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {/* 搜索或首次加载时的加载状态 */}
                {loading && recentMusics.length === 0 && (
                    <div className={styles.loadingOverlay}>
                        <Loading message={searchTerm ? `正在搜索 "${searchTerm}"...` : "正在加载最近播放记录..."} />
                    </div>
                )}

                {/* 内容区域 */}
                <div className={styles.contentArea}>
                    {viewMode === 'table' ? (
                        <MusicTableView
                            musics={recentMusics}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            onRemoveRecent={handleRemoveRecent}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={true}
                            showRemoveButton={true}
                            currentSong={currentSong}
                        />
                    ) : (
                        <MusicGridView
                            musics={recentMusics}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            onRemoveRecent={handleRemoveRecent}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={true}
                            showRemoveButton={true}
                            currentSong={currentSong}
                        />
                    )}
                </div>

                {/* 滚动加载时的加载提示 */}
                {loading && recentMusics.length > 0 && (
                    <div className={styles.loadingMore}>
                        <Loading message="正在加载更多记录..." />
                    </div>
                )}

                {!hasMore && recentMusics.length > 0 && (
                    <div className={styles.noMoreData}>已加载全部记录</div>
                )}

                {!loading && recentMusics.length === 0 && (
                    <div className={styles.noData}>
                        {searchTerm ? `没有找到与 "${searchTerm}" 相关的播放记录` : '暂无最近播放的音乐'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recent;