import React, { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import './ChatWindow.css';
import { Loading } from '../../../components/UI';
import VideoCall from './VideoCall';
import GroupVideoCall from './GroupVideoCall';

import Circularrotatingtext from './.././../../components/Animation/Circularrotatingtext'; // 加载动画里面的环形旋转文字
const socket = io('https://www.cqrdpg.com:5202');

 

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
    // 群通话状态管理
    const [isGroupVideoCallModalOpen, setIsGroupVideoCallModalOpen] = useState(false);
    // 添加音频元素引用
    const invitationAudioRef = useRef(null);
    // 修改播放声音函数，保存音频引用
    const playInvitationSound = () => {
        // 如果已经有音频在播放，先停止
        if (invitationAudioRef.current) {
            invitationAudioRef.current.pause();
            invitationAudioRef.current = null;
        }

        const audio = new Audio('https://www.cqrdpg.com/backend/musics/AnswerThePhone.mp3');
        invitationAudioRef.current = audio;

        // 设置循环播放（可选，让邀请声音持续播放）
        audio.loop = true;

        audio.play().catch(error => {
            console.log('播放邀请声音失败:', error);
        });
    };

    // 添加停止播放声音的函数
    const stopInvitationSound = () => {
        if (invitationAudioRef.current) {
            invitationAudioRef.current.pause();
            invitationAudioRef.current.currentTime = 0; // 重置到开始
            invitationAudioRef.current = null;
            console.log('已停止播放邀请声音');
        }
    };
    //添加视频通话状态管理 


    const [isVideoCallModalOpen, setIsVideoCallModalOpen] = useState(false);
    const [videoCallInfo, setVideoCallInfo] = useState({
        isIncoming: false, // 是否是收到的邀请
        callerName: '', // 邀请者名称
        receiverName: '', // 被邀请者名称
        roomId: null,  // 改为 roomId
        callStatus: 'waiting' // 通话状态: 'waiting', 'connected', 'rejected'
    });
    const videoCallInfoRef = useRef(videoCallInfo);
    // 同步更新 ref
    useEffect(() => {
        videoCallInfoRef.current = videoCallInfo;
    }, [videoCallInfo]);
    //添加发送视频通话邀请的函数

    // 替换原来的 sendVideoCallInvitation 函数
    const sendVideoCallInvitation = async () => {
        if (!selectedFriend) {
            alert('请先选择聊天对象');
            return;
        }

        try {
            // 先获取或创建房间号
            const roomResponse = await axios.post('/api/WeChatApp/chatRoom/getOrCreateRoom', {
                sender_name: username,
                receiver_name: selectedFriend.name
            });

            if (!roomResponse.data.success) {
                throw new Error(roomResponse.data.error || '获取房间号失败');
            }

            const roomId = roomResponse.data.roomId;
            console.log('获取到房间号:', roomId);

            // 发送视频通话邀请消息，携带 roomId
            const response = await axios.post('/api/messages', {
                message_text: `您的好友 ${username} 邀请您进行视频通话`,
                sender_name: username,
                receiver_name: selectedFriend.name,
                message_type: 'video_call_invitation',
                roomId: roomId  //  
            });

            console.log('邀请发送响应:', response.data);

            // 播放邀请声音（发送方）
            playInvitationSound();

            // 打开自己的视频通话模态框
            setVideoCallInfo({
                isIncoming: false,
                callerName: username,
                receiverName: selectedFriend.name,
                roomId: roomId,  // 使用 roomId
                callStatus: 'waiting'
            });
            setIsVideoCallModalOpen(true);

            console.log('视频通话模态框已打开，roomId:', roomId);

        } catch (error) {
            console.error('发送视频通话邀请失败:', error);
            alert('发送视频通话邀请失败: ' + (error.response?.data?.error || error.message));
        }
    };
    // 2. 添加打开群通话的函数
    // 添加在 sendVideoCallInvitation 函数后面
    const openGroupVideoCall = () => {
        console.log('打开群通话');
        setIsGroupVideoCallModalOpen(true);
    };

    // 3. 添加关闭群通话的函数
    const closeGroupVideoCall = () => {
        console.log('关闭群通话');
        setIsGroupVideoCallModalOpen(false);
    };
    // 添加 Socket 连接状态监听
    useEffect(() => {
        const onConnect = () => {
            console.log('Socket connected successfully');
            // 重新注册用户
            if (username) {
                socket.emit('register-user', username);
            }
        };

        const onDisconnect = () => {
            console.log('Socket disconnected');
        };

        const onConnectError = (error) => {
            console.error('Socket connection error:', error);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
        };
    }, [username]);

    //添加图片及视频通话悬浮
    // 添加状态控制菜单显示
    const [showImageMenu, setShowImageMenu] = useState(false);
    const imageMenuRef = useRef(null);

    // 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (imageMenuRef.current && !imageMenuRef.current.contains(event.target)) {
                setShowImageMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);



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

            const response = await axios.post('/api/WeChatApp/messages/uploadImage', formData, {
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
        return `https://www.cqrdpg.com/backend/images/ChatImages/${senderName}/${filename}`;
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
            const response = await axios.get('/api/messages');
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
            const response = await axios.get('/api/messages/chat', {
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


            // 检查是否是视频通话邀请
            // 在 handleNewMessage 函数中修改

            // 在 socket.on('newMessage') 中处理视频通话邀请
            // 在 socket.on('newMessage') 中处理视频通话邀请
            if (newMessage.message_type === 'video_call_invitation') {
                // 如果是发给当前用户的消息
                if (newMessage.receiver_name === username && newMessage.sender_name === selectedFriend?.name) {
                    console.log('收到视频通话邀请:', newMessage);
                    console.log('邀请中的 roomId:', newMessage.roomId); // ✅ 添加日志

                    // 检查 roomId 是否存在
                    if (!newMessage.roomId) {
                        console.error('收到的视频邀请中没有 roomId');
                        alert('收到的视频邀请无效，缺少房间号');
                        return;
                    }

                    playInvitationSound();

                    const roomId = newMessage.roomId;

                    setVideoCallInfo({
                        isIncoming: true,
                        callerName: newMessage.sender_name,
                        receiverName: newMessage.receiver_name,
                        roomId: roomId,
                        callStatus: 'waiting'
                    });
                    setIsVideoCallModalOpen(true);

                    console.log('设置 videoCallInfo 完成，roomId:', roomId);
                }
            }

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


    // 接受视频通话

    const acceptVideoCall = () => {
        console.log('=== 接受视频通话 ===');
        console.log('当前 videoCallInfo:', videoCallInfo);
        console.log('当前 videoCallInfoRef.current:', videoCallInfoRef.current);

        // 停止播放声音
        stopInvitationSound();

        const roomId = videoCallInfoRef.current.roomId;

        if (!roomId) {
            console.error('roomId 为空，无法接受视频通话');
            return;
        }

        console.log('接受视频通话，roomId:', roomId);

        // 发送 Socket 事件
        socket.emit('video-call-accepted', {
            callerName: videoCallInfo.callerName,
            receiverName: videoCallInfo.receiverName,
            roomId: roomId
        });

        console.log('已发送 video-call-accepted 事件, roomId:', roomId);

        // 更新状态为已连接
        setVideoCallInfo(prev => ({
            ...prev,
            callStatus: 'connected'
        }));
    };

    // 拒绝视频通话
    const rejectVideoCall = () => {
        console.log('=== 拒绝/取消视频通话 ===');
        console.log('当前 videoCallInfo:', videoCallInfo);

        stopInvitationSound();

        if (videoCallInfo.roomId) {
            socket.emit('video-call-rejected', {
                roomId: videoCallInfo.roomId,  // 使用 roomId
                callerName: videoCallInfo.callerName,
                receiverName: videoCallInfo.receiverName
            });
            console.log('已发送 video-call-rejected 事件，roomId:', videoCallInfo.roomId);
        }

        setIsVideoCallModalOpen(false);
        setVideoCallInfo({
            isIncoming: false,
            callerName: '',
            receiverName: '',
            roomId: null,  // 使用 roomId
            callStatus: 'waiting'
        });
    };

    // 添加挂断视频通话的函数
    const endVideoCall = () => {
        console.log('=== 挂断视频通话 ===');
        stopInvitationSound();

        if (videoCallInfo.roomId) {
            socket.emit('video-call-ended', {
                roomId: videoCallInfo.roomId,  // 使用 roomId
                callerName: videoCallInfo.callerName,
                receiverName: videoCallInfo.receiverName
            });
        }

        setIsVideoCallModalOpen(false);
        setVideoCallInfo({
            isIncoming: false,
            callerName: '',
            receiverName: '',
            roomId: null,  // 使用 roomId
            callStatus: 'waiting'
        });
    };

    // 在现有的 useEffect 之后，添加一个新的 useEffect 专门处理视频通话的 Socket 事件

    // 视频通话 Socket 事件监听
    useEffect(() => {
        // 监听对方接受视频通话 - 使用用户名组合匹配
        const handleVideoCallAccepted = (data) => {
            console.log('收到视频通话接受事件:', data);

            // 使用用户名组合来匹配通话
            const isMatchingCall =
                (data.callerName === videoCallInfoRef.current.callerName &&
                    data.receiverName === videoCallInfoRef.current.receiverName) ||
                (data.callerName === videoCallInfoRef.current.receiverName &&
                    data.receiverName === videoCallInfoRef.current.callerName);

            if (isMatchingCall) {
                console.log('通话匹配成功，更新状态为 connected');
                // 对方接受了，停止播放声音（发送方）
                stopInvitationSound();

                setVideoCallInfo(prev => ({
                    ...prev,
                    callStatus: 'connected'
                }));
                setIsVideoCallModalOpen(true);
            } else {
                console.log('通话不匹配，忽略事件', {
                    dataCaller: data.callerName,
                    dataReceiver: data.receiverName,
                    currentCaller: videoCallInfoRef.current.callerName,
                    currentReceiver: videoCallInfoRef.current.receiverName
                });
            }
        };

        // 监听对方拒绝视频通话
        // 监听对方拒绝视频通话
        const handleVideoCallRejected = (data) => {
            console.log('收到视频通话拒绝事件:', data);

            const isMatchingCall =
                (data.callerName === videoCallInfoRef.current.callerName &&
                    data.receiverName === videoCallInfoRef.current.receiverName) ||
                (data.callerName === videoCallInfoRef.current.receiverName &&
                    data.receiverName === videoCallInfoRef.current.callerName);

            if (isMatchingCall) {
                // 对方拒绝了，停止播放声音（发送方）
                stopInvitationSound();
                alert(`${data.callerName === username ? data.receiverName : data.callerName} 拒绝了视频通话`);
                setIsVideoCallModalOpen(false);
                setVideoCallInfo({
                    isIncoming: false,
                    callerName: '',
                    receiverName: '',
                    roomId: null,  // ✅ 修复：改为 roomId
                    callStatus: 'waiting'
                });
            }
        };

        // 监听对方挂断通话
        // 监听对方挂断通话
        const handleVideoCallEnded = (data) => {
            console.log('收到视频通话挂断事件:', data);

            const isMatchingCall =
                (data.callerName === videoCallInfoRef.current.callerName &&
                    data.receiverName === videoCallInfoRef.current.receiverName) ||
                (data.callerName === videoCallInfoRef.current.receiverName &&
                    data.receiverName === videoCallInfoRef.current.callerName);

            if (isMatchingCall) {
                // 对方挂断了，停止播放声音
                stopInvitationSound();
                alert('对方已挂断视频通话');
                setIsVideoCallModalOpen(false);
                setVideoCallInfo({
                    isIncoming: false,
                    callerName: '',
                    receiverName: '',
                    roomId: null,  // ✅ 修复：改为 roomId
                    callStatus: 'waiting'
                });
            }
        };

        socket.on('video-call-accepted', handleVideoCallAccepted);
        socket.on('video-call-rejected', handleVideoCallRejected);
        socket.on('video-call-ended', handleVideoCallEnded);

        return () => {
            socket.off('video-call-accepted', handleVideoCallAccepted);
            socket.off('video-call-rejected', handleVideoCallRejected);
            socket.off('video-call-ended', handleVideoCallEnded);
        };
    }, [username]);
    // 组件卸载时停止播放声音
    useEffect(() => {
        return () => {
            // 组件卸载时停止播放声音
            stopInvitationSound();
        };
    }, []);
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
    // 在组件中添加用户注册（放在所有 useEffect 之前或之后都可以）
    useEffect(() => {
        if (username) {
            console.log('注册用户:', username);
            socket.emit('register-user', username);
        }

        return () => {
            // 可选：离开时注销
            // socket.emit('unregister-user', username);
        };
    }, [username]);
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
            await axios.put('/api/messages/markAllAsRead', {
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
            await axios.post('/api/messages', {
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
            await axios.delete('/api/messages', {
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
            await axios.put('/api/messages/read', { messageIds });
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
                    ? `url(https://www.cqrdpg.com/backend/images/ChatApp/${username}/chatbackgroundimage/backgroundimage.jpg)`
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
                        {/* 悬浮菜单容器 */}
                        <div className="chat-image-menu-container" ref={imageMenuRef}>
                            {/* 主按钮 - 点击或悬浮时显示菜单 */}
                            <button
                                className="chat-friendmanagement-chatwindow-button"
                                onClick={() => setShowImageMenu(!showImageMenu)}
                                onMouseEnter={() => setShowImageMenu(true)}
                            >
                                <svg className="chat-friend-send-message-icon" aria-hidden="true">
                                    <use xlinkHref="#icon-tianjia" />
                                </svg>
                            </button>

                            {/* 悬浮菜单 */}
                            {showImageMenu && (
                                <div
                                    className="chat-image-menu"
                                    onMouseLeave={() => setShowImageMenu(false)}
                                >
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            handleImageUpload(e);
                                            setShowImageMenu(false);
                                        }}
                                    />
                                    <button
                                        className="chat-image-menu-item"
                                        onClick={() => document.getElementById('image-upload').click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <Loading message="上传中..." size="small" />
                                        ) : (
                                            <>
                                                <svg className="chat-menu-icon" aria-hidden="true">
                                                    <use xlinkHref="#icon-tupian" />
                                                </svg>
                                                <span>发送图片</span>
                                            </>
                                        )}
                                    </button>


                                    <button
                                        className="chat-image-menu-item"
                                        onClick={sendVideoCallInvitation}  // 添加这个
                                    >
                                        <svg className="chat-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-shipintonghua_48" />
                                        </svg>
                                        <span>视频通话</span>
                                    </button>

                                    <button
                                        className="chat-image-menu-item"
                                        onClick={() => {
                                            openGroupVideoCall();
                                            setShowImageMenu(false); // 点击后关闭菜单
                                        }}
                                    >
                                        <svg className="chat-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-shipintonghua_48" />
                                        </svg>
                                        <span>群通话</span>
                                    </button>

                                </div>
                            )}
                        </div>

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
            {/* 视频通话模态框 */}

            {isVideoCallModalOpen && (
                <div className="chat-friendmanagement-chatwindow-modal">
                    <div className="chat-video-call-modal-content">
                        {videoCallInfo.callStatus === 'connected' ? (
                            // 通话已连接，显示 VideoCall 组件
                            <VideoCall
                                callerName={videoCallInfo.callerName}
                                receiverName={videoCallInfo.receiverName}
                                roomId={videoCallInfo.roomId}  // 改为 roomId
                                isInitiator={!videoCallInfo.isIncoming}
                                onClose={() => {
                                    // 清理所有视频通话相关的状态
                                    stopInvitationSound();
                                    setIsVideoCallModalOpen(false);
                                    setVideoCallInfo({
                                        isIncoming: false,
                                        callerName: '',
                                        receiverName: '',
                                        roomId: null,
                                        callStatus: 'waiting'
                                    });
                                }}
                            />
                        ) : (
                            // 等待接受状态
                            <>
                                <button
                                    className="chat-friendmanagement-chatwindow-modal-close-button"
                                    onClick={rejectVideoCall}
                                >
                                    ×
                                </button>
                                <div className="video-call-container">
                                    {!videoCallInfo.isIncoming ? (
                                        // 自己发出的邀请
                                        <>
                                            <div className="video-call-icon">
                                                <svg className="video-call-svg" aria-hidden="true">
                                                    <use xlinkHref="#icon-shipin" />
                                                </svg>
                                            </div>
                                            <h3>等待对方接受视频通话...</h3>
                                            <p>正在邀请: {videoCallInfo.receiverName}</p>
                                            <button
                                                className="video-call-cancel-btn"
                                                onClick={rejectVideoCall}
                                            >
                                                取消
                                            </button>
                                        </>
                                    ) : (
                                        // 收到的邀请
                                        <>
                                            <div className="video-call-icon">
                                                <svg className="video-call-svg" aria-hidden="true">
                                                    <use xlinkHref="#icon-shipin" />
                                                </svg>
                                            </div>
                                            <h3>{videoCallInfo.callerName} 邀请您进行视频通话</h3>
                                            <div className="video-call-buttons">
                                                <button
                                                    className="video-call-accept-btn"
                                                    onClick={acceptVideoCall}
                                                >
                                                    接受
                                                </button>
                                                <button
                                                    className="video-call-reject-btn"
                                                    onClick={rejectVideoCall}
                                                >
                                                    拒绝
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* 群通话模态框 */}
            {isGroupVideoCallModalOpen && (
                <div className="chat-friendmanagement-chatwindow-modal">
                    <div className="chat-video-call-modal-content">
                        <button
                            className="chat-friendmanagement-chatwindow-modal-close-button"
                            onClick={closeGroupVideoCall}
                        >
                            ×
                        </button>
                        <GroupVideoCall
                            onClose={closeGroupVideoCall}
                        />
                    </div>
                </div>
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