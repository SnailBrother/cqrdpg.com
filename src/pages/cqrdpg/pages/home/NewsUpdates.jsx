import React, { useState } from 'react';
import styles from './NewsUpdates.module.css';

const NewsUpdates = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  // 新闻数据
  const newsData = [
    {
      id: 1,
      category: '公司新闻',
      date: '2024-03-15',
      title: '瑞达评估荣获重庆市“优秀司法鉴定机构”称号',
      summary: '近日，重庆市司法局公布了2023年度司法鉴定机构考核结果，瑞达评估公司凭借专业的评估能力和优质的服务水平，荣获“优秀司法鉴定机构”称号...',
      image: '/images/cqrdpg/home/News/1.jpg',
      views: 1256
    },
    {
      id: 2,
      category: '行业动态',
      date: '2024-03-10',
      title: '《资产评估法》修订草案征求意见稿发布',
      summary: '为适应新时代资产评估行业发展的需要，财政部近日发布了《中华人民共和国资产评估法》修订草案征求意见稿，向社会公开征求意见...',
      image: '/images/cqrdpg/home/News/2.jpg',
      views: 2341
    },
    {
      id: 3,
      category: '公司新闻',
      date: '2024-03-05',
      title: '瑞达评估顺利完成江北区城市更新项目评估工作',
      summary: '瑞达评估公司受江北区住房和城乡建设委员会委托，顺利完成江北区观音桥片区城市更新项目的评估工作，为项目推进提供了专业支持...',
      image: '/images/cqrdpg/home/News/3.jpg',
      views: 892
    },
    {
      id: 4,
      category: '行业动态',
      date: '2024-02-28',
      title: '2024年中国房地产估价师执业资格考试报名通知',
      summary: '根据人力资源社会保障部办公厅《关于2024年度专业技术人员职业资格考试工作计划及有关事项的通知》，2024年房地产估价师职业资格考试将于10月举行...',
      image: '/images/cqrdpg/home/News/4.jpg',
      views: 1567
    },
    {
      id: 5,
      category: '政策法规',
      date: '2024-02-20',
      title: '重庆市发布《国有土地上房屋征收评估技术规范》',
      summary: '为进一步规范国有土地上房屋征收评估行为，重庆市住房和城乡建设委员会近日发布了《重庆市国有土地上房屋征收评估技术规范（试行）》...',
      image: '/images/cqrdpg/home/News/5.jpg',
      views: 1103
    },
    {
      id: 6,
      category: '公司新闻',
      date: '2024-02-15',
      title: '瑞达评估参与重庆市轨道交通建设征地拆迁评估项目',
      summary: '瑞达评估公司成功中标重庆市轨道交通27号线、18号线等项目的征地拆迁评估工作，将为轨道交通建设提供专业的评估服务...',
      image: '/images/cqrdpg/home/News/6.jpg',
      views: 745
    },
    {
      id: 7,
      category: '行业动态',
      date: '2024-02-10',
      title: '中国资产评估协会发布2023年度行业发展报告',
      summary: '中国资产评估协会近日发布了《2023年度资产评估行业发展报告》，报告显示，2023年全国资产评估行业实现业务收入同比增长8.5%...',
      image: '/images/cqrdpg/home/News/3.jpg',
      views: 982
    },
    {
      id: 8,
      category: '政策法规',
      date: '2024-02-05',
      title: '自然资源部：进一步完善土地估价机构备案管理',
      summary: '自然资源部近日印发通知，要求进一步加强土地估价机构备案管理，规范土地估价行为，促进土地估价行业健康发展...',
      image: '/images/cqrdpg/home/News/3.jpg',
      views: 634
    },
    {
      id: 9,
      category: '公司新闻',
      date: '2024-01-28',
      title: '瑞达评估2023年度总结表彰大会圆满举行',
      summary: '瑞达评估公司2023年度总结表彰大会在重庆总部隆重举行，会议总结了2023年的工作成绩，表彰了优秀员工，并部署了2024年的重点工作...',
      image: '/images/cqrdpg/home/News/3.jpg',
      views: 521
    }
  ];

  // 分类标签
  const categories = [
    { id: 'all', name: '全部动态' },
    { id: '公司新闻', name: '公司新闻' },
    { id: '行业动态', name: '行业动态' },
    { id: '政策法规', name: '政策法规' }
  ];

  // 根据分类筛选新闻
  const filteredNews = activeCategory === 'all' 
    ? newsData 
    : newsData.filter(news => news.category === activeCategory);

  return (
    <section className={styles.newsSection}>
      <div className={styles.container}>
        {/* 标题区域 - 固定不滚动 */}
        <div className={styles.headerFixed}>
          <h2 className={styles.sectionTitle}>新闻动态</h2>
          <p className={styles.sectionSubtitle}>了解最新行业资讯与公司动态</p>

          {/* 分类导航 */}
          <div className={styles.categoryNav}>
            {categories.map(category => (
              <button
                key={category.id}
                className={`${styles.categoryBtn} ${activeCategory === category.id ? styles.active : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 新闻列表 - 可滚动区域 */}
        <div className={styles.scrollableContent}>
          <div className={styles.newsGrid}>
            {filteredNews.length > 0 ? (
              filteredNews.map(news => (
                <div key={news.id} className={styles.newsCard}>
                  <div className={styles.newsImageWrapper}>
                    <img 
                      src={news.image} 
                      alt={news.title}
                      className={styles.newsImage}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300/f0f0f0/cccccc?text=瑞达评估';
                      }}
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
                    <button className={styles.readMoreBtn}>阅读更多</button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>暂无相关新闻</p>
              </div>
            )}
          </div>

          {/* 加载更多按钮 */}
          {filteredNews.length > 0 && (
            <div className={styles.loadMoreWrapper}>
              <button className={styles.loadMoreBtn}>加载更多</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsUpdates;