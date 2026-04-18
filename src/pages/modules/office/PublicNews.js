import './PublicNews.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Loading } from '../../../components/UI';

// 创建Socket连接
const socket = io('https://www.cqrdpg.com:5202');

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const PublicNews = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null); // 存储选中的完整消息对象
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessageNotification, setNewMessageNotification] = useState(null);

  // 获取初始消息数据
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get('/api/getMessageDetailData');
        setMessages(response.data.MessageDetail);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();

    // 设置Socket监听
    socket.on('message-update', (updatedMessages) => {
      setMessages(updatedMessages);

      // 如果有新消息，显示通知
      if (updatedMessages.length > messages.length) {
        const newestMessage = updatedMessages[0];
        setNewMessageNotification({
          title: newestMessage.title,
          id: newestMessage.id
        });

        // 5秒后自动消失
        setTimeout(() => {
          setNewMessageNotification(null);
        }, 5000);
      }
    });

    // 组件卸载时移除监听
    return () => {
      socket.off('message-update');
    };
  }, [messages.length]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCloseNotification = () => {
    setNewMessageNotification(null);
  };

  // 查看消息详情
  const handleViewMessage = (message) => {
    setSelectedMessage(message);
  };

  // 返回消息列表
  const handleBackToList = () => {
    setSelectedMessage(null);
  };

  const filteredMessages = messages.filter((message) =>
    message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (message.content && message.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <div className="PublicNews-loading"><Loading message="消息加载中" /></div>;
  }

  // 如果正在查看消息详情
  if (selectedMessage) {
    return (
      <div className="PublicNews-container">
        {/* 返回按钮 */}
        <div className="PublicNews-back-button-container">
          <button 
            onClick={handleBackToList}
            className="PublicNews-back-button"
          >
            返回
          </button>
        </div>

        {/* 消息详情内容 */}
        <div className="PublicNews-detail-container">
          <h2 className="PublicNews-detail-title">{selectedMessage.title}</h2>
          <p className="PublicNews-detail-time">发布时间：{formatDate(selectedMessage.time)}</p>
          <div className="PublicNews-detail-content">{selectedMessage.content}</div>
        </div>
      </div>
    );
  }

  // 消息列表界面
  return (
    <div className="PublicNews-container">
      {/* 新消息通知 */}
      {newMessageNotification && (
        <div className="PublicNews-notification">
          <div className="PublicNews-notification-content">
            新公告: {newMessageNotification.title}
            <button
              onClick={() => {
                const message = messages.find(msg => msg.id === newMessageNotification.id);
                if (message) handleViewMessage(message);
              }}
              className="PublicNews-notification-link"
            >
              查看
            </button>
          </div>
          <button
            onClick={handleCloseNotification}
            className="PublicNews-notification-close"
          >
            ×
          </button>
        </div>
      )}

      {/* 搜索框 */}
      <div className="PublicNews-search">
        <input
          type="text"
          placeholder="搜索公告..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="PublicNews-search-input"
        />
      </div>

      <div className="PublicNews-message-list">
        {filteredMessages.length === 0 ? (
          <div className="PublicNews-no-results">没有找到相关的公告。</div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className="PublicNews-message-item"
              onClick={() => handleViewMessage(message)}
            >
              <div className="PublicNews-message-title">
                {message.title}
              </div>
              <div className="PublicNews-message-time">发布时间：{formatDate(message.time)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PublicNews;