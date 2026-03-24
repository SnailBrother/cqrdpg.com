import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. 引入 useNavigate
import styles from './NewsUpdates.module.css';

// 配置项
const API_BASE_URL = '/api/publish-news';
const SERVER_BASE_URL = 'http://www.cqrdpg.com/backend';
const DEFAULT_IMAGE = `${SERVER_BASE_URL}/images/PublishNewsPictures/Defaultbackground.jpg`;

const NewsUpdates = () => {
  const navigate = useNavigate(); // 2. 初始化 navigate
  const [activeCategory, setActiveCategory] = useState('all');
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    { id: 'all', name: '全部动态' },
    { id: '公司新闻', name: '公司新闻' },
    { id: '行业动态', name: '行业动态' },
    { id: '政策法规', name: '政策法规' }
  ];

  const fetchNews = async (category) => {
    setLoading(true);
    setError(null);
    try {
      const categoryParam = category === 'all' ? '' : `&category=${category}`;
      const url = `${API_BASE_URL}/list?page=1&limit=50${categoryParam}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('网络请求失败');
      
      const data = await res.json();
      
      const processedList = (data.list || []).map(item => {
        let imgUrl = DEFAULT_IMAGE;
        if (item.ImageUrl && item.ImageUrl !== 'Defaultbackground.jpg') {
          if (item.ImageUrl.startsWith('http')) {
            imgUrl = item.ImageUrl;
          } else {
            const path = item.ImageUrl.startsWith('/') ? item.ImageUrl : `/${item.ImageUrl}`;
            imgUrl = `${SERVER_BASE_URL}${path}`;
          }
        }

        const summary = item.Content 
          ? (item.Content.length > 60 ? item.Content.substring(0, 60) + '...' : item.Content)
          : '暂无详细内容';

        return {
          id: item.Id,
          category: item.Category,
          date: item.PublishDate,
          title: item.Title,
          summary: summary,
          image: imgUrl,
          views: item.ViewCount || 0,
          content: item.Content // 列表页虽然不显示全文，但可以暂存，或者详情页再请求一次
        };
      });

      setNewsList(processedList);
    } catch (err) {
      console.error('Fetch news error:', err);
      setError('加载新闻失败，请稍后重试');
      setNewsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_IMAGE;
  };

  // 3. 定义跳转函数
  const handleReadMore = (id) => {
    navigate(`/newsdetails/${id}`);
  };

  return (
    <section className={styles.newsSection}>
      <div className={styles.container}>
        <div className={styles.headerFixed}>
          <h2 className={styles.sectionTitle}>新闻动态</h2>
          <p className={styles.sectionSubtitle}>了解最新行业资讯与公司动态</p>

          <div className={styles.categoryNav}>
            {categories.map(category => (
              <button
                key={category.id}
                className={`${styles.categoryBtn} ${activeCategory === category.id ? styles.active : ''}`}
                onClick={() => setActiveCategory(category.id)}
                disabled={loading}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.scrollableContent}>
          {loading ? (
            <div className={styles.loadingState}><p>正在加载最新资讯...</p></div>
          ) : error ? (
            <div className={styles.emptyState}><p style={{color: 'red'}}>{error}</p></div>
          ) : (
            <div className={styles.newsGrid}>
              {newsList.length > 0 ? (
                newsList.map(news => (
                  <div key={news.id} className={styles.newsCard}>
                    <div className={styles.newsImageWrapper}>
                      <img 
                        src={news.image} 
                        alt={news.title}
                        className={styles.newsImage}
                        onError={handleImageError}
                      />
                      <span className={styles.newsCategory}>{news.category}</span>
                    </div>
                    <div className={styles.newsContent}>
                      <div className={styles.newsMeta}>
                        <span className={styles.newsDate}>{news.date}</span>
                        <span className={styles.newsViews}>👁️ {news.views}</span>
                      </div>
                      <h3 className={styles.newsTitle}>{news.title}</h3>
                      <p className={styles.newsSummary}>{news.summary}</p>
                      
                      {/* 4. 绑定点击事件 */}
                      <button 
                        className={styles.readMoreBtn}
                        onClick={() => handleReadMore(news.id)}
                      >
                        阅读更多
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}><p>暂无相关新闻</p></div>
              )}
            </div>
          )}

          {!loading && newsList.length > 0 && (
            <div className={styles.loadMoreWrapper}>
              <button className={styles.loadMoreBtn} onClick={() => alert('已加载所有最新新闻')}>
                加载更多
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsUpdates;