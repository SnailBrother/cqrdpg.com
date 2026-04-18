import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './FriendsList.css';

const socket = io('https://www.cqrdpg.com:5202');

const FriendsList = (props) => {
    const { username, onFriendClick, refreshTrigger, themeSettings, selectedFriend } = props;
    const [friends, setFriends] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [intervalId, setIntervalId] = useState(null);
    const [titleScrollInterval, setTitleScrollInterval] = useState(null);

    // 计算未读消息总数（排除当前选中好友）
    const totalUnread = Object.entries(unreadCounts).reduce((sum, [friendName, count]) => {
        if (selectedFriend && friendName === selectedFriend.name) {
            return sum; // 排除当前选中好友的未读消息
        }
        return sum + count;
    }, 0);
    // 在 FriendsList 中添加这个 useEffect 接受已读未读消息
    useEffect(() => {
        const handleMessagesRead = (data) => {
            // 如果当前更新的是当前用户的好友，更新未读计数
            if (data.receiverName === username) {
                setUnreadCounts(prevCounts => {
                    const newCounts = { ...prevCounts };
                    // 减少对应好友的未读计数
                    if (newCounts[data.senderName] > 0) {
                        newCounts[data.senderName] = Math.max(0, newCounts[data.senderName] - data.messageIds.length);
                    }
                    return newCounts;
                });

                // 触发重新获取未读计数
                socket.emit('updateUnreadCounts', { receiverName: username });
            }
        };

        socket.on('messagesReadByReceiver', handleMessagesRead);

        return () => {
            socket.off('messagesReadByReceiver', handleMessagesRead);
        };
    }, [username]);

    // 在组件挂载时和 refreshTrigger 变化时获取好友列表
    useEffect(() => {
        const fetchFriendsAndUnreadCounts = async () => {
            try {
                // 获取好友列表
                const response = await axios.get('/api/WeChatApp/user-management');
                const filteredFriends = response.data.filter(user =>
                    user.username === username && user.is_friend_request_accepted === true
                );
                const uniqueFriends = [...new Set(filteredFriends.map(user => user.friend))];

                // 获取每个好友的头像和未读消息数
                const friendsWithHeadImagesAndUnreadCounts = await Promise.all(
                    uniqueFriends.map(async (name, index) => {
                        try {
                            const headImageResponse = await axios.get('/api/WeChatApp/getuserheadimage', {
                                params: { username: name }
                            });
                            const friendRecord = filteredFriends.find(f => f.friend === name);
                            const nickname = friendRecord?.friend_nickname || name;

                            // 获取未读消息数
                            const unreadResponse = await axios.get('/api/messages');
                            const unreadCount = unreadResponse.data.filter(msg =>
                                msg.receiver_name === username &&
                                msg.sender_name === name &&
                                !msg.is_read
                            ).length;

                            return {
                                id: index + 1,
                                name,
                                nickname,
                                headImage: headImageResponse.data.imageUrl || null,
                                unreadCount
                            };
                        } catch (error) {
                            console.error(`Error fetching data for ${name}:`, error);
                            return {
                                id: index + 1,
                                name,
                                nickname: name,
                                headImage: null,
                                unreadCount: 0
                            };
                        }
                    })
                );

                // 按昵称首字母排序，英文字母优先
                const sortedFriends = friendsWithHeadImagesAndUnreadCounts.sort((a, b) => {
                    const firstCharA = a.nickname[0].toUpperCase();
                    const firstCharB = b.nickname[0].toUpperCase();
                    const isEnglishA = /^[A-Z]$/.test(firstCharA);
                    const isEnglishB = /^[A-Z]$/.test(firstCharB);

                    if (isEnglishA && !isEnglishB) {
                        return -1;
                    }
                    if (!isEnglishA && isEnglishB) {
                        return 1;
                    }
                    return firstCharA.localeCompare(firstCharB, 'zh', { sensitivity: 'base' });
                });

                setFriends(sortedFriends);

                // 更新未读消息计数
                const newUnreadCounts = {};
                sortedFriends.forEach(friend => {
                    newUnreadCounts[friend.name] = friend.unreadCount;
                });
                setUnreadCounts(newUnreadCounts);

            } catch (error) {
                console.error('Error fetching friends and unread counts:', error);
            }
        };

        if (username) {
            fetchFriendsAndUnreadCounts();
        }

        socket.on('friendListChanged', fetchFriendsAndUnreadCounts);

        return () => {
            socket.off('friendListChanged');
        };
    }, [username, refreshTrigger]);

    // 获取一次好友列表
    useEffect(() => {
        const fetchFriendsInterval = () => {
            const fetchFriends = async () => {
                try {
                    const response = await axios.get('/api/WeChatApp/user-management');
                    const filteredFriends = response.data.filter(user =>
                        user.username === username && user.is_friend_request_accepted === true
                    );
                    const uniqueFriends = [...new Set(filteredFriends.map(user => user.friend))];

                    const friendsWithHeadImages = await Promise.all(
                        uniqueFriends.map(async (name, index) => {
                            try {
                                const headImageResponse = await axios.get('/api/WeChatApp/getuserheadimage', {
                                    params: { username: name }
                                });
                                const friendRecord = filteredFriends.find(f => f.friend === name);
                                const nickname = friendRecord?.friend_nickname || name;
                                return {
                                    id: index + 1,
                                    name,
                                    nickname,
                                    headImage: headImageResponse.data.imageUrl || null,
                                    unreadCount: 0
                                };
                            } catch (error) {
                                console.error(`Error fetching head image for ${name}:`, error);
                                return {
                                    id: index + 1,
                                    name,
                                    nickname: name,
                                    headImage: null,
                                    unreadCount: 0
                                };
                            }
                        })
                    );

                    // 按昵称首字母排序，英文字母优先
                    const sortedFriends = friendsWithHeadImages.sort((a, b) => {
                        const firstCharA = a.nickname[0].toUpperCase();
                        const firstCharB = b.nickname[0].toUpperCase();
                        const isEnglishA = /^[A-Z]$/.test(firstCharA);
                        const isEnglishB = /^[A-Z]$/.test(firstCharB);

                        if (isEnglishA && !isEnglishB) {
                            return -1;
                        }
                        if (!isEnglishA && isEnglishB) {
                            return 1;
                        }
                        return firstCharA.localeCompare(firstCharB, 'zh', { sensitivity: 'base' });
                    });

                    setFriends(sortedFriends);
                } catch (error) {
                    console.error('Error fetching friends:', error);
                }
            };
            fetchFriends();
        };

        // const id = setInterval(fetchFriendsInterval, 3600000);
        // setIntervalId(id);

        // return () => {
        //     clearInterval(id);
        // };
    }, [username]);

    // 每 1 秒获取一次未读消息计数
    // 同时修改现有的 unreadCountsUpdated 监听器
    useEffect(() => {
        const fetchUnreadCounts = async () => {
            try {
                const response = await axios.get('/api/messages');
                const allMessages = response.data;
                const newUnreadCounts = {};
                friends.forEach(friend => {
                    const count = allMessages.filter(msg =>
                        msg.receiver_name === username &&
                        msg.sender_name === friend.name &&
                        !msg.is_read
                    ).length;
                    newUnreadCounts[friend.name] = count;
                });
                setUnreadCounts(newUnreadCounts);
            } catch (error) {
                console.error('Error fetching unread counts:', error);
            }
        };

        socket.on('unreadCountsUpdated', fetchUnreadCounts);

        return () => {
            socket.off('unreadCountsUpdated', fetchUnreadCounts);
        };
    }, [friends, username]);

    // 处理标题滚动效果
    useEffect(() => {
        const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

        // 清除之前的滚动定时器
        if (titleScrollInterval) {
            clearInterval(titleScrollInterval);
        }

        if (totalUnread > 0) {
            const baseTitle = `WeChat-你有${totalUnread}条消息未读`;
            let currentTitle = baseTitle;
            const scrollTitle = () => {
                currentTitle = currentTitle.slice(1) + currentTitle[0];
                document.title = currentTitle;
            };
            const newInterval = setInterval(scrollTitle, 300);
            setTitleScrollInterval(newInterval);
        } else {
            document.title = 'WeChat';
        }

        return () => {
            if (titleScrollInterval) {
                clearInterval(titleScrollInterval);
            }
        };
    }, [unreadCounts]);

    return (
        <div className="friendslist-container"
            style={{
                color: themeSettings.navbarFontColor,
                backgroundColor: themeSettings.navbarBackgroundColor
            }} // 新增样式设置
        >
            <h2 className="friendslist-title">好友列表</h2>
            <ul className="friendslist-list">
                {friends.map((friend, index) => (
                    <li
                        key={friend.id}
                        className="friendslist-item"
                        style={{
                            color: themeSettings.navbarFontColor
                        }}
                        // FriendsList 组件中的点击事件
                        onClick={() => onFriendClick({
                            name: friend.name,
                            headImage: friend.headImage,
                            nickname: friend.nickname,
                            unreadCount: unreadCounts[friend.name] || 0 // 传递未读消息数
                        })}
                    >
                        <div className="friendslist-item-content">
                            {friend.headImage ? (
                                <img
                                    src={friend.headImage}
                                    alt={`${friend.name}'s Head`}
                                    className="friendslist-item-img"
                                />
                            ) : (
                                <svg className="friendslist-item-icon" aria-hidden="true">
                                    <use xlinkHref="#icon-a-gerenyonghu"></use>
                                </svg>
                            )}
                            {unreadCounts[friend.name] > 0 && (
                                <span className="unread-badge">{unreadCounts[friend.name]}</span>
                            )}
                            <span>{friend.nickname}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FriendsList;    