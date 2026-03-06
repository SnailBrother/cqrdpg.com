import React, { useState } from 'react';

const ChatConversations = () => {
  const [message, setMessage] = useState('');
  return (
    <div>
      <h2>聊天 - 会话</h2>
      <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="输入消息测试缓存" />
    </div>
  );
};

export default ChatConversations;


