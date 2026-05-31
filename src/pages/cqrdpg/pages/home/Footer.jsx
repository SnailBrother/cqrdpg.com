// Footer.jsx
import React from 'react';
import styles from './Footer.module.css';
import { Link } from 'react-router-dom';
//import { useAuth } from '../../../context/AuthContext';
import { useAuth } from '../../../../context/AuthContext';
const Footer = () => {
  const currentYear = new Date().getFullYear();
 const { user, isAuthenticated } = useAuth(); //获取用户名 
   // 判断是否显示"关于我们"链接
  const shouldShowLoveHome = () => {
    if (!isAuthenticated || !user?.username) return false;
    const username = user.username;
    return username === '陈彦羽' || username === '李中敬';
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* 顶部区域：公司信息和联系方式 */}
        <div className={styles.footerTop}>
          {/* 公司简介列 */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>关于</h3>
            <p className={styles.companyDesc}>
              专业从事资产评估、房地产评估、土地评估等业务，
              致力于为客户提供专业、高效的服务。
            </p>

          </div>

          {/* 快速链接列 */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>链接</h3>
            <ul className={styles.linkList}>
              <li>
                <Link to="/qrcodeRealcheck" className={styles.link}>
                  报告验证
                </Link>
              </li>

              <li>
                <Link to="/suggestion" className={styles.link}>
                  意见反馈
                </Link>
              </li>
              <li>
                <Link to="/easyvaluation" className={styles.link}>
                  易估价
                </Link>
              </li>
               {shouldShowLoveHome() && (
                <li>
                  <Link to="/lovehome" className={styles.link}>
                    关于我们
                  </Link>
                </li>
              )}
         
            </ul>
          </div>

          {/* 范围列 */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>范围</h3>
            <ul className={styles.linkList}>
              <li><a href="#" className={styles.link}>资产评估</a></li>
              <li><a href="#" className={styles.link}>房地产评估</a></li>
              <li><a href="#" className={styles.link}>土地评估</a></li>
              <li><a href="#" className={styles.link}>司法鉴定</a></li>
              <li><a href="#" className={styles.link}>社会稳定风险评估</a></li>
            </ul>
          </div>

          {/* 工作时间 */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>工作时间</h3>
            <div className={styles.contactInfo}>
              
             
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
            © {currentYear} 版权所有
          </p>
          <p className={styles.beian}>
            <a href="https://beian.miit.gov.cn/" className={styles.beianLink}>渝ICP备2026003834号-1</a>
            {/* <a href="#" className={styles.beianLink}>渝公网安备 xxxxxxxxxxxx号</a> */}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;