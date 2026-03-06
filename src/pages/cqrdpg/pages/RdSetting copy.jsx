import React, { useState } from 'react';
import styles from './RdSetting.module.css';
// 引入两个子组件
import MessageManagement from './MessageManagement';
import QrcodeManagementSettings from './QrcodeManagementSettings';

const AVATAR_URL = '/RuidaLogo.jpg';
const ROTATING_TEXT = "重庆瑞达留言管理系统";

const RdSetting = () => {
    const [searchValue, setSearchValue] = useState('');
    // 定义当前激活的菜单项，默认显示 'message' (留言)
    const [activeTab, setActiveTab] = useState('message');

    return (
        <div className={styles.settingContainer}>
            {/* 左侧个人信息栏 */}
            <aside className={styles.sidebar}>

                {/* --- 旋转文字与头像区域 (保持不变) --- */}
                <div className={styles.rotateWrapper}>
                    <div className={styles.textCircle}>
                        {ROTATING_TEXT.split('').map((char, index) => {
                            const totalChars = ROTATING_TEXT.length;
                            const angle = (360 / totalChars) * index;
                            const radius = 80; 
                            return (
                                <span
                                    key={index}
                                    className={styles.circleChar}
                                    style={{
                                        transform: `rotate(${angle}deg) translateY(-${radius}px)`
                                    }}
                                >
                                    {char}
                                </span>
                            );
                        })}
                    </div>
                    <div className={styles.avatarWrapper}>
                        <img src={AVATAR_URL} alt="个人头像" className={styles.avatar} />
                    </div>
                </div>
                {/* --- 旋转区域结束 --- */}

                {/* --- 新增：左侧导航菜单 --- */}
                <nav className={styles.navMenu}>
                    <button 
                        className={`${styles.navItem} ${activeTab === 'message' ? styles.active : ''}`}
                        onClick={() => setActiveTab('message')}
                    >
                        <span className={styles.navIcon}>💬</span>
                        <span className={styles.navText}>留言管理</span>
                    </button>

                    <button 
                        className={`${styles.navItem} ${activeTab === 'qrcode' ? styles.active : ''}`}
                        onClick={() => setActiveTab('qrcode')}
                    >
                        <span className={styles.navIcon}>📱</span>
                        <span className={styles.navText}>二维码设置</span>
                    </button>
                </nav>
                {/* --- 导航菜单结束 --- */}

            </aside>

            {/* 右侧主内容区 */}
            <main className={styles.mainContent}>
                {/* 顶部搜索栏 (保持不变) */}
                <div className={styles.searchBar}>
                    <div className={styles.searchInputWrapper}>
                        <span className={styles.searchPrefix}>BING</span>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="请输入搜索内容..."
                            className={styles.searchInput}
                        />
                        <button className={styles.searchBtn}>🔍</button>
                    </div>

                    <div className={styles.timeInfo}>
                        {new Date().toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            weekday: 'long'
                        }).replace(/\//g, '-')}
                    </div>
                </div>

                {/* 下方内容区 - 根据 activeTab 动态渲染 */}
                <div className={styles.tableContainer}>
                    {activeTab === 'message' && (
                        <MessageManagement />
                    )}
                    {activeTab === 'qrcode' && (
                        <QrcodeManagementSettings />
                    )}
                </div>
            </main>
        </div>
    );
};

export default RdSetting;