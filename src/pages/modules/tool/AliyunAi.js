import React, { useState, useRef, useEffect } from 'react';
import styles from './AliyunAi.module.css';

const AliyunAi = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: '您好！我是房产AI助手，可以帮您查询房价、对比区域、分析趋势等。请问有什么可以帮您？', 
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);
  
  // API配置
  const API_CONFIG = {
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: 'sk-cf3cf29dbeaa4edc9765d4ae83ebdc1e',
    model: 'qwen-max'
  };

  // 滚动到最新消息
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 发送消息到阿里云百炼API
  const sendToAliyunAPI = async (message, history) => {
    try {
      const response = await fetch(API_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: API_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的房产AI助手，专门帮助用户查询房产信息、分析房价趋势、对比不同区域房价等。回答要专业、准确、简洁。如果用户询问具体房价，需要给出基于历史数据的分析。'
            },
            ...history.map(msg => ({
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.text
            })),
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '抱歉，我没有理解您的问题。';
    } catch (error) {
      console.error('调用阿里云API失败:', error);
      return '抱歉，服务暂时不可用，请稍后重试。';
    }
  };

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 添加到消息列表
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // 更新对话历史
      const updatedHistory = [...conversationHistory, userMessage];
      setConversationHistory(updatedHistory);

      // 发送到阿里云API
      const aiResponse = await sendToAliyunAPI(inputText.trim(), updatedHistory.slice(-10)); // 只发送最近10条历史

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversationHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: '抱歉，发送消息时出现错误，请稍后重试。',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 清除对话
  const handleClearConversation = () => {
    setMessages([
      { 
        id: 1, 
        text: '您好！我是房产AI助手，可以帮您查询房价、对比区域、分析趋势等。请问有什么可以帮您？', 
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setConversationHistory([]);
  };

  // 快速问题示例
  const quickQuestions = [
    '永川区凰城御府现在多少钱？',
    '对比一下永川和江津的房价',
    '最近半年房价趋势怎么样？',
    '帮我推荐几个性价比高的小区',
    '100平米左右的住宅大概什么价格？'
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>
            <span className={styles.avatarText}>AI</span>
          </div>
          <div>
            <h2 className={styles.title}>房产AI助手</h2>
            <p className={styles.subtitle}>基于阿里云百炼大模型</p>
          </div>
        </div>
        <button 
          onClick={handleClearConversation}
          className={styles.clearButton}
          title="清除对话"
        >
          🗑️ 清除
        </button>
      </div>

      <div className={styles.chatContainer}>
        <div className={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.messageWrapper} ${
                message.isUser ? styles.userMessage : styles.aiMessage
              }`}
            >
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  <span className={styles.sender}>
                    {message.isUser ? '您' : 'AI助手'}
                  </span>
                  <span className={styles.timestamp}>{message.timestamp}</span>
                </div>
                <div className={styles.messageText}>
                  {message.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className={`${styles.messageWrapper} ${styles.aiMessage}`}>
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  <span className={styles.sender}>AI助手</span>
                  <span className={styles.timestamp}>思考中...</span>
                </div>
                <div className={styles.typingIndicator}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 快速问题建议 */}
        {messages.length <= 1 && (
          <div className={styles.quickQuestions}>
            <p className={styles.quickQuestionsTitle}>您可以尝试问：</p>
            <div className={styles.quickQuestionsGrid}>
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(question)}
                  className={styles.quickQuestionButton}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.inputContainer}>
          <div className={styles.textareaWrapper}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入您的问题，例如：查询永川区房价..."
              className={styles.textarea}
              rows="3"
              disabled={isLoading}
            />
            <div className={styles.textareaActions}>
              <span className={styles.charCount}>
                {inputText.length}/500
              </span>
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className={styles.sendButton}
              >
                {isLoading ? (
                  <span className={styles.loadingText}>发送中...</span>
                ) : (
                  <>
                    <span className={styles.sendIcon}>📤</span>
                    发送
                  </>
                )}
              </button>
            </div>
          </div>
          <div className={styles.inputTips}>
            <span>提示：按 Enter 发送，Shift + Enter 换行</span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          由阿里云百炼大模型提供技术支持 • 对话数据不保存
        </p>
      </div>
    </div>
  );
};

export default AliyunAi;