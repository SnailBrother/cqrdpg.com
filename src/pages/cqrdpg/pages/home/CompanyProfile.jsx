import React, { useState, useEffect, useRef } from 'react';
import styles from './CompanyProfile.module.css';

const images = [
  {
    id: 1,
    src: '/images/cqrdpg/home/CompanyProfile/Service.jpg',
    alt: 'Image 1',
    title: ' 擅长 ',
    description: ' 房地产价值评估 \n' +
    ' 土地估价 \n' +
    ' 资产评估 \n' +
    ' 司法鉴定相关评估工作'
  },
  {
    id: 2,
    src: '/images/cqrdpg/home/CompanyProfile/Qualification.jpg',
    alt: 'Image 2',
    title: '从业经验',
    description: '深耕评估行业多年 \n' +
      '熟悉全流程评估操作 \n' +
      '精通报告编制与数据分析 \n' +
      '长期服务各类评估项目，经验成熟可靠'
  },
  {
    id: 3,
    src: '/images/cqrdpg/home/CompanyProfile/Honor.jpg',
    alt: 'Image 3',
    title: '优势',
    description: ' 响应高效，沟通及时，需求秒回 \n' +
      ' 做事严谨细致，交付质量稳定 \n' +
      ' 专业能力扎实，业务经验丰富 \n' +
      ' 诚信靠谱，责任心强，客户满意度高'
  },
  {
    id: 4,
    src: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg',
    alt: 'Image 4',
    title: ' 执业理念 ',
    description: ' 用心服务、专业立身\n' +
    ' 诚信为本、高效尽责。\n' +
      ' 公平、公正、独立、客观，\n' +
      ' 坚守职业底线，维护各方合法权益'
  },
  {
    id: 5,
    src: '/images/cqrdpg/home/CompanyProfile/Team.jpg',
    alt: 'Image 5',
    title: '服务保障',
    description: '一对一专属对接，沟通顺畅 \n' +
      '严格保密客户信息与项目资料 \n' +
      '流程规范，结果客观可信 \n' +
      '全程负责，售后跟进及时到位'
  }
];

const CarouselTypeSecond = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // --- 新增：触摸滑动相关状态 ---
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchCurrentX, setTouchCurrentX] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startAutoPlay = () => {
    clearTimer();
    if (!isHovering && !isSwiping) { // 滑动过程中也不自动播放
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 8000);
    }
  };

  const handleSwitch = (index) => {
    setCurrentIndex(index);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    clearTimer();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // --- 新增：触摸事件处理函数 ---

  // 触摸开始
  const handleTouchStart = (e) => {
    // 记录起始 X 坐标
    setTouchStartX(e.touches[0].clientX);
    setTouchCurrentX(e.touches[0].clientX);
    setIsSwiping(true);
    clearTimer(); // 滑动时停止自动播放
  };

  // 触摸移动
  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    // 更新当前 X 坐标
    setTouchCurrentX(e.touches[0].clientX);
  };

  // 触摸结束
  const handleTouchEnd = () => {
    if (touchStartX === null || touchCurrentX === null) {
      setIsSwiping(false);
      return;
    }

    const diff = touchStartX - touchCurrentX;
    const threshold = 50; // 滑动阈值，超过50px才算有效滑动

    // 判断是向左滑还是向右滑
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 手指向左滑 (x 减小)，显示下一张
        nextSlide();
      } else {
        // 手指向右滑 (x 增大)，显示上一张
        prevSlide();
      }
    }

    // 重置状态
    setTouchStartX(null);
    setTouchCurrentX(null);
    setIsSwiping(false);

    // 恢复自动播放 (会在 useEffect 中触发)
  };

  useEffect(() => {
    startAutoPlay();
    return () => {
      clearTimer();
    };
  }, [currentIndex, isHovering, isSwiping]); // 依赖项加入 isSwiping

  return (
    <div
      className={styles['carouseltypesecond-box']}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 轮播图片区域 - 绑定触摸事件 */}
      <ul
        className={styles['carouseltypesecond-ul1']}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, index) => (
          <li
            key={img.id}
            className={`${styles['carouseltypesecond-slide']} ${index === currentIndex ? styles['carouseltypesecond-active'] :
              index === (currentIndex - 1 + images.length) % images.length ? styles['carouseltypesecond-prev'] :
                index === (currentIndex + 1) % images.length ? styles['carouseltypesecond-next'] : ''
              }`}
          >
            <img src={img.src} alt={img.alt} className={styles['carouseltypesecond-img']} />
            {index === currentIndex && (
              <div key={currentIndex} className={styles['carouseltypesecond-description']}>
                {/* 新增内部容器，用于包裹文字内容以应用动画 */}
                <div className={styles['carouseltypesecond-description-content']}>
                  {/* 图片标题描述 */}
                  {/* <h3 className={styles['carouseltypesecond-description-title']}>
                    {img.title.split(' ').map((word, i) => (
                      <span key={i}>{word} </span>
                    ))}
                  </h3> */}
                  <p className={styles['carouseltypesecond-description-text']}>{img.description}</p>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* 左右按钮 - 移动端通常隐藏，这里保留但可通过 CSS 控制 */}
      {/* <div
        className={`${styles['carouseltypesecond-left-button']} ${styles['carouseltypesecond-indexs']}`}
        onClick={prevSlide}
      >
        &lt;
      </div>
      <div
        className={`${styles['carouseltypesecond-right-button']} ${styles['carouseltypesecond-indexs']}`}
        onClick={nextSlide}
      >
        &gt;
      </div> */}

      {/* 指示器 */}
      <ul className={`${styles['carouseltypesecond-ul2']} ${styles['carouseltypesecond-indexs']}`}>
        {images.map((_, index) => (
          <li
            key={index}
            className={`${styles['carouseltypesecond-indicator']} ${index === currentIndex ? styles['carouseltypesecond-active-indicator'] : ''}`}
            onClick={() => handleSwitch(index)}
          >
            {index + 1}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CarouselTypeSecond;