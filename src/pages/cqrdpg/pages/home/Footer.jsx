// Footer.jsx
import React from 'react';
import styles from './Footer.module.css';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* 顶部区域：公司信息和联系方式 */}
        <div className={styles.footerTop}>
          {/* 公司简介列 */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>关于我们</h3>
            <p className={styles.companyDesc}>
              重庆瑞达资产评估房地产土地估价有限公司成立于2003年，
              专业从事资产评估、房地产评估、土地评估等业务，
              致力于为客户提供专业、高效的服务。
            </p>
            {/* <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink}>📱</a>
              <a href="#" className={styles.socialLink}>📧</a>
              <a href="#" className={styles.socialLink}>📞</a>
              <a href="#" className={styles.socialLink}>🏢</a>
            </div> */}
          </div>

          {/* 快速链接列 */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>快速链接</h3>
            <ul className={styles.linkList}>
              <li>
                <Link to="/qrcodeRealcheck" className={styles.link}>
                  报告验证
                </Link>
              </li>

              <li><a href="#" className={styles.link}>人才招聘</a></li>
              <li>
                <Link to="/suggestion" className={styles.link}>
                  意见反馈
                </Link>
              </li>
            </ul>
          </div>

          {/* 服务范围列 */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>服务范围</h3>
            <ul className={styles.linkList}>
              <li><a href="#" className={styles.link}>资产评估</a></li>
              <li><a href="#" className={styles.link}>房地产评估</a></li>
              <li><a href="#" className={styles.link}>土地评估</a></li>
              <li><a href="#" className={styles.link}>司法鉴定</a></li>
              <li><a href="#" className={styles.link}>矿业权评估</a></li>
              <li><a href="#" className={styles.link}>社会稳定风险评估</a></li>
            </ul>
          </div>

          {/* 联系方式列 */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>联系方式</h3>
            <div className={styles.contactInfo}>
              <p className={styles.contactItem}>
                <span className={styles.contactIcon}>📍</span>
                重庆市渝中区和平路7号6-19号、6-20号
              </p>
              <p className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                18983033184
              </p>
              <p className={styles.contactItem}>
                <span className={styles.contactIcon}>📧</span>
                644260249@qq.com
              </p>
              <p className={styles.contactItem}>
                <span className={styles.contactIcon}>🕒</span>
                周一至周五 9:00 - 18:00
              </p>
            </div>
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {currentYear} 重庆瑞达资产评估房地产土地估价有限公司 版权所有
          </p>
          <p className={styles.beian}>
            <a href="#" className={styles.beianLink}>渝ICP备xxxxxxxx号</a>
            <a href="#" className={styles.beianLink}>渝公网安备 xxxxxxxxxxxx号</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;