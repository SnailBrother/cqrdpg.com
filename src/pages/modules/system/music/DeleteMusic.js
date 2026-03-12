import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './DeleteMusic.module.css';

const DeleteMusic = () => {
    const [musics, setMusics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // 输入框的值
    const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); // 实际用于搜索的值
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const imgErrorHandled = useRef(new Set());
    const observer = useRef();
    const pageSize = 12;
    const baseUrl = 'http://121.4.22.55:80/backend';

    const lastMusicElementRef = useCallback((node) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setPage((prevPage) => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const fetchMusics = async (pageNum) => {
        if (pageNum === 1) setLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/getallmusics?page=${pageNum}&pageSize=${pageSize}&search=${encodeURIComponent(appliedSearchTerm)}`
            );

            if (!response.ok) {
                throw new Error('获取音乐列表失败');
            }

            const result = await response.json();
            const newData = result.data || [];

            if (pageNum === 1) {
                setMusics(newData);
                setSelectedIds(new Set());
            } else {
                setMusics((prev) => [...prev, ...newData]);
            }

            setHasMore(newData.length === pageSize);
            setIsInitialLoad(false);
        } catch (err) {
            setError('加载音乐列表失败: ' + err.message);
            console.error('加载音乐失败:', err);
            if (pageNum === 1) setMusics([]);
        } finally {
            if (pageNum === 1) setLoading(false);
        }
    };

    const handleSearchSubmit = () => {
        setAppliedSearchTerm(searchTerm);
        setPage(1);
        setHasMore(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    useEffect(() => {
        fetchMusics(page);
    }, [page, appliedSearchTerm]);

    const deleteMusic = async (musicId, musicTitle) => {
        if (!window.confirm(`确定要删除歌曲 "${musicTitle}" 吗？此操作不可撤销！`)) return;

        setDeletingId(musicId);
        try {
            const response = await fetch(`/api/deletemusic/${musicId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('删除失败');

            setPage(1);
            setAppliedSearchTerm(appliedSearchTerm);
            alert('删除成功');
        } catch (err) {
            console.error('删除失败:', err);
            alert('删除失败: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const batchDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) {
            alert('请至少选择一首歌曲');
            return;
        }

        if (!window.confirm(`确定要删除选中的 ${ids.length} 首歌曲吗？此操作不可撤销！`)) return;

        try {
            const response = await fetch(`/api/batchdeletemusic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            if (!response.ok) throw new Error('批量删除失败');

            setPage(1);
            setAppliedSearchTerm(appliedSearchTerm);
            alert('批量删除成功');
        } catch (err) {
            console.error('批量删除失败:', err);
            alert('批量删除失败: ' + err.message);
        }
    };

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === musics.length && musics.length > 0) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(musics.map(m => m.id));
            setSelectedIds(allIds);
        }
    };

    return (
        <div className={styles.deleteMusic}>
            <div className={styles.header}>
                <h1 className={styles.title}>音乐管理</h1>
                <div className={styles.controls}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="输入歌曲或歌手搜索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            className={styles.searchBtn}
                            onClick={handleSearchSubmit}
                        >
                            搜索
                        </button>
                    </div>
                    {selectedIds.size > 0 && (
                        <button
                            className={styles.btnBatchDelete}
                            onClick={batchDelete}
                        >
                            批量删除 ({selectedIds.size})
                        </button>
                    )}
                </div>
            </div>

            {/* {!loading && !error && !isInitialLoad && (
                <div className={styles.pageInfo}>
                    已加载 {musics.length} 首音乐
                </div>
            )} */}

            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={() => {
                        setPage(1);
                        setAppliedSearchTerm(searchTerm);
                    }}>重试</button>
                </div>
            )}

            {loading && page === 1 && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>加载中...</p>
                </div>
            )}

            {!loading && !error && musics.length === 0 && !isInitialLoad && (
                <div className={styles.noDataMsg}>
                    暂无匹配的音乐
                </div>
            )}

            {musics.length > 0 && (
                <div className={styles.tableContainer}>
                    <table className={styles.musicTable}>
                        <thead>
                            <tr>
                                <th>序号</th> {/* 新增序号列 */}
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={musics.length > 0 && selectedIds.size === musics.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>封面</th>
                                <th>歌曲名</th>
                                <th>歌手</th>
                                <th>类型</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {musics.map((music, index) => {
                                const isLast = index === musics.length - 1;
                                return (
                                    <tr
                                        key={music.id}
                                        ref={isLast ? lastMusicElementRef : null}
                                    >
                                        <td>{index + 1}</td> {/* 序号 */}
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(music.id)}
                                                onChange={() => toggleSelect(music.id)}
                                            />
                                        </td>
                                        <td>
                                            <img
                                                src={`${baseUrl}/musics/${music.coverimage}`}
                                                alt={music.title}
                                                className={styles.coverImg}
                                                onError={(e) => {
                                                    if (!imgErrorHandled.current.has(music.id)) {
                                                        e.target.src = '/default-cover.jpg';
                                                        imgErrorHandled.current.add(music.id);
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>{music.title}</td>
                                        <td>{music.artist}</td>
                                        <td>{music.genre}</td>
                                        <td>
                                            <button
                                                className={styles.btnDelete}
                                                onClick={() => deleteMusic(music.id, music.title)}
                                                disabled={deletingId === music.id}
                                            >
                                                {deletingId === music.id ? '删除中...' : '删除'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {loading && page > 1 && (
                        <div className={styles.loadMore}>
                            <div className={styles.spinner}></div>
                            <span>加载更多...</span>
                        </div>
                    )}

                    {!hasMore && musics.length > 0 && (
                        <div className={styles.noMore}>
                            —— 没有更多音乐了 ——
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeleteMusic;