import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './NewsDetails.module.css';

const API_BASE_URL = '/api/publish-news';
const SERVER_BASE_URL = 'http://www.cqrdpg.com/backend';
const DEFAULT_IMAGE = `${SERVER_BASE_URL}/images/PublishNewsPictures/Defaultbackground.jpg`;

const NewsDetails = () => {
  const { id } = useParams(); // 获取当前 URL 中的 ID
  const navigate = useNavigate();
  
  // 状态管理
  const [newsList, setNewsList] = useState([]); // 左侧列表数据
  const [currentNews, setCurrentNews] = useState(null); // 右侧详情数据
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 获取新闻列表 (用于左侧侧边栏)
  useEffect(() => {
    const fetchList = async () => {
      try {
        // 获取最新 50 条作为侧边栏列表，不区分分类，或者你可以加分类筛选逻辑
        const res = await fetch(`${API_BASE_URL}/list?page=1&limit=50`);
        if (!res.ok) throw new Error('列表加载失败');
        const data = await res.json();
        
        const list = (data.list || []).map(item => {
           // 简单处理图片
           let imgUrl = DEFAULT_IMAGE;
           if (item.ImageUrl && item.ImageUrl !== 'Defaultbackground.jpg') {
             imgUrl = item.ImageUrl.startsWith('http') 
               ? item.ImageUrl 
               : `${SERVER_BASE_URL}/${item.ImageUrl.startsWith('/') ? item.ImageUrl.slice(1) : item.ImageUrl}`;
           }
           return { ...item, thumb: imgUrl };
        });
        
        setNewsList(list);
      } catch (err) {
        console.error('Failed to fetch list:', err);
      }
    };
    
    fetchList();
  }, []);

  // 2. 获取当前 ID 的详情 (右侧内容)
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      setCurrentNews(null); // 清空旧数据，显示加载状态

      try {
        const res = await fetch(`${API_BASE_URL}/${id}`);
        
        if (!res.ok) {
          if (res.status === 404) throw new Error('该新闻不存在或已被删除');
          throw new Error('网络请求失败');
        }

        const data = await res.json();
        const item = data.data || data;

        if (!item) throw new Error('未找到数据');

        // 处理详情图片
        let imgUrl = DEFAULT_IMAGE;
        if (item.ImageUrl && item.ImageUrl !== 'Defaultbackground.jpg') {
           imgUrl = item.ImageUrl.startsWith('http') 
             ? item.ImageUrl 
             : `${SERVER_BASE_URL}/${item.ImageUrl.startsWith('/') ? item.ImageUrl.slice(1) : item.ImageUrl}`;
        }

        setCurrentNews({ ...item, fullImage: imgUrl });

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]); // 依赖项是 id，只要 URL 里的 id 变了，这里就会重新执行

  // 处理左侧点击
  const handleListItemClick = (newsId) => {
    if (newsId.toString() !== id) {
      navigate(`/newsdetails/${newsId}`);
      // 移动端点击后自动滚动到顶部
      window.scrollTo(0, 0);
    }
  };

  // 格式化日期
// 最简洁的实现
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
};

  return (
    <div className={styles.layoutContainer}>
      {/* --- 左侧侧边栏 --- */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>相关新闻</h3>
          <span className={styles.count}>{newsList.length} 条</span>
        </div>
        
        <div className={styles.listScrollArea}>
          {newsList.length === 0 ? (
            <div className={styles.emptyTip}>暂无新闻</div>
          ) : (
            newsList.map(item => (
              <div 
                key={item.Id}
                className={`${styles.listItem} ${item.Id.toString() === id ? styles.active : ''}`}
                onClick={() => handleListItemClick(item.Id)}
              >
                <div className={styles.listThumb}>
                  <img src={item.thumb} alt="" onError={(e) => e.target.src = DEFAULT_IMAGE} />
                </div>
                <div className={styles.listInfo}>
                  <h4 className={styles.listTitle}>{item.Title}</h4>
                  <span className={styles.listDate}>{formatDate(item.PublishDate)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* --- 右侧详情区域 --- */}
      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>正在加载详情...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <h2>⚠️ 出错了</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/news')} className={styles.retryBtn}>返回新闻首页</button>
          </div>
        ) : currentNews ? (
          <article className={styles.article}>
            <div className={styles.breadcrumb}>
              <span onClick={() => navigate('/news')} className={styles.crumbLink}>新闻动态</span>
              <span className={styles.crumbSeparator}>/</span>
              <span className={styles.crumbCurrent}>{currentNews.Category}</span>
            </div>

            <h1 className={styles.title}>{currentNews.Title}</h1>
            
            <div className={styles.metaBar}>
              <span className={styles.metaItem}>📅 {formatDate(currentNews.PublishDate)}</span>
              <span className={styles.metaItem}>👁️ 浏览：{currentNews.ViewCount || 0}</span>
               <button onClick={() => navigate(-1)} className={styles.backBtn}>
                上一条
              </button>
              {/* <span className={styles.metaTag}>{currentNews.Category}</span> */}
            </div>

            {currentNews.fullImage && (
              <div className={styles.heroImageWrapper}>
                <img 
                  src={currentNews.fullImage} 
                  alt={currentNews.Title} 
                  className={styles.heroImage}
                  onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                />
              </div>
            )}

            <div className={styles.contentBody}>
              {/* white-space: pre-wrap 保留换行 */}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '16px', color: '#333' }}>
                {currentNews.Content}
              </div>
            </div>

            {/* <div className={styles.footerNav}>
             
            </div> */}
          </article>
        ) : null}
      </main>
    </div>
  );
};

export default NewsDetails;