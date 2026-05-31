// Footer.jsx
import React, { useEffect, useState } from 'react';
import styles from './Footer.module.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const footer = document.getElementById('footer');
    if (footer) {
      observer.observe(footer);
    }

    return () => observer.disconnect();
  }, []);

  const shouldShowLoveHome = () => {
    if (!isAuthenticated || !user?.username) return false;
    const username = user.username;
    return username === '陈彦羽' || username === '李中敬';
  };

  const quickLinks = [
    { name: '报告验证', path: '/qrcodeRealcheck' },
    { name: '意见反馈', path: '/suggestion' },
    { name: '易估价', path: '/easyvaluation' },
  ];

  const serviceScope = [
    '资产评估',
    '房地产评估',
    '土地评估',
    '司法鉴定',
    '社会稳定风险评估',
  ];

  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.bgDecoration}>
        <div className={styles.gradientLine}></div>
        <div className={styles.gradientLine}></div>
      </div>

      <div className={styles.container}>
        <div className={`${styles.linksWrapper} ${isVisible ? styles.fadeIn : ''}`}>
          <div className={styles.linkGroup}>
            <h4 className={styles.groupTitle}>快速链接</h4>
            <ul className={styles.linkList}>
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.path} className={styles.link}>
                    <span className={styles.linkArrow}>›</span>
                    {link.name}
                  </Link>
                </li>
              ))}
              {shouldShowLoveHome() && (
                <li>
                  <Link to="/lovehome" className={styles.link}>
                    <span className={styles.linkArrow}>›</span>
                    关于我们
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div className={styles.linkGroup}>
            <h4 className={styles.groupTitle}>服务范围</h4>
            <ul className={styles.linkList}>
              {serviceScope.map((item, idx) => (
                <li key={idx}>
                  <span className={styles.link}>
                    <span className={styles.linkArrow}>›</span>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkGroup}>
            <h4 className={styles.groupTitle}>工作时间</h4>
            <div className={styles.workTime}>
              <span className={styles.timeIcon}>🕒</span>
              <span>周一至周五 9:00-18:00</span>
            </div>

          </div>
        </div>

        <div className={`${styles.copyright} ${isVisible ? styles.slideUp : ''}`}>
          <span>© {currentYear} 评估专家</span>
          <span className={styles.dot}>•</span>
          <a href="https://beian.miit.gov.cn/" className={styles.icpLink}>
            渝ICP备2026003834号-1
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;