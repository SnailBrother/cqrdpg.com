import React from 'react';
import './PhotoGallery.css';

const PhotoGallery = () => {
    const images = Array.from({ length: 12 }, (_, i) => i + 1);
    
    // 生成足够重复的图片数组确保无缝循环
    const getRepeatedImages = (start, end, repeats = 4) => {
        const slice = images.slice(start, end);
        return Array(repeats).fill(slice).flat();
    };
//http://121.4.22.55:80/backend/images/OurHomePage/Details/PhotoGallery/5.jpg

    return (
        <div className="photogallery-container">
            {/* 第一行 - 从右向左滚动 (较快) */}
            <div className="photogallery-scrolling-row photogallery-reverse" style={{ '--scroll-speed': '80s' }}>
                {getRepeatedImages(0, 4).map((num, index) => (
                    <div key={`first-${num}-${index}`} className="photogallery-card">
                        <div className="photogallery-frame">
                            <div className="photogallery-mat">
                                <img
                                    src={`http://121.4.22.55:80/backend/images/OurHomePage/Details/PhotoGallery/${num}.jpg`}
                                    alt={`Reunion Photo ${num}`}
                                    className="photogallery-image"
                                    loading="lazy"  // 添加懒加载优化性能
                                />
                            </div>
                        </div>
                        {/* <div className="photogallery-number">{num}</div> */}
                    </div>
                ))}
            </div>

            {/* 第二行 - 从左向右滚动 (较慢) */}
            <div className="photogallery-scrolling-row" style={{ '--scroll-speed': '100s' }}>
                {getRepeatedImages(5, 8).map((num, index) => (
                    <div key={`second-${num}-${index}`} className="photogallery-card">
                        <div className="photogallery-frame">
                            <div className="photogallery-mat">
                                <img
                                    src={`http://121.4.22.55:80/backend/images/OurHomePage/Details/PhotoGallery/${num}.jpg`}
                                    alt={`Reunion Photo ${num}`}
                                    className="photogallery-image"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                        {/* <div className="photogallery-number">{num}</div> */}
                    </div>
                ))}
            </div>

            {/* 第三行 - 从右向左滚动 (较快) */}
            <div className="photogallery-scrolling-row photogallery-reverse" style={{ '--scroll-speed': '80s' }}>
                {getRepeatedImages(9, 12).map((num, index) => (
                    <div key={`third-${num}-${index}`} className="photogallery-card">
                        <div className="photogallery-frame">
                            <div className="photogallery-mat">
                                <img
                                    src={`http://121.4.22.55:80/backend/images/OurHomePage/Details/PhotoGallery/${num}.jpg`}
                                    alt={`Reunion Photo ${num}`}
                                    className="photogallery-image"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PhotoGallery;