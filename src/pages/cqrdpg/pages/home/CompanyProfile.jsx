import React, { useState, useEffect, useRef } from 'react';
import styles from './CompanyProfile.module.css';

const images = [
  {
    id: 1,
    src: '/images/cqrdpg/home/CompanyProfile/Service.jpg',
    alt: 'Image 1',
    title: ' 服务范围',
    description: '重庆瑞达是一家具有资产评估、社会稳定风险评估、工程造价、\n' +
      '土地测绘等资质的大型综合咨询专业服务机构。具有专业服务经验近20年，\n' +
      '主要为客户提供资产评估、房地产估价、土地估价、国有土地上房屋征收评估、\n' +
      '社会稳定风险评估、工程造价咨询和管理咨询等专业服务'
  },
  {
    id: 2,
    src: '/images/cqrdpg/home/CompanyProfile/Qualification.jpg',
    alt: 'Image 2',
    title: '资质',
    description: '土地估价A级资格\n' +
      '（2012年7月1日取得）\n' +
      '房地产估价一级资格\n' +
      '（2016年7月1日取得）\n' +
      '资产评估综合B级资格\n' +
      '（2008年2月26日取得）\n' +
      '司法鉴定资格\n' +
      '（2011年7月5日取得）'
  },
  {
    id: 3,
    src: '/images/cqrdpg/home/CompanyProfile/Honor.jpg',
    alt: 'Image 3',
    title: '企业荣誉',
    description: '重庆工商大学管理学院实习实践基地奖\n' +
      '重庆工商大学管理学院校企合作突出贡献单位\n' +
      '重庆市国土资源房屋评估和经纪协会四届理事会理事单位\n' +
      '重庆市司法鉴定行业年度诚信执业会员单位'
  },
  {
    id: 4,
    src: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg',
    alt: 'Image 4',
    title: '理念与宗旨',
    description: '服务理念：\n' +
      '坚持“以人为本、质量求生存、信誉求发展、效率求效益”的服务理念。\n' +
      '评估宗旨： \n' +
      '公平、公正、独立、客观、 \n' +
      ' 维护当事人的合法权益'
  },
  {
    id: 5,
    src: '/images/cqrdpg/home/CompanyProfile/Team.jpg',
    alt: 'Image 5',
    title: '专业团队',
    description: '公司现有从业人员50余人，其中硕士研究生3人，高级职称8人，中级职称15人。\n' +
      '注册资产评估师8人，注册土地估价师8人、注册房地产估价师15人，注册造价工程师13人，\n' +
      '注册咨询师2人、注册建造师、注册监理工程师各2人。'
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
                  <h3 className={styles['carouseltypesecond-description-title']}>
                    {img.title.split(' ').map((word, i) => (
                      <span key={i}>{word} </span>
                    ))}
                  </h3>
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