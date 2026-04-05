import React, { useState, useEffect } from 'react';
import { useMusic } from '../../../context/MusicContext';
import { useAuth } from '../../../context/AuthContext';
import io from 'socket.io-client';
import styles from './SongReview.module.css'; // 假设您已将CSS转换为模块

const socket = io('http://121.4.22.55:5202');

/**
 * 【时间格式化核心函数】
 * 将从后端获取的UTC时间字符串，转换为用户本地时区的 "YYYY-MM-DD HH:MM:SS" 格式。
 * @param {string} utcDateString - 从后端API获取的、未经处理的UTC时间字符串。
 * @returns {string} 格式化后的本地时间字符串，或在出错时返回 '无效日期'。
 */
const formatUTCToLocal = (utcDateString) => {
  if (!utcDateString) return '';
  
  try {
    // 关键：new Date() 会自动将ISO格式的UTC字符串转换为浏览器的本地时区
    const date = new Date(utcDateString);

    // 使用 getFullYear(), getMonth() 等方法会获取基于本地时区的时间部分
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('格式化日期时出错:', error);
    return '无效日期';
  }
};


const SongReview = () => {
  const { user, isAuthenticated } = useAuth();
  const { state } = useMusic();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMusicId, setCurrentMusicId] = useState(null);

  // 根据歌曲标题和艺术家获取 music_id
  const getMusicId = async (title, artist) => {
    if (!title || !artist) return null;
    try {
      const response = await fetch(`/api/ReactDemomusic-id?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      if (!response.ok) throw new Error('获取歌曲ID失败');
      const data = await response.json();
      return data.music_id || null;
    } catch (err) {
      console.error('Error fetching music ID:', err);
      return null;
    }
  };

  // 获取当前歌曲的评论
  const fetchComments = async () => {
    if (!state.currentSong?.title || !state.currentSong?.artist) {
      setCurrentMusicId(null);
      setComments([]);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const musicId = await getMusicId(state.currentSong.title, state.currentSong.artist);
      setCurrentMusicId(musicId);
      
      if (!musicId) {
        setComments([]);
        return;
      }
      
      const response = await fetch(`/api/ReactDemomusic-comments?music_id=${musicId}`);
      if (!response.ok) throw new Error('获取评论失败');
      
      const data = await response.json();
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('获取评论失败，请稍后重试');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // 提交新评论
  const submitComment = async () => {
    if (!newComment.trim() || !state.currentSong || !user || !currentMusicId) {
      setError('评论内容不能为空或歌曲信息不完整');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/ReactDemomusiccomments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          music_id: currentMusicId,
          music_title: state.currentSong.title,
          music_artist: state.currentSong.artist,
          user_name: user.username,
          comment_text: newComment.trim()
        })
      });
      if (!response.ok) throw new Error('提交评论失败');

      const result = await response.json();
      if (result.success) {
        setNewComment('');
        await fetchComments(); // 重新获取以看到自己的新评论
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('提交评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 更新评论
  const updateComment = async (commentId) => {
    if (!editText.trim()) { setError('评论内容不能为空'); return; }

    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/ReactDemomusiccomments/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, comment_text: editText.trim(), user_name: user.username })
      });
      if (!response.ok) throw new Error('更新评论失败');

      const result = await response.json();
      if (result.success) {
        setEditingComment(null);
        setEditText('');
        await fetchComments();
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('更新评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除评论
  const deleteComment = async (commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) return;

    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/ReactDemomusiccomments/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, user_name: user.username })
      });
      if (!response.ok) throw new Error('删除评论失败');

      const result = await response.json();
      if (result.success) {
        await fetchComments();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('删除评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (comment) => {
    setEditingComment(comment.comment_id);
    setEditText(comment.comment_text);
  };
  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  useEffect(() => {
    socket.on('new-comment', (data) => {
      if (data.music_id === currentMusicId) fetchComments();
    });
    socket.on('comment-updated', (data) => {
      if (data.music_id === currentMusicId) fetchComments();
    });
    return () => {
      socket.off('new-comment');
      socket.off('comment-updated');
    };
  }, [currentMusicId]);

  useEffect(() => {
    fetchComments();
  }, [state.currentSong?.title, state.currentSong?.artist]);

  return (
    <div className={styles.container}>
      
         <h3>评论 ({comments.length})</h3>
      {isAuthenticated && user ? (
        <div className={styles.content}>
          {/* <div className={styles.currentSong}>
          
            {state.currentSong ? (
              <div className={styles.songInfo}>
                <p><strong>歌曲标题:</strong> {state.currentSong.title}</p>
                <p><strong>艺术家:</strong> {state.currentSong.artist}</p>
               <p><strong>数据库ID:</strong> {currentMusicId || '未找到对应歌曲'}</p>  
              </div>
            ) : (
              <p className={styles.noSong}>暂无播放歌曲</p>
            )}
          </div> */}

          {state.currentSong && currentMusicId && (
            <div className={styles.commentInput}>
              {/* <h3>发表评论</h3> */}
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="请输入您的评论..." rows="4" disabled={loading} />
              <button onClick={submitComment} disabled={loading || !newComment.trim()} className={styles.submitBtn}>
                {loading ? '提交中...' : '提交评论'}
              </button>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.commentsSection}>
         
            {loading && comments.length === 0 ? (<div className={styles.loading}>加载中...</div>) 
            : !currentMusicId && state.currentSong ? (<div className={styles.noComments}>未找到对应的歌曲记录</div>)
            : comments.length === 0 ? (<div className={styles.noComments}>暂无评论</div>) 
            : (
              <div className={styles.commentsList}>
                {comments.map((comment) => (
                  <div key={comment.comment_id} className={styles.commentItem}>
                    {editingComment === comment.comment_id ? (
                      <div className={styles.editComment}>
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows="3" disabled={loading} />
                        <div className={styles.editActions}>
                          <button onClick={() => updateComment(comment.comment_id)} disabled={loading} className={styles.saveBtn}>
                            {loading ? '保存中...' : '保存'}
                          </button>
                          <button onClick={cancelEdit} disabled={loading} className={styles.cancelBtn}>取消</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.commentHeader}>
                          <span className={styles.userName}>{comment.user_name}</span>
                          <span className={styles.commentTime}>
                            {formatUTCToLocal(comment.created_at)}
                          </span>
                        </div>
                        <div className={styles.commentText}>{comment.comment_text}</div>
                        {comment.user_name === user.username && (
                          <div className={styles.commentActions}>
                            <button onClick={() => startEdit(comment)} className={styles.editBtn}>编辑</button>
                            <button onClick={() => deleteComment(comment.comment_id)} className={styles.deleteBtn}>删除</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.notLoggedIn}>
          <p>请先登录以管理评论</p>
        </div>
      )}
    </div>
  );
};

export default SongReview;