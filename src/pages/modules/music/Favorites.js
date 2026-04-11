// src/components/modules/music/Favorites.js 我的喜欢
// src/components/modules/music/Favorites.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useMusic } from '../../../context/MusicContext';
import styles from './Favorites.module.css';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';
import { Loading } from '../../../components/UI';

const Favorites = () => {
    const { user, isAuthenticated } = useAuth();
    const { dispatch, currentSong } = useMusic();
    const [favorites, setFavorites] = useState([]);
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
  setFavorites([]);
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
        setFavorites([]);
        setPage(1);
        setHasMore(true);
    }, [searchTerm]);

    useEffect(() => {
        if (isAuthenticated && user?.username) {
            fetchFavorites();
        }
    }, [page, searchTerm, isAuthenticated, user?.username]);

    const fetchFavorites = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('https://www.cqrdpg.com:5202/backend/api/reactdemofavorites', {
                params: {
                    username: user.username,
                    page: page,
                    pageSize: 20,
                    search: searchTerm
                }
            });
            
            const newFavorites = response.data.data.map(song => ({
                id: song.id,
                title: song.title,
                artist: song.artist,
                src: `https://www.cqrdpg.com/backend/musics/${song.src}`,
                coverimage: song.coverimage
                            ? `https://www.cqrdpg.com/backend/musics/${song.coverimage}`
                            : 'https://www.cqrdpg.com/backend/musics/default.jpg',
                play_count: song.play_count
            }));

            console.log('收藏歌曲数据:', newFavorites);

            setFavorites(prev => {
                const all = page === 1 ? newFavorites : [...prev, ...newFavorites];
                const unique = Array.from(new Set(all.map(m => m.id))).map(id => all.find(m => m.id === id));
                return unique;
            });
            
            setHasMore(response.data.data.length > 0 && response.data.page < response.data.totalPages);

        } catch (err) {
            console.error('获取收藏列表失败:', err);
            setError('获取收藏列表失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };
    
    const handlePlayMusic = (songToPlay) => {
        const actualIndex = favorites.findIndex(music => music.id === songToPlay.id);
        
        dispatch({
            type: 'PLAY_SONG',
            payload: {
                song: songToPlay,
                queue: favorites,
                index: actualIndex,
            }
        });
    };

    const handleLike = (e, musicId) => {
        e.stopPropagation();
        console.log('取消喜欢歌曲:', musicId);
    };

    // 初始加载时显示全屏加载动画
    const isInitialLoading = loading && favorites.length === 0 && page === 1;
    if (isInitialLoading) {
        return (
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <Loading message="收藏列表加载中..." />
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
                        请先登录以查看您的收藏
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
                    <h2 className={styles.sectionTitle}>收藏 ({favorites.length})</h2>

                    {/* 2. 右侧容器 - 搜索框和视图切换右对齐 */}
                    <div className={styles.sectionHeaderRight}>
                        {/* 搜索框 */}
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                            </svg>
                           <input
  type="text"
  placeholder="搜索收藏的歌曲、艺术家..."
  className={styles.searchInput}
  value={searchInput} // 绑定临时值
  onChange={(e) => setSearchInput(e.target.value)} // 只更新临时值
  onKeyDown={handleKeyDown} // 监听回车键
/>
                        </div>

                        {/* 视图切换 */}
                        <div className={styles.viewModeToggle}>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.active : ''}`}
                                onClick={() => setViewMode('table')}
                                title="列表视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                                </svg>
                            </button>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="网格视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8zm0-10h8v8h-8V3z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {/* 搜索或首次加载时的加载状态 */}
                {loading && favorites.length === 0 && (
                    <div className={styles.loadingOverlay}>
                        <Loading message={searchTerm ? `正在搜索 "${searchTerm}"...` : "正在加载收藏列表..."} />
                    </div>
                )}

                {/* 内容区域 */}
                <div className={styles.contentArea}>
                    {viewMode === 'table' ? (
                        <MusicTableView
                            musics={favorites}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={false}
                            currentSong={currentSong}
                        />
                    ) : (
                        <MusicGridView
                            musics={favorites}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={false}
                            currentSong={currentSong}
                        />
                    )}
                </div>

                {/* 滚动加载时的加载提示 */}
                {loading && favorites.length > 0 && (
                    <div className={styles.loadingMore}>
                        <Loading message="正在加载更多收藏..." />
                    </div>
                )}

                {!hasMore && favorites.length > 0 && (
                    <div className={styles.noMoreData}>已加载全部收藏</div>
                )}

                {!loading && favorites.length === 0 && (
                    <div className={styles.noData}>
                        {searchTerm ? `没有找到与 "${searchTerm}" 相关的收藏` : '暂无收藏的音乐'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;