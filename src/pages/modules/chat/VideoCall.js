// VideoCall.js
import React, { useEffect, useRef, useState } from 'react';
import styles from './VideoCall.module.css';

const VideoCall = ({ callerName, receiverName, callId, isInitiator, onClose }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    
    useEffect(() => {
        // 获取本地媒体流
        const getLocalStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: true 
                });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing media devices:', error);
            }
        };
        
        getLocalStream();
        
        console.log('VideoCall component mounted', { callerName, receiverName, callId, isInitiator });
        
        return () => {
            // 清理逻辑：关闭所有媒体流
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [callerName, receiverName, callId, isInitiator]);
    
    // 静音/取消静音
    const toggleMute = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = isMuted;
            });
            setIsMuted(!isMuted);
        }
    };
    
    // 开启/关闭视频
    const toggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = isVideoOff;
            });
            setIsVideoOff(!isVideoOff);
        }
    };
    
    // 挂断通话
    const handleEndCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        onClose();
    };
    
    return (
        <div className={styles.videoCallComponent}>
            <div className={styles.videoCallHeader}>
                <h3 className={styles.videoCallTitle}>
                    与 {isInitiator ? receiverName : callerName} 的视频通话
                </h3>
                <button className={styles.videoCallCloseBtn} onClick={handleEndCall}>
                    挂断
                </button>
            </div>
            
            <div className={styles.videoCallContent}>
                <div className={styles.remoteVideoContainer}>
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className={styles.remoteVideo} 
                    />
                    <div className={styles.remoteVideoPlaceholder}>
                        {isInitiator ? receiverName : callerName}
                    </div>
                </div>
                
                <div className={styles.localVideoContainer}>
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={styles.localVideo} 
                    />
                </div>
            </div>
            
            <div className={styles.videoCallControls}>
                <button 
                    className={`${styles.controlBtn} ${styles.muteBtn} ${isMuted ? styles.active : ''}`}
                    onClick={toggleMute}
                >
                    <svg className={styles.controlIcon} viewBox="0 0 24 24">
                        {isMuted ? (
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        ) : (
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
                        )}
                    </svg>
                    <span>{isMuted ? '取消静音' : '静音'}</span>
                </button>
                
                <button 
                    className={`${styles.controlBtn} ${styles.videoBtn} ${isVideoOff ? styles.active : ''}`}
                    onClick={toggleVideo}
                >
                    <svg className={styles.controlIcon} viewBox="0 0 24 24">
                        {isVideoOff ? (
                            <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z"/>
                        ) : (
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        )}
                    </svg>
                    <span>{isVideoOff ? '开启视频' : '关闭视频'}</span>
                </button>
                
                <button 
                    className={`${styles.controlBtn} ${styles.endCallBtn}`}
                    onClick={handleEndCall}
                >
                    <svg className={styles.controlIcon} viewBox="0 0 24 24">
                        <path d="M12 9c-2.6 0-5.2.6-7.6 1.7-1 .5-1.6 1.5-1.6 2.5v2.8c0 .8.7 1.5 1.5 1.5h1.5c.8 0 1.5-.7 1.5-1.5v-1.5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1.5c0 .8.7 1.5 1.5 1.5h1.5c.8 0 1.5-.7 1.5-1.5v-2.8c0-1-.6-2-1.6-2.5C17.2 9.6 14.6 9 12 9z"/>
                    </svg>
                    <span>挂断</span>
                </button>
            </div>
        </div>
    );
};

export default VideoCall;