// src/components/modules/music/MusicLayout.js
import React from 'react';
import { useMusic } from '../../../context/MusicContext';
import Player from './Player';
import styles from './MusicLayout.module.css';

const MusicLayout = ({ children }) => {
  const { state } = useMusic();

  return (
    <div className={styles.musicLayout}>
      {/* 主要内容区域 */}
      <div className={styles.musicContent}>
        {children}
      </div>
      
      {/* 播放器 - 始终显示 */}
      {/* <div className={styles.playerWrapper}>
        <Player />
      </div> */}
    </div>
  );
};

export default MusicLayout;