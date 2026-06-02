//防刷评论 未登录访客每天最多 100 条
//IP 限流
//内容去重
//基础 XSS 清洗
//未登录访客频率限制
//以上都灭有写
import React, { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import styles from './Suggestion.module.css';
import { useAuth } from '../../../context/AuthContext';

const API_URL = '/api/suggestion';
const socket = io('/');

const getGuestIdentity = () => {
  let guestId = localStorage.getItem('suggestion_guest_id');
  if (!guestId) {
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    guestId = `访客_${randomPart}`;
    localStorage.setItem('suggestion_guest_id', guestId);
  }
  return guestId;
};

const CommentItem = ({
  comment,
  isChild = false,
  onReply,
  onToggleReplies,
  isExpanded,
  loadingReplies
}) => {
  const replyCount = comment.replyCount || 0;

  return (
    <div className={isChild ? styles.childCommentItem : styles.rootCommentItem}>
      <div className={styles.commentAvatar}>
        {(comment.author || '匿').charAt(0)}
      </div>

      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>{comment.author}</span>

          {isChild && comment.replyToAuthor && (
            <>
              <span className={styles.replyArrow}>→</span>
              <span className={styles.replyToAuthor}>{comment.replyToAuthor}</span>
            </>
          )}

          <span className={styles.commentDate}>{comment.date}</span>

          {!isChild && comment.browser && (
            <span className={styles.commentBrowser}>{comment.browser}</span>
          )}
        </div>

        <div
          className={styles.commentContent}
          onClick={() => onReply(comment)}
        >
          {comment.content}
        </div>

        <div className={styles.commentActions}>
          <button
            className={styles.actionButton}
            onClick={() => onReply(comment)}
          >
            回复
          </button>

          {!isChild && replyCount > 0 && (
            <button
              className={styles.actionButton}
              onClick={() => onToggleReplies(comment.id)}
              disabled={loadingReplies}
            >
              {loadingReplies
                ? '加载中...'
                : isExpanded
                  ? '收起回复'
                  : `展开 ${replyCount} 条回复`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Suggestion = () => {
  const { user, isAuthenticated } = useAuth();

  const [rootComments, setRootComments] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [hasMoreRoot, setHasMoreRoot] = useState(true);

  const [expandedRepliesMap, setExpandedRepliesMap] = useState({});
  const [loadingRepliesMap, setLoadingRepliesMap] = useState({});

  const [composerText, setComposerText] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currentIdentity = useMemo(() => {
    if (isAuthenticated && user) {
      return {
        authorname: user.username || '已登录用户',
        authoremail: user.email || '',
        authoridentity: `user:${user.email || user.username || 'unknown'}`
      };
    }

    const guestId = getGuestIdentity();
    return {
      authorname: guestId,
      authoremail: '',
      authoridentity: `guest:${guestId}`
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadRootComments(true);

    socket.on('new_comment_added', ({ comment }) => {
      setRootComments(prev => [comment, ...prev]);
    });

    socket.on('new_reply_added', ({ parentId, reply }) => {
      setRootComments(prev =>
        prev.map(item => {
          if (item.id !== parentId) return item;
          return {
            ...item,
            replyCount: (item.replyCount || 0) + 1
          };
        })
      );

      setExpandedRepliesMap(prev => {
        if (!prev[parentId]) return prev;
        return {
          ...prev,
          [parentId]: [...prev[parentId], reply]
        };
      });
    });

    return () => {
      socket.off('new_comment_added');
      socket.off('new_reply_added');
    };
  }, []);

  const loadRootComments = async (reset = false) => {
    if (loadingRoot) return;

    setLoadingRoot(true);
    const currentPage = reset ? 1 : page;

    try {
      const res = await fetch(`${API_URL}/list?page=${currentPage}&limit=20`);
      const data = await res.json();

      if (data.length < 20) {
        setHasMoreRoot(false);
      } else if (reset) {
        setHasMoreRoot(true);
      }

      if (reset) {
        setRootComments(data);
        setPage(2);
        setExpandedRepliesMap({});
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

  const handleToggleReplies = async (parentId) => {
    if (expandedRepliesMap[parentId]) {
      setExpandedRepliesMap(prev => {
        const next = { ...prev };
        delete next[parentId];
        return next;
      });
      return;
    }

    if (loadingRepliesMap[parentId]) return;

    setLoadingRepliesMap(prev => ({ ...prev, [parentId]: true }));

    try {
      const res = await fetch(`${API_URL}/children?parentId=${parentId}`);
      const data = await res.json();

      setExpandedRepliesMap(prev => ({
        ...prev,
        [parentId]: data
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRepliesMap(prev => ({ ...prev, [parentId]: false }));
    }
  };

  const openComposerForReply = (comment) => {
    setReplyTarget(comment);
  };

  const closeComposer = () => {
    setComposerText('');
    setReplyTarget(null);
  };

  const getRootParentId = (comment) => {
    return comment.parentId ? comment.parentId : comment.id;
  };

  const sendComment = async () => {
    if (!composerText.trim()) {
      alert('请输入内容');
      return;
    }

    setSubmitting(true);

    try {
      const isReply = !!replyTarget;

      const payload = {
        content: composerText.trim(),
        authorname: currentIdentity.authorname,
        authoremail: currentIdentity.authoremail,
        authoridentity: currentIdentity.authoridentity,
        parentid: isReply ? getRootParentId(replyTarget) : null,
        replytoid: isReply ? replyTarget.id : null,
        replytoauthor: isReply ? replyTarget.author : null
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '提交失败');
      }

      setComposerText('');
      setReplyTarget(null);
    } catch (err) {
      console.error(err);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.suggestionPage}>
      <div className={styles.suggestionContainer}>
        <div className={styles.identityBar}>
          当前身份：
          <span className={styles.identityName}>{currentIdentity.authorname}</span>
          {currentIdentity.authoremail ? `（${currentIdentity.authoremail}）` : '（未绑定邮箱）'}
        </div>

        <div className={styles.commentList}>
          {rootComments.map(root => {
            const replies = expandedRepliesMap[root.id] || [];
            const isExpanded = !!expandedRepliesMap[root.id];
            const loadingReplies = !!loadingRepliesMap[root.id];

            return (
              <div key={root.id} className={styles.commentBlock}>
                <CommentItem
                  comment={root}
                  isChild={false}
                  onReply={openComposerForReply}
                  onToggleReplies={handleToggleReplies}
                  isExpanded={isExpanded}
                  loadingReplies={loadingReplies}
                />

                {isExpanded && replies.length > 0 && (
                  <div className={styles.repliesWrapper}>
                    {replies.map(reply => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        isChild={true}
                        onReply={openComposerForReply}
                        onToggleReplies={() => { }}
                        isExpanded={false}
                        loadingReplies={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {loadingRoot && <div className={styles.loadingText}>加载中...</div>}

        {!loadingRoot && hasMoreRoot && (
          <button className={styles.loadMoreRootBtn} onClick={() => loadRootComments(false)}>
            加载更多评论
          </button>
        )}

        {!hasMoreRoot && rootComments.length > 0 && (
          <div className={styles.noMoreText}>没有更多评论了</div>
        )}
      </div>

      <div className={styles.bottomComposer}>
        <div className={styles.bottomComposerHeader}>
          <div className={styles.bottomComposerTitle}>
            {replyTarget
              ? `回复 ${replyTarget.author}${replyTarget.replyToAuthor ? `（原回复 ${replyTarget.replyToAuthor}）` : ''}`
              : '发表评论'}
          </div>

          {replyTarget && (
            <button className={styles.cancelReplyBtn} onClick={closeComposer}>
              取消回复
            </button>
          )}
        </div>

        <div className={styles.bottomComposerBody}>
          <textarea
            className={styles.bottomTextarea}
            placeholder={replyTarget ? `回复 @${replyTarget.author}...` : '写下你的评论...'}
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
          />
          <button
            className={styles.sendButton}
            onClick={sendComment}
            disabled={!composerText.trim() || submitting}
          >
            {submitting ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Suggestion;