import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import styles from './MessageManagement.module.css';
import axios from 'axios';



const MessageManagement = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // ✅ 1. Socket.io连接改为相对路径（走Nginx的/socket.io/代理）
    // 不传URL则默认连接当前页面的域名（即Nginx的localhost:80）
    const newSocket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    setSocket(newSocket);

    const fetchInitialData = async () => {
      try {
        const res = await axios.get(`/api/CodeDatabase/getMessages`);
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error("初始数据加载失败", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    newSocket.on('connect', () => setConnectionStatus('connected'));
    newSocket.on('disconnect', () => setConnectionStatus('disconnected'));
    newSocket.on('connect_error', () => setConnectionStatus('error'));

    // 监听新消息
    newSocket.on('new_message_received', (newMessage) => {
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMessage.id)) return prev;
        return [newMessage, ...prev];
      });
      if (Notification.permission === "granted") {
        new Notification("新留言通知", { body: `来自 ${newMessage.requestername} 的新消息` });
      }
    });

    // 监听状态更新
    newSocket.on('message_updated', (updatedData) => {
      setMessages(prev => prev.map(msg => 
        msg.id === updatedData.id ? { ...msg, ...updatedData } : msg
      ));
    });

    // ✅ 新增：监听删除事件
    newSocket.on('message_deleted', (data) => {
      console.log('收到删除通知，ID:', data.id);
      setMessages(prev => prev.filter(msg => msg.id !== data.id));
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('new_message_received');
      newSocket.off('message_updated');
      newSocket.off('message_deleted'); // 记得清理新事件
      newSocket.disconnect();
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/CodeDatabase/markAsRead/${id}`);
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, isread: 1, responded: new Date().toISOString() } : msg
      ));
    } catch (err) {
      alert('标记失败');
    }
  };

  // ✅ 新增：删除处理函数
  const handleDelete = async (id) => {
    if (!window.confirm('确定要永久删除这条留言吗？此操作无法恢复。')) {
      return;
    }

    try {
      await axios.delete(`/api/CodeDatabase/deleteMessage/${id}`);
      // 乐观更新：先在前端移除，等待 socket 确认或直接移除
      setMessages(prev => prev.filter(msg => msg.id !== id));
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请稍后重试');
      // 如果失败，可能需要重新拉取列表以确保数据一致性
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className={styles.managementContainer}>
      <header className={styles.header}>
        <h2>留言管理</h2>
        <div className={styles.statusBadge}>
          连接状态: 
          <span className={`${styles.dot} ${connectionStatus === 'connected' ? styles.online : styles.offline}`}></span>
          {connectionStatus === 'connected' ? '实时在线' : '连接中...'}
        </div>
      </header>

      {isLoading ? (
        <div className={styles.loading}>加载中...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.messageTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>提交时间</th>
                <th>姓名</th>
                <th>联系方式</th>
                <th>问题描述</th>
                <th>状态</th>
                <th>回复时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr><td colSpan="8" className={styles.emptyRow}>暂无留言</td></tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className={msg.isread ? styles.readRow : styles.unreadRow}>
                    <td>{msg.id}</td>
                    <td>{formatDate(msg.submitted)}</td>
                    <td>{msg.requestername}</td>
                    <td>{msg.contact || '-'}</td>
                    <td className={styles.descCell}>{msg.description}</td>
                    <td>
                      <span className={msg.isread ? styles.badgeRead : styles.badgeUnread}>
                        {msg.isread ? '已读' : '未读'}
                      </span>
                    </td>
                    <td>{formatDate(msg.responded)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        {!msg.isread && (
                          <button 
                            className={styles.markBtn}
                            onClick={() => handleMarkAsRead(msg.id)}
                          >
                            标记已读
                          </button>
                        )}
                        {/* ✅ 新增：删除按钮 */}
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(msg.id)}
                          title="永久删除"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MessageManagement;