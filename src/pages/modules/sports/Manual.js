import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './Manual.module.css';

const Manual = () => {
    const [sportsList, setSportsList] = useState([]);
    const [activeSport, setActiveSport] = useState(null);
    const [markdownContent, setMarkdownContent] = useState('');
    const [isLoadingSports, setIsLoadingSports] = useState(true);
    const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);
    const [sportsError, setSportsError] = useState(null);
    const [markdownError, setMarkdownError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // 手机端模态框状态

    // 1. 获取左侧运动选项列表
    useEffect(() => {
        const fetchSportsOptions = async () => {
            try {
                setIsLoadingSports(true);
                const response = await fetch('/api/getSportsOptions');

                if (!response.ok) {
                    throw new Error(`请求失败: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('API返回数据:', data);

                if (Array.isArray(data) && data.length > 0) {
                    setSportsList(data);
                    setActiveSport(data[0]);
                } else {
                    throw new Error('没有获取到运动选项数据');
                }

                setSportsError(null);
            } catch (err) {
                console.error('获取运动选项失败:', err);
                setSportsError(`加载运动列表失败: ${err.message}`);
            } finally {
                setIsLoadingSports(false);
            }
        };

        fetchSportsOptions();
    }, []);

    // 2. 使用 id 加载对应的 Markdown 文件
    useEffect(() => {
        if (!activeSport || !activeSport.id) return;

        const fetchMarkdown = async () => {
            try {
                setIsLoadingMarkdown(true);
                setMarkdownError(null);
                setMarkdownContent('');

                const mdFileName = `${activeSport.id}.md`;
                const url = `/manual/${mdFileName}`;
                
                console.log('准备请求:', url);
                console.log('当前运动:', activeSport.sport_type_Options, 'ID:', activeSport.id);

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`请求失败: ${response.status}`);
                }

                const text = await response.text();
                console.log('加载成功，文件长度:', text.length);
                setMarkdownContent(text);
            } catch (err) {
                console.error('加载失败:', err);
                setMarkdownError(`无法加载运动指南 (ID: ${activeSport.id})`);
            } finally {
                setIsLoadingMarkdown(false);
            }
        };

        fetchMarkdown();
    }, [activeSport]);

    // 选择运动（手机端）
    const handleSelectSport = (sport) => {
        setActiveSport(sport);
        setIsModalOpen(false); // 关闭模态框
    };

    const renderIcon = (iconName) => {
        if (!iconName) return null;
        return (
            <svg className={styles.sportIcon} aria-hidden="true">
                <use xlinkHref={`#${iconName}`} />
            </svg>
        );
    };

    // 获取当前选中的运动名称
    const getCurrentSportName = () => {
        return activeSport?.sport_type_Options || '请选择运动';
    };

    if (isLoadingSports) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>正在加载运动列表...</p>
                </div>
            </div>
        );
    }

    if (sportsError) {
        return (
            <div className={styles.container}>
                <div className={styles.errorContainer}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <p>{sportsError}</p>
                    <button className={styles.retryButton} onClick={() => window.location.reload()}>
                        重试
                    </button>
                </div>
            </div>
        );
    }

    if (sportsList.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyContainer}>
                    <span className={styles.emptyIcon}>🏃</span>
                    <p>暂无运动项目，请在数据库中添加</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* PC端左侧边栏 - 电脑端显示 */}
                <div className={styles.sidebar}>
                    <h3 className={styles.sidebarTitle}>运动项目</h3>
                    <ul className={styles.exerciseList}>
                        {sportsList.map((sport) => (
                            <li
                                key={sport.id}
                                className={`${styles.exerciseItem} ${activeSport?.id === sport.id ? styles.active : ''}`}
                                onClick={() => setActiveSport(sport)}
                            >
                                <div className={styles.exerciseInfo}>
                                    {sport.icon_Options && renderIcon(sport.icon_Options)}
                                    <span className={styles.exerciseName}>{sport.sport_type_Options}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 手机端运动选择按钮 - 只在手机端显示 */}
                <div className={styles.mobileSportSelector}>
                    <button 
                        className={styles.mobileSportButton}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <div className={styles.mobileSportInfo}>
                            {activeSport?.icon_Options && renderIcon(activeSport.icon_Options)}
                            <span className={styles.mobileSportName}>{getCurrentSportName()}</span>
                        </div>
                        
                    </button>
                </div>

                {/* 手机端模态框 */}
                {isModalOpen && (
                    <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3>选择运动项目</h3>
                                <button className={styles.modalClose} onClick={() => setIsModalOpen(false)}>✕</button>
                            </div>
                            <div className={styles.modalList}>
                                {sportsList.map((sport) => (
                                    <div
                                        key={sport.id}
                                        className={`${styles.modalItem} ${activeSport?.id === sport.id ? styles.modalItemActive : ''}`}
                                        onClick={() => handleSelectSport(sport)}
                                    >
                                        <div className={styles.modalItemInfo}>
                                            {sport.icon_Options && renderIcon(sport.icon_Options)}
                                            <span>{sport.sport_type_Options}</span>
                                        </div>
                                        {activeSport?.id === sport.id && (
                                            <span className={styles.modalItemCheck}>✓</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 右侧详情内容 */}
                <div className={styles.detail}>
                    {isLoadingMarkdown ? (
                        <div className={styles.markdownLoading}>
                            <div className={styles.loadingSpinnerSmall}></div>
                            <p>正在加载 {activeSport?.sport_type_Options} 运动指南...</p>
                        </div>
                    ) : markdownError ? (
                        <div className={styles.markdownError}>
                            <span className={styles.errorIcon}>📄</span>
                            <p>{markdownError}</p>
                            <p className={styles.errorHint}>
                                提示：请确保文件 <strong>/manual/{activeSport?.id}.md</strong> 存在
                            </p>
                        </div>
                    ) : (
                        <div className={styles.markdownContent}>
                            <ReactMarkdown
                                components={{
                                    img: ({ node, ...props }) => (
                                        <img className={styles.markdownImage} {...props} alt={props.alt || '运动图片'} />
                                    ),
                                    h1: ({ node, ...props }) => <h1 className={styles.markdownH1} {...props} />,
                                    h2: ({ node, ...props }) => <h2 className={styles.markdownH2} {...props} />,
                                    h3: ({ node, ...props }) => <h3 className={styles.markdownH3} {...props} />,
                                    code: ({ node, inline, ...props }) =>
                                        inline ? (
                                            <code className={styles.inlineCode} {...props} />
                                        ) : (
                                            <pre className={styles.codeBlock}>
                                                <code {...props} />
                                            </pre>
                                        ),
                                }}
                            >
                                {markdownContent}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Manual;