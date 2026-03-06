import React, { useEffect, useState } from 'react';
import axios from 'axios';

import './FriendManagement.css';
import io from 'socket.io-client';
const socket = io('http://121.4.22.55:5202'); // 与你的后端 socket 地址匹配

const FriendManagement = ({ username, refreshFriends }) => {
    const [friendRequests, setFriendRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchError, setSearchError] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentFriends, setCurrentFriends] = useState([]);
    const [activeTab, setActiveTab] = useState('friends');
    const [userHeadImage, setUserHeadImage] = useState(null);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [editMode, setEditMode] = useState({});
    const [newNicknames, setNewNicknames] = useState({});
    const [friendNicknames, setFriendNicknames] = useState({});

    // 定义获取好友请求的函数
    const fetchFriendRequests = async () => {
        try {
            const response = await axios.get('http://121.4.22.55:5202/api/user-management');

            const requests = response.data
                .filter(user =>
                    user.friend === username &&
                    !user.is_friend_request_accepted &&
                    user.is_show_request === true
                )
                .map(user => ({
                    id: user.id,
                    name: user.username,
                    ip: user.friend_ip,
                    friend_nickname: user.friend_nickname || ''
                }));

            setFriendRequests(requests);
            setPendingRequestsCount(requests.length);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 定义获取当前好友列表的函数
    // 定义获取当前好友列表的函数
    const fetchCurrentFriends = async () => {
        try {
            const response = await axios.get('http://121.4.22.55:5202/api/user-management');
            const friends = response.data
                .filter(user =>
                    user.is_friend_request_accepted &&
                    user.username === username // 只处理当前用户发起的好友关系
                )
                .map(user => {
                    // 好友的用户名
                    const friendName = user.friend;

                    // 获取当前用户对好友的昵称
                    const nickname = user.friend_nickname || '';

                    // 更新 friendNicknames 状态
                    setFriendNicknames(prev => ({ ...prev, [friendName]: nickname }));

                    return {
                        name: friendName,
                        nickname: nickname || friendName // 如果没有昵称，使用用户名
                    };
                });

            // 去重好友列表
            const uniqueFriends = [...new Map(friends.map(friend => [friend.name, friend])).values()];

            // 按照指定规则排序
            const sortedFriends = uniqueFriends.sort((a, b) => {
                // 使用昵称进行排序，如果没有昵称则使用用户名
                const nameA = a.nickname || a.name;
                const nameB = b.nickname || b.name;

                const firstCharA = nameA.charAt(0).toUpperCase();
                const firstCharB = nameB.charAt(0).toUpperCase();
                const isEnglishA = /^[A-Z]$/.test(firstCharA);
                const isEnglishB = /^[A-Z]$/.test(firstCharB);

                // 英文优先于中文
                if (isEnglishA && !isEnglishB) {
                    return -1;
                }
                if (!isEnglishA && isEnglishB) {
                    return 1;
                }

                // 相同类型按字母顺序排序
                return nameA.localeCompare(nameB, 'zh', { sensitivity: 'base' });
            });

            // 只提取用户名数组
            const sortedFriendNames = sortedFriends.map(friend => friend.name);

            // 更新当前好友列表
            setCurrentFriends(sortedFriendNames);
        } catch (err) {
            setError(err.message);
        }
    };

    // 获取用户头像的函数
    const fetchUserHeadImage = async () => {
        try {
            const response = await axios.get('http://121.4.22.55:5202/api/getuserheadimage', {
                params: { username }
            });
            if (response.data.imageUrl) {
                setUserHeadImage(response.data.imageUrl);
            }
        } catch (error) {
            console.error('Error fetching user head image:', error);
        }
    };

    useEffect(() => {
        fetchFriendRequests();
        fetchCurrentFriends();
        fetchUserHeadImage();

        // 监听好友列表变化的事件
        socket.on('friendListChanged', () => {
            fetchFriendRequests();
            fetchCurrentFriends();
        });

        return () => {
            socket.off('friendListChanged');
        };
    }, [username]);

    const handleSearch = async () => {
        setSearchError('');
        setSearchResults([]);
        try {
            const response = await axios.get(`http://121.4.22.55:5202/api/validate-user/${searchQuery}`);
            if (response.data.exists) {
                if (currentFriends.includes(searchQuery)) {
                    setSearchError('该用户已经是你的好友，无需重复添加。');
                } else {
                    setSearchResults([{ username: searchQuery }]);
                }
            } else {
                setSearchError('用户不存在');
            }
        } catch (error) {
            setSearchError('请求失败，请重试');
        }
    };

    let isFirstRequest = true;
    const handleAddFriend = async (friend) => {
        try {
            const isShowRequest = isFirstRequest ? true : false;
            isFirstRequest = false;

            await axios.post('http://121.4.22.55:5202/api/user-management', {
                username,
                friend,
                is_friend_request_accepted: false,
                is_show_request: isShowRequest
            });
            await axios.post('http://121.4.22.55:5202/api/user-management', {
                username: friend,
                friend: username,
                is_friend_request_accepted: false,
                is_show_request: !isShowRequest
            });
            alert('好友请求已发送');
            setSearchQuery('');
            setSearchResults([]);
            fetchFriendRequests();
            fetchCurrentFriends();
            if (refreshFriends) {
                refreshFriends();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            const currentRequest = friendRequests.find(req => req.id === requestId);
            if (currentRequest) {
                const friendName = currentRequest.name;
                await axios.put(`http://121.4.22.55:5202/api/user-management/${username}/${friendName}/accept`);
                await axios.put(`http://121.4.22.55:5202/api/user-management/${friendName}/${username}/accept`);
            }
            fetchFriendRequests();
            fetchCurrentFriends();
            if (refreshFriends) {
                refreshFriends();
            }

        } catch (err) {
            setError(err.message);
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            const currentRequest = friendRequests.find(req => req.id === requestId);
            if (currentRequest) {
                const friendName = currentRequest.name;

                const allRequestsResponse = await axios.get('http://121.4.22.55:5202/api/user-management');
                const allRequests = allRequestsResponse.data;

                const forwardRequest = allRequests.find(req => req.username === username && req.friend === friendName);
                const reverseRequest = allRequests.find(req => req.username === friendName && req.friend === username);

                const retryDelete = async (url, maxRetries = 3) => {
                    let retries = 0;
                    while (retries < maxRetries) {
                        try {
                            await axios.delete(url);
                            break;
                        } catch (err) {
                            if (err.response && err.response.status === 404) {
                                retries++;
                                if (retries === maxRetries) {
                                    throw err;
                                }
                            } else {
                                throw err;
                            }
                        }
                    }
                };

                if (forwardRequest) {
                    await retryDelete(`http://121.4.22.55:5202/api/user-management/${username}/${friendName}`);
                }
                if (reverseRequest) {
                    await retryDelete(`http://121.4.22.55:5202/api/user-management/${friendName}/${username}`);
                }
            }
            fetchFriendRequests();
            fetchCurrentFriends();
            if (refreshFriends) {
                refreshFriends();
            }
        } catch (err) {
            console.error('Error deleting friend request:', err);
            setError(err.message);
        }
    };

    const handleDeleteFriend = async (friend) => {
        try {
            await axios.delete(`http://121.4.22.55:5202/api/user-management/${username}/${friend}`);
            await axios.delete(`http://121.4.22.55:5202/api/user-management/${friend}/${username}`);
            alert('好友已删除');
            fetchCurrentFriends();
            if (refreshFriends) {
                refreshFriends();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const startEdit = (friend) => {
        setEditMode({ ...editMode, [friend]: true });
        setNewNicknames({ ...newNicknames, [friend]: friendNicknames[friend] || '' });
    };

    const stopEdit = (friend) => {
        setEditMode({ ...editMode, [friend]: false });
    };

    const saveNickname = async (friend) => {
        try {
            const newNickname = newNicknames[friend];
            await axios.post('http://121.4.22.55:5202/api/update-nickname', {
                username,
                friend,
                newNickname
            });
            alert('昵称已保存');
            setFriendNicknames(prev => ({ ...prev, [friend]: newNickname }));
            stopEdit(friend);
            fetchCurrentFriends();
            if (refreshFriends) {
                refreshFriends();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <div className="chat-friendmanagement-loading">Loading...</div>;
    }

    if (error) {
        return <div className="chat-friendmanagement-error">Error: {error}</div>;
    }

    return (
        <div className="chat-friendmanagement">
            <div className="chat-friendmanagement-head-image">
                {userHeadImage ? (
                    <img
                        src={userHeadImage}
                        alt="User Head"
                        className="chat-friendmanagement-head-image-img"
                    />
                ) : (
                    <svg
                        className="chat-friendmanagement-head-image-icon"
                        aria-hidden="true"
                    >
                        <use xlinkHref="#icon-a-gerenyonghu"></use>
                    </svg>
                )}
            </div>
            <h2 className="chat-friendmanagement-title">好友管理</h2>
            <div className="chat-friendmanagement-search">
                <div className="chat-friendmanagement-search-div">
                    <input
                        type="text"
                        placeholder="搜索好友用户名"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="chat-friendmanagement-search-input"
                    />
                    <button onClick={handleSearch} className="chat-friendmanagement-search-button">
                        搜索
                    </button>
                </div>
                <div>
                    {searchError && <p className="chat-friendmanagement-error">{searchError}</p>}
                </div>
            </div>
            {searchResults.length > 0 && (
                <div className="chat-friendmanagement-search-results">
                    {searchResults.map((result, index) => (
                        <div key={index} className="chat-friendmanagement-search-result">
                            <span>{result.username}</span>
                            <button
                                onClick={() => handleAddFriend(result.username)}
                                className="chat-friendmanagement-add-button"
                            >
                                添加
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="chat-friendmanagement-tabs">
                <button
                    className={activeTab === 'friends' ? 'active' : ''}
                    onClick={() => setActiveTab('friends')}
                >
                    好友列表
                </button>
                <button
                    className={activeTab === 'requests' ? 'active' : ''}
                    onClick={() => setActiveTab('requests')}
                >
                    好友请求
                    {pendingRequestsCount > 0 && <span className="chat-friendmanagement-request-count">{pendingRequestsCount}</span>}
                </button>
            </div>
            {activeTab === 'friends' && (
                <div className="chat-friendmanagement-current-friends">
                    <div className="chat-friendmanagement-divider"></div>
                    <ul>
                        {currentFriends.map((friend, index) => (
                            <li key={index} className="chat-friendmanagement-friend-item">
                                {editMode[friend] ? (
                                    <>
                                        <input
                                            type="text"
                                            className="chat-friendmanagement-setnewnicknames-input"
                                            value={newNicknames[friend]}
                                            onChange={(e) => setNewNicknames({ ...newNicknames, [friend]: e.target.value })}
                                        />
                                        <button className="chat-friendmanagement-setnewnicknames-button" onClick={() => saveNickname(friend)}>保存</button>
                                        <button className="chat-friendmanagement-setnewnicknames-button" onClick={() => stopEdit(friend)}>取消</button>
                                    </>
                                ) : (
                                    <>
                                        <div className="chat-friendmanagement-friends-list-container">
                                            {/* <span>{username}</span> */}
                                            {/* 实际用户名 */}
                                            <span className="chat-friendmanagement-friends-list-container-span" >{friendNicknames[friend]}</span>
                                            {friendNicknames[friend] &&
                                                <span className="chat-friendmanagement-friends-list-container-friendnicknames">
                                                    （{friend}）
                                                </span>}
                                            <button
                                                onClick={() => startEdit(friend)}
                                                className="chat-friendmanagement-editfriendnote-button"
                                            >
                                                {/* 编辑 */}
                                                <svg className="chat-container-friendmanagement-delete-icon" aria-hidden="true">
                                                    <use xlinkHref="#icon-beizhu1"></use>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFriend(friend)}
                                                className="chat-friendmanagement-delete-button"
                                            >
                                                {/* 删除 */}
                                                <svg className="chat-container-friendmanagement-delete-icon" aria-hidden="true">
                                                    <use xlinkHref="#icon-shanchu7"></use>
                                                </svg>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {activeTab === 'requests' && (
                <div className="chat-friendmanagement-requests-list">
                    <div className="chat-friendmanagement-divider"></div>
                    {friendRequests.length > 0 ? (
                        <ul>
                            {friendRequests.map(request => (
                                <li key={request.id} className="chat-friendmanagement-request-item">
                                    <span>{request.name}</span>
                                    <div>
                                        <button
                                            onClick={() => handleAcceptRequest(request.id)}
                                            className="chat-friendmanagement-accept-button"
                                        >
                                            <svg className="chat-container-friendmanagement-delete-icon" aria-hidden="true">
                                                <use xlinkHref="#icon-tongyi"></use>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(request.id)}
                                            className="chat-friendmanagement-reject-button"
                                        >
                                            <svg className="chat-container-friendmanagement-delete-icon" aria-hidden="true">
                                                <use xlinkHref="#icon-butongyi"></use>
                                            </svg>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="chat-friendmanagement-no-requests">暂无好友请求</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FriendManagement;