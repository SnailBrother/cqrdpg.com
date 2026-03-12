// Service.jsx
import React from 'react';
import styles from './Service.module.css';

const Service = () => {
  const serviceItems = [
    {
      title: '无形资产评估',
      image: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg',
      description: [
        '● 作价入股、资产转让、使用许可、特许经营等目的而涉及的专利技术(动植物)品种权,专有技术',
        '● 商标专用权'
      ]
    },
    {
      title: '司法鉴定评估',
      image: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg',
      description: [
        '● 重庆市各级人民法院指定的诉讼司法鉴定评估机构',
        '● 可提供房地产、土地使用权、机器设备、机动车等各项资产的鉴定评估'
      ]
    },
    {
      title: '企业价值评估',
      image: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg',
      description: [
        '● 设立公司、组建集团、中外合资、合作涉及的评估',
        '● 企业资产重组、股份制改造涉及的评估',
        '● 企业股份转让所涉及的相关评估',
        '● 企业兼并收购、合并、分立、租赁承包、破产清算涉及的评估',
        '● 企业投融资涉及的评估',
        '● 收购及处置债权的评估',
        '● 法律诉讼涉及的评估'
      ]
    },
    {
      title: '单项资产评估',
      image: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg',
      description: [
        '● 资产转让、资产抵押、资产拍卖、资产租赁',
        '● 诉讼清偿等目的的机器设备、建筑物、债权、股份等单项资产的价值评估'
      ]
    },
    {
      title: '房地产估价',
      image: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg',
      description: [
        '● 抵押价值评估',
        '● 转让价格评估(包括买卖、赠与等)',
        '● 租赁价格评估',
        '● 课税价格评估',
        '● 分割、合并价格评估',
        '● 典当、拍卖价格评估',
        '● 城市房屋征收价格评估',
        '● 可行性研究及分析',
        '● 其他房地产相关价格评估及咨询'
      ]
    },
    {
      title: '土地估价',
      image: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg',
      description: [
        '● 重庆市各国土房屋相关部门委估土地的收储，收购，出让底价以及成本价格的评估',
        '● 土地的使用权出让、转让、出租、抵押、作价入股以及国家收回土地等的宗地价格评估',
        '● 各公司涉及的土地价格评估',
        '● 企业兼并、破产、清产核算涉及的土地价格评估',
        '● 征收土地税费涉及的土地价格评估',
        '● 城市房屋征收涉及的土地评估',
        '● 其他土地评估'
      ]
    }
  ];

  return (
    <div className={styles['service-container']}>
      {/* 桌面端布局 */}
      <div className={styles['desktop-layout']}>
        {/* First Row - Two Hexagons + Text Content */}
        <div className={styles['desktop-first-row']}>
          <div className={styles['desktop-first-row-images']}>
            {serviceItems.slice(0, 2).map((item, index) => (
              <div key={index} className={styles['desktop-hexagon-item']}>
                <div 
                  className={styles['desktop-hexagon']} 
                  style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${item.image})` }}
                >
                  <div className={styles['desktop-hexagon-content']}>
                    <h3 className={styles['desktop-hexagon-title']}>{item.title}</h3>
                    <div className={styles['desktop-hexagon-description']}>
                      {item.description.map((desc, idx) => (
                        <p key={idx} className={styles['desktop-description-item']}>{desc}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles['desktop-text-content']}>
            <h2 className={styles['desktop-main-title']}>服务领域</h2>
            <p className={styles['desktop-main-subtitle']}>核心服务</p>
            <button className={styles['desktop-more-btn']}>查看更多 &gt;</button>
          </div>
        </div>

        {/* Second Row - Four Hexagon Items */}
        <div className={styles['desktop-second-row']}>
          {serviceItems.slice(2, 6).map((item, index) => (
            <div key={index} className={styles['desktop-second-row-item']}>
              <div 
                className={styles['desktop-hexagon']} 
                style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${item.image})` }}
              >
                <div className={styles['desktop-hexagon-content']}>
                  <h3 className={styles['desktop-hexagon-title']}>{item.title}</h3>
                  <div className={styles['desktop-hexagon-description']}>
                    {item.description.map((desc, idx) => (
                      <p key={idx} className={styles['desktop-description-item']}>{desc}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 移动端布局 */}
      <div className={styles['mobile-layout']}>
        <div className={styles['mobile-header']}>
          <h2 className={styles['mobile-main-title']}>服务领域</h2>
          <p className={styles['mobile-main-subtitle']}>核心服务</p>
        </div>
        
        <div className={styles['mobile-scroll-container']}>
          {serviceItems.map((item, index) => (
            <div key={index} className={styles['mobile-card']}>
              <div 
                className={styles['mobile-card-image']}
                style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${item.image})` }}
              >
                <div className={styles['mobile-card-content']}>
                  <h3 className={styles['mobile-card-title']}>{item.title}</h3>
                  <div className={styles['mobile-card-description']}>
                    {item.description.map((desc, idx) => (
                      <p key={idx} className={styles['mobile-description-item']}>{desc}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Service;