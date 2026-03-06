import React, { useState, useEffect } from 'react';
import './CustomBackground.css';
import { useAuth } from '../../context/AuthContext'; // 使用 useAuth hook
import { useTheme } from '../../context/ThemeContext';
import io from 'socket.io-client';

const socket = io('http://121.4.22.55:5202', {
  transports: ['websocket', 'polling']
});

const CustomBackground = () => {
  const { user } = useAuth(); // 使用 useAuth hook 获取用户信息
  const { activeTheme } = useTheme();
  const [imageSrc, setImageSrc] = useState('');
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  useEffect(() => {
    const checkImageExists = (url, callback) => {
      const img = new Image();
      img.onload = () => callback(true);
      img.onerror = () => callback(false);
      img.src = url;
    };

    if (user?.email && activeTheme?.id) {
      // 使用动态的 themeId 而不是硬编码的 6
      const userImageUrl = `http://121.4.22.55:8888/backend/images/ReactDemoUserThemeSettings/${user.email}/${activeTheme.id}/CustomBackground.jpg?t=${imageTimestamp}`;
      
      checkImageExists(userImageUrl, (exists) => {
        if (exists) {
          setImageSrc(userImageUrl);
        } else {
          setImageSrc('http://121.4.22.55:8888/backend/images/ReactDemoUserThemeSettings/default/CustomBackground.jpg');
        }
      });
    }
  }, [user, activeTheme, imageTimestamp]);

  // 监听背景图片更新事件
  useEffect(() => {
    socket.on('background-image-updated', (data) => {
      if (data.email === user?.email) {
        setImageTimestamp(data.timestamp || Date.now());
      }
    });

    if (user?.email) {
      socket.emit('join-user-room', user.email);
    }

    return () => {
      socket.off('background-image-updated');
    };
  }, [user]);

  return (
    <div className="customBackground-container">
      {imageSrc && (
        <img 
          src={imageSrc}
          alt="Custom Background" 
          className="customBackground-image"
          onError={(e) => {
            e.target.src = 'http://121.4.22.55:8888/backend/images/ReactDemoUserThemeSettings/default/CustomBackground.jpg';
          }}
        />
      )}
    </div>
  );
};

export default CustomBackground;

// src="http://121.4.22.55:8888/backend/images/SystemThemesettings/李中敬/CustomBackground.jpg"
