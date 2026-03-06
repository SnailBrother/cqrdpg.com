// Recruitment.jsx
import React, { useState } from 'react';
import styles from './Recruitment.module.css';

const Recruitment = () => {
  // 招聘岗位数据，扩展更多岗位
  const jobs = [
    {
      title: '前端开发工程师',
      requirements: [
        '熟练掌握React、Vue等主流前端框架',
        '精通HTML/CSS/JavaScript，熟悉ES6+语法',
        '具备良好的代码规范和编程习惯',
        '有移动端适配和性能优化经验优先',
        '具备团队协作能力和沟通能力'
      ],
      responsibility: [
        '负责公司前端页面的开发和维护',
        '参与前端技术架构设计和优化',
        '与后端工程师协作完成接口联调',
        '持续优化用户体验和页面性能'
      ]
    },
    {
      title: '后端开发工程师',
      requirements: [
        '熟练掌握Java/Python/Go等至少一门后端语言',
        '熟悉MySQL、Redis等数据库的使用和优化',
        '具备微服务架构设计和开发经验',
        '了解常用的中间件和消息队列',
        '有良好的问题排查和分析能力'
      ],
      responsibility: [
        '负责后端接口的设计和开发',
        '维护和优化现有系统性能',
        '参与技术方案的讨论和制定',
        '保障系统的稳定性和安全性'
      ]
    },
    {
      title: 'UI/UX设计师',
      requirements: [
        '熟练使用Figma、PS、AI等设计工具',
        '具备良好的审美和用户体验思维',
        '能够独立完成产品界面设计',
        '了解前端实现原理，能与开发高效协作',
        '有互联网产品设计经验优先'
      ],
      responsibility: [
        '负责公司产品的界面设计和交互设计',
        '参与产品需求分析和用户研究',
        '输出高质量的设计稿和标注',
        '持续优化产品视觉体验'
      ]
    },
    {
      title: '资产评估师',
      requirements: [
        '持有资产评估师执业资格证书',
        '3年以上资产评估工作经验',
        '熟悉房地产、土地等各类资产评估流程',
        '具备良好的财务分析和报告撰写能力',
        '有团队管理经验者优先'
      ],
      responsibility: [
        '负责各类资产评估项目的实施和管理',
        '完成评估报告的撰写和审核',
        '与客户沟通协调，提供专业咨询',
        '参与新业务领域的拓展和研究'
      ]
    },
    {
      title: '房地产估价师',
      requirements: [
        '持有房地产估价师执业资格证书',
        '熟悉房地产市场和相关法律法规',
        '具备独立完成房地产估价项目的能力',
        '良好的沟通能力和客户服务意识',
        '有大型房地产估价项目经验优先'
      ],
      responsibility: [
        '负责房地产估价项目的现场勘察和评估',
        '撰写房地产估价报告',
        '维护客户关系，提供专业咨询服务',
        '参与市场调研和数据分析'
      ]
    },
    {
      title: '土地估价师',
      requirements: [
        '持有土地估价师执业资格证书',
        '熟悉土地评估相关政策和标准',
        '具备土地估价项目实施经验',
        '良好的团队协作和沟通能力',
        '有国土部门对接经验者优先'
      ],
      responsibility: [
        '负责土地估价项目的评估工作',
        '撰写土地估价报告和相关文件',
        '参与土地市场研究和分析',
        '协助完成项目招投标工作'
      ]
    }
  ];

  // 状态管理：记录哪些卡片是展开的
  const [expandedCards, setExpandedCards] = useState({});

  // 切换卡片展开/折叠状态
  const toggleCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <section className={styles.recruitmentSection}>
      <div className={styles.container}>
        {/* 左侧图片区域 - 保持和ContactUs一致的布局结构 */}
        <div className={styles.leftCol}>
          <div className={styles.imageWrapper}>
            <img
              src="/Picture/home/Recruitment/1.jpeg"
              alt="招聘信息"
              className={styles.recruitmentImage}
            />
          </div>
        </div>

        {/* 右侧招聘信息区域 - 添加滚动容器 */}
        <div className={styles.rightCol}>
          <div className={styles.rightContent}>
            <h2 className={styles.title}>加入我们</h2>
            <p className={styles.subtitle}>RECRUITMENT</p>

            <div className={styles.jobsContainer}>
              {jobs.map((job, index) => (
                <div key={index} className={styles.jobCard}>
                  <div 
                    className={styles.jobHeader} 
                    onClick={() => toggleCard(index)}
                  >
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <span className={styles.expandIcon}>
                      {expandedCards[index] ? '−' : '+'}
                    </span>
                  </div>
                  
                  <div className={`${styles.jobDetails} ${expandedCards[index] ? styles.expanded : ''}`}>
                    <div className={styles.jobSection}>
                      <h4 className={styles.sectionLabel}>任职要求：</h4>
                      <ul className={styles.jobList}>
                        {job.requirements.map((item, i) => (
                          <li key={i} className={styles.jobItem}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.jobSection}>
                      <h4 className={styles.sectionLabel}>岗位职责：</h4>
                      <ul className={styles.jobList}>
                        {job.responsibility.map((item, i) => (
                          <li key={i} className={styles.jobItem}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Recruitment;