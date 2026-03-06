import React, { useState, useEffect, useRef } from 'react';
import './PictureCarouselOne.css';

const PictureCarousel = () => {
    const images = [
        'images/1.jpg',
        'images/2.jpg',
        'images/3.jpg',
        'images/4.jpg',
        'images/5.jpg',
        'images/6.jpg'
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
        <div className="pcone-container">
            <ul className="pcone-banner">
                {[-1, 0, 1].map(offset => {
                    let index = (currentIndex + offset + slides.length) % slides.length;
                    let slide = slides[index];
                    return (
                        <li 
                            key={slide.id}
                            className={`pcone-slide ${index === currentIndex ? 'pcone-active' : ''}`}
                            style={{
                                zIndex: index === currentIndex ? 100 : index,
                                transform: index === currentIndex ? 'scale(1.3)' : 'scale(1)',
                                left: offset === 0 ? '300px' : 
                                      offset === -1 ? '0px' : '600px',
                                opacity: 1
                            }}
                            onMouseEnter={index === currentIndex ? handleMouseEnter : undefined}
                            onMouseLeave={index === currentIndex ? handleMouseLeave : undefined}
                        >
                            <img src={slide.src} alt={`banner-${slide.id}`} className="pcone-img" />
                        </li>
                    );
                })}
                
                <div className="pcone-dots">
                    {slides.map((slide, index) => (
                        <div 
                            key={slide.id}
                            className="pcone-dot"
                            style={{
                                backgroundColor: index === currentIndex ? 'black' : 'white',
                                left: `${190 * (index + 1)}px`
                            }}
                            onMouseEnter={() => handleDotHover(index)}
                        />
                    ))}
                </div>
                
                <button 
                    className="pcone-nav pcone-left" 
                    onClick={handlePrev}
                    aria-label="Previous"
                >
                    &lt;
                </button>
                <button 
                    className="pcone-nav pcone-right" 
                    onClick={handleNext}
                    aria-label="Next"
                >
                    &gt;
                </button>
            </ul>
        </div>
    );
};

export default PictureCarousel;    