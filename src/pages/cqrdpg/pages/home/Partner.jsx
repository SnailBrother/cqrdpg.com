import React from 'react';
import styles from './Partner.module.css';

const Partner = () => {
  // 政府机关数据
  const governmentList = [
    '重庆市国有资产监督管理委员会评估中介机构备选库',
    '全国最高人民法院司法评估机构名单库（房地产、土地、资产分库均入选）',
    '重庆市国有土地上房屋征收评估机构名单',
    '重庆市规划和自然资源局、大足区规划和自然资源局',
    '江津区规划和自然资源局',
    '永川区规划和自然资源局',
    '万盛经开区规划和自然资源局',
    '黔江区规划和自然资源局',
    '忠县规划和自然资源局',
    '江津区国有资产管理中心',
    '忠县财政局',
  ];

  // 金融机构数据
  const financialList = [
    '农业银行重庆分行',
    '建设银行重庆分行',
    '工商银行重庆分行',
    '重庆三峡银行',
    '大连银行重庆分行',
    '中德银行重庆分行',
    '哈尔滨银行重庆分行',
    '广东南粤银行重庆分行',
    '重庆农村商业银行股份有限公司',
    '厦门国际银行',
    '国家开发银行重庆市分行',
    '重庆农村商业银行',
  ];

  return (
    <div className={styles.container}>
      {/* 左侧装饰条 - 简约线条感 */}
      <div className={styles.accentLine}></div>

      <div className={styles.content}>
        <h2 className={styles.mainTitle}>
          我们的<span>合作伙伴</span>
        </h2>
        <p className={styles.subTitle}>信任源自专业 · 携手共筑未来</p>

        <div className={styles.partnerGrid}>
          {/* 政府机关区块 */}
          <div className={styles.block}>
            <div className={styles.blockHeader}>
              <span className={styles.icon}>🏛️</span>
              <h3 className={styles.blockTitle}>入围政府机关</h3>
              <span className={styles.blockCount}>{governmentList.length}</span>
            </div>
            <ul className={styles.list}>
              {governmentList.map((item, index) => (
                <li key={`gov-${index}`} className={styles.listItem}>
                  <span className={styles.marker}></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 金融机构区块 */}
          <div className={styles.block}>
            <div className={styles.blockHeader}>
              <span className={styles.icon}>🏦</span>
              <h3 className={styles.blockTitle}>入围金融机构</h3>
              <span className={styles.blockCount}>{financialList.length}</span>
            </div>
            <ul className={styles.list}>
              {financialList.map((item, index) => (
                <li key={`fin-${index}`} className={styles.listItem}>
                  <span className={styles.marker}></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 底部水印装饰 */}
        <div className={styles.watermark}>ESTABLISHED TRUST</div>
      </div>

      {/* 右侧极简几何装饰 */}
      <div className={styles.geometricBg}></div>
    </div>
  );
};

export default Partner;