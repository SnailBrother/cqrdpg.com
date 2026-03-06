import React, { useState, useRef, useEffect } from 'react';
import styles from './RealEstateAISearch.module.css';

const RealEstateAISearch = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showExamples, setShowExamples] = useState(true);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    
    // 新增状态控制显示
    const [showSQL, setShowSQL] = useState(false);
    const [showExamplePopup, setShowExamplePopup] = useState(false);
    const [useAliyunAI, setUseAliyunAI] = useState(false); // 新增：是否使用阿里云API
    const popupRef = useRef(null);
    const exampleBtnRef = useRef(null);

    // 阿里云百炼API配置
    //https://bailian.console.aliyun.com/cn-beijing/?spm=a2c4g.11186623.0.0.3234c7b4B95o8W&tab=model#/api-key
    const API_CONFIG = {
        endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        apiKey: 'sk-cf3cf29dbeaa4edc9765d4ae83ebdc1e',
        model: 'qwen-max'
    };

    // 监听点击外部关闭悬浮框
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!showExamplePopup) return;

            const isClickInsidePopup = popupRef.current && popupRef.current.contains(event.target);
            const isClickOnExampleBtn = exampleBtnRef.current && exampleBtnRef.current.contains(event.target);

            if (!isClickInsidePopup && !isClickOnExampleBtn) {
                setShowExamplePopup(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExamplePopup]);

    // 示例查询语句
    const exampleQueries = [
        "渝中区有哪些房源？",
        "对比一下渝北和江北的房价",
        "最近半年重庆房价趋势如何？",
        "统计一下重庆渝北区房源分布",
        "找带电梯的住宅",
        "南岸区房屋均价多少",
        "永川区凰城御府现在多少钱",
    ];

    // 滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // 调用阿里云百炼API
    const callAliyunAPI = async (message, history) => {
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
                            content: '你是一个专业的房产AI助手，专门帮助用户查询房产信息、分析房价趋势、对比不同区域房价等。回答要专业、准确、简洁。如果用户询问具体房价，需要给出基于历史数据的分析。请用中文回答。'
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

    // 发送消息
    const sendMessage = async (message = inputText) => {
        if (!message.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);
        setShowExamples(false);

        try {
            if (useAliyunAI) {
                // 使用阿里云百炼API
                const history = messages.slice(-5).map(m => ({
                    isUser: m.type === 'user',
                    text: m.content
                }));
                
                const aiResponse = await callAliyunAPI(message, history);

                // 模拟AI打字效果
                setIsTyping(true);
                let displayedText = '';

                const typingInterval = setInterval(() => {
                    if (displayedText.length < aiResponse.length) {
                        displayedText = aiResponse.substring(0, displayedText.length + 1);

                        setMessages(prev => {
                            const lastMessage = prev[prev.length - 1];
                            if (lastMessage?.type === 'ai') {
                                return [
                                    ...prev.slice(0, -1),
                                    { ...lastMessage, content: displayedText }
                                ];
                            } else {
                                return [
                                    ...prev,
                                    {
                                        id: Date.now() + 1,
                                        type: 'ai',
                                        content: displayedText,
                                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                        isAliyunAI: true // 标记为阿里云AI回复
                                    }
                                ];
                            }
                        });
                    } else {
                        clearInterval(typingInterval);
                        setIsTyping(false);
                    }
                }, 20);
            } else {
                // 使用原有的后端API
                const response = await fetch('/api/ai-query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        question: message,
                        history: messages.slice(-5).map(m => ({
                            role: m.type === 'user' ? 'user' : 'assistant',
                            content: m.content
                        }))
                    }),
                });

                const data = await response.json();

                // 模拟AI打字效果
                setIsTyping(true);
                const aiResponse = data.response || "抱歉，我暂时无法回答这个问题。";
                let displayedText = '';

                const typingInterval = setInterval(() => {
                    if (displayedText.length < aiResponse.length) {
                        displayedText = aiResponse.substring(0, displayedText.length + 1);

                        setMessages(prev => {
                            const lastMessage = prev[prev.length - 1];
                            if (lastMessage?.type === 'ai') {
                                return [
                                    ...prev.slice(0, -1),
                                    { ...lastMessage, content: displayedText }
                                ];
                            } else {
                                return [
                                    ...prev,
                                    {
                                        id: Date.now() + 1,
                                        type: 'ai',
                                        content: displayedText,
                                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                        sql: data.sql,
                                        data: data.data,
                                        analysis: data.analysis,
                                        isAliyunAI: false // 标记为非阿里云AI回复
                                    }
                                ];
                            }
                        });
                    } else {
                        clearInterval(typingInterval);
                        setIsTyping(false);
                    }
                }, 20);

                // 如果有SQL和数据，添加到消息中
                if (data.sql || data.data) {
                    setTimeout(() => {
                        setMessages(prev => {
                            const lastMsg = prev[prev.length - 1];
                            if (lastMsg.type === 'ai') {
                                return [
                                    ...prev.slice(0, -1),
                                    {
                                        ...lastMsg,
                                        sql: data.sql,
                                        data: data.data,
                                        analysis: data.analysis
                                    }
                                ];
                            }
                            return prev;
                        });
                    }, 500);
                }
            }

        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 2,
                type: 'ai',
                content: "抱歉，网络连接出现问题，请稍后重试。",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // 处理示例点击
    const handleExampleClick = (example) => {
        setInputText(example);
    };

    // 处理键盘事件
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // 格式化SQL
    const formatSQL = (sql) => {
        if (!sql) return null;
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'JOIN', 'LEFT JOIN', 'INNER JOIN', 'ON', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'BETWEEN', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL', 'DESC', 'ASC'];

        let formatted = sql;
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            formatted = formatted.replace(regex, `<span class="${styles.sqlKeyword}">${keyword}</span>`);
        });

        return { __html: formatted.replace(/\n/g, '<br>') };
    };

    // 格式化数据表格
    const formatData = (data) => {
        if (!data || !Array.isArray(data) || data.length === 0) return null;

        const formattedData = data.map((item, index) => {
            const { reportsID, ...rest } = item || {};
            return { 序号: index + 1, ...rest };
        });

        const headers = Object.keys(formattedData[0]);

        return (
            <div className={styles.dataTable}>
                <table>
                    <thead>
                        <tr>
                            {headers.map(header => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {formattedData.slice(0, 10).map((row, index) => (
                            <tr key={index}>
                                {headers.map(header => (
                                    <td key={header}>
                                        {typeof row[header] === 'boolean'
                                            ? (row[header] ? '是' : '否')
                                            : row[header]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {formattedData.length > 10 && (
                    <div className={styles.tableNote}>
                        显示前10条记录，共 {formattedData.length} 条
                    </div>
                )}
            </div>
        );
    };

    // 渲染消息内容
    const renderMessageContent = (message) => {
        if (message.type === 'user') {
            return (
                <div className={styles.userMessage}>
                    <div className={styles.messageContent}>{message.content}</div>
                    <div className={styles.messageTime}>{message.timestamp}</div>
                </div>
            );
        }

        return (
            <div className={styles.aiMessage}>
                {/* 如果是阿里云AI回复，显示标识 */}
                {message.isAliyunAI && (
                    <div className={styles.aliyunTag}>
                        <span className={styles.aliyunIcon}>☁️</span>
                        阿里百炼
                    </div>
                )}
                
                <div className={styles.aiContent}>
                    {message.content}
                </div>

                {showSQL && message.sql && !message.isAliyunAI && (
                    <div className={styles.sqlSection}>
                        <div className={styles.sqlTitle}>
                            <span>📋 生成的SQL：</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => navigator.clipboard.writeText(message.sql)}
                            >
                                复制SQL
                            </button>
                        </div>
                        <div
                            className={styles.sqlCode}
                            dangerouslySetInnerHTML={formatSQL(message.sql)}
                        />
                    </div>
                )}

                {message.data && message.data.length > 0 && !message.isAliyunAI && (
                    <div className={styles.dataSection}>
                        <div className={styles.dataTitle}>📊 查询结果：</div>
                        {formatData(message.data)}
                    </div>
                )}

                {message.analysis && !message.isAliyunAI && (
                    <div className={styles.analysisSection}>
                        <div className={styles.analysisTitle}>📈 数据分析：</div>
                        <div className={styles.analysisContent}>{message.analysis}</div>
                    </div>
                )}

                <div className={styles.messageTime}>{message.timestamp}</div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.chatArea}>
                {/* 消息容器 */}
                <div className={styles.messagesContainer} ref={chatContainerRef}>
                    {messages.length === 0 ? (
                        <div className={styles.welcomeSection}>
                            <div className={styles.tipsBox}>
                                <div className={styles.tipItem}>📍 支持重庆所有区域查询</div>
                                <div className={styles.tipItem}>💰 支持价格区间筛选</div>
                                <div className={styles.tipItem}>🏠 支持户型、面积、楼层查询</div>
                                <div className={styles.tipItem}>📊 支持统计分析</div>
                                <div className={`${styles.tipItem} ${styles.aliyunTip}`}>
                                    ☁️ {useAliyunAI ? '当前使用阿里云AI模式' : '可切换到阿里云AI模式'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.messages}>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`${styles.message} ${message.type === 'user' ? styles.user : styles.ai}`}
                                >
                                    {renderMessageContent(message)}
                                </div>
                            ))}
                            {isTyping && (
                                <div className={styles.typingIndicator}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* 输入区域 */}
                <div className={styles.inputContainer}>
                    <div className={styles.inputWrapper}>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="请输入您的问题，例如：重庆市渝中区有哪些房子？"
                            disabled={isLoading}
                            rows="3"
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.displaySettings}>
                        {/* 示例查询悬浮框按钮 */}
                        <button
                            ref={exampleBtnRef}
                            className={styles.toggleBtn}
                            onClick={() => setShowExamplePopup(!showExamplePopup)}
                            title="查看示例问题"
                        >
                            💡 示例问题
                        </button>

                        {/* 示例查询悬浮框 */}
                        {showExamplePopup && (
                            <div ref={popupRef} className={styles.examplesPopup}>
                                <div className={styles.popupHeader}>
                                    <span>💡 试试这样问我</span>
                                    <button
                                        className={styles.closeBtn}
                                        onClick={() => setShowExamplePopup(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className={styles.popupContent}>
                                    {exampleQueries.map((query, index) => (
                                        <div
                                            key={index}
                                            className={styles.popupExample}
                                            onClick={() => {
                                                setInputText(query);
                                                setShowExamplePopup(false);
                                            }}
                                        >
                                            {query}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 显示SQL按钮 */}
                        {!useAliyunAI && (
                            <button
                                className={`${styles.toggleBtn} ${showSQL ? styles.active : ''}`}
                                onClick={() => setShowSQL(!showSQL)}
                                title={showSQL ? "隐藏SQL语句" : "显示SQL语句"}
                            >
                                📋 {showSQL ? '隐藏SQL' : '显示SQL'}
                            </button>
                        )}

                        {/* 切换阿里云AI模式按钮 */}
                        <button
                            className={`${styles.toggleBtn} ${useAliyunAI ? styles.active : ''} ${styles.aliyunBtn}`}
                            onClick={() => setUseAliyunAI(!useAliyunAI)}
                            title={useAliyunAI ? "切换到数据库查询模式" : "切换到阿里云AI模式"}
                        >
                            {useAliyunAI ? (
                                <>
                                    <span className={styles.aliyunIcon}>☁️</span>
                                    数据库查询
                                </>
                            ) : (
                                <>
                                    <span className={styles.aliyunIcon}>🤖</span>
                                    阿里百炼
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => sendMessage()}
                            disabled={!inputText.trim() || isLoading}
                            className={styles.sendBtn}
                        >
                            {isLoading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                </>
                            ) : (
                                <svg className={styles.sendIcon} viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealEstateAISearch;