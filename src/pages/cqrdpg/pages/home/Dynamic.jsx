import React, { useState, useEffect, useRef } from 'react';
import styles from './Dynamic.module.css';

const CarouselTypeThird = () => {
    const images = [
        { src: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg', description: '高效响应' },
        { src: '/images/cqrdpg/home/CompanyProfile/Honor.jpg', description: '快速出稿' },
        { src: '/images/cqrdpg/home/CompanyProfile/Qualification.jpg', description: '精准评估' },
        { src: '/images/cqrdpg/home/CompanyProfile/Service.jpg', description: '按时交付' },
        { src: '/images/cqrdpg/home/CompanyProfile/Team.jpg', description: '全程高效' },
        { src: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg', description: '专业服务' },
    ];

    const [slides, setSlides] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const timerRef = useRef(null);
    const middleImageRef = useRef(null);

    // 检测屏幕尺寸
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initialize slides
    useEffect(() => {
        const initialSlides = images.map((item, index) => ({
            id: index + 1,
            src: item.src,
            description: item.description
        }));
        setSlides(initialSlides);
    }, []);

    // Auto-rotate effect（仅电脑端）
    useEffect(() => {
        if (!isMobile && !isHovering) {
            startTimer();
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [currentIndex, isHovering, isMobile]);

    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
            handleNext();
        }, 4000);
    };

    const handlePrev = () => {
        setCurrentIndex(prevIndex =>
            prevIndex === 0 ? slides.length - 1 : prevIndex - 1
        );
        startTimer();
    };

    const handleNext = () => {
        setCurrentIndex(prevIndex =>
            prevIndex === slides.length - 1 ? 0 : prevIndex + 1
        );
        startTimer();
    };

    const handleDotClick = (index) => {
        setCurrentIndex(index);
        startTimer();
    };

    const handleMouseEnter = () => {
        setIsHovering(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        startTimer();
    };

    if (slides.length === 0) return null;

    // 滚动文字内容
    const scrollText = "我们是一支专业、高效、创新的评估团队，秉承专业、客观、公正的原则，为客户提供全方位的资产评估服务。十年行业经验，五千余客户信赖，我们致力于让评估更简单、更精准、更可靠。";

    return (
        <div className={styles['carousel-container']}>
            {/* 标题区域 */}
            <div className={styles['carousel-header']}>
                <div className={styles['title-container']}>
                    <div className={styles['title-bg']}></div>
                    <h2 className={styles['title']}>
                        <span className={styles['title-text']}>企业团队</span>
                        <span className={styles['title-shadow']}>企业团队</span>
                    </h2>
                    <div className={styles['decoration']}>
                        <div className={styles['decoration-left']}></div>
                        <div className={styles['decoration-right']}></div>
                    </div>
                </div>
            </div>

            {/* 横向滚动文字 */}
            <div className={styles['marquee-wrapper']}>
                <div className={styles['marquee']}>
                    <div className={styles['marquee-content']}>
                        <span className={styles['marquee-text']}>{scrollText}</span>
                        <span className={styles['marquee-text']}>{scrollText}</span>
                        <span className={styles['marquee-text']}>{scrollText}</span>
                    </div>
                </div>
            </div>

            {/* 电脑端：轮播图 */}
            {!isMobile && (
                <div className={styles['carousel-wrapper']}>
                    <ul className={styles['banner']}>
                        {slides.map((slide, index) => {
                            let isActive = index === currentIndex;
                            let isPrev = index === (currentIndex - 1 + slides.length) % slides.length;
                            let isNext = index === (currentIndex + 1) % slides.length;
                            
                            let position = '';
                            if (isActive) position = 'center';
                            else if (isPrev) position = 'left';
                            else if (isNext) position = 'right';
                            else position = 'hidden';
                            
                            return (
                                <li
                                    key={slide.id}
                                    ref={isActive ? middleImageRef : null}
                                    className={`${styles['slide']} ${isActive ? styles['active'] : ''} ${styles[position]}`}
                                    onMouseEnter={isActive ? handleMouseEnter : undefined}
                                    onMouseLeave={isActive ? handleMouseLeave : undefined}
                                >
                                    <div className={styles['image-wrapper']}>
                                        <img src={slide.src} alt={`banner-${slide.id}`} className={styles['img']} />
                                        {isActive && (
                                            <div className={styles['image-description']}>
                                                {slide.description}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* 导航按钮 */}
                    <button
                        className={`${styles['nav']} ${styles['nav-left']}`}
                        onClick={handlePrev}
                        aria-label="Previous"
                    >
                        &lt;
                    </button>
                    <button
                        className={`${styles['nav']} ${styles['nav-right']}`}
                        onClick={handleNext}
                        aria-label="Next"
                    >
                        &gt;
                    </button>

                    {/* 圆点导航 */}
                    <div className={styles['dots-wrapper']}>
                        <div className={styles['dots']}>
                            {slides.map((slide, index) => (
                                <div
                                    key={slide.id}
                                    className={`${styles['dot']} ${index === currentIndex ? styles['dot-active'] : ''}`}
                                    onClick={() => handleDotClick(index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 手机端：瀑布流卡片布局 */}
            {isMobile && (
                <div className={styles['waterfall']}>
                    {slides.map((slide, index) => (
                        <div key={slide.id} className={styles['card']}>
                            <div className={styles['card-image']}>
                                <img src={slide.src} alt={slide.description} />
                                <div className={styles['card-overlay']}>
                                    <span className={styles['card-tag']}>{slide.description}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CarouselTypeThird;