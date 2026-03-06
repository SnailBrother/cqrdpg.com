import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate(); // 添加路由导航

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 处理开始使用按钮点击
  const handleGetStarted = () => {
    navigate('/login'); // 导航到登录页面
  };

  // 处理了解更多按钮点击
  const handleLearnMore = () => {
    // 滚动到特性区域
    document.getElementById('features')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  // 处理查看案例按钮点击
  const handleViewCases = () => {
    // 滚动到关于区域
    document.getElementById('about')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className={styles.container}>
      {/* 导航栏 */}
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <h2>React-Demo</h2>
          </div>
          
          <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
            <ul className={styles.navList}>
              <li><a href="#home" onClick={(e) => {
                e.preventDefault();
                document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
              }}>首页</a></li>
              <li><a href="#features" onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>功能</a></li>
              <li><a href="#about" onClick={(e) => {
                e.preventDefault();
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
              }}>关于</a></li>
              <li><a href="#services" onClick={(e) => {
                e.preventDefault();
                document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
              }}>服务</a></li>
              <li><a href="#contact" onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}>联系</a></li>
            </ul>
          </nav>
          
          <div className={styles.navActions}>
            <button 
              className={styles.ctaButton}
              onClick={handleGetStarted} // 添加点击事件
            >
              开始使用
            </button>
            <button 
              className={styles.menuToggle}
              onClick={toggleMenu}
              aria-label="切换菜单"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* 英雄区域 */}
      <section id="home" className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            创造<span className={styles.highlight}>卓越</span>的数字化体验
          </h1>
          <p className={styles.heroSubtitle}>
            我们致力于打造直观、美观且功能强大的网站和应用，帮助您的业务在数字世界中脱颖而出。
          </p>
          <div className={styles.heroActions}>
            <button 
              className={`${styles.ctaButton} ${styles.primary}`}
              onClick={handleLearnMore} // 添加点击事件
            >
              了解更多
            </button>
            <button 
              className={`${styles.ctaButton} ${styles.secondary}`}
              onClick={handleViewCases} // 添加点击事件
            >
              查看案例
            </button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroGraphic}>
            <div className={styles.circle}></div>
            <div className={styles.square}></div>
            <div className={styles.triangle}></div>
          </div>
        </div>
      </section>

      {/* 特性区域 */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2>我们的优势</h2>
          <p>探索我们如何帮助您实现业务目标</p>
        </div>
        
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15C19.2669 15.9247 18.9628 16.8165 18.505 17.625C18.0472 18.4335 17.4446 19.1428 16.7323 19.7123C16.02 20.2818 15.2119 20.7006 14.3515 20.9454C13.4911 21.1902 12.5953 21.2563 11.7119 21.1401C10.8286 21.0239 9.97531 20.7279 9.2 20.268C8.42469 19.8081 7.74249 19.1933 7.1925 18.458C6.64251 17.7227 6.23505 16.8814 5.993 16H2C2 17.0506 2.20693 18.0909 2.60896 19.0615C3.011 20.0321 3.60028 20.914 4.34315 21.6569C5.08601 22.3997 5.96793 22.989 6.93853 23.391C7.90914 23.7931 8.94943 24 10 24C11.0506 24 12.0909 23.7931 13.0615 23.391C14.0321 22.989 14.914 22.3997 15.6569 21.6569C16.3997 20.914 16.989 20.0321 17.391 19.0615C17.7931 18.0909 18 17.0506 18 16V15H19.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 9V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 3L12 6L9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>创新设计</h3>
            <p>采用最新的设计趋势和技术，打造独特而引人入胜的用户体验。</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15C19.2669 15.9247 18.9628 16.8165 18.505 17.625C18.0472 18.4335 17.4446 19.1428 16.7323 19.7123C16.02 20.2818 15.2119 20.7006 14.3515 20.9454C13.4911 21.1902 12.5953 21.2563 11.7119 21.1401C10.8286 21.0239 9.97531 20.7279 9.2 20.268C8.42469 19.8081 7.74249 19.1933 7.1925 18.458C6.64251 17.7227 6.23505 16.8814 5.993 16H2C2 17.0506 2.20693 18.0909 2.60896 19.0615C3.011 20.0321 3.60028 20.914 4.34315 21.6569C5.08601 22.3997 5.96793 22.989 6.93853 23.391C7.90914 23.7931 8.94943 24 10 24C11.0506 24 12.0909 23.7931 13.0615 23.391C14.0321 22.989 14.914 22.3997 15.6569 21.6569C16.3997 20.914 16.989 20.0321 17.391 19.0615C17.7931 18.0909 18 17.0506 18 16V15H19.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 9V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 3L12 6L9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>高性能</h3>
            <p>优化每一行代码，确保您的网站加载迅速，运行流畅。</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.93 4.93L9.17 9.17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.83 14.83L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.83 9.17L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.83 9.17L18.36 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.93 19.07L9.17 14.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>完全响应式</h3>
            <p>无论使用何种设备，都能提供一致且完美的用户体验。</p>
          </div>
        </div>
      </section>

      {/* 关于区域 */}
      <section id="about" className={styles.about}>
        <div className={styles.aboutContent}>
          <div className={styles.aboutText}>
            <h2>关于我们</h2>
            <p>
              我们是一支充满激情的设计师和开发人员团队，致力于通过创新技术和卓越设计帮助企业在数字时代取得成功。
            </p>
            <p>
              自2015年成立以来，我们已经为全球数百家企业提供了高质量的数字化解决方案，帮助他们提升品牌形象，增加用户参与度，并实现业务增长。
            </p>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <h3>200+</h3>
                <p>完成项目</p>
              </div>
              <div className={styles.stat}>
                <h3>98%</h3>
                <p>客户满意度</p>
              </div>
              <div className={styles.stat}>
                <h3>50+</h3>
                <p>专业团队成员</p>
              </div>
            </div>
          </div>
          <div className={styles.aboutVisual}>
            <div className={styles.aboutImage}>
              <div className={styles.imagePlaceholder}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 服务区域 - 新增 */}
      <section id="services" className={styles.services}>
        <div className={styles.sectionHeader}>
          <h2>我们的服务</h2>
          <p>为您提供全方位的数字化解决方案</p>
        </div>
        <div className={styles.servicesGrid}>
          <div className={styles.serviceCard}>
            <h3>网站开发</h3>
            <p>定制化网站开发，满足您的业务需求</p>
          </div>
          <div className={styles.serviceCard}>
            <h3>移动应用</h3>
            <p>跨平台移动应用开发，覆盖更多用户</p>
          </div>
          <div className={styles.serviceCard}>
            <h3>UI/UX设计</h3>
            <p>专业的用户界面和用户体验设计</p>
          </div>
        </div>
      </section>

      {/* 联系区域 - 新增 */}
      <section id="contact" className={styles.contact}>
        <div className={styles.sectionHeader}>
          <h2>联系我们</h2>
          <p>随时为您提供专业咨询</p>
        </div>
        <div className={styles.contactContent}>
          <div className={styles.contactInfo}>
            <h3>获取专业建议</h3>
            <p>我们的团队随时准备为您提供最佳的数字化解决方案</p>
            <button 
              className={`${styles.ctaButton} ${styles.primary}`}
              onClick={handleGetStarted}
            >
              立即咨询
            </button>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>React-Demo</h3>
            <p>创造卓越的数字化体验，助力您的业务成功。</p>
          </div>
          
          <div className={styles.footerSection}>
            <h4>快速链接</h4>
            <ul>
              <li><a href="#home" onClick={(e) => {
                e.preventDefault();
                document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
              }}>首页</a></li>
              <li><a href="#features" onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>功能</a></li>
              <li><a href="#about" onClick={(e) => {
                e.preventDefault();
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
              }}>关于</a></li>
              <li><a href="#services" onClick={(e) => {
                e.preventDefault();
                document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
              }}>服务</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h4>联系我们</h4>
            <ul>
              <li>电话: +1 (123) 456-7890</li>
              <li>邮箱: info@reactdemo.com</li>
              <li>地址: 123 设计街, 创意市</li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h4>关注我们</h4>
            <div className={styles.socialLinks}>
              <a href="#" aria-label="Twitter">Twitter</a>
              <a href="#" aria-label="Facebook">Facebook</a>
              <a href="#" aria-label="Instagram">Instagram</a>
              <a href="#" aria-label="LinkedIn">LinkedIn</a>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} React-Demo. 保留所有权利。</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;