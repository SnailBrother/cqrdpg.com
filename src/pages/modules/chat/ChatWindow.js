import React, { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import './ChatWindow.css';
import { Loading } from '../../../components/UI';

import Circularrotatingtext from './.././../../components/Animation/Circularrotatingtext'; // 加载动画里面的环形旋转文字
const socket = io('http://121.4.22.55:5202');

const ChatWindow = ({ selectedFriend, username, themeSettings, userHeadImage }) => {
    const [messages, setMessages] = useState([]);
    const [senderName, setSenderName] = useState(username);
    const [receiverName, setReceiverName] = useState(selectedFriend ? selectedFriend.name : '我们来聊天吧');
    const [messageText, setMessageText] = useState('');
     // 移除这一行：const { username: currentUsername } = useContext(useAuth);
    const currentUsername = username; // 直接使用传入的 username
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const inputRef = useRef(null); // 用于引用文本输入框
    const messageListRef = useRef(null); // 用于引用消息列表
    const [isModalOpen, setIsModalOpen] = useState(false); // 模拟框图片
    const [selectedImage, setSelectedImage] = useState(null); // 用于存储当前选中的图片
    // 分页相关状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20); // 每页消息数量
    const [hasMore, setHasMore] = useState(true); // 是否还有更多消息
    const [isLoading, setIsLoading] = useState(false); // 是否正在加载

    const [isInitialLoad, setIsInitialLoad] = useState(true); // 标记是否为初次加载
    const [totalMessages, setTotalMessages] = useState([]); // 存储全部消息
    const [totalUnread, setTotalUnread] = useState(0); // 未读消息总数
    const [hasNewMessages, setHasNewMessages] = useState(false); // 新增：是否有新消息 针对滚动条不是在顶部的提示
    const [isAtBottom, setIsAtBottom] = useState(true); // 新增：是否在底部

    // 模拟框图片
    const handleAvatarClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsModalOpen(true);
    };
    const [isUploading, setIsUploading] = useState(false); // 新增：图片上传状态
    // 处理图片上传
    // 在前端的 handleImageUpload 函数中，确保正确设置 FormData
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!selectedFriend) {
            alert('请先选择聊天对象');
            return;
        }

        // 检查文件类型
        if (!file.type.match(/image\/(jpeg|jpg|png|gif|bmp|webp)/)) {
            alert('请选择图片文件 (JPEG, JPG, PNG, GIF, BMP, WebP)');
            return;
        }

        // 检查文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过5MB');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('sender_name', username);
            formData.append('receiver_name', selectedFriend.name);

            console.log('上传图片数据:', {
                sender_name: username,
                receiver_name: selectedFriend.name,
                file_name: file.name,
                file_size: file.size
            });

            const response = await axios.post('http://121.4.22.55:5202/api/messages/uploadImage', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000 // 30秒超时
            });

            if (response.data.success) {
                console.log('图片发送成功:', response.data);
            }
        } catch (error) {
            console.error('图片上传失败:', error);
            let errorMessage = '图片上传失败';
            if (error.response) {
                errorMessage += ': ' + (error.response.data.error || error.response.data.message);
            } else if (error.request) {
                errorMessage += ': 网络错误，请检查网络连接';
            } else {
                errorMessage += ': ' + error.message;
            }
            alert(errorMessage);
        } finally {
            setIsUploading(false);
            // 清空文件输入
            event.target.value = '';
        }
    };

    // 获取图片URL
    const getImageUrl = (senderName, filename) => {
        return `http://121.4.22.55:8888/backend/images/ChatImages/${senderName}/${filename}`;
    };

    // 渲染消息内容
    // const renderMessageContent = (message) => {
    //     if (message.message_type === 'image') {
    //         return (
    //             <div className="chat-image-message">
    //                 <img
    //                     src={getImageUrl(message.sender_name, message.image_filename)}
    //                     alt="聊天图片"
    //                     className="chat-message-image"
    //                     onClick={() => handleAvatarClick(getImageUrl(message.sender_name, message.image_filename))}
    //                 />
    //             </div>
    //         );
    //     } else {
    //         return <p>{message.message_text}</p>;
    //     }
    // };
    // 渲染消息内容
    const renderMessageContent = (message) => {
        if (message.message_type === 'image') {
            return (
                <div className="chat-image-message">
                    <img
                        src={getImageUrl(message.sender_name, message.image_filename)}
                        alt="聊天图片"
                        className="chat-message-image"
                        onClick={() => handleAvatarClick(getImageUrl(message.sender_name, message.image_filename))}
                        onLoad={(e) => {
                            // 图片加载完成后可以做一些处理
                            console.log('图片加载完成');
                        }}
                        onError={(e) => {
                            // 图片加载失败处理
                            console.error('图片加载失败');
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            );
        } else {
            return <p style={{ margin: 0, padding: '6px 8px' }}>{message.message_text}</p>;
        }
    };

    // 获取未读消息总数（排除当前选中好友）
    const fetchUnreadCounts = async () => {
        try {
            const response = await axios.get('http://121.4.22.55:5202/api/messages');
            const allMessages = response.data;

            const unreadCounts = {};
            allMessages.forEach(msg => {
                if (msg.receiver_name === username && !msg.is_read) {
                    unreadCounts[msg.sender_name] = (unreadCounts[msg.sender_name] || 0) + 1;
                }
            });

            let total = 0;
            Object.entries(unreadCounts).forEach(([sender, count]) => {
                if (selectedFriend && sender === selectedFriend.name) {
                    return;
                }
                total += count;
            });

            setTotalUnread(total);
        } catch (error) {
            console.error('Error fetching unread counts:', error);
        }
    };

    useEffect(() => {
        socket.on('unreadCountsUpdated', fetchUnreadCounts);
        return () => {
            socket.off('unreadCountsUpdated');
        };
    }, [username, selectedFriend]);

    // 主题颜色 包括三角符号
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--their-bubble-color', themeSettings.theirBubbleColor);
        root.style.setProperty('--my-bubble-color', themeSettings.myBubbleColor);
    }, [themeSettings]);

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return '';
    }

    // 直接使用本地时间，不要手动加减小时
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
};

    // 初次加载时标记未读消息为已读
    // 获取消息的函数（支持分页） - 提取到 useEffect 外部
    const fetchMessages = async (page = 1, isLoadMore = false) => {
        if (!selectedFriend) return;

        setIsLoading(true);
        try {
            const response = await axios.get('http://121.4.22.55:5202/api/messages/chat', {
                params: {
                    senderName: username,
                    receiverName: selectedFriend.name,
                    page: page,
                    pageSize: pageSize
                }
            });

            const newMessages = response.data;

            if (newMessages.length === 0) {
                setHasMore(false);
                return;
            }

            if (isLoadMore) {
                // 加载更多时，将新消息添加到现有消息前面
                setMessages(prevMessages => [...newMessages, ...prevMessages]);
            } else {
                // 初次加载时，直接设置消息
                setMessages(newMessages);
                setCurrentPage(1);
                setHasMore(newMessages.length === pageSize);
            }

            // 标记未读消息为已读（只标记当前可见的消息）
            if (!isLoadMore) {
                const unreadMessageIds = newMessages
                    .filter(msg => msg.receiver_name === currentUsername && !msg.is_read)
                    .map(msg => msg.message_id);
                if (unreadMessageIds.length > 0) {
                    await markMessagesAsRead(unreadMessageIds);
                }
            }

        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 加载更多消息
    const loadMoreMessages = async () => {
        if (isLoading || !hasMore) return;

        const nextPage = currentPage + 1;
        await fetchMessages(nextPage, true);
        setCurrentPage(nextPage);
    };

    // 初次加载消息
    useEffect(() => {
        if (selectedFriend) {
            setReceiverName(selectedFriend.name);
            setCurrentPage(1);
            setHasMore(true);
            setMessages([]); // 清空旧消息
            fetchMessages(1, false); // 加载第一页
        }
    }, [selectedFriend, username, currentUsername]); // 移除 isInitialLoad 依赖

    // Socket 监听器
    useEffect(() => {
        const handleNewMessage = (newMessage) => {
            if (
                (newMessage.sender_name === senderName && newMessage.receiver_name === receiverName) ||
                (newMessage.sender_name === receiverName && newMessage.receiver_name === senderName)
            ) {
                // 新消息添加到列表末尾
                //setMessages((prevMessages) => [...prevMessages, newMessage]);
                // 防止重复添加相同的消息
                setMessages((prevMessages) => {
                    const isDuplicate = prevMessages.some(
                        msg => msg.message_id === newMessage.message_id
                    );
                    if (isDuplicate) {
                        return prevMessages;
                    }
                    return [...prevMessages, newMessage];
                });
                // 如果是别人发来的消息且用户不在底部，显示新消息提示
                if (newMessage.sender_name === receiverName &&
                    newMessage.receiver_name === senderName &&
                    !isAtBottom) {
                    setHasNewMessages(true);
                }

                // 如果是别人发来的消息且用户在底部，自动标记为已读
                if (newMessage.sender_name === receiverName &&
                    newMessage.receiver_name === senderName &&
                    isAtBottom) {
                    markMessagesAsRead([newMessage.message_id]);
                }
            }
        };

        socket.on('newMessage', handleNewMessage);

        // 刷新消息时重新加载第一页
        socket.on('refreshMessages', async () => {
            if (selectedFriend) {
                await fetchMessages(1, false);
            }
        });

        socket.on('messagesRead', (messageIds) => {
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    messageIds.includes(msg.message_id) ? { ...msg, is_read: 1 } : msg
                )
            );
        });

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('refreshMessages');
            socket.off('messagesRead');
        };
    }, [selectedFriend, username, senderName, receiverName, currentUsername, isAtBottom, fetchMessages]); // 添加 fetchMessages 依赖

    // Socket 监听器单独使用一个 useEffect
    useEffect(() => {
        const handleNewMessage = (newMessage) => {
            if (
                (newMessage.sender_name === senderName && newMessage.receiver_name === receiverName) ||
                (newMessage.sender_name === receiverName && newMessage.receiver_name === senderName)
            ) {
                // 新消息添加到列表末尾
                setMessages((prevMessages) => [...prevMessages, newMessage]);

                // 如果是别人发来的消息且用户不在底部，显示新消息提示
                if (newMessage.sender_name === receiverName &&
                    newMessage.receiver_name === senderName &&
                    !isAtBottom) {
                    setHasNewMessages(true);
                }

                // 如果是别人发来的消息且用户在底部，自动标记为已读
                if (newMessage.sender_name === receiverName &&
                    newMessage.receiver_name === senderName &&
                    isAtBottom) {
                    markMessagesAsRead([newMessage.message_id]);
                }
            }
        };

        socket.on('newMessage', handleNewMessage);

        // 刷新消息时重新加载第一页
        socket.on('refreshMessages', async () => {
            if (selectedFriend) {
                await fetchMessages(1, false);
            }
        });

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('refreshMessages');
        };
    }, [selectedFriend, username, senderName, receiverName, currentUsername, isAtBottom]);

    // 滚动到底部的函数
    const scrollToBottom = () => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
            setHasNewMessages(false);
            setIsAtBottom(true);

            // 滚动到底部时标记所有未读消息为已读
            const unreadMessageIds = messages
                .filter(msg => msg.receiver_name === currentUsername && !msg.is_read)
                .map(msg => msg.message_id);
            if (unreadMessageIds.length > 0) {
                markMessagesAsRead(unreadMessageIds);
            }
        }
    };

    // 智能滚动：只在用户接近底部时自动滚动
    useEffect(() => {
        if (messageListRef.current && isAtBottom) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages, isAtBottom]);

    // 标记所有消息为已读
    const handleMarkAllAsRead = async () => {
        if (!selectedFriend || !username) return; // 如果没有选中好友或用户未登录，直接返回

        try {
            await axios.put('http://121.4.22.55:5202/api/messages/markAllAsRead', {
                sender_name: selectedFriend.name, // 好友的用户名
                receiver_name: username // 当前用户的用户名
            });

            // 更新本地消息状态为已读
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.sender_name === selectedFriend.name && msg.receiver_name === username
                        ? { ...msg, is_read: 1 }
                        : msg
                )
            );

            // 通知服务器消息已读
            socket.emit('messagesReadByReceiver', {
                senderName: selectedFriend.name,
                receiverName: username,
                messageIds: messages
                    .filter(msg => msg.sender_name === selectedFriend.name && msg.receiver_name === username)
                    .map(msg => msg.message_id)
            });

        } catch (error) {
            console.error('Error marking all messages as read:', error);
        }
    };

    // 发送消息
    const handleSendMessage = async () => {
        if (messageText.trim() === '') {
            alert('请输入消息内容');
            return;
        }

        try {
            // 发送消息
            await axios.post('http://121.4.22.55:5202/api/messages', {
                message_text: messageText,
                sender_name: senderName,
                receiver_name: receiverName
            });

            // 将当前好友发送给当前用户的所有消息标记为已读
            await handleMarkAllAsRead();

            setMessageText('');

            // 手动更新未读消息数量
            socket.emit('updateUnreadCounts', { receiverName });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // 阻止默认换行行为
            handleSendMessage();
        }
    };

    const handleSettingClick = () => {
        setIsSettingOpen(!isSettingOpen);
        if (!isSettingOpen) {
            setSelectedMessages([]);
            setIsAllSelected(false);
        }
    };

    const handleMessageSelect = (messageId) => {
        setSelectedMessages((prevSelectedMessages) => {
            if (prevSelectedMessages.includes(messageId)) {
                // 如果已经选中，则取消选中
                return prevSelectedMessages.filter(id => id !== messageId);
            } else {
                // 如果未选中，则添加到选中列表
                return [...prevSelectedMessages, messageId];
            }
        });
    };

    const handleSelectAll = () => {
        setIsAllSelected((prevIsAllSelected) => !prevIsAllSelected);
        if (!isAllSelected) {
            // 全选时，将所有消息的 ID 添加到选中列表
            setSelectedMessages(messages.map(msg => msg.message_id));
        } else {
            // 取消全选时，清空选中列表
            setSelectedMessages([]);
        }
    };

    // 在前端的 handleDeleteMessages 函数中
    const handleDeleteMessages = async () => {
        if (selectedMessages.length === 0) return;

        // 确认删除
        const confirmDelete = window.confirm(`确定要删除选中的 ${selectedMessages.length} 条消息吗？`);
        if (!confirmDelete) return;

        try {
            await axios.delete('http://121.4.22.55:5202/api/messages', {
                data: { messageIds: selectedMessages }
            });

            // 删除成功后，更新消息列表
            setMessages((prevMessages) =>
                prevMessages.filter(msg => !selectedMessages.includes(msg.message_id))
            );

            // 关闭设置菜单并清空选中列表
            setIsSettingOpen(false);
            setSelectedMessages([]);
            setIsAllSelected(false);

            // 显示删除成功提示
            // alert('消息删除成功');

        } catch (error) {
            console.error('删除消息失败:', error);
            alert('删除消息失败: ' + (error.response?.data || error.message));
        }
    };

    // 输入框获得焦点时标记未读消息为已读
    const handleInputFocus = async () => {
        const unreadMessageIds = messages
            .filter(msg => msg.receiver_name === currentUsername && !msg.is_read)
            .map(msg => msg.message_id);
        if (unreadMessageIds.length > 0) {
            await markMessagesAsRead(unreadMessageIds);
        }
    };

    // 滚动条滚动时处理 滚动到顶部时加载更多
    // 滚动条滚动时处理
    const handleScroll = async () => {
        const messageList = messageListRef.current;
        if (!messageList || isLoading) return;

        const { scrollTop, scrollHeight, clientHeight } = messageList;

        // 检查是否在底部
        const atBottom = scrollHeight - scrollTop - clientHeight <= 10;
        setIsAtBottom(atBottom);

        // 如果在底部，隐藏新消息提示并标记为已读
        if (atBottom) {
            setHasNewMessages(false);
            const unreadMessageIds = messages
                .filter(msg => msg.receiver_name === currentUsername && !msg.is_read)
                .map(msg => msg.message_id);
            if (unreadMessageIds.length > 0) {
                await markMessagesAsRead(unreadMessageIds);
            }
        }

        // 滚动到顶部时加载更多消息
        if (scrollTop === 0 && hasMore && !isLoading) {
            // 保存当前滚动位置
            const prevScrollHeight = messageList.scrollHeight;

            await loadMoreMessages();

            // 加载完成后恢复滚动位置
            setTimeout(() => {
                if (messageListRef.current) {
                    const newScrollHeight = messageListRef.current.scrollHeight;
                    messageListRef.current.scrollTop = newScrollHeight - prevScrollHeight;
                }
            }, 0);
        }
    };

    const markMessagesAsRead = async (messageIds) => {
        if (messageIds.length === 0) return;

        try {
            await axios.put('http://121.4.22.55:5202/api/messages/read', { messageIds });
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    messageIds.includes(msg.message_id) ? { ...msg, is_read: 1 } : msg
                )
            );

            // 通知服务器消息已读，携带必要信息
            socket.emit('messagesReadByReceiver', {
                senderName: senderName,
                receiverName: receiverName,
                messageIds: messageIds
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    useEffect(() => {
        const textarea = inputRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // 重置高度
            textarea.style.height = `${textarea.scrollHeight}px`; // 根据内容调整高度
        }
    }, [messageText]);

    return (
        // 根据 useBackgroundImage 的值决定是否使用背景图片，并替换用户名
        <div className="chat-friendmanagement-chatwindow-container"
            style={{
                backgroundColor: themeSettings.backgroundColor,
                backgroundImage: themeSettings.useBackgroundImage
                    ? `url(http://121.4.22.55:8888/backend/images/ChatApp/${username}/chatbackgroundimage/backgroundimage.jpg)`
                    : 'none',
                backgroundRepeat: 'no-repeat', // 背景图片不重复
                backgroundPosition: 'center center', // 背景图片居中
                backgroundSize: 'cover' // 背景图片覆盖整个容器，保持宽高比
            }}>

            {!selectedFriend && (
                <div className="chat-friendmanagement-chatwindow-empty">
                    <Circularrotatingtext userHeadImage={userHeadImage} /> {/* 传递 userHeadImage */}
                </div>
            )}
            {selectedFriend && (
                <>
                    {/* 头部内容 */}
                    <div className="chat-friendmanagement-chatwindow-header">
                        <div className="chat-friendmanagement-chatwindow-friend-name-container">
                            <h2 className="chat-friendmanagement-chatwindow-friend-name">
                                {/* 显示未读消息总数 */}
                                {totalUnread > 0 && (
                                    <span className="chat-friendmanagement-chatwindow-unread-count">
                                        {totalUnread}
                                    </span>
                                )}
                                {/* 显示昵称或用户名 */}
                                {selectedFriend.nickname ? (
                                    <span className="chat-friendmanagement-chatwindow-friend-nickname">
                                        {selectedFriend.nickname}
                                    </span>
                                ) : (
                                    <span>{selectedFriend.name}</span>
                                )}
                            </h2>
                            <svg className="chat-friend-chatwindow-list-usename-icon" aria-hidden="true">
                                <use xlinkHref="#icon-liaotian1"></use>
                            </svg>
                        </div>

                        {isSettingOpen && (
                            <div className="chat-friendmanagement-chatwindow-select-all">
                                {isAllSelected ? (
                                    //全不选
                                    <svg
                                        className="chat-friend-chatwindow-list-usename-icon"
                                        aria-hidden="true"
                                        onClick={handleSelectAll}
                                    >
                                        <use xlinkHref="#icon-quanxuan-xuanze"></use>
                                    </svg>
                                ) : (
                                    //全选
                                    <svg
                                        className="chat-friend-chatwindow-list-usename-icon"
                                        aria-hidden="true"
                                        onClick={handleSelectAll}
                                    >
                                        <use xlinkHref="#icon-winning-quanbuxuan"></use>
                                    </svg>
                                )}
                                {/* <span>全选</span> */}
                            </div>
                        )}
                        {/* 删除 */}
                        {isSettingOpen && selectedMessages.length > 0 && (
                            <button className="chat-friendmanagement-chatwindow-delete-button" onClick={handleDeleteMessages}>
                                <svg className="chat-friend-chatwindow-setting-button-icon" aria-hidden="true">
                                    <use xlinkHref="#icon-shanchu7"></use>
                                </svg>
                            </button>
                        )}

                        {/* 设置 */}
                        <button className="chat-friendmanagement-chatwindow-setting-button" onClick={handleSettingClick}>
                            <svg className="chat-friend-chatwindow-setting-button-icon" aria-hidden="true">
                                <use xlinkHref="#icon-shezhi2"></use>
                            </svg>
                        </button>

                    </div>
                    {/* 消息列表内容 */}
                    <div
                        className="chat-friendmanagement-chatwindow-message-list"
                        ref={messageListRef}
                        onScroll={handleScroll}
                        onClick={handleMarkAllAsRead} // 点击对话框时标记所有消息为已读
                    >
                        {/* 加载更多指示器 */}
                        {isLoading && (
                            <div className="chat-loading-indicator">
                                 <Loading message="信息加载中..." />
                                {/* 加载中... */}
                            </div>
                        )}

                        {/* 没有更多消息提示 */}
                        {!hasMore && messages.length > 0 && (
                            <div className="chat-no-more-messages">
                                没有更多消息了
                            </div>
                        )}  {/* 加载更多指示器 */}
                        {isLoading && (
                            <div className="chat-loading-indicator">
                                 <Loading message="信息加载中..." />
                                {/* 加载中... */}
                            </div>
                        )}

                        {messages.map((message, index) => {
                            const isMyMessage = message.sender_name === senderName;
                            const isImageMessage = message.message_type === 'image';
                            const fontColor = isMyMessage ? themeSettings.myFontColor : themeSettings.theirFontColor;
                            const bubbleColor = isMyMessage ? themeSettings.myBubbleColor : themeSettings.theirBubbleColor;
                            const messageClass = isMyMessage
                                ? 'chat-friendmanagement-chatwindow-message chat-friendmanagement-chatwindow-message-right'
                                : 'chat-friendmanagement-chatwindow-message chat-friendmanagement-chatwindow-message-left';

                            const avatar = isMyMessage ? userHeadImage : selectedFriend ? selectedFriend.headImage : null;
                            return (
                                <div key={index} className={`chat-message-wrapper ${isMyMessage ? 'right' : 'left'}`}>
                                    {isMyMessage ? null : (
                                        avatar ? (
                                            <img
                                                src={avatar}
                                                alt={`${message.sender_name}'s Head`}
                                                onClick={() => handleAvatarClick(avatar)}
                                                className="chat-friendmanagement-chatwindow-avatar"
                                            />
                                        ) : (
                                            <svg className="chat-friendmanagement-chatwindow-avatar-icon" aria-hidden="true">
                                                <use xlinkHref="#icon-a-gerenyonghu"></use>
                                            </svg>
                                        )
                                    )}

                                    <div
                                        className={messageClass}
                                        style={{
                                            backgroundColor: bubbleColor,
                                            color: fontColor,
                                            // 根据消息类型设置padding
                                            padding: isImageMessage ? '0px' : '6px',
                                        }}
                                    >
                                        {isSettingOpen && (
                                            <input
                                                className="chat-friendmanagement-chatwindow-message-checkbox"
                                                type="checkbox"
                                                checked={selectedMessages.includes(message.message_id)}
                                                onChange={() => handleMessageSelect(message.message_id)}
                                            />
                                        )}
                                        <div style={{ position: "relative" }}>
                                            {isMyMessage ? (
                                                <>
                                                    {renderMessageContent(message)}
                                                    <span className="chat-friendmanagement-chatwindow-arrow-right" ></span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="chat-friendmanagement-chatwindow-arrow-left"></span>
                                                    {renderMessageContent(message)}
                                                </>
                                            )}
                                            <div className={isMyMessage ? 'chat-message-timestamp-right' : 'chat-message-timestamp-left'}>
                                                {formatTime(message.timestamp)}
                                            </div>
                                        </div>
                                        {isMyMessage && !message.is_read && (
                                            <span className="chat-friendmanagement-chatwindow-read-status unread">
                                                未读
                                            </span>
                                        )}
                                    </div>

                                    {isMyMessage ? (
                                        avatar ? (
                                            <img
                                                src={avatar}
                                                alt={`${message.sender_name}'s Head`}
                                                onClick={() => handleAvatarClick(avatar)}
                                                className="chat-friendmanagement-chatwindow-avatar"
                                            />
                                        ) : (
                                            <svg className="chat-friend-list-usename-icon" aria-hidden="true">
                                                <use xlinkHref="#icon-a-gerenyonghu"></use>
                                            </svg>
                                        )
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>

                    {/* 新消息提示 */}
                    {hasNewMessages && (
                        <div className="chat-new-message-indicator" onClick={scrollToBottom}>
                            <span>你有新消息 ↓</span>
                        </div>
                    )}

                    <div className="chat-friendmanagement-chatwindow-input-container">
                        {/* 图片上传按钮 */}
                        <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                        <button
                            className="chat-friendmanagement-chatwindow-button"
                            onClick={() => document.getElementById('image-upload').click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                  <Loading message="上传库加载中..."  size="small" />  
                            ) : (
                                <svg className="chat-friend-send-message-icon" aria-hidden="true">
                                    <use xlinkHref="#icon-tianjia" />
                                </svg>
                            )}
                        </button>

                        {/* 文本输入框 */}
                        <input
                            className="chat-friendmanagement-chatwindow-input"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="请输入发送消息..."
                            ref={inputRef}
                            onFocus={handleInputFocus}
                            rows={1}
                        />

                        {/* 发送消息按钮 */}
                        <button
                            className="chat-friendmanagement-chatwindow-button"
                            onClick={handleSendMessage}
                            disabled={isUploading}
                        >
                            <svg className="chat-friend-send-message-icon" aria-hidden="true">
                                <use xlinkHref="#icon-fabu3" />
                            </svg>
                        </button>
                    </div>
                </>
            )}

            {/* 图片模态框 */}
            {isModalOpen && (
                <div className="chat-friendmanagement-chatwindow-modal">
                    <div className="chat-friendmanagement-chatwindow-modal-content">
                        <button
                            className="chat-friendmanagement-chatwindow-modal-close-button"
                            onClick={() => setIsModalOpen(false)}
                        >
                            ×
                        </button>
                        <img src={selectedImage} alt="Enlarged" className="chat-friendmanagement-chatwindow-modal-image" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;