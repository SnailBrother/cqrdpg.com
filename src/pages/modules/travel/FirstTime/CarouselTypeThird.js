import React, { useState, useEffect, useRef } from 'react';
import './CarouselTypeThird.css';

const CarouselTypeThird = () => {
    // 图片源保持在组件内部
    const images = [
        'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeThird/1.jpg',
        'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeThird/2.jpg',
        'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeThird/3.jpg',
        'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeThird/4.jpg',
        'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeThird/5.jpg',
        'http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeThird/6.jpg',
    ];

    const [slides, setSlides] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const timerRef = useRef(null);

    // Initialize slides
    useEffect(() => {
        const initialSlides = images.map((img, index) => ({
            id: index + 1,
            src: img
        }));
        setSlides(initialSlides);
    }, []);

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
        <div
            className="carouseltypethird-container"

        >
            <div className="carouseltypethird-header">
                <div className="carouseltypethird-title-container">
                    <div className="carouseltypethird-title-bg"></div>
                    <h2 className="carouseltypethird-title">
                        <span className="carouseltypethird-title-text">欢声笑语</span>
                        <span className="carouseltypethird-title-shadow">欢声笑语</span>
                    </h2>
                    <div className="carouseltypethird-decoration">
                        <div className="carouseltypethird-decoration-left"></div>
                        <div className="carouseltypethird-decoration-right"></div>
                    </div>
                </div>
            </div>

            <ul className="carouseltypethird-banner">
                {[-1, 0, 1].map(offset => {
                    let index = (currentIndex + offset + slides.length) % slides.length;
                    let slide = slides[index];
                    return (
                        <li
                            key={slide.id}
                            className={`carouseltypethird-slide ${index === currentIndex ? 'carouseltypethird-active' : ''}`}
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
                            <img src={slide.src} alt={`banner-${slide.id}`} className="carouseltypethird-img" />
                        </li>
                    );
                })}

                <div className="carouseltypethird-dots">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className="carouseltypethird-dot"
                            style={{
                                backgroundColor: index === currentIndex ? 'black' : 'white'
                            }}
                            onMouseEnter={() => handleDotHover(index)}
                        />
                    ))}
                </div>

                <button
                    className="carouseltypethird-nav carouseltypethird-left"
                    onClick={handlePrev}
                    aria-label="Previous"
                >
                    &lt;
                </button>
                <button
                    className="carouseltypethird-nav carouseltypethird-right"
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