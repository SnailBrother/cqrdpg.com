// VideoCall.js - 修复版
import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import styles from './VideoCall.module.css';

const SERVER_URL = 'https://www.cqrdpg.com:8443';
const SOCKET_URL = SERVER_URL;

const VideoCall = ({ callerName, receiverName, callId, isInitiator, onClose }) => {
  const [isInRoom, setIsInRoom] = useState(false);
  const [users, setUsers] = useState([]);
  const [connectedPeers, setConnectedPeers] = useState(new Set());
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [debugInfo, setDebugInfo] = useState([]);
  const [featuredUserId, setFeaturedUserId] = useState(null);
  const [facingMode, setFacingMode] = useState('user');

  const localVideoRef = useRef(null);
  const featuredVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerInstancesRef = useRef({});
  const userIdRef = useRef('');
  const socketRef = useRef(null);
  const videoElementsRef = useRef({});
  const debugLogsRef = useRef([]);
  const pendingStreamsRef = useRef(new Map());
  const connectingPeersRef = useRef(new Set());
  const connectionEstablishedRef = useRef(new Set());

  const addDebugLog = useCallback((message) => {
    console.log(message);
    debugLogsRef.current = [...debugLogsRef.current, `${new Date().toLocaleTimeString()}: ${message}`].slice(-30);
    setDebugInfo([...debugLogsRef.current]);
  }, []);

  // 生成唯一用户ID（使用随机ID，而不是基于名字）
 
const getOrCreateUserId = useCallback(() => {
    // 🔥 重要：使用用户名组合作为唯一标识，而不是随机ID
    // 这样双方都能识别对方
    const myName = isInitiator ? callerName : receiverName;
    const otherName = isInitiator ? receiverName : callerName;
    
    // 使用固定的格式，确保同一用户在不同客户端生成相同的ID
    return `${myName}_${callId}`;
}, [callerName, receiverName, callId, isInitiator]);

  // 获取对方的用户ID（注意：实际对方ID需要从服务器获知）
  const getOtherUserId = useCallback(() => {
    // 从 users 列表中获取不是自己的那个
    return users.find(id => id !== userIdRef.current);
  }, [users]);

  // 打开系统摄像头选择器
  const openDevicePicker = useCallback(async () => {
    addDebugLog(`打开系统摄像头选择器...`);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];
      const newVideoTrack = stream.getVideoTracks()[0];

      if (oldVideoTrack && newVideoTrack) {
        oldVideoTrack.stop();
        localStreamRef.current.removeTrack(oldVideoTrack);
        localStreamRef.current.addTrack(newVideoTrack);

        Object.values(peerInstancesRef.current).forEach(peer => {
          if (!peer || peer.destroyed || !peer._pc) return;
          try {
            const senders = peer._pc.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(newVideoTrack).catch(() => {});
            }
          } catch (e) {}
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        if (featuredUserId === null && featuredVideoRef.current) {
          featuredVideoRef.current.srcObject = localStreamRef.current;
        }

        addDebugLog(`✅ 摄像头切换成功: ${newVideoTrack.label}`);
      }
    } catch (err) {
      addDebugLog(`用户取消或选择失败: ${err.message}`);
    }
  }, [featuredUserId, addDebugLog]);

  // 切换摄像头
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) {
      addDebugLog('❌ 没有本地流，无法切换摄像头');
      return;
    }

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    addDebugLog(`🔄 切换摄像头: ${facingMode} -> ${newFacingMode}`);

    try {
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      oldVideoTrack.stop();
      localStreamRef.current.removeTrack(oldVideoTrack);

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      localStreamRef.current.addTrack(newVideoTrack);

      Object.values(peerInstancesRef.current).forEach(peer => {
        if (!peer || peer.destroyed || !peer._pc) return;
        try {
          const senders = peer._pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack).catch(() => {});
          }
        } catch (e) {}
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      if (featuredUserId === null && featuredVideoRef.current) {
        featuredVideoRef.current.srcObject = localStreamRef.current;
      }

      setFacingMode(newFacingMode);
      addDebugLog(`✅ 摄像头切换成功`);
    } catch (err) {
      addDebugLog(`❌ 切换失败: ${err.message}`);
    }
  }, [facingMode, featuredUserId, addDebugLog]);

  // 绑定远程视频流
  const bindRemoteStream = useCallback((userId, stream) => {
    const videoElement = videoElementsRef.current[userId];
    if (videoElement) {
      addDebugLog(`✅ 绑定远程视频流到 ${userId.slice(-6)}`);
      videoElement.srcObject = stream;
      videoElement.onloadedmetadata = () => {
        videoElement.play().catch(e => addDebugLog(`播放错误: ${e.message}`));
      };

      if (featuredUserId === userId && featuredVideoRef.current) {
        featuredVideoRef.current.srcObject = stream;
      }
      return true;
    } else {
      addDebugLog(`⏳ 等待视频元素渲染: ${userId.slice(-6)}`);
      pendingStreamsRef.current.set(userId, stream);
      return false;
    }
  }, [featuredUserId, addDebugLog]);

  // 设置本地视频显示
  const setupLocalVideo = useCallback((stream) => {
    if (localVideoRef.current) {
      addDebugLog('✅ 本地视频元素已绑定');
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.onloadedmetadata = () => {
        localVideoRef.current.play().catch(e => addDebugLog(`本地视频播放失败: ${e.message}`));
      };
    }
    
    setTimeout(() => {
      if (featuredVideoRef.current) {
        addDebugLog('🔥 自动设置顶部放大区域为本地画面');
        featuredVideoRef.current.srcObject = stream;
        featuredVideoRef.current.onloadedmetadata = () => {
          featuredVideoRef.current.play().catch(e => addDebugLog(`顶部视频播放失败: ${e.message}`));
        };
      }
    }, 50);
  }, [addDebugLog]);

  // 获取本地媒体流
  const getMedia = useCallback(async (mode = facingMode) => {
    try {
      addDebugLog(`正在请求摄像头权限，方向: ${mode === 'user' ? '前置' : '后置'}...`);

      let stream;

      const tryGetStream = async (constraints) => {
        return await navigator.mediaDevices.getUserMedia(constraints);
      };

      try {
        stream = await tryGetStream({
          video: { facingMode: { exact: mode } },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (err1) {
        addDebugLog(`方式1失败: ${err1.message}`);
        try {
          stream = await tryGetStream({
            video: { facingMode: mode },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch (err2) {
          addDebugLog(`方式2失败: ${err2.message}`);
          try {
            stream = await tryGetStream({
              video: true,
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            });
          } catch (err3) {
            throw new Error(`所有获取摄像头方式都失败: ${err3.message}`);
          }
        }
      }

      localStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      addDebugLog(`✅ 获取到媒体流 - 视频: ${videoTrack?.label || '未知'}, 音频: ${stream.getAudioTracks().length}`);

      if (videoTrack) {
        const settings = videoTrack.getSettings();
        addDebugLog(`📷 视频设置: ${JSON.stringify(settings)}`);
        if (settings.facingMode) {
          setFacingMode(settings.facingMode);
        }
      }

      stream.getAudioTracks().forEach(track => {
        track.enabled = audioEnabled;
      });
      stream.getVideoTracks().forEach(track => {
        track.enabled = videoEnabled;
      });

      setupLocalVideo(stream);
      return stream;
    } catch (err) {
      addDebugLog(`❌ 获取媒体设备失败: ${err.message}`);
      setError('无法访问摄像头或麦克风: ' + err.message);
      throw err;
    }
  }, [audioEnabled, videoEnabled, setupLocalVideo, addDebugLog, facingMode]);

  // 创建 Peer 连接
  const createPeer = useCallback((targetUserId, shouldBeInitiator, stream) => {
    if (!stream) {
      addDebugLog(`❌ 创建 Peer 失败: 没有媒体流`);
      return null;
    }

    if (connectionEstablishedRef.current.has(targetUserId)) {
      addDebugLog(`⚠️ 与 ${targetUserId.slice(-6)} 的连接已建立，跳过`);
      return null;
    }

    if (connectingPeersRef.current.has(targetUserId)) {
      addDebugLog(`⚠️ 正在连接 ${targetUserId.slice(-6)}，跳过`);
      return null;
    }

    if (peerInstancesRef.current[targetUserId]) {
      addDebugLog(`销毁已存在的连接: ${targetUserId.slice(-6)}`);
      peerInstancesRef.current[targetUserId].destroy();
      delete peerInstancesRef.current[targetUserId];
    }

    connectingPeersRef.current.add(targetUserId);
    addDebugLog(`创建 Peer: target=${targetUserId.slice(-6)}, initiator=${shouldBeInitiator}`);

    const peer = new SimplePeer({
      initiator: shouldBeInitiator,
      stream: stream,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (data) => {
      if (socketRef.current && targetUserId) {
        addDebugLog(`发送信令到 ${targetUserId.slice(-6)}: ${data.type || 'candidate'}`);
        socketRef.current.emit('send-signal', {
          roomId: callId,
          targetUserId,
          signal: data
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      addDebugLog(`✅ 收到 ${targetUserId.slice(-6)} 的视频流`);
      const bound = bindRemoteStream(targetUserId, remoteStream);
      if (!bound) {
        addDebugLog(`⏳ 视频元素未就绪，已缓存流`);
      }
      setConnectedPeers(prev => new Set([...prev, targetUserId]));
      connectingPeersRef.current.delete(targetUserId);
      connectionEstablishedRef.current.add(targetUserId);
    });

    peer.on('connect', () => {
      addDebugLog(`✅ 与 ${targetUserId.slice(-6)} 的 P2P 连接已建立`);
    });

    peer.on('error', (err) => {
      addDebugLog(`❌ Peer 错误: ${err.message}`);
      connectingPeersRef.current.delete(targetUserId);
      
      if (!err.message.includes('setLocalDescription') &&
          !err.message.includes('setRemoteDescription') &&
          !err.message.includes('wrong state')) {
        setError(`连接失败: ${err.message}`);
      }
    });

    peer.on('close', () => {
      addDebugLog(`连接已关闭: ${targetUserId.slice(-6)}`);
      connectingPeersRef.current.delete(targetUserId);
      connectionEstablishedRef.current.delete(targetUserId);
      setConnectedPeers(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
      delete peerInstancesRef.current[targetUserId];
    });

    peerInstancesRef.current[targetUserId] = peer;
    return peer;
  }, [callId, addDebugLog, bindRemoteStream]);

  // 初始化 Socket 连接
  const initSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
      secure: true,
      rejectUnauthorized: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      addDebugLog('✅ Socket 已连接');
      setError('');
    });

    socket.on('connect_error', (err) => {
      addDebugLog(`❌ Socket 连接错误: ${err.message}`);
      setError('无法连接到服务器');
    });

    return socket;
  }, [addDebugLog]);

  // 点击缩略图放大
  const handleThumbnailClick = useCallback((userId) => {
    addDebugLog(`点击放大: ${userId === null ? '自己' : userId.slice(-6)}`);
    setFeaturedUserId(userId);

    if (featuredVideoRef.current) {
      if (userId === null) {
        featuredVideoRef.current.srcObject = localStreamRef.current;
      } else {
        const remoteVideo = videoElementsRef.current[userId];
        if (remoteVideo && remoteVideo.srcObject) {
          featuredVideoRef.current.srcObject = remoteVideo.srcObject;
        } else if (pendingStreamsRef.current.has(userId)) {
          featuredVideoRef.current.srcObject = pendingStreamsRef.current.get(userId);
        }
      }
    }
  }, [addDebugLog]);

  // 加入通话
  const joinCall = useCallback(async () => {
    if (!callId) {
      setError('无效的通话ID');
      return;
    }
  // 🔥 添加详细的调试信息
    addDebugLog(`========== 开始加入通话 ==========`);
    addDebugLog(`callId: ${callId}`);
    addDebugLog(`isInitiator: ${isInitiator}`);
    addDebugLog(`callerName: ${callerName}`);
    addDebugLog(`receiverName: ${receiverName}`);
    addDebugLog(`生成的用户ID: ${getOrCreateUserId()}`);
    addDebugLog(`对方用户ID应该是: ${isInitiator ? receiverName : callerName}_${callId}`);
    addDebugLog(`==================================`);

    
    setIsConnecting(true);
    setError('');
    setDebugInfo([]);
    debugLogsRef.current = [];
    pendingStreamsRef.current.clear();
    connectingPeersRef.current.clear();
    connectionEstablishedRef.current.clear();
    setFeaturedUserId(null);
    
    addDebugLog(`开始加入通话: ${callId}`);
    addDebugLog(`我是: ${isInitiator ? callerName : receiverName}`);

    try {
      const stream = await getMedia();
      addDebugLog('媒体流获取成功');

      const socket = initSocket();
      socketRef.current = socket;

      // 获取用户ID
      userIdRef.current = getOrCreateUserId();
      addDebugLog(`用户ID: ${userIdRef.current.slice(-6)}`);

      let joinResolve;
      const joinPromise = new Promise((resolve) => {
        joinResolve = resolve;
      });

      // 监听加入成功
      socket.on('join-success', (data) => {
        addDebugLog(`✅ 加入房间成功，房间内用户: ${data.userList?.length || 0}人`);
        setIsInRoom(true);
        setIsConnecting(false);
        joinResolve();
      });

      // 监听用户列表更新
      socket.on('user-list', (data) => {
        const userList = data.users;
        addDebugLog(`用户列表更新: ${userList.length}人`);
        addDebugLog(`当前用户: ${userIdRef.current.slice(-6)}`);
        
        const others = userList.filter(id => id !== userIdRef.current);
        setUsers(others);
        
        addDebugLog(`其他用户: ${others.map(id => id.slice(-6)).join(', ')}`);
        
        // 🔥 关键修复：根据 isInitiator 决定谁主动连接
        if (others.length > 0) {
          if (isInitiator) {
            // 发起方主动连接所有其他用户
            addDebugLog(`作为发起方，主动连接 ${others.length} 个用户`);
            others.forEach(userId => {
              if (!connectionEstablishedRef.current.has(userId) &&
                  !peerInstancesRef.current[userId]) {
                addDebugLog(`发起连接: ${userId.slice(-6)}`);
                createPeer(userId, true, stream);
              }
            });
          } else {
            // 接收方等待对方连接
            addDebugLog(`作为接收方，等待对方发起连接`);
          }
        }
      });

      // 监听新用户加入
      socket.on('user-connected', (data) => {
        const newUserId = data.userId;
        addDebugLog(`新用户加入: ${newUserId.slice(-6)}`);
        
        setUsers(prev => {
          if (!prev.includes(newUserId)) {
            return [...prev, newUserId];
          }
          return prev;
        });
        
        // 如果是发起方，主动连接新用户
        if (isInitiator && !connectionEstablishedRef.current.has(newUserId)) {
          addDebugLog(`主动连接新用户: ${newUserId.slice(-6)}`);
          createPeer(newUserId, true, stream);
        }
      });

      // 监听用户离开
      socket.on('user-disconnected', (leftUserId) => {
        addDebugLog(`用户离开: ${leftUserId.slice(-6)}`);
        setUsers(prev => prev.filter(id => id !== leftUserId));
        
        if (peerInstancesRef.current[leftUserId]) {
          peerInstancesRef.current[leftUserId].destroy();
          delete peerInstancesRef.current[leftUserId];
        }
        connectingPeersRef.current.delete(leftUserId);
        connectionEstablishedRef.current.delete(leftUserId);
        
        if (featuredUserId === leftUserId) {
          handleThumbnailClick(null);
        }
        
        // 如果对方离开，关闭通话
        if (leftUserId !== userIdRef.current && users.length === 1) {
          addDebugLog('对方已挂断通话');
          setTimeout(() => onClose(), 1000);
        }
      });

      // 监听信令
      socket.on('receive-signal', (data) => {
        addDebugLog(`收到信令，来自: ${data.fromUserId?.slice(-6)}`);
        
        if (connectionEstablishedRef.current.has(data.fromUserId)) {
          addDebugLog(`连接已建立，忽略信令`);
          return;
        }
        
        // 如果还没有创建 Peer，创建它（作为被动方）
        if (!peerInstancesRef.current[data.fromUserId] && !connectingPeersRef.current.has(data.fromUserId)) {
          addDebugLog(`作为被动方，创建 Peer`);
          createPeer(data.fromUserId, false, stream);
        }
        
        const peer = peerInstancesRef.current[data.fromUserId];
        if (peer && data.signal) {
          try {
            peer.signal(data.signal);
          } catch (err) {
            addDebugLog(`处理信令错误: ${err.message}`);
          }
        }
      });

      // 加入房间
      socket.emit('join-room', callId, userIdRef.current);

      await Promise.race([
        joinPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('加入超时')), 15000))
      ]);

    } catch (err) {
      addDebugLog(`❌ 加入通话失败: ${err.message}`);
      setError('无法加入通话: ' + err.message);
      setIsConnecting(false);
    }
  }, [callId, isInitiator, callerName, receiverName, getMedia, initSocket, createPeer, getOrCreateUserId, addDebugLog, handleThumbnailClick, featuredUserId, onClose, users]);

  // 离开通话
  const leaveCall = useCallback(() => {
    addDebugLog('离开通话');
    Object.values(peerInstancesRef.current).forEach(peer => {
      peer.destroy();
    });
    peerInstancesRef.current = {};
    pendingStreamsRef.current.clear();
    connectingPeersRef.current.clear();
    connectionEstablishedRef.current.clear();
    setFeaturedUserId(null);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.emit('leave-room');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsInRoom(false);
    setUsers([]);
    setConnectedPeers(new Set());
    setError('');
    onClose();

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (featuredVideoRef.current) {
      featuredVideoRef.current.srcObject = null;
    }
  }, [addDebugLog, onClose]);

  // 切换音视频
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setAudioEnabled(newState);
        addDebugLog(`音频 ${newState ? '开启' : '关闭'}`);
      }
    }
  }, [addDebugLog]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newState = !videoTrack.enabled;
        videoTrack.enabled = newState;
        setVideoEnabled(newState);
        addDebugLog(`视频 ${newState ? '开启' : '关闭'}`);
      }
    }
  }, [addDebugLog]);

  // 设置远程视频元素
  const setVideoRef = useCallback((userId, element) => {
    if (element && videoElementsRef.current[userId] !== element) {
      addDebugLog(`📹 远程视频元素已渲染: ${userId.slice(-6)}`);
      videoElementsRef.current[userId] = element;
      
      if (pendingStreamsRef.current.has(userId)) {
        const stream = pendingStreamsRef.current.get(userId);
        addDebugLog(`✅ 立即绑定等待中的视频流`);
        element.srcObject = stream;
        element.onloadedmetadata = () => {
          element.play().catch(e => addDebugLog(`播放错误: ${e.message}`));
        };
        pendingStreamsRef.current.delete(userId);
      }
    }
  }, [addDebugLog]);

  // 自动加入
  useEffect(() => {
    if (callId) {
      joinCall();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [callId]);

  // 进入房间后同步本地流
  useEffect(() => {
    if (isInRoom && localStreamRef.current && featuredVideoRef.current && featuredUserId === null) {
      featuredVideoRef.current.srcObject = localStreamRef.current;
      featuredVideoRef.current.play().catch(e => {});
    }
  }, [isInRoom, featuredUserId]);

  // 渲染部分保持不变...
  return (
    <div className={styles.container}>
      <div className={styles.debugPanel}>
        <details>
          <summary>🔍 调试信息 ({debugInfo.length})</summary>
          <div className={styles.debugContent}>
            {debugInfo.map((log, idx) => (
              <div key={idx} className={styles.debugLog}>{log}</div>
            ))}
          </div>
        </details>
      </div>

      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className={styles.closeError}>✕</button>
        </div>
      )}

      {!isInRoom ? (
        <div className={styles.joinPanel}>
          <div className={styles.loadingInfo}>
            <div className={styles.spinner}></div>
            <p>正在连接通话...</p>
            <p className={styles.callInfo}>
              与 {isInitiator ? receiverName : callerName} 的{isInitiator ? '呼出' : '接听'}中
            </p>
          </div>
          {isConnecting && (
            <button onClick={leaveCall} className={styles.cancelButton}>
              取消
            </button>
          )}
        </div>
      ) : (
        <div className={styles.callContainer}>
          <div className={styles.fullscreenVideoWrapper}>
            <video
              ref={featuredVideoRef}
              className={styles.fullscreenVideo}
              autoPlay
              playsInline
              muted={featuredUserId === null}
            />
            <div className={styles.videoLabel}>
              {featuredUserId === null ? (
                <>我 ({callerName})</>
              ) : (
                <>对方 ({featuredUserId.split('_')[0]})</>
              )}
            </div>
          </div>

          <div className={styles.overlayControls}>
            <div className={styles.controls}>
              <button onClick={toggleAudio} className={styles.controlBtn}>
                {audioEnabled ? '🎤 麦克风开' : '🔇 麦克风关'}
              </button>
              <button onClick={toggleVideo} className={styles.controlBtn}>
                {videoEnabled ? '📷 摄像头开' : '🚫 摄像头关'}
              </button>
              <button onClick={switchCamera} className={styles.controlBtn}>
                🔄 切换摄像头
              </button>
              <button onClick={leaveCall} className={`${styles.controlBtn} ${styles.controlBtnHangup}`}>
                📞 挂断
              </button>
              <button onClick={openDevicePicker} className={styles.controlBtn}>
                📷 选择摄像头
              </button>
            </div>

            <div className={styles.thumbnailSection}>
              <div className={styles.thumbnailGrid}>
                <div
                  className={`${styles.thumbnailCard} ${featuredUserId === null ? styles.activeThumbnail : ''}`}
                  onClick={() => handleThumbnailClick(null)}
                >
                  <div className={styles.thumbnailLabel}>我 ({callerName})</div>
                  <video
                    ref={localVideoRef}
                    className={styles.thumbnailVideo}
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className={styles.thumbnailStatus}>✅ 已连接</div>
                </div>

                {users.map(userId => (
                  <div
                    key={userId}
                    className={`${styles.thumbnailCard} ${featuredUserId === userId ? styles.activeThumbnail : ''}`}
                    onClick={() => handleThumbnailClick(userId)}
                  >
                    <div className={styles.thumbnailLabel}>
                      {userId.split('_')[0]}
                    </div>
                    <video
                      ref={(el) => setVideoRef(userId, el)}
                      className={styles.thumbnailVideo}
                      autoPlay
                      playsInline
                    />
                    <div className={styles.thumbnailStatus}>
                      {connectedPeers.has(userId) ? '✅ 已连接' : '⏳ 连接中...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;