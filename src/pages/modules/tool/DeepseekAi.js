import './DeepseekAi.css';
import React, { useState } from 'react';

const DeepseekAi = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // API configuration
  const apiConfig = {
    apiKey: "sk-821310d021b54b038d9cfa979b79f497",
    apiHost: "https://api.deepseek.com/v1",
    chatEndpoint: "/chat/completions"
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiConfig.apiHost}${apiConfig.chatEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [...messages.map(msg => ({ role: msg.role, content: msg.content })), userMessage],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage.content
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (text) => {
    return text.split('\n').map((paragraph, i) => {
      const html = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
      
      return (
        <p 
          key={i} 
          className="deepseekai-markdown-paragraph"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  };

  return (
    <div className="deepseekai-container">
      <h4 className="deepseekai-title">在线客服</h4>
      
      <div className="deepseekai-messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`deepseekai-message-wrapper ${msg.role === 'user' ? 'deepseekai-message-user' : 'deepseekai-message-assistant'}`}
          >
            <div className={`deepseekai-avatar ${msg.role === 'user' ? 'deepseekai-avatar-user' : 'deepseekai-avatar-assistant'}`}>
              {msg.role === 'user' ? '我' : '客服'}
            </div>
            <div className={`deepseekai-message-content ${msg.role === 'user' ? 'deepseekai-message-content-user' : 'deepseekai-message-content-assistant'}`}>
              <div className="deepseekai-message-text">
                {renderMarkdown(msg.content)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="deepseekai-loading">
            <div className="deepseekai-spinner"></div>
          </div>
        )}
      </div>
      
      <div className="deepseekai-input-container">
        <input
          type="text"
          className="deepseekai-text-input"
          placeholder="输入你的问题..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        
        <button 
          className={`deepseekai-send-button ${isLoading ? 'deepseekai-send-button-disabled' : ''}`}
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? '思考中...' : '发送'}
        </button>
      </div>
    </div>
  );
};

export default DeepseekAi;