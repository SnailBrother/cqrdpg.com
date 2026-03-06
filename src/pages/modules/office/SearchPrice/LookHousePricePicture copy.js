import React, { useState, useEffect, useRef } from 'react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './LookHousePricePicture.css';
import { useSearchParams } from 'react-router-dom';
import WordReportGeneratorLoader from '../../accounting/Notification/WordReportGeneratorLoader';

const LookHousePricePicture = () => {
  // 修改页面标题
  useEffect(() => {
    document.title = '现状照片';
  }, []);

  const [searchParams] = useSearchParams();
  const reportsID = searchParams.get('reportsID') || "";
  const location = searchParams.get('location') || "";

  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const thumbnailContainerRef = useRef(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!reportsID) {
        setError('报告ID不能为空');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/GetHousePricePictures?reportsID=${encodeURIComponent(reportsID)}`
        );

        if (!response.ok) {
          throw new Error('获取图片失败');
        }

        const data = await response.json();

        if (data.success && data.images) {
          // 构造完整的图片URL
          // const imageUrls = data.images.map(image =>
          //   `http://121.4.22.55:8888/backend/images/HousePricePictures/${reportsID}/${image.pictureFileName}`
          // );
          // setImages(imageUrls);
          // 使用环境变量构造图片URL
          const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
          const imageUrls = data.images.map(image =>
            `${baseUrl}/backend/images/HousePricePictures/${reportsID}/${image.pictureFileName}`
          );
          setImages(imageUrls);
        } else {
          setImages([]);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
        setError('加载图片失败，请稍后重试');
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [reportsID]);

  // 点击缩略图切换大图
  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  // 上一张图片
  const handlePrev = () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    setCurrentImageIndex(newIndex);
  };

  // 下一张图片
  const handleNext = () => {
    const newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
  };

  if (isLoading) {
    return (
      <div className="LookHousePricePicture-container">
        <WordReportGeneratorLoader />
      </div>
    );
  }

  return (
    <div className="LookHousePricePicture-container">
      <div className="LookHousePricePicture-header">
        <h3>{location}</h3>
        {/* <div className="LookHousePricePicture-count">
          共 {images.length} 张图片
        </div> */}
      </div>

      {error ? (
        <div className="LookHousePricePicture-error">{error}</div>
      ) : images.length > 0 ? (
        <div className="LookHousePricePicture-gallery">
          {/* 大图显示区域 */}
          <div className="LookHousePricePicture-main-image-container">
            <img
              src={images[currentImageIndex]}
              alt={`房价图片-${currentImageIndex + 1}`}
              className="LookHousePricePicture-main-image"
            />
            <div className="LookHousePricePicture-image-counter">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>

          {/* 缩略图预览区域 */}
          <div className="LookHousePricePicture-thumbnail-wrapper">


            {/* 缩略图容器 */}
            <div
              className="LookHousePricePicture-thumbnail-container"
              ref={thumbnailContainerRef}
            >

              {/* 大图切换按钮 - 左侧 */}
              {images.length > 1 && (
                <button
                  className="LookHousePricePicture-nav-button LookHousePricePicture-prev-button"
                  onClick={handlePrev}
                >
                  ‹
                </button>
              )}


              {images.map((image, index) => (
                <div
                  key={index}
                  className={`LookHousePricePicture-thumbnail ${index === currentImageIndex ? 'LookHousePricePicture-thumbnail-active' : ''
                    }`}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img
                    src={image}
                    alt={`缩略图-${index + 1}`}
                    className="LookHousePricePicture-thumbnail-image"
                  />
                </div>
              ))}


              {/* 大图切换按钮 - 右侧 */}
              {images.length > 1 && (
                <button
                  className="LookHousePricePicture-nav-button LookHousePricePicture-next-button"
                  onClick={handleNext}
                >
                  ›
                </button>
              )}


            </div>


          </div>
        </div>
      ) : (
        <div className="LookHousePricePicture-no-images">
          暂无图片数据
        </div>
      )}
    </div>
  );
};

export default LookHousePricePicture;