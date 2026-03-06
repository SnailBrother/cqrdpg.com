import React from 'react';
import './DetailsHomeContainer.css';
import { useTheme } from '../ThemeContext'; // 导入useTheme hook
// 导入小组件
//import DetailTopHeader from './DetailTopHeader';
import TopHeader from '../TopHeader';
import Footer from '../Footer';
import DetailsHomeBackground from '../background/DetailsHomeBackground'; // 导入背景组件

import TravelDetailsFirst from './TravelDetailsFirst';
import TravelDetailsSecond from './TravelDetailsSecond';
import TravelDetailsThird from './TravelDetailsThird';
import TravelDetailsFourth from './TravelDetailsFourth';
import TravelDetailsFifth from './TravelDetailsFifth';
import TravelDetailsSixth from './TravelDetailsSixth';
import TravelDetailsSeventh from './TravelDetailsSeventh';
import TravelDetailsEighth from './TravelDetailsEighth';
import PhotoConfessionWall3D from './PhotoConfessionWall3D';
import PhotoGallery from './PhotoGallery';

import HeartbeatLove from './HeartbeatLove';
import LoveHeartDengdeng from './LoveHeartDengdeng';
import LoveTextEffects from './LoveTextEffects';
import VariableFontAnimation from './VariableFontAnimation';
import WordsMeltAway from './WordsMeltAway';
import PromoBanner from '../PromoBanner';
import GlowingTextEffect from './GlowingTextEffect';
import DynamicTextAnimation from './DynamicTextAnimation';
import TypingAnimation from './TypingAnimation';
import TextBoxAnimation from './TextBoxAnimation';
const DetailsHomeContainer = () => {
  const { theme } = useTheme(); // 获取当前主题
  return (

    <div className={`detailshomecontainer-root ${theme}`}>
      {/* 背景组件 */}
      <div className="detailshomecontainer-background">
        <DetailsHomeBackground />
      </div>

      {/* 内容容器 */}
      <div className="detailshomecontainer-content">
        {/* 顶部区域 */}
        <header className="detailshomecontainer-header">
          <TopHeader />
        </header>

        {/* 主要内容区域 */}
        <main className="detailshomecontainer-main">
          {/* 促销横幅 */}
          <section className="detailshomecontainer-section">
            <PromoBanner />
          </section>
          <section className="detailshomecontainer-section">
            <DynamicTextAnimation />
          </section>

          {/* 轮播图区域 - 多种类型的轮播图 */}
          <section className="detailshomecontainer-section">
            <TravelDetailsFirst />
          </section>

          <section className="detailshomecontainer-section">
            <WordsMeltAway />
          </section>

          <section className="detailshomecontainer-section">
            <TravelDetailsSecond />
          </section>

          <section className="detailshomecontainer-section">
            <HeartbeatLove />
          </section>

          <section className="detailshomecontainer-section">
            <TravelDetailsThird />
          </section>

          <section className="detailshomecontainer-section">
            <LoveHeartDengdeng />
          </section>
          <section className="detailshomecontainer-section">
            <TravelDetailsFourth />
          </section>

          <section className="detailshomecontainer-section">
            <LoveTextEffects />
          </section>

          <section className="detailshomecontainer-section">
            <TravelDetailsFifth />
          </section>

          <section className="detailshomecontainer-section">
            <GlowingTextEffect />
          </section>
          <section className="detailshomecontainer-section">
            <TravelDetailsSixth />
          </section>
          <section className="detailshomecontainer-section">
            <VariableFontAnimation />
          </section>

          <section className="detailshomecontainer-section">
            <TravelDetailsSeventh />
          </section>
          <section className="detailshomecontainer-section">
            <TextBoxAnimation />
          </section>
          <section className="detailshomecontainer-section">
            <TravelDetailsEighth />
          </section>
          <section className="detailshomecontainer-section">
            <TypingAnimation />
          </section>

          <section className="detailshomecontainer-section">
            <PhotoConfessionWall3D />
          </section>
          <section className="detailshomecontainer-section">
            <PhotoGallery />
          </section>

        </main>

        {/* 底部区域 */}
        <footer className="detailshomecontainer-footer">
          <Footer />
        </footer>
      </div>
    </div >
  );
};

export default DetailsHomeContainer;