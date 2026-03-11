// src/pages/Home.jsx
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

// --- 🔥 关键修改：全部改为懒加载 ---
// 这样只有当用户滚动到对应页面时，才会下载对应的 JS 和 CSS
const Dynamic = lazy(() => import('./home/Dynamic'));
const Partner = lazy(() => import('./home/Partner'));
const Service = lazy(() => import('./home/Service'));
const ContactUs = lazy(() => import('./home/ContactUs'));
const CompanyProfile = lazy(() => import('./home/CompanyProfile'));
const Recruitment = lazy(() => import('./home/Examples'));
const NewsUpdates = lazy(() => import('./home/NewsUpdates'));
const Footer = lazy(() => import('./home/Footer'));

// 轻量级骨架屏组件 (替代复杂的 Loading 文字)
const PageSkeleton = () => (
  <div className={styles.skeletonLoader}>
    <div className={styles.skeletonBlock}></div>
    <div className={styles.skeletonBlock}></div>
    <div className={styles.skeletonBlock}></div>
  </div>
);

const HomeOptions = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  const navItems = ['关于我们', '服务领域', '合作伙伴', '企业案例', '企业团队', '新闻动态', '联系我们'];
  const totalPages = 8;
  const logoImg = '/RuidaLogo.jpg';

  // 翻页逻辑 (保持不变)
  const goToPage = useCallback((pageIndex) => {
    if (isAnimating || pageIndex === currentPage) return;
    setIsAnimating(true);
    setCurrentPage(pageIndex);
    setIsMenuOpen(false);
    if (containerRef.current) {
      containerRef.current.style.transform = `translateY(-${pageIndex * 100}vh)`;
    }
    setTimeout(() => setIsAnimating(false), 600);
  }, [currentPage, isAnimating]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // 点击外部关闭菜单 (保持不变)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) goToPage(currentPage + 1);
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // --- 滚轮事件 (保持你原有的优秀逻辑，仅做微调) ---
  useEffect(() => {
    const handleWheel = (e) => {
      if (isAnimating) return;
      if (e.ctrlKey || e.metaKey) return;

      let target = e.target;
      while (target && target !== containerRef.current) {
        const isScrollable = target.scrollHeight > target.clientHeight;
        const hasOverflowY = window.getComputedStyle(target).overflowY === 'auto' || 
                             window.getComputedStyle(target).overflowY === 'scroll';
        if (isScrollable && hasOverflowY) break;
        target = target.parentElement;
      }

      if (!target || target === containerRef.current) {
        const container = containerRef.current;
        if (!container || !container.children[currentPage]) return;
        target = container.children[currentPage].querySelector(`.${styles.pageContent}`) || container.children[currentPage];
      }

      if (target && target !== containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = target;
        const isAtTop = scrollTop <= 1; 
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

        if (e.deltaY > 0) {
          if (!isAtBottom) return;
          e.preventDefault();
          nextPage();
          return;
        } else if (e.deltaY < 0) {
          if (!isAtTop) return;
          e.preventDefault();
          prevPage();
          return;
        }
      }

      const container = containerRef.current;
      if (!container || !container.children[currentPage]) return;
      const currentPageElement = container.children[currentPage].querySelector(`.${styles.pageContent}`) || container.children[currentPage];
      if (!currentPageElement) return;

      const { scrollTop, scrollHeight, clientHeight } = currentPageElement;
      const isAtTop = scrollTop === 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if (e.deltaY > 0) {
        if (!isAtBottom) return;
        e.preventDefault();
        nextPage();
      } else if (e.deltaY < 0) {
        if (!isAtTop) return;
        e.preventDefault();
        prevPage();
      }
    };

    const container = containerRef.current;
    if (container) container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      if (container) container.removeEventListener('wheel', handleWheel);
    };
  }, [nextPage, prevPage, isAnimating, currentPage]);

  // --- 触摸事件 (保持不变) ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let startY = 0;
    let currentScrollElement = null;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      let target = e.target;
      while (target && target !== container) {
        const isScrollable = target.scrollHeight > target.clientHeight;
        const overflowY = window.getComputedStyle(target).overflowY;
        if (isScrollable && (overflowY === 'auto' || overflowY === 'scroll')) {
          currentScrollElement = target;
          break;
        }
        target = target.parentElement;
      }
      if (!currentScrollElement) {
        const pageNode = container.children[currentPage];
        if (pageNode) currentScrollElement = pageNode.querySelector(`.${styles.pageContent}`) || pageNode;
      }
    };

    const handleTouchEnd = (e) => {
      if (isAnimating || !currentScrollElement) return;
      const endY = e.changedTouches[0].clientY;
      const deltaY = startY - endY;
      const { scrollTop, scrollHeight, clientHeight } = currentScrollElement;
      const isAtTop = scrollTop <= 1;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if (deltaY < -50) { 
        if (!isAtTop) return; 
        e.preventDefault(); 
        prevPage();
        return;
      }
      if (deltaY > 50) {
        if (!isAtBottom) return;
        e.preventDefault();
        nextPage();
        return;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [nextPage, prevPage, isAnimating, currentPage]);

  // 键盘事件 (保持不变)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnimating) return;
      switch (e.key) {
        case 'ArrowDown': case 'PageDown': e.preventDefault(); nextPage(); break;
        case 'ArrowUp': case 'PageUp': e.preventDefault(); prevPage(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, isAnimating]);

  return (
    <div className={styles.container}>
      <div
        ref={containerRef}
        className={styles.pageContainer}
        style={{ transform: `translateY(-${currentPage * 100}vh)` }}
      >
        {/* 第1页 - 主页 */}
        <div className={styles.page}>
          <nav className={styles.navBar}>
            <div className={styles.navLeft}>
              <img src={logoImg} alt="公司Logo" className={styles.navLogo} />
              <span className={styles.companyName}>重庆瑞达资产评估房地产土地估价有限公司</span>
            </div>
            <div className={styles.navCenter}>
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`${styles.navButton} ${currentPage === index ? styles.navActive : ''}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className={styles.navRight}>
              <div className={styles.searchBox}>
                <input type="text" placeholder="搜索..." className={styles.searchInput} />
                <button className={styles.searchButton}>🔍</button>
              </div>
              <Link to="/login" className={styles.loginButton}>登录</Link>
              <button className={styles.menuToggle} onClick={toggleMenu} aria-label="菜单">
                <span className={styles.menuIcon}></span>
                <span className={styles.menuIcon}></span>
                <span className={styles.menuIcon}></span>
              </button>
            </div>
            {isMenuOpen && (
              <div className={styles.mobileMenu} ref={menuRef}>
                <div className={styles.mobileMenuHeader}>
                  <span className={styles.mobileCompanyName}>重庆瑞达资产评估</span>
                  <button className={styles.mobileCloseBtn} onClick={toggleMenu}>×</button>
                </div>
                <div className={styles.mobileSearchBox}>
                  <input type="text" placeholder="搜索..." className={styles.mobileSearchInput} />
                  <button className={styles.mobileSearchButton}>🔍</button>
                </div>
                <div className={styles.mobileNavItems}>
                  {navItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => goToPage(index)}
                      className={`${styles.mobileNavButton} ${currentPage === index ? styles.mobileNavActive : ''}`}
                    >
                      {item}
                    </button>
                  ))}
                  <div className={styles.mobileDivider}></div>
                  <Link to="/login" className={styles.mobileNavButton} onClick={toggleMenu}>登录</Link>
                </div>
              </div>
            )}
          </nav>
          
          {/* 🔥 关键修改：每个页面内容都用 Suspense 包裹 */}
          <div className={`${styles.pageContent} ${styles.page1}`}>
            <Suspense fallback={<PageSkeleton />}>
              <CompanyProfile />
            </Suspense>
          </div>
        </div>

        {/* 第2页 -服务领域 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page2}`}>
            <Suspense fallback={<PageSkeleton />}>
              <Service />
            </Suspense>
          </div>
        </div>

        {/* 第3页 -合作伙伴 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page2}`}>
            <Suspense fallback={<PageSkeleton />}>
              <Partner />
            </Suspense>
          </div>
        </div>

        {/* 第4页 - 企业案例 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page3}`}>
            <Suspense fallback={<PageSkeleton />}>
              <Recruitment />
            </Suspense>
          </div>
        </div>

        {/* 第5页 - 企业团队 */}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page4}`}>
            <Suspense fallback={<PageSkeleton />}>
              <Dynamic />
            </Suspense>
          </div>
        </div>

        {/* 第6页 -  新闻动态*/}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page5}`}>
            <Suspense fallback={<PageSkeleton />}>
              <NewsUpdates />
            </Suspense>
          </div>
        </div>

        {/* 第7页 -  联系我们*/}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page6}`}>
            <Suspense fallback={<PageSkeleton />}>
              <ContactUs />
            </Suspense>
          </div>
        </div>

        {/* 第8页 -  页脚*/}
        <div className={styles.page}>
          <div className={`${styles.pageContent} ${styles.page7}`}>
            <Suspense fallback={<PageSkeleton />}>
              <Footer />
            </Suspense>
          </div>
        </div>
      </div>

      {/* 页面指示器 */}
      {/* 页面指示器容器 */}
      {currentPage !== 0 && currentPage !== 6 && (
      <div className={styles.floatingContactWrapper}>
        <button 
          className={styles.floatingContactBtn}
          onClick={() => goToPage(6)}
        >
          联系我们
          <span className={styles.speechTriangle}></span>
        </button>
      </div>
    )}
    
    <div className={`${styles.indicators} ${currentPage === 0 ? styles.hideOnFirst : ''}`}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <button
          key={index}
          className={`${styles.indicator} ${currentPage === index ? styles.active : ''}`}
          onClick={() => goToPage(index)}
        />
      ))}
    </div>

      {currentPage > 0 && (
        <button className={styles.prevButton} onClick={prevPage}>↑</button>
      )}
      {currentPage < totalPages - 1 && (
        <button className={styles.nextButton} onClick={nextPage}>↓</button>
      )}
    </div>
  );
};

export default HomeOptions;