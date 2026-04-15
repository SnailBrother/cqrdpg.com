// MusicMenu.jsx
import React from 'react';
import SlidingNavView from './../../../components/UI/SlidingNavView';
import PublicNews from './PublicNews';
import SiteLinks from './SiteLinks';
import Specialtips from './Specialtips';
import styles from './QuickCopy.module.css';

const MusicMenu = () => {
    // 定义页面配置
    const pages = [
        { component: PublicNews, props: {} },
        { component: SiteLinks, props: {} },
        { component: Specialtips, props: {} }
    ];

    // 导航标签
    const labels = ['消息通知', '快捷网站', '特别通知'];

    const handlePageChange = (index) => {
        console.log('切换到页面:', index);
        // 可以在这里添加页面切换的逻辑
    };

    return (
        <div className={styles.musicMenu}>
            <SlidingNavView
                pages={pages}
                labels={labels}
                navType="text" // 改为 "dots" 就可以切换回点状导航
                defaultIndex={0}
                onPageChange={handlePageChange}
                className={styles.menuContainer}
            />
        </div>
    );
};

export default MusicMenu;