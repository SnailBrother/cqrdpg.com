import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import FriendManagement from './FriendManagement';
import FriendsList from './FriendsList';
import ChatWindow from './ChatWindow';
import { Link, useNavigate } from 'react-router-dom'; //react-router-dom v6 // 使用 useNavigate 
import ThemeSettings from './ThemeSettings';
import AvatarSettings from './AvatarSettings';
import io from 'socket.io-client';
import './Chat.css';
const socket = io('http://121.4.22.55:5202');

const Chat = () => {
    const { user, logout } = useAuth();
    const username = user?.username; // 从 user 对象中获取 username
    const navigate = useNavigate(); // 使用 useNavigate
    const [userHeadImage, setUserHeadImage] = useState(null);
    const [isLeftPanelOpen, setLeftPanelOpen] = useState(true);
    const [isFriendListCollapsed, setIsFriendListCollapsed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [refreshFriendsList, setRefreshFriendsList] = useState(false);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const isHeadImageLoaded = useRef(false);
    const settingsMenuRef = useRef(null);

    // 添加好友请求
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    // 新增状态来存储主题设置
    const [themeSettings, setThemeSettings] = useState({
        theirFontColor: '#000000',
        theirBubbleColor: '#D3D3D3',
        myFontColor: '#000000',
        myBubbleColor: '#90EE90',
        backgroundColor: '#F0F0F0',
        useBackgroundImage: false,
        navbarFontColor: '#FFFFFF',
        navbarBackgroundColor: '#2c3e50',
    });
    // 检查用户名是否为空或未定义
    useEffect(() => {
        if (!username) {
            navigate('/login'); // 使用 navigate 替代 history.push
        }
    }, [username, navigate]);

    // 处理退出账号
    const handleLogout = () => {
        logout(); // 调用 logout 方法清空用户名
        navigate('/login'); // 跳转到登录页面
    };

    useEffect(() => {
        const fetchPendingRequests = async () => {
            try {
                const response = await axios.get('http://121.4.22.55:5202/api/user-management');
                const requests = response.data
                    .filter(user =>
                        user.friend === username &&
                        !user.is_friend_request_accepted &&
                        user.is_show_request === true
                    );
                setPendingRequestsCount(requests.length);
            } catch (error) {
                console.error('Error fetching pending requests:', error);
            }
        };

        if (username) {
            fetchPendingRequests();
        }
    }, [username]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
                setIsSettingsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleLeftPanel = () => {
        setLeftPanelOpen(!isLeftPanelOpen);
    };

    const fetchUserHeadImage = useCallback(async () => {
        if (isHeadImageLoaded.current) return;
        try {
            const response = await axios.get('http://121.4.22.55:5202/api/getuserheadimage', {
                params: { username }
            });
            if (response.data.imageUrl) {
                setUserHeadImage(response.data.imageUrl);
                isHeadImageLoaded.current = true;
            }
        } catch (error) {
            console.error('Error fetching user head image:', error);
        }
    }, [username]);

    useEffect(() => {
        const loadThemeSettings = async () => {
            try {
                const response = await axios.get('http://121.4.22.55:5202/api/getthemesettings', {
                    params: { username },
                });

                if (response.data.success) {
                    const settings = response.data.settings;
                    setThemeSettings({
                        theirFontColor: settings.their_font_color || '#000000',
                        theirBubbleColor: settings.their_bubble_color || '#D3D3D3',
                        myFontColor: settings.my_font_color || '#000000',
                        myBubbleColor: settings.my_bubble_color || '#90EE90',
                        backgroundColor: settings.background_color || '#F0F0F0',
                        useBackgroundImage: settings.use_background_image || false,
                        navbarFontColor: settings.navbar_font_color || '#FFFFFF',
                        navbarBackgroundColor: settings.navbar_background_color || '#2c3e50',
                    });
                } else {
                    console.log('未找到主题设置，使用默认值。');
                }
            } catch (error) {
                console.error('加载主题设置时出错:', error);
            }
        };

        loadThemeSettings();
    }, [username]);

    useEffect(() => {
        const navbar = document.querySelector('.chat-left-panel');
        if (navbar) {
            navbar.style.color = themeSettings.navbarFontColor;
            navbar.style.backgroundColor = themeSettings.navbarBackgroundColor;
        }
    }, [themeSettings.navbarFontColor, themeSettings.navbarBackgroundColor]);

    useEffect(() => {
        if (username && !isHeadImageLoaded.current) {
            fetchUserHeadImage();
        }
    }, [username, fetchUserHeadImage]);

    const handleOpenModal = () => {
        handleMenuItemClick('friend');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleFriendClick = (friend) => {
        setSelectedFriend(friend);
    };

    const refreshFriends = () => {
        setRefreshFriendsList(prev => !prev);
        const fetchPendingRequests = async () => {
            try {
                const response = await axios.get('http://121.4.22.55:5202/api/user-management');
                const requests = response.data
                    .filter(user =>
                        user.friend === username &&
                        !user.is_friend_request_accepted &&
                        user.is_show_request === true
                    );
                setPendingRequestsCount(requests.length);
            } catch (error) {
                console.error('Error fetching pending requests:', error);
            }
        };
        if (username) {
            fetchPendingRequests();
        }
    };

    const handleSettingsClick = () => {
        setIsSettingsMenuOpen(!isSettingsMenuOpen);
    };

    const handleMenuItemClick = (menuItem) => {
        setIsSettingsMenuOpen(false);
        switch (menuItem) {
            case 'theme':
                setModalContent(<ThemeSettings onClose={handleCloseModal} />);
                setIsModalOpen(true);
                break;
            case 'avatar':
                setModalContent(<AvatarSettings onClose={handleCloseModal} />);
                setIsModalOpen(true);
                break;
            case 'friend':
                setModalContent(<FriendManagement username={username} refreshFriends={refreshFriends} />);
                setIsModalOpen(true);
                break;
            case 'switch':
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        socket.on('newFriendRequest', (data) => {
            if (data.receiver === username) {
                // 在这里处理接收到的好友请求通知
                // 例如更新好友请求数量或显示通知
                setPendingRequestsCount(prevCount => prevCount + 1);
            }
        });

        return () => {
            socket.off('newFriendRequest');
        };
    }, [username]);

    return (
        <div className="chat-container">
            <div className={`chat-left-panel ${isLeftPanelOpen ? 'open' : 'closed'}`}>
                <div className="chat-container-usercontainer">
                    <div
                        className="chat-friend-list-usename"
                        onClick={handleOpenModal}
                    >
                        {userHeadImage ? (
                            <img
                                src={userHeadImage}
                                alt="User Head"
                                className="chat-friend-list-usename-img"
                            />
                        ) : (
                            <svg className="chat-friend-list-usename-icon" aria-hidden="true">
                                <use xlinkHref="#icon-a-gerenyonghu"></use>
                            </svg>
                        )}
                        <h2 className={`chat-friend-list-usename-ht ${!isLeftPanelOpen ? 'hidden' : ''}`} style={{ color: themeSettings.navbarFontColor }}>{username}</h2>
                        {pendingRequestsCount > 0 && (
                            <span className="chat-friend-request-count">{pendingRequestsCount}</span>
                        )}
                    </div>
                </div>

                <div className={`chat-container-friendslist-container ${isLeftPanelOpen ? 'visible' : 'hidden'}`}>
                    <FriendsList
                        username={username}
                        onFriendClick={handleFriendClick}
                        refreshTrigger={refreshFriendsList}
                        themeSettings={themeSettings}
                    />
                </div>

                <div className={`chat-container-container-div ${isLeftPanelOpen ? 'visible' : 'hidden'}`}>
                    <li className="chat-container-container">
                        <div className="chat-container-link"
                            style={{ color: themeSettings.navbarFontColor }}
                            onClick={handleSettingsClick}>
                            <svg className="chat-container-link-icon" aria-hidden="true">
                                <use xlinkHref="#icon-xitongguanli2"></use>
                            </svg>
                            设置
                        </div>
                        {isSettingsMenuOpen && (
                            <div className="chat-settings-menu" ref={settingsMenuRef}>
                                <div className="chat-settings-menu-item" onClick={() => handleMenuItemClick('theme')}>
                                    <svg className="chat-toggle-button-seeting-icon" aria-hidden="true">
                                        <use xlinkHref="#icon-zhuti"></use>
                                    </svg>主题设置
                                </div>
                                <div className="chat-settings-menu-item" onClick={() => handleMenuItemClick('avatar')}>
                                    <svg className="chat-toggle-button-seeting-icon" aria-hidden="true">
                                        <use xlinkHref="#icon-zhanghao"></use>
                                    </svg>头像设置
                                </div>
                                <div className="chat-settings-menu-item" onClick={() => handleMenuItemClick('friend')}>
                                    <svg className="chat-toggle-button-seeting-icon" aria-hidden="true">
                                        <use xlinkHref="#icon-haoyou-copy"></use>
                                    </svg>好友管理
                                </div>
                                <div className="chat-settings-menu-item">
                                    <Link to="/billingpage" className="chat-settings-menu-item">
                                        <svg className="chat-toggle-button-seeting-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-jizhang3"></use>
                                        </svg>记账管理
                                    </Link>
                                </div>
                                <div className="chat-settings-menu-item">
                                    <Link to="/login" className="chat-settings-menu-item">
                                        <svg className="chat-toggle-button-seeting-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-zhanghaoqiehuan"></use>
                                        </svg>用户切换
                                    </Link>
                                </div>
                                <div className="chat-settings-menu-item" onClick={handleLogout}>
                                    <svg className="chat-toggle-button-seeting-icon" aria-hidden="true">
                                        <use xlinkHref="#icon-bianzu"></use>
                                    </svg>退出账号
                                </div>
                            </div>
                        )}
                    </li>
                </div>

                <button className="chat-toggle-button" onClick={toggleLeftPanel}>
                    <div>
                        {isLeftPanelOpen ? (
                            <svg className="chat-toggle-button-collapsed-icon" aria-hidden="true">
                                <use xlinkHref="#icon-jiantou_liebiaoxiangzuo"></use>
                            </svg>
                        ) : (
                            <svg className="chat-toggle-button-collapsed-icon" aria-hidden="true">
                                <use xlinkHref="#icon-jiantou_liebiaoxiangyou"></use>
                            </svg>
                        )}
                    </div>
                </button>
            </div>
            <div className="chat-right-panel">
                <ChatWindow
                    selectedFriend={selectedFriend}
                    username={username}
                    themeSettings={themeSettings}
                    userHeadImage={userHeadImage}
                />
            </div>
            {isModalOpen && (
                <div className="chat-modal">
                    <div className="chat-modal-content">
                        <span className="chat-modal-close" onClick={handleCloseModal}>&times;</span>
                        {modalContent}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;