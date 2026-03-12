import React, { useState, useEffect, useRef } from 'react';
import styles from './Dynamic.module.css';

const CarouselTypeThird = () => {
    // 图片源保持在组件内部
    const images = [
        { src: '/images/cqrdpg/home/CompanyProfile/Purpose.jpg', description: '高效响应' },
        { src: '/images/cqrdpg/home/CompanyProfile/Honor.jpg', description: '快速出稿' },
        { src: '/images/cqrdpg/home/CompanyProfile/Qualification.jpg', description: '精准评估' },
        { src: '/images/cqrdpg/home/CompanyProfile/Service.jpg', description: '按时交付' },
        { src: '/images/cqrdpg/home/CompanyProfile/Team.jpg', description: '全程高效' },
];

    const [slides, setSlides] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const timerRef = useRef(null);
    const middleImageRef = useRef(null);
    const [imageWidth, setImageWidth] = useState(0);

    // Initialize slides
    useEffect(() => {
        const initialSlides = images.map((item, index) => ({
            id: index + 1,
            src: item.src,
            description: item.description
        }));
        setSlides(initialSlides);
    }, []);

    // 监听中间图片的宽度变化
    useEffect(() => {
        if (middleImageRef.current) {
            const updateWidth = () => {
                const width = middleImageRef.current.offsetWidth;
                setImageWidth(width);
            };
            
            updateWidth();
            window.addEventListener('resize', updateWidth);
            
            return () => {
                window.removeEventListener('resize', updateWidth);
            };
        }
    }, [currentIndex]);

    // Auto-rotate effect
    useEffect(() => {
        if (!isHovering) {
            startTimer();
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [currentIndex, isHovering]);

    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
            handleNext();
        }, 3000);
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

    const handleDotHover = (index) => {
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

    return (
        <div className={styles['carouseltypethird-container']}>
            <div className={styles['carouseltypethird-header']}>
                <div className={styles['carouseltypethird-title-container']}>
                    <div className={styles['carouseltypethird-title-bg']}></div>
                    <h2 className={styles['carouseltypethird-title']}>
                        <span className={styles['carouseltypethird-title-text']}>企业团队</span>
                        <span className={styles['carouseltypethird-title-shadow']}>企业团队</span>
                    </h2>
                    <div className={styles['carouseltypethird-decoration']}>
                        <div className={styles['carouseltypethird-decoration-left']}></div>
                        <div className={styles['carouseltypethird-decoration-right']}></div>
                    </div>
                </div>
            </div>

            <ul className={styles['carouseltypethird-banner']}>
                {[-1, 0, 1].map(offset => {
                    let index = (currentIndex + offset + slides.length) % slides.length;
                    let slide = slides[index];
                    return (
                        <li
                            key={slide.id}
                            ref={index === currentIndex ? middleImageRef : null}
                            className={`${styles['carouseltypethird-slide']} ${index === currentIndex ? styles['carouseltypethird-active'] : ''}`}
                            style={{
                                zIndex: index === currentIndex ? 100 : index,
                                left: offset === 0 ? '50%' :
                                    offset === -1 ? '25%' : '75%',
                                top: '50%',
                                transform: `translate(-50%, -50%) ${index === currentIndex ? 'scale(1.3)' : 'scale(1)'}`,
                                width: '40%',
                                height: '80%',
                                opacity: 1
                            }}
                            onMouseEnter={index === currentIndex ? handleMouseEnter : undefined}
                            onMouseLeave={index === currentIndex ? handleMouseLeave : undefined}
                        >
                            <img src={slide.src} alt={`banner-${slide.id}`} className={styles['carouseltypethird-img']} />
                            
                            {/* 只在中间图片显示描述 - 固定在图片顶部 */}
                            {index === currentIndex && (
                                <div 
                                    className={styles['carouseltypethird-description']}
                                    style={{
                                        width: imageWidth ? `${imageWidth}px` : '100%',
                                    }}
                                >
                                    {slide.description}
                                </div>
                            )}
                        </li>
                    );
                })}

                <div className={styles['carouseltypethird-dots-wrapper']}>
                    <div className={styles['carouseltypethird-dots']}>
                        {slides.map((slide, index) => (
                            <div
                                key={slide.id}
                                className={`${styles['carouseltypethird-dot']} ${index === currentIndex ? styles['carouseltypethird-dot-active'] : ''}`}
                                onMouseEnter={() => handleDotHover(index)}
                            />
                        ))}
                    </div>
                </div>

                <button
                    className={`${styles['carouseltypethird-nav']} ${styles['carouseltypethird-left']}`}
                    onClick={handlePrev}
                    aria-label="Previous"
                >
                    &lt;
                </button>
                <button
                    className={`${styles['carouseltypethird-nav']} ${styles['carouseltypethird-right']}`}
                    onClick={handleNext}
                    aria-label="Next"
                >
                    &gt;
                </button>
            </ul>
        </div>
    );
};

export default CarouselTypeThird;