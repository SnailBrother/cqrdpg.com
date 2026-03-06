import React from 'react';
import './HomeContainer.css';
import { useTheme } from '../ThemeContext'; // 导入useTheme hook
// 导入小组件
import TopHeader from '../TopHeader';
import Footer from '../Footer';
import CarouselTypeFirst from './CarouselTypeFirst';
import CarouselTypeSecond from './CarouselTypeSecond';
import CarouselTypeThird from './CarouselTypeThird';
import CarouselTypeFourth from './CarouselTypeFourth';
import CarouselTypeFifth from './CarouselTypeFifth';
import CarouselTypeSixth from './CarouselTypeSixth';
import CarouselTypeSeventh from './CarouselTypeSeventh';
import CarouselTypeEighth from './CarouselTypeEighth';
import CarouselTypeNinth from './CarouselTypeNinth';
import PromoBanner from './PromoBanner';
import OurHomePageBackground from '../background/OurHomePageBackground';

const HomeContainer = () => {
  const { theme } = useTheme(); // 获取当前主题
  return (
    <div className={`ourhomepage-root ${theme}`}>
      {/* Background bubbles */}
      <OurHomePageBackground />
      
      {/* Content container with higher z-index */}
      <div className="ourhomepage-content">
        {/* 顶部区域 - 不再固定 */}
        <header className="ourhomepage-header">
          <TopHeader />
        </header>

        {/* 主要内容区域 */}
        <main className="ourhomepage-main">
          {/* 促销横幅 */}
          <section className="ourhomepage-section">
            <PromoBanner />
          </section>

          {/* 轮播图区域 - 多种类型的轮播图 */}
          <section className="ourhomepage-section">
            <CarouselTypeFirst />
          </section>

          <section className="ourhomepage-section">
            <CarouselTypeSecond />
          </section>

          <section className="ourhomepage-section">
            <CarouselTypeThird />
          </section>

          <section className="ourhomepage-section">
            <CarouselTypeFourth />
          </section>

          <section className="ourhomepage-section">
            <CarouselTypeFifth />
          </section>

          <section className="ourhomepage-section">
            <CarouselTypeSixth />
          </section>

          <section className="ourhomepage-section">
            <CarouselTypeSeventh />
          </section>

          <section className="ourhomepage-section">
            <CarouselTypeEighth />
          </section>

          <section className="ourhomepage-section">
            <CarouselTypeNinth />
          </section>
        </main>

        {/* 底部区域 - 不再固定 */}
        <footer className="ourhomepage-footer">
          <Footer />
        </footer>
      </div>
    </div>
  );
};

export default HomeContainer;