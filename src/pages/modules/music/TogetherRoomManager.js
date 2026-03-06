// src/components/modules/music/TogetherRoomManager.js
// src/components/modules/music/TogetherRoomManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useMusic } from '../../../context/MusicContext';
import axios from 'axios';
import { ConfirmationDialog } from '../../../components/UI';
import styles from './TogetherRoomManager.module.css';
import io from 'socket.io-client';

// 创建 Socket.IO 实例
const socket = io('http://121.4.22.55:5202');

const TogetherRoomManager = () => {
    const [rooms, setRooms] = useState([]);
    const { user, isAuthenticated } = useAuth();
    const { dispatch } = useMusic(); // 新增
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [password, setPassword] = useState('');
    const [joinRoomName, setJoinRoomName] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingRoomAction, setPendingRoomAction] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const currentUserRoom = rooms.find(room => room.users?.some(u => u.email === user.email));

    // Socket.IO 连接和事件监听
    useEffect(() => {
        // 连接成功
        socket.on('connect', () => {
            console.log('Socket.IO 连接成功');
            setSocketConnected(true);
        });

        // 连接断开
        socket.on('disconnect', () => {
            console.log('Socket.IO 连接断开');
            setSocketConnected(false);
        });

        // 监听房间列表更新事件
        socket.on('rooms-updated', () => {
            console.log('收到房间列表更新通知，重新获取数据');
            fetchRooms();
        });

        // 监听房间解散事件
        socket.on('room-dissolved', () => {
            console.log('收到房间解散通知');
            fetchRooms();
            alert('您所在的房间已被解散');
        });

        // 监听房间关闭事件
        socket.on('room-closed', () => {
            console.log('收到房间关闭通知');
            fetchRooms();
            alert('房间已关闭');
        });

        // 清理事件监听器
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('rooms-updated');
            socket.off('room-dissolved');
            socket.off('room-closed');
            socket.off('room-users-update');
            socket.off('room-state-update');
            socket.off('new-message');
        };
    }, []);

    // 获取房间列表的函数
    const fetchRooms = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await axios.get('/api/ReactDemomusic-rooms');
            setRooms(response.data);
        } catch (err) {
            console.error('获取房间列表失败:', err);
            setError('获取房间列表失败: ' + (err.response?.data?.error || err.message));
        }
    }, [isAuthenticated]);
    // 在获取房间列表后，检查用户是否在房间中并更新状态
    useEffect(() => {
        if (currentUserRoom) {
            // 用户在当前房间，更新音乐上下文
            dispatch({
                type: 'SET_ROOM_INFO',
                payload: {
                    room: currentUserRoom,
                    isInRoom: true,
                    roomUsers: currentUserRoom.users || [],
                    isHost: currentUserRoom.host === user.email
                }
            });
        } else {
            // 用户不在任何房间，清除房间信息
            dispatch({ type: 'CLEAR_ROOM_INFO' });
        }
    }, [currentUserRoom, user.email, dispatch]);
    // 组件首次挂载和定时刷新逻辑
    useEffect(() => {
        fetchRooms();

        // 由于有了 Socket.IO 实时通知，可以延长轮询间隔或完全移除
        const interval = setInterval(fetchRooms, 30000); // 延长到30秒

        return () => clearInterval(interval);
    }, [fetchRooms]);

    // 加入房间后加入对应的 Socket.IO 房间
    useEffect(() => {
        if (currentUserRoom && socketConnected) {
            // 离开所有房间
            socket.emit('leave-all-rooms');

            // 加入当前房间
            socket.emit('join-room', `room-${currentUserRoom.id}`);
            console.log(`加入 Socket.IO 房间: room-${currentUserRoom.id}`);
        }
    }, [currentUserRoom, socketConnected]);

    // --- 数据操作函数 ---

    const createRoom = async (e) => {
        e.preventDefault();
        if (!roomName.trim()) { setError('请输入房间名称'); return; }
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/ReactDemomusic-rooms', {
                room_name: roomName.trim(),
                password: password || null,
                host: user.email,
                max_users: 10
            });
            setShowCreateForm(false);
            setRoomName('');
            setPassword('');

            // 创建成功后，Socket.IO 会自动广播 rooms-updated 事件
            // 我们只需要等待事件触发重新获取数据
            alert('房间创建成功！');
        } catch (err) {
            const errorMsg = err.response?.data?.error || '创建房间失败';
            setError(errorMsg);
            alert('创建失败: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/ReactDemomusic-rooms/join', {
                room_name: joinRoomName,
                password: joinPassword || null,
                email: user.email
            });
            setShowJoinForm(false);
            setJoinRoomName('');
            setJoinPassword('');

            // 加入成功后，Socket.IO 会自动广播 rooms-updated 事件
            alert('加入房间成功！');
        } catch (err) {
            const errorMsg = err.response?.data?.error || '加入房间失败';
            setError(errorMsg);
            alert('加入失败: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const deleteRoom = async (roomName) => {
        try {
            await axios.delete(`/api/ReactDemomusic-rooms/${roomName}`, {
                data: { email: user.email }
            });
            // 解散成功后，Socket.IO 会自动广播 rooms-updated 和 room-dissolved 事件
            alert('房间已成功解散');
        } catch (err) {
            const errorMsg = err.response?.data?.error || '解散房间失败';
            alert('解散失败: ' + errorMsg);
        }
    };

    const leaveRoom = async (roomName) => {
        try {
            await axios.post('/api/ReactDemomusic-rooms/leave', {
                room_name: roomName,
                email: user.email
            });
            // 离开成功后，Socket.IO 会自动广播 rooms-updated 事件
            alert('已成功离开房间');
        } catch (err) {
            const errorMsg = err.response?.data?.error || '离开房间失败';
            alert('离开失败: ' + errorMsg);
        }
    };

    // --- 对话框和交互逻辑 ---

    const promptAction = (actionType, roomName) => {
        setPendingRoomAction({ type: actionType, roomName });
        setShowConfirmDialog(true);
    };

    const confirmAction = async () => {
        if (!pendingRoomAction) return;

        setLoading(true);
        if (pendingRoomAction.type === 'delete') {
            await deleteRoom(pendingRoomAction.roomName);
        } else if (pendingRoomAction.type === 'leave') {
            await leaveRoom(pendingRoomAction.roomName);
        }
        setLoading(false);
        setShowConfirmDialog(false);
        setPendingRoomAction(null);
    };

    const cancelAction = () => {
        setShowConfirmDialog(false);
        setPendingRoomAction(null);
    };

    // --- 渲染逻辑 ---

    if (!isAuthenticated) {
        return <div className={styles.roomManager}><p>请先登录以使用一起听歌功能</p></div>;
    }



    return (
        <div className={styles.roomManager}>
            <div className={styles.header}>
                {/* <h3>一起听歌 🎵</h3> */}
                {/* <div className={styles.connectionStatus}>
                    <span className={`${styles.statusIndicator} ${socketConnected ? styles.connected : styles.disconnected}`}>
                        {socketConnected ? '● 实时连接' : '○ 连接断开'}
                    </span>
                </div> */}
                {currentUserRoom && (
                    <div className={styles.currentRoom}>
                        <span>当前房间: <strong>{currentUserRoom.room_name}</strong></span>
                        <span className={styles.roomStatus}>
                            {currentUserRoom.host === user.email ? '👑 房主' : '👥 成员'}
                        </span>
                    </div>
                )}
                <div className={styles.buttons}>
                    <button
                        className={styles.primaryButton}
                        onClick={() => setShowCreateForm(true)}
                        disabled={loading || !!currentUserRoom}
                    >
                        创建房间
                    </button>
                    {/* <button
                        className={styles.secondaryButton}
                        onClick={() => setShowJoinForm(true)}
                        disabled={loading || !!currentUserRoom}
                    >
                        加入房间
                    </button> */}
                    {/* <button
                        className={styles.refreshButton}
                        onClick={fetchRooms}
                        disabled={loading}
                    >
                        刷新列表
                    </button> */}
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <ConfirmationDialog
                isOpen={showConfirmDialog}
                title={pendingRoomAction?.type === 'delete' ? "解散房间" : "离开房间"}
                message={pendingRoomAction?.type === 'delete' ? "确定要解散房间吗？此操作不可撤销。" : "确定要离开这个房间吗？"}
                confirmText={pendingRoomAction?.type === 'delete' ? "确认解散" : "确认离开"}
                onConfirm={confirmAction}
                onCancel={cancelAction}
            />

            {showCreateForm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h4>创建房间</h4>
                        <form onSubmit={createRoom}>
                            <div className={styles.formGroup}>
                                <label>房间名称:</label>
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>房间密码 (可选):</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className={styles.modalButtons}>
                                <button type="submit" disabled={loading}>
                                    {loading ? '创建中...' : '创建'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    disabled={loading}
                                >
                                    取消
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showJoinForm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h4>加入房间</h4>
                        <form onSubmit={joinRoom}>
                            <div className={styles.formGroup}>
                                <label>房间名称:</label>
                                <input
                                    type="text"
                                    value={joinRoomName}
                                    onChange={(e) => setJoinRoomName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>房间密码:</label>
                                <input
                                    type="password"
                                    value={joinPassword}
                                    onChange={(e) => setJoinPassword(e.target.value)}
                                    placeholder="(无密码可不填)"
                                    disabled={loading}
                                />
                            </div>
                            <div className={styles.modalButtons}>
                                <button type="submit" disabled={loading}>
                                    {loading ? '加入中...' : '加入'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowJoinForm(false)}
                                    disabled={loading}
                                >
                                    取消
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className={styles.roomList}>
                <h4>可用房间 ({rooms?.length || 0})</h4>
                {!rooms || rooms.length === 0 ? (
                    <p>{loading ? '正在加载房间...' : '暂无房间，点击上方按钮创建一个吧！'}</p>
                ) : (
                    rooms.map(room => {
                        const isHost = room.host === user?.email;
                        const isInRoom = room.users?.some(u => u.email === user.email);
                        const isFull = room.current_users >= room.max_users;

                        return (
                            <div key={room.id} className={`${styles.roomItem} ${isInRoom ? styles.inRoom : ''}`}>
                                <div className={styles.roomInfo}>
                                    <span className={styles.roomName}>
                                        <svg className={styles.roomNameicon}  aria-hidden="true">
                                            <use xlinkHref="#icon-house" />
                                        </svg>
                                        {room.room_name}</span>
                                    <span className={styles.host}>房主: {room.host.split('@')[0]}</span>
                                    <span className={styles.users}>人数: {room.current_users || 0}/{room.max_users} 人</span>
                                    {/* {room.password && <span className={styles.locked}>🔒</span>} */}
                                </div>
                                {/* <div className={styles.roomStatus}>
                                    {isInRoom ?
                                        <span className={styles.statusIn}>✅ 在房间内</span> :
                                        <span className={styles.statusOut}>- 未加入 -</span>
                                    }
                                </div> */}
                                <div className={styles.roomActions}>
                                    {isHost && (
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() => promptAction('delete', room.room_name)}
                                            disabled={loading}
                                        >
                                            解散
                                        </button>
                                    )}
                                    {isInRoom && !isHost && (
                                        <button
                                            className={styles.leaveButton}
                                            onClick={() => promptAction('leave', room.room_name)}
                                            disabled={loading}
                                        >
                                            退出
                                        </button>
                                    )}
                                    {!isInRoom && (
                                        <button
                                            className={styles.joinButton}
                                            onClick={() => {
                                                setJoinRoomName(room.room_name);
                                                setShowJoinForm(true);
                                            }}
                                            disabled={isFull || loading}
                                        >
                                            {isFull ? '已满' : '加入'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TogetherRoomManager;