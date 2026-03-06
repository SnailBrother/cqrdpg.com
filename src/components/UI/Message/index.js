import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Message.module.css';

const MessageContext = createContext(null);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

const MessageItem = ({ message, onClose }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 自动关闭逻辑
    if (message.duration && message.duration > 0) {
      const closeTimer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => onClose(message.id), 300);
      }, message.duration);

      return () => clearTimeout(closeTimer);
    }
  }, [message.id, message.duration, onClose]);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onClose(message.id), 300);
  }, [message.id, onClose]);

  return (
    <div className={`${styles.message} ${styles[message.type] || styles.info} ${isLeaving ? styles.leaving : ''}`}>
      <div className={styles.messageContent}>{message.content}</div>
      <button className={styles.closeButton} onClick={handleClose}>
        ×
      </button>
    </div>
  );
};

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [portalRoot, setPortalRoot] = useState(null);

  // 使用 useRef 来跟踪是否已经创建了 portal root
  const portalCreatedRef = React.useRef(false);

  const removeMessage = useCallback((id) => {
    setMessages(currentMessages => currentMessages.filter(msg => msg.id !== id));
  }, []);

  const addMessage = useCallback((message) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newMessage = {
      id,
      type: 'info',
      duration: 3000,
      ...message,
    };
    setMessages(currentMessages => [...currentMessages, newMessage]);
    return id;
  }, []);

  const messageApi = React.useMemo(() => ({
    info: (content, options) => addMessage({ type: 'info', content, ...options }),
    success: (content, options) => addMessage({ type: 'success', content, ...options }),
    warning: (content, options) => addMessage({ type: 'warning', content, ...options }),
    error: (content, options) => addMessage({ type: 'error', content, ...options }),
  }), [addMessage]);

  const contextValue = React.useMemo(() => ({
    ...messageApi,
    addMessage,
    removeMessage,
  }), [messageApi, addMessage, removeMessage]);

  // 优化 portal root 创建逻辑
  useEffect(() => {
    // 如果已经创建了，直接返回
    if (portalCreatedRef.current) {
      return;
    }

    let element = document.getElementById('message-portal-root');
    
    // 如果不存在，创建新的
    if (!element) {
      element = document.createElement('div');
      element.id = 'message-portal-root';
      document.body.appendChild(element);
      portalCreatedRef.current = true;
    }
    
    setPortalRoot(element);

    // 清理函数
    return () => {
      // 注意：这里我们不自动移除 portal root，因为可能有多个组件使用
      // 让应用自己决定何时清理
    };
  }, []);

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
      {portalRoot && createPortal(
        <div className={styles.messageContainer}>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onClose={removeMessage}
            />
          ))}
        </div>,
        portalRoot
      )}
    </MessageContext.Provider>
  );
};

export default MessageProvider;