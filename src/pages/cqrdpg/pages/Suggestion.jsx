import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import styles from './Suggestion.module.css';

const API_URL = '/api/suggestion';
const socket = io('/');

// ==========================================
// 子组件：单条评论展示
// isChild={true} 时，不显示点赞和回复按钮
// ==========================================
const CommentItem = ({ 
  comment, 
  isChild = false, 
  onReplyClick, 
  replyingToId, 
  submitReply, 
  cancelReply, 
  replyText, 
  setReplyText,
  handleLike,
  likedSet
}) => {
  const isReplying = replyingToId === comment.id;
  const hasLiked = likedSet.has(comment.id);

  return (
    <div className={isChild ? styles.replyItemWrapper : styles.rootItemWrapper}>
      <div className={styles.commentFlex}>
        {/* 头像 */}
        <div className={isChild ? styles.smallAvatar : styles.avatar}>
          {comment.author.charAt(0)}
        </div>
        
        {/* 内容区 */}
        <div className={styles.contentBox}>
          <div className={styles.metaRow}>
            <span className={styles.authorName}>{comment.author}</span>
            <span className={styles.dateText}>{comment.date}</span>
            {!isChild && comment.browser && (
              <span className={styles.browserText}>{comment.browser}</span>
            )}
          </div>
          
          <div className={styles.commentText}>{comment.content}</div>
          
          {/* 【关键修改】只有父级评论 (isChild=false) 才显示操作栏 */}
          {!isChild && (
            <div className={styles.actionRow}>
              <span 
                className={`${styles.likeBtn} ${hasLiked ? styles.liked : ''}`}
                onClick={() => handleLike(comment.id)}
                title="点赞"
              >
                {hasLiked ? '❤️' : '🤍'} {comment.likes}
              </span>
              <span 
                className={styles.replyBtnText}
                onClick={() => onReplyClick(comment.id)}
                title="回复"
              >
                💬 回复
              </span>
            </div>
          )}

          {/* 回复输入框 (只在父级评论下显示) */}
          {!isChild && isReplying && (
            <div className={styles.replyInputArea}>
              <div className={styles.replyNotice}>回复 @{comment.author}</div>
              <textarea
                className={styles.inputBox}
                placeholder="写下你的回复..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <div className={styles.btnGroup}>
                <button onClick={cancelReply} className={styles.cancelBtn}>取消</button>
                <button onClick={() => submitReply(comment.id)} className={styles.submitBtn}>提交</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 主组件
// ==========================================
const Suggestion = () => {
  const [rootComments, setRootComments] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [hasMoreRoot, setHasMoreRoot] = useState(true);
  
  // 记录哪些父评论加载了“更多”子评论 (key: parentId, value: { list: [], page: ..., hasMore: ... })
  const [extraRepliesMap, setExtraRepliesMap] = useState({});
  
  // 用户信息
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorSite, setAuthorSite] = useState('');

  // 交互状态
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [mainCommentText, setMainCommentText] = useState('');
  
  // 点赞记录
  const [likedSet, setLikedSet] = useState(new Set());

  useEffect(() => {
    loadRootComments(true);

    socket.on('refresh_comments', () => {
      setPage(1);
      setRootComments([]);
      setExtraRepliesMap({});
      loadRootComments(true);
    });

    socket.on('like_update', ({ id, likes }) => {
      updateLikeCount(id, likes);
    });

    return () => {
      socket.off('refresh_comments');
      socket.off('like_update');
    };
  }, []);

  // 加载根评论 (自带前 10 条子评论)
  const loadRootComments = async (reset = false) => {
    if (loadingRoot) return;
    setLoadingRoot(true);
    const currentPage = reset ? 1 : page;
    
    try {
      const res = await fetch(`${API_URL}/list?page=${currentPage}&limit=100`);
      const data = await res.json();
      
      if (data.length < 100) setHasMoreRoot(false);
      
      if (reset) {
        setRootComments(data);
        setPage(2);
        setExtraRepliesMap({}); // 重置额外加载的子评论记录
      } else {
        setRootComments(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoot(false);
    }
  };

  // 加载额外的子评论 (第 11 条开始)
  const loadMoreReplies = async (parentId) => {
    const current = extraRepliesMap[parentId] || { list: [], page: 2, hasMore: true, loading: false };
    if (current.loading || !current.hasMore) return;

    setExtraRepliesMap(prev => ({ ...prev, [parentId]: { ...current, loading: true } }));

    try {
      // page=2 对应 offset=10
      const res = await fetch(`${API_URL}/children?parentId=${parentId}&page=${current.page}&limit=10`);
      const data = await res.json();
      
      const hasMore = data.length === 10;
      
      setExtraRepliesMap(prev => ({
        ...prev,
        [parentId]: {
          list: [...current.list, ...data],
          page: current.page + 1,
          hasMore,
          loading: false
        }
      }));
    } catch (err) {
      console.error(err);
      setExtraRepliesMap(prev => ({ ...prev, [parentId]: { ...current, loading: false } }));
    }
  };

  const handleReplyClick = (id) => {
    if (replyingToId === id) {
      setReplyingToId(null);
      setReplyText('');
    } else {
      setReplyingToId(id);
      setReplyText('');
      setMainCommentText('');
    }
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyText('');
  };

  const submitReply = async (parentId) => {
    if (!replyText.trim()) return alert('请输入内容');
    await sendComment(replyText, parentId);
    setReplyingToId(null);
    setReplyText('');
    // 提交后刷新根列表，以显示新的子评论
    setPage(1);
    setRootComments([]);
    setExtraRepliesMap({});
    loadRootComments(true);
  };

  const handleSubmitMain = async () => {
    if (!mainCommentText.trim()) return alert('请输入内容');
    await sendComment(mainCommentText, null);
    setMainCommentText('');
    setPage(1);
    setRootComments([]);
    setExtraRepliesMap({});
    loadRootComments(true);
  };

  const sendComment = async (content, parentId) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorname: authorName,
          authoremail: authorEmail,
          authortelephone: authorSite,
          parentid: parentId
        })
      });
      if (!res.ok) throw new Error('Fail');
    } catch (e) {
      alert('提交失败');
    }
  };

  const handleLike = async (id) => {
    if (likedSet.has(id)) return; 

    setLikedSet(prev => new Set(prev).add(id));
    
    try {
      await fetch(`/api/suggestion/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      setLikedSet(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert('点赞失败');
    }
  };

  const updateLikeCount = (id, newCount) => {
    setRootComments(prev => prev.map(c => c.id === id ? { ...c, likes: newCount } : c));
    // 子评论不需要更新点赞数，因为子评论不显示点赞
  };

  return (
    <div className={styles.suggestionContainer}>
      {/* 顶部输入 */}
      <div className={styles.globalInfoBar}>
        <input className={styles.smallInput} placeholder="昵称" value={authorName} onChange={e => setAuthorName(e.target.value)} />
        <input className={styles.smallInput} placeholder="邮箱" value={authorEmail} onChange={e => setAuthorEmail(e.target.value)} />
        <input className={styles.smallInput} placeholder="电话" value={authorSite} onChange={e => setAuthorSite(e.target.value)} />
      </div>

      <div className={styles.mainInputArea}>
        <textarea
          className={styles.commentInput}
          placeholder="发表新评论..."
          value={mainCommentText}
          onChange={e => setMainCommentText(e.target.value)}
          disabled={!!replyingToId}
        />
        <div className={styles.inputFooter}>
          <span>{mainCommentText.length} 字</span>
          <button className={styles.submitBtn} onClick={handleSubmitMain} disabled={!mainCommentText.trim()}>发布</button>
        </div>
      </div>

      {/* 评论列表 */}
      <div className={styles.commentList}>
        {rootComments.map(root => {
          const initialReplies = root.replies || []; // 后端返回的前 10 条
          const extraData = extraRepliesMap[root.id]; // 用户点击加载的后续子评论
          const allReplies = [...initialReplies, ...(extraData?.list || [])];
          const hasMore = extraData ? extraData.hasMore : root.hasMoreReplies;
          const isLoadingMore = extraData?.loading;

          return (
            <div key={root.id} className={styles.rootBlock}>
              {/* 1. 渲染父级评论 (有点赞、有回复按钮) */}
              <CommentItem
                comment={root}
                isChild={false}
                onReplyClick={handleReplyClick}
                replyingToId={replyingToId}
                submitReply={submitReply}
                cancelReply={cancelReply}
                replyText={replyText}
                setReplyText={setReplyText}
                handleLike={handleLike}
                likedSet={likedSet}
              />

              {/* 2. 渲染子评论区域 (无点赞、无回复按钮) */}
              {allReplies.length > 0 && (
                <div className={styles.childrenContainer}>
                  {allReplies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      isChild={true} // 关键：设为 true，隐藏操作栏
                      onReplyClick={() => {}} 
                      replyingToId={null}
                      submitReply={() => {}}
                      cancelReply={() => {}}
                      replyText=""
                      setReplyText={() => {}}
                      handleLike={() => {}}
                      likedSet={new Set()}
                    />
                  ))}
                </div>
              )}

              {/* 3. 加载更多子评论按钮 */}
              {hasMore && (
                <button 
                  className={styles.loadMoreBtn} 
                  onClick={() => loadMoreReplies(root.id)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? '加载中...' : '查看更多回复'}
                </button>
              )}
              
              <div className={styles.divider} />
            </div>
          );
        })}
      </div>

      {loadingRoot && <div className={styles.loadingText}>加载中...</div>}
      {!loadingRoot && hasMoreRoot && (
        <button className={styles.loadRootBtn} onClick={() => loadRootComments(false)}>
          下拉加载更多评论
        </button>
      )}
      {!hasMoreRoot && rootComments.length > 0 && <div className={styles.noMore}>没有更多评论了</div>}
    </div>
  );
};

export default Suggestion;