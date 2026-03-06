// src/components/modules/music/Recommend.js
// src/components/modules/music/Recommend.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useMusic } from '../../../context/MusicContext';
import styles from './Recommend.module.css';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';
import { Loading } from '../../../components/UI';

const Recommend = () => {
    const { user, isAuthenticated } = useAuth();
    const { dispatch, currentSong } = useMusic();//修改为数据库中的id
    const [musicData, setMusicData] = useState({
        ranking: [],
        chinese: [],
        western: [],
        japaneseKorean: [],
        other: []
    });
    const [activeTab, setActiveTab] = useState('ranking');
    const [pages, setPages] = useState({
        ranking: 1,
        chinese: 1,
        western: 1,
        japaneseKorean: 1,
        other: 1
    });
    const [hasMore, setHasMore] = useState({
        ranking: true,
        chinese: true,
        western: true,
        japaneseKorean: true,
        other: true
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState(''); // 新增：输入框临时值
    const [viewMode, setViewMode] = useState('table');

    const observer = useRef();
    // 处理搜索提交
    const handleSearchSubmit = () => {
        setSearchTerm(searchInput); // 只有提交时才更新搜索词
        setPages({ ranking: 1, chinese: 1, western: 1, japaneseKorean: 1, other: 1 });
        setMusicData({ ranking: [], chinese: [], western: [], japaneseKorean: [], other: [] });
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
            if (entries[0].isIntersecting && hasMore[activeTab]) {
                setPages(prevPages => ({
                    ...prevPages,
                    [activeTab]: prevPages[activeTab] + 1
                }));
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, activeTab]);

    useEffect(() => {
        if (isAuthenticated) {
            if (musicData[activeTab].length === 0) {
                fetchRecommendMusic(true);
            }
        }
    }, [activeTab, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchRecommendMusic(false);
        }
    }, [pages, searchTerm, isAuthenticated]);

    const fetchRecommendMusic = async (isFirstLoadForTab) => {
        const currentPage = pages[activeTab];

        if (!isFirstLoadForTab && (currentPage === 1 || !hasMore[activeTab])) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/reactdemorecommend', {
                params: {
                    category: activeTab,
                    page: currentPage,
                    pageSize: 20,
                    search: searchTerm
                }
            });

            const newMusics = response.data.data.map(song => ({
                id: song.id,
                title: song.title || '未知标题',
                artist: song.artist || '未知艺术家',
                genre: song.genre || '未知类型',
                src: song.src || `http://121.4.22.55:8888/backend/musics/${song.src}`,
                coverimage: song.coverimage || 'http://121.4.22.55:8888/backend/musics/default.jpg',
                playcount: song.playcount || 0,
                rank: song.rank,
                duration: song.duration || 0,
                liked: song.liked || false
            }));

            setMusicData(prev => {
                const shouldReplace = currentPage === 1;
                const existingData = shouldReplace ? [] : (prev[activeTab] || []);
                const all = [...existingData, ...newMusics];
                const unique = Array.from(new Set(all.map(m => m.id))).map(id => all.find(m => m.id === id));
                return { ...prev, [activeTab]: unique };
            });

            setHasMore(prev => ({
                ...prev,
                [activeTab]: response.data.data.length > 0 && response.data.page < response.data.totalPages
            }));

        } catch (err) {
            console.error('获取推荐音乐失败:', err);
            setError('获取推荐音乐失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setPages({ ranking: 1, chinese: 1, western: 1, japaneseKorean: 1, other: 1 });
            setMusicData({ ranking: [], chinese: [], western: [], japaneseKorean: [], other: [] });
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const handlePlayMusic = (songToPlay) => {
        const currentMusics = musicData[activeTab] || [];
        const actualIndex = currentMusics.findIndex(music => music.id === songToPlay.id);

        if (actualIndex === -1) {
            console.error('未找到歌曲在列表中的位置');
            return;
        }

        const songWithFullData = {
            id: songToPlay.id,
            title: songToPlay.title || '未知标题',
            artist: songToPlay.artist || '未知艺术家',
            genre: songToPlay.genre || '未知类型',
            src: songToPlay.src,
            coverimage: songToPlay.coverimage || 'http://121.4.22.55:8888/backend/musics/default.jpg',
            playcount: songToPlay.playcount || 0
        };

        dispatch({
            type: 'PLAY_SONG',
            payload: {
                song: songWithFullData,
                queue: currentMusics.map(song => ({
                    id: song.id,
                    title: song.title || '未知标题',
                    artist: song.artist || '未知艺术家',
                    genre: song.genre || '未知类型',
                    src: song.src,
                    coverimage: song.coverimage || 'http://121.4.22.55:8888/backend/musics/default.jpg'
                })),
                index: actualIndex,
            }
        });
    };

    const handlePlaySingle = (songToPlay) => {
        const songWithFullData = {
            id: songToPlay.id,
            title: songToPlay.title || '未知标题',
            artist: songToPlay.artist || '未知艺术家',
            genre: songToPlay.genre || '未知类型',
            src: songToPlay.src,
            coverimage: songToPlay.coverimage || 'http://121.4.22.55:8888/backend/musics/default.jpg'
        };

        dispatch({
            type: 'PLAY_SONG',
            payload: {
                song: songWithFullData,
                queue: [songWithFullData],
                index: 0,
            }
        });
    };

    const handleLike = async (e, musicId) => {
        e.stopPropagation();
        try {
            await axios.post('http://121.4.22.55:5202/backend/api/favorites', {
                username: user.username,
                musicId: musicId
            });

            setMusicData(prev => {
                const updatedData = { ...prev };
                Object.keys(updatedData).forEach(category => {
                    updatedData[category] = updatedData[category].map(music =>
                        music.id === musicId ? { ...music, liked: true } : music
                    );
                });
                return updatedData;
            });

        } catch (err) {
            console.error('喜欢歌曲失败:', err);
            setError('喜欢歌曲失败，请稍后重试');
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const getTabName = (tabKey) => {
        const tabNames = {
            ranking: '排行榜',
            chinese: '华语',
            western: '欧美',
            japaneseKorean: '日韩',
            other: '其他'
        };
        return tabNames[tabKey] || tabKey;
    };

    const currentMusics = musicData[activeTab] || [];
    const currentHasMore = hasMore[activeTab];

    // 初始加载时显示全屏加载动画
    const isInitialLoading = loading && Object.values(musicData).every(arr => arr.length === 0);
    if (isInitialLoading) {
        return (
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <Loading message="音乐推荐加载中..." />
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
                    <h2 className={styles.sectionTitle}>音乐推荐</h2>

                    {/* 2. 右侧容器 - 搜索框和视图切换右对齐 */}
                    <div className={styles.sectionHeaderRight}>
                        {/* 搜索框 */}
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="搜索推荐歌曲、艺术家..."
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

                {/* 分类标签容器 */}
                <div className={styles.tabContainer}>
                    {['ranking', 'chinese', 'western', 'japaneseKorean', 'other'].map(tab => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                            onClick={() => handleTabChange(tab)}
                        >
                            {getTabName(tab)}
                        </button>
                    ))}
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {/* 切换tab时的加载状态 */}
                {loading && currentMusics.length === 0 && (
                    <div className={styles.loadingOverlay}>
                        <Loading message={`正在加载${getTabName(activeTab)}音乐...`} />
                    </div>
                )}

                {/* 内容区域 */}
                <div className={styles.contentArea}>
                    {viewMode === 'table' ? (
                        <MusicTableView
                            musics={currentMusics}
                            onPlayMusic={handlePlayMusic}
                            onPlaySingle={handlePlaySingle}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={true}
                            showRank={activeTab === 'ranking'}
                            currentSong={currentSong}
                        />
                    ) : (
                        <MusicGridView
                            musics={currentMusics}
                            onPlayMusic={handlePlayMusic}
                            onPlaySingle={handlePlaySingle}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={true}
                            showRank={activeTab === 'ranking'}
                            currentSong={currentSong}
                        />
                    )}
                </div>

                {/* 滚动加载时的加载提示 */}
                {loading && currentMusics.length > 0 && (
                    <div className={styles.loadingMore}>
                        <Loading message={`正在加载更多${getTabName(activeTab)}音乐...`} />
                    </div>
                )}

                {!currentHasMore && currentMusics.length > 0 && (
                    <div className={styles.noMoreData}>已加载全部{getTabName(activeTab)}音乐</div>
                )}

                {!loading && currentMusics.length === 0 && (
                    <div className={styles.noData}>
                        {searchTerm ? `没有找到与 "${searchTerm}" 相关的${getTabName(activeTab)}音乐` : `暂无${getTabName(activeTab)}音乐推荐`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recommend;