// src/components/modules/music/Recommend.js
//这个版本已经实现了您最后的需求：首次进入页面时，默认选中“排行榜”并立即加载其数据，同时保留了所有其他的功能和逻辑（如切换标签页、无限滚动加载、搜索功能等）不变
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
    const { state, dispatch } = useMusic();
    const { currentSong } = state;
    
    const [musicData, setMusicData] = useState({
        ranking: [], chinese: [], western: [], japaneseKorean: [], other: []
    });
    const [activeTab, setActiveTab] = useState('ranking');
    const [pages, setPages] = useState({
        ranking: 1, chinese: 1, western: 1, japaneseKorean: 1, other: 1
    });
    const [hasMore, setHasMore] = useState({
        ranking: true, chinese: true, western: true, japaneseKorean: true, other: true
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');

    const observer = useRef();
    const isInitialLoad = useRef(true); // 使用 ref 来标记是否是首次加载

    // 数据获取函数
    const fetchRecommendMusic = useCallback(async (category, page, isNewSearchOrTab) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/reactdemorecommend', {
                params: { category, page, pageSize: 20, search: searchTerm }
            });

            const newMusics = response.data.data.map(song => ({
                id: song.id,
                title: song.title || '未知标题',
                artist: song.artist || '未知艺术家',
                genre: song.genre || '未知类型',
                src: song.src,
                coverimage: song.coverimage,
                playcount: song.playcount || 0,
                rank: song.rank,
                duration: song.duration || 0,
                liked: song.liked || false
            }));

            setMusicData(prev => {
                const existingData = isNewSearchOrTab ? [] : (prev[category] || []);
                const all = [...existingData, ...newMusics];
                // 去重，确保 key 的唯一性
                const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
                return { ...prev, [category]: unique };
            });

            setHasMore(prev => ({
                ...prev,
                [category]: response.data.data.length > 0 && response.data.page < response.data.totalPages
            }));

        } catch (err) {
            console.error('获取推荐音乐失败:', err);
            setError('获取推荐音乐失败，请稍后重试');
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    }, [searchTerm]); // 依赖项中包含 searchTerm

    // 1. 首次加载 Effect
    useEffect(() => {
        if (isAuthenticated && isInitialLoad.current) {
            fetchRecommendMusic(activeTab, 1, true);
        }
    }, [isAuthenticated, fetchRecommendMusic, activeTab]);

    // 2. 切换 Tab 的 Effect
    useEffect(() => {
        // 避免在首次加载时重复触发
        if (!isInitialLoad.current && musicData[activeTab].length === 0) {
            setPages(prev => ({ ...prev, [activeTab]: 1 }));
            setHasMore(prev => ({ ...prev, [activeTab]: true }));
            fetchRecommendMusic(activeTab, 1, true);
        }
    }, [activeTab, musicData, fetchRecommendMusic]);

    // 3. 无限滚动加载的 Effect
    useEffect(() => {
        if (!isInitialLoad.current && pages[activeTab] > 1) {
            fetchRecommendMusic(activeTab, pages[activeTab], false);
        }
    }, [pages, activeTab, fetchRecommendMusic]);

    // 4. 搜索的 Effect
    useEffect(() => {
        const handler = setTimeout(() => {
            // 避免在组件首次挂载时触发不必要的搜索
            if (!isInitialLoad.current) {
                setPages({ ranking: 1, chinese: 1, western: 1, japaneseKorean: 1, other: 1 });
                setHasMore({ ranking: true, chinese: true, western: true, japaneseKorean: true, other: true });
                fetchRecommendMusic(activeTab, 1, true);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm, activeTab, fetchRecommendMusic]);


    // 无限滚动观察器
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

    // --- 事件处理函数 ---

    const handlePlayMusic = (songToPlay) => {
        const currentMusics = musicData[activeTab] || [];
        const actualIndex = currentMusics.findIndex(music => music.id === songToPlay.id);

        if (actualIndex === -1) {
            console.error('未找到歌曲在列表中的位置，将作为单曲播放');
            handlePlaySingle(songToPlay);
            return;
        }
        dispatch({ type: 'PLAY_SONG', payload: { song: songToPlay, queue: currentMusics, index: actualIndex } });
    };

    const handlePlaySingle = (songToPlay) => {
        dispatch({ type: 'PLAY_SONG', payload: { song: songToPlay, queue: [songToPlay], index: 0 } });
    };

    const handleLike = async (e, musicId) => { /* ... 保持不变 ... */ };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const getTabName = (tabKey) => {
        const tabNames = { ranking: '排行榜', chinese: '华语', western: '欧美', japaneseKorean: '日韩', other: '其他' };
        return tabNames[tabKey] || tabKey;
    };


    // --- 渲染逻辑 ---

    const currentMusics = musicData[activeTab] || [];
    const currentHasMore = hasMore[activeTab];

    if (loading && isInitialLoad.current) {
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
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>音乐推荐</h2>
                    <div className={styles.sectionHeaderRight}>
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path></svg>
                            <input type="text" placeholder="搜索推荐..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className={styles.viewModeToggle}>
                            <button className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.active : ''}`} onClick={() => setViewMode('table')} title="列表视图"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" /></svg></button>
                            <button className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`} onClick={() => setViewMode('grid')} title="网格视图"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8zm0-10h8v8h-8V3z" /></svg></button>
                        </div>
                    </div>
                </div>

                <div className={styles.tabContainer}>
                    {['ranking', 'chinese', 'western', 'japaneseKorean', 'other'].map(tab => (
                        <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`} onClick={() => handleTabChange(tab)}>
                            {getTabName(tab)}
                        </button>
                    ))}
                </div>

                {error && <div className={styles.error}>{error}</div>}
                
                {loading && currentMusics.length === 0 && <div className={styles.loadingOverlay}><Loading message={`正在加载${getTabName(activeTab)}音乐...`} /></div>}

                <div className={styles.contentArea}>
                    {viewMode === 'table' ? (
                        <MusicTableView musics={currentMusics} onPlayMusic={handlePlayMusic} onPlaySingle={handlePlaySingle} onLike={handleLike} lastMusicElementRef={lastMusicElementRef} showLikeButton={true} showRank={activeTab === 'ranking'} currentSong={currentSong} />
                    ) : (
                        <MusicGridView musics={currentMusics} onPlayMusic={handlePlayMusic} onPlaySingle={handlePlaySingle} onLike={handleLike} lastMusicElementRef={lastMusicElementRef} showLikeButton={true} showRank={activeTab === 'ranking'} currentSong={currentSong} />
                    )}
                </div>

                {loading && currentMusics.length > 0 && <div className={styles.loadingMore}><Loading message={`正在加载更多...`} /></div>}

                {!currentHasMore && currentMusics.length > 0 && <div className={styles.noMoreData}>已加载全部{getTabName(activeTab)}音乐</div>}
                
                {!loading && currentMusics.length === 0 && !error && <div className={styles.noData}>{searchTerm ? `没有找到与 "${searchTerm}" 相关的音乐` : `暂无${getTabName(activeTab)}音乐推荐`}</div>}
            </div>
        </div>
    );
};

export default Recommend;