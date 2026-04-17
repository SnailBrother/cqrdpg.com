// src/components/modules/music/Favorites.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useMusic } from '../../../context/MusicContext';
import styles from './Favorites.module.css';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';
import { Loading } from '../../../components/UI';
import io from 'socket.io-client';

const socket = io('https://www.cqrdpg.com:5202');

const Favorites = () => {
    const { user, isAuthenticated } = useAuth();
    const { dispatch, currentSong } = useMusic();
    const [favorites, setFavorites] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const observer = useRef();

    // ✅ 监听收藏更新事件
    useEffect(() => {
        const handleFavoritesUpdated = (data) => {
            console.log('📡 Favorites 收到广播:', data);
            console.log('当前用户:', user?.username);
            
            if (data.user_name === user?.username) {
                console.log('✅ 用户匹配，触发刷新');
                setRefreshTrigger(prev => prev + 1);
            }
        };

        socket.on('favoritesUpdated', handleFavoritesUpdated);
        socket.on('favoriteChanged', handleFavoritesUpdated);

        return () => {
            socket.off('favoritesUpdated', handleFavoritesUpdated);
            socket.off('favoriteChanged', handleFavoritesUpdated);
        };
    }, [user?.username]);

    // ✅ 当 refreshTrigger 变化时，重新加载
    useEffect(() => {
        if (refreshTrigger > 0 && isAuthenticated && user?.username) {
            console.log('🔄 触发刷新，重新加载第一页');
            setPage(1);
            setFavorites([]);
            setHasMore(true);
            fetchFavorites(1);
        }
    }, [refreshTrigger]);

    const handleSearchSubmit = () => {
        setSearchTerm(searchInput);
        setPage(1);
        setFavorites([]);
        setHasMore(true);
    };

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
        if (searchTerm) {
            setPage(1);
            setFavorites([]);
            setHasMore(true);
        }
    }, [searchTerm]);

    useEffect(() => {
        if (isAuthenticated && user?.username) {
            fetchFavorites(page);
        }
    }, [page, searchTerm, isAuthenticated, user?.username]);

    const fetchFavorites = async (currentPage = page) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/music/favorites', {
                params: {
                    username: user.username,
                    page: currentPage,
                    pageSize: 20,
                    search: searchTerm
                }
            });
            
            const newFavorites = response.data.data.map(song => ({
                id: song.id,
                music_id: song.music_id,
                title: song.title || song.song_name,
                artist: song.artist,
                genre: song.genre || '',
                src: song.src 
                    ? (song.src.startsWith('http') 
                        ? song.src 
                        : `https://www.cqrdpg.com/backend/musics/${song.src}`)
                    : '',
                coverimage: song.coverimage
                    ? (song.coverimage.startsWith('http')
                        ? song.coverimage
                        : `https://www.cqrdpg.com/backend/musics/${song.coverimage}`)
                    : 'https://www.cqrdpg.com/backend/musics/default.jpg',
                play_count: song.play_count
            }));

            console.log('🔄 加载收藏列表，第', currentPage, '页，共', newFavorites.length, '条');

            setFavorites(prev => {
                const all = currentPage === 1 ? newFavorites : [...prev, ...newFavorites];
                const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
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

    // ✅ 修复：Favorites 中的取消收藏功能
    const handleLike = async (e, musicId) => {
        e.stopPropagation();
        
        if (!isAuthenticated || !user?.username) {
            alert('请先登录');
            return;
        }

        // 找到要删除的歌曲
        const songToRemove = favorites.find(m => m.id === musicId);
        
        if (!songToRemove) {
            console.error('找不到要删除的歌曲');
            return;
        }

        try {
            await axios.delete('/api/music/favorites', {
                data: {
                    user_name: user.username,
                    music_id: songToRemove.music_id,
                    song_name: songToRemove.title
                }
            });
            
            // 乐观更新：立即从列表中移除
            setFavorites(prev => prev.filter(music => music.id !== musicId));
            console.log('取消收藏成功:', songToRemove.title);
            
            // 注意：后端会自动广播 favoritesUpdated 事件
            // 但我们已经做了乐观更新，所以不需要等待广播
            
        } catch (err) {
            console.error('取消收藏失败:', err);
            alert('取消收藏失败，请重试');
        }
    };

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
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>收藏 ({favorites.length})</h2>

                    <div className={styles.sectionHeaderRight}>
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="搜索收藏的歌曲、艺术家..."
                                className={styles.searchInput}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

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

                {loading && favorites.length === 0 && (
                    <div className={styles.loadingOverlay}>
                        <Loading message={searchTerm ? `正在搜索 "${searchTerm}"...` : "正在加载收藏列表..."} />
                    </div>
                )}

                <div className={styles.contentArea}>
                    {viewMode === 'table' ? (
                        <MusicTableView
                            musics={favorites}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={true}
                            currentSong={currentSong}
                        />
                    ) : (
                        <MusicGridView
                            musics={favorites}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={true}
                            currentSong={currentSong}
                        />
                    )}
                </div>

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