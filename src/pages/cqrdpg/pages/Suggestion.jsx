import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import styles from './Suggestion.module.css';


const API_URL = '/api/suggestion';

const socket = io('/');

// ==========================================
// 递归组件：渲染单个评论及其所有子评论
// ==========================================
const CommentNode = ({ 
  comment, 
  depth = 0, 
  onReplyClick, 
  replyingToId, 
  submitReply, 
  cancelReply, 
  replyText, 
  setReplyText,
  authorName,
  authorEmail,
  authorSite
}) => {
  const isReplying = replyingToId === comment.id;

  const handleLike = async () => {
    // 这里可以添加乐观更新，或者直接刷新
    await fetch(`api/suggestion/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: comment.id })
    });
  };

  return (
    <div className={styles.commentNode} style={{ marginLeft: depth > 0 ? '20px' : '0', borderLeft: depth > 0 ? '2px solid #eee' : 'none', paddingLeft: '10px' }}>
      
      {/* 评论主体 */}
      <div className={styles.commentItem}>
        <div className={styles.commentHeader}>
          <div className={styles.avatar}>{comment.author.charAt(0)}</div>
          <div className={styles.meta}>
            <span className={styles.author}>{comment.author}</span>
            <span className={styles.date}>{comment.date}</span>
            <span className={styles.browser}>{comment.browser}</span>
          </div>
          <div className={styles.actions}>
            <span className={styles.like} onClick={handleLike} style={{cursor: 'pointer'}}>❤️ {comment.likes}</span>
            <span 
              className={styles.replyBtn} 
              onClick={() => onReplyClick(comment.id)}
              style={{ cursor: 'pointer', marginLeft: '10px', color: '#007bff' }}
            >
              💬 回复
            </span>
          </div>
        </div>
        <div className={styles.content}>{comment.content}</div>
      </div>

      {/* 回复输入框 (仅当当前评论是被回复对象时显示) */}
      {isReplying && (
        <div className={styles.replyInputBox}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
            回复 @{comment.author}
          </div>
          <textarea
            className={styles.commentInput}
            placeholder="写下你的回复..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
            style={{ height: '60px', marginBottom: '5px' }}
          />
          <div style={{ textAlign: 'right' }}>
            <button onClick={() => cancelReply()} style={{ marginRight: '10px', padding: '4px 8px' }}>取消</button>
            <button 
              onClick={() => submitReply(comment.id)} 
              className={styles.submitBtn}
              style={{ padding: '4px 8px' }}
            >
              提交回复
            </button>
          </div>
        </div>
      )}

      {/* 递归渲染子评论 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.repliesList}>
          {comment.replies.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              onReplyClick={onReplyClick}
              replyingToId={replyingToId}
              submitReply={submitReply}
              cancelReply={cancelReply}
              replyText={replyText}
              setReplyText={setReplyText}
              authorName={authorName}
              authorEmail={authorEmail}
              authorSite={authorSite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 主组件
// ==========================================
const Suggestion = () => {
  const [sortBy, setSortBy] = useState('newest');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 全局表单状态 (用于获取用户输入的昵称等)
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorSite, setAuthorSite] = useState('');

  // 顶部主评论输入
  const [mainCommentText, setMainCommentText] = useState('');
  
  // 回复相关状态
  const [replyingToId, setReplyingToId] = useState(null); // 当前正在回复哪个评论的 ID
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchComments();

    socket.on('refresh_comments', () => {
      fetchComments();
    });

    return () => {
      socket.off('refresh_comments');
    };
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/list`);
      const data = await res.json();
      setComments(data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  // 提交主评论 (根节点)
  const handleSubmitMain = async () => {
    if (!mainCommentText.trim()) return alert('请输入内容');
    await sendComment(mainCommentText, null);
    setMainCommentText('');
  };

  // 点击回复按钮
  const handleReplyClick = (id) => {
    if (replyingToId === id) {
      setReplyingToId(null); // 再次点击取消
      setReplyText('');
    } else {
      setReplyingToId(id);
      setReplyText('');
      setMainCommentText(''); // 清空主输入框以防混淆
    }
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyText('');
  };

  // 提交回复 (子节点)
  const submitReply = async (parentId) => {
    if (!replyText.trim()) return alert('请输入回复内容');
    await sendComment(replyText, parentId);
    setReplyingToId(null);
    setReplyText('');
  };

  // 通用发送函数
  const sendComment = async (content, parentId) => {
    const payload = {
      content,
      authorname: authorName,
      authoremail: authorEmail,
      authortelephone: authorSite,
      parentid: parentId
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // Socket 会触发刷新，无需手动操作
      } else {
        alert('提交失败');
      }
    } catch (e) {
      console.error(e);
      alert('网络错误');
    }
  };

  // 前端排序逻辑 (针对根节点)
  // 注意：由于后端已经返回了树形结构，我们只能对根节点排序。
  // 子节点的顺序通常由后端决定（例如按时间正序显示对话流）。
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'hot') return b.likes - a.likes;
    return 0;
  });

  return (
    <div className={styles.suggestionContainer}>
      {/* 顶部全局信息输入 */}
      <div className={styles.globalInfoBar}>
        <input 
          className={styles.smallInput} 
          placeholder="昵称 (可选，默认匿名)" 
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
        <input 
          className={styles.smallInput} 
          placeholder="邮箱 (可选)" 
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
        />
        <input 
          className={styles.smallInput} 
          placeholder="网址/电话 (可选)" 
          value={authorSite}
          onChange={(e) => setAuthorSite(e.target.value)}
        />
      </div>

      {/* 顶部主评论输入框 */}
      <div className={styles.commentInputWrapper}>
        <textarea
          className={styles.commentInput}
          placeholder="发表新评论..."
          value={mainCommentText}
          onChange={(e) => setMainCommentText(e.target.value)}
          disabled={!!replyingToId} // 如果正在回复别人，禁用主输入框
        />
        <div className={styles.inputFooter}>
          <div className={styles.toolbar}>
            <span>M↓</span><span>😀</span><span>GIF</span>
          </div>
          <div className={styles.inputMeta}>
            <span>{mainCommentText.length} 字</span>
            {!replyingToId && (
              <button className={styles.submitBtn} onClick={handleSubmitMain}>发布评论</button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.commentListHeader}>
        <h3 className={styles.commentCount}>{comments.length} 条评论</h3>
        <div className={styles.sortOptions}>
          <button className={`${styles.sortBtn} ${sortBy === 'newest' ? styles.active : ''}`} onClick={() => setSortBy('newest')}>最新</button>
          <button className={`${styles.sortBtn} ${sortBy === 'oldest' ? styles.active : ''}`} onClick={() => setSortBy('oldest')}>最早</button>
          <button className={`${styles.sortBtn} ${sortBy === 'hot' ? styles.active : ''}`} onClick={() => setSortBy('hot')}>热度</button>
        </div>
      </div>

      <div className={styles.commentList}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
        ) : (
          sortedComments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              depth={0}
              onReplyClick={handleReplyClick}
              replyingToId={replyingToId}
              submitReply={submitReply}
              cancelReply={cancelReply}
              replyText={replyText}
              setReplyText={setReplyText}
              authorName={authorName}
              authorEmail={authorEmail}
              authorSite={authorSite}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Suggestion;