import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CarouselTypeSeventh.css';

const CarouselTypeSeventh = () => {
    // First column carousel data
    const mainCarouselItems = [
        {
            title: '合川',
            subtitle: '涞滩古镇',
            src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSeventh/1.jpg`
        },
        {
            title: '南川',
            subtitle: '山王坪',
            src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSeventh/2.jpg`
        },
        {
            title: '恩施',
            subtitle: '双凤村',
            src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSeventh/3.jpg`
        }
    ];

    // Second column top row carousel data (pairs of items)
    const subCarouselItems = [
        [
            { title: '水上公路', src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSeventh/4.jpg` },
            { title: '贡水', src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSeventh/5.jpg` }
        ],
        [
            { title: '山王坪', src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSeventh/6.jpg` },
            { title: '宣恩', src: `http://121.4.22.55:80/backend/images/OurHomePage/CarouselTypeSeventh/7.jpg` }

        ]
    ];

    const [mainIndex, setMainIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [mainDirection, setMainDirection] = useState('right');
    const [subDirection, setSubDirection] = useState('right');

    const handleMainPrev = () => {
        setMainDirection('left');
        setMainIndex(prev => (prev === 0 ? mainCarouselItems.length - 1 : prev - 1));
    };

    const handleMainNext = () => {
        setMainDirection('right');
        setMainIndex(prev => (prev === mainCarouselItems.length - 1 ? 0 : prev + 1));
    };

    const handleSubPrev = () => {
        setSubDirection('left');
        setSubIndex(prev => (prev === 0 ? subCarouselItems.length - 1 : prev - 1));
    };

    const handleSubNext = () => {
        setSubDirection('right');
        setSubIndex(prev => (prev === subCarouselItems.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="carouseltypeseventh-container">

            <div className="carouseltypeseventh-header-titcontainer">
                <div className="carouseltypeseventh-title-container">
                    <div className="carouseltypeseventh-watercolor-bg"></div>
                    <div className="carouseltypeseventh-title-wrapper">
                        <div className="carouseltypeseventh-decoration-butterfly left">🦋</div>
                        <h2 className="carouseltypeseventh-title">
                            <span className="carouseltypeseventh-title-text">幸福存档</span>
                            <span className="carouseltypeseventh-title-watercolor">幸福存档</span>
                        </h2>
                        <div className="carouseltypeseventh-decoration-butterfly right">🦋</div>
                    </div>
                </div>
            </div>

            <div className="carouseltypeseventh-grid">
                {/* First column - main carousel */}
                <div className="carouseltypeseventh-main">
                    <div className="carouseltypeseventh-main-carousel">
                        <div className={`carouseltypeseventh-main-slide ${mainDirection}`}>
                            <img
                                src={mainCarouselItems[mainIndex].src}
                                alt={mainCarouselItems[mainIndex].title}
                                className="carouseltypeseventh-main-image"
                            />
                            <div className="carouseltypeseventh-main-overlay">
                                <h3>{mainCarouselItems[mainIndex].title}</h3>
                                <p>{mainCarouselItems[mainIndex].subtitle}</p>
                            </div>
                        </div>
                    </div>
                    <div className="carouseltypeseventh-main-nav">
                        <button className="carouseltypeseventh-main-prev" onClick={handleMainPrev}>
                            &lt;
                        </button>
                        <div className="carouseltypeseventh-main-dots">
                            {mainCarouselItems.map((_, index) => (
                                <button
                                    key={index}
                                    className={`carouseltypeseventh-main-dot ${index === mainIndex ? 'active' : ''}`}
                                    onClick={() => {
                                        setMainDirection(index > mainIndex ? 'right' : 'left');
                                        setMainIndex(index);
                                    }}
                                />
                            ))}
                        </div>
                        <button className="carouseltypeseventh-main-next" onClick={handleMainNext}>
                            &gt;
                        </button>
                    </div>
                </div>

                {/* Second column - divided into two rows */}
                <div className="carouseltypeseventh-secondary">
                    {/* Top row - sub carousel */}
                    <div className="carouseltypeseventh-sub-carousel">
                        <button
                            className="carouseltypeseventh-sub-prev"
                            onClick={handleSubPrev}
                        >
                            &lt;
                        </button>

                        <div className="carouseltypeseventh-sub-slider">
                            <div className={`carouseltypeseventh-sub-slide ${subDirection}`}>
                                {subCarouselItems[subIndex].map((item, i) => (
                                    <div key={i} className="carouseltypeseventh-sub-item">
                                        <img src={item.src} alt={item.title} />
                                        <div className="carouseltypeseventh-sub-overlay">
                                            <h4>{item.title}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="carouseltypeseventh-sub-next"
                            onClick={handleSubNext}
                        >
                            &gt;
                        </button>
                    </div>

                    {/* Bottom row - description */}
                    <div className="carouseltypeseventh-description">
                        <div className="carouseltypeseventh-description-header">
                            <div className="carouseltypeseventh-description-title-wrap">
                                <h4 className="carouseltypeseventh-description-title">国家A级旅游景区</h4>
                                <span className="carouseltypeseventh-description-count">共收录32处A级景区</span>
                            </div>
                            <Link to="/detailshomecontainer" className="carouseltypeseventh-more">
                                查看更多 &gt;
                            </Link> 
                             </div>

                        <ul className="carouseltypeseventh-description-list">
                            <li>长寿湖</li>
                            <li>壹华里</li>
                            <li>南天湖</li>
                            <li>白帝城</li>
                            <li>璧山公园</li>
                            <li>四面山</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarouselTypeSeventh;