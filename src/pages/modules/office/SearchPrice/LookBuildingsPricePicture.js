import React, { useState, useEffect, useRef } from 'react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './LookBuildingsPricePicture.module.css';
import { useSearchParams } from 'react-router-dom';
import WordReportGeneratorLoader from '../../accounting/Notification/WordReportGeneratorLoader';

const LookBuildingsPricePicture = () => {
  useEffect(() => {
    document.title = '建筑物造价图片';
  }, []);

  const [searchParams] = useSearchParams();
  const buildingsPriceid = searchParams.get('buildingsPriceid') || "";
  const name = searchParams.get('name') || "";

  const [images, setImages] = useState([]);
  const [buildingInfo, setBuildingInfo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const thumbnailContainerRef = useRef(null);

  // 计算总价
  const calculateTotalPrice = () => {
    if (!buildingInfo || !buildingInfo.price || !buildingInfo.area) return null;

    const price = parseFloat(buildingInfo.price);
    const area = parseFloat(buildingInfo.area);

    if (isNaN(price) || isNaN(area)) return null;

    let total = 0;
    const unit = buildingInfo.unit || '';

    if (unit === '元/㎡') {
      total = (area * price) / 10000; // 转换为万元
    } else if (unit === '元/m³') {
      total = (area * price) / 10000; // 转换为万元
    } else if (unit === '元/m') {
      total = (area * price) / 10000; // 转换为万元
    } else if (unit === '元/座' || unit === '元/个') {
      total = price / 10000; // 转换为万元
    } else {
      // 默认按单价计算
      total = (area * price) / 10000;
    }

    return total.toFixed(2);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    } catch (e) {
      return dateString;
    }
  };

  // 格式化面积/数量
  const formatArea = (area, unit) => {
    if (!area) return '-';

    if (unit === '元/㎡' || unit === '元/m²') {
      return `${parseFloat(area).toFixed(2)} ㎡`;
    } else if (unit === '元/m³') {
      return `${parseFloat(area).toFixed(2)} m³`;
    } else if (unit === '元/m') {
      return `${parseFloat(area).toFixed(2)} m`;
    } else if (unit === '元/座') {
      return '1 座';
    } else if (unit === '元/个') {
      return '1 个';
    }
    return `${area} ${unit || ''}`;
  };

  // 获取单价显示
  // 获取单价显示
  const formatUnitPrice = (price, unit) => {
    if (!price) return '-';

    // 如果单位不包含"元/"，则添加
    let formattedUnit = unit || '';
    if (formattedUnit && !formattedUnit.includes('元/')) {
      formattedUnit = '元/' + formattedUnit;
    }

    return `${parseFloat(price).toLocaleString('zh-CN')} ${formattedUnit}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!buildingsPriceid) {
        setError('建筑物ID不能为空');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // 并行获取图片和建筑物信息
        const [imagesResponse, buildingResponse] = await Promise.all([
          fetch(`/api/GetBuildingsPricePictures?buildingsPriceid=${encodeURIComponent(buildingsPriceid)}`),
          fetch(`/api/GetBuildingsPriceInfo?buildingsPriceid=${encodeURIComponent(buildingsPriceid)}`)
        ]);

        if (!imagesResponse.ok || !buildingResponse.ok) {
          throw new Error('获取数据失败');
        }

        const imagesData = await imagesResponse.json();
        const buildingData = await buildingResponse.json();

        if (imagesData.success && imagesData.images) {
          const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
          const imageUrls = imagesData.images.map(image =>
            `${baseUrl}/backend/images/BuildingsPricePictures/${buildingsPriceid}/${image.pictureFileName}`
          );
          setImages(imageUrls);
        } else {
          setImages([]);
        }

        if (buildingData.success) {
          setBuildingInfo(buildingData.buildingInfo);
        } else {
          setError('获取建筑物信息失败');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('加载数据失败，请稍后重试');
        setImages([]);
        setBuildingInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [buildingsPriceid]);

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
      <div className={styles.container}>
        <WordReportGeneratorLoader />
      </div>
    );
  }

  const totalPrice = calculateTotalPrice();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{name || buildingInfo?.name || '建筑物造价信息'}</h3>
      </div>

      {error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          {/* 第一行：图片 + 基础信息 */}
          <div className={styles.firstRow}>

            {/* 左侧图片区域 */}
            <div className={styles.imageSection}>
              {/* 大图显示区域 */}
              <div className={styles.mainImageContainer}>
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={`建筑物图片-${currentImageIndex + 1}`}
                      className={styles.mainImage}
                    />
                    <div className={styles.imageCounter}>
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                ) : (
                  <div className={styles.noImagePlaceholder}>
                    <svg className={styles.noImageIcon} aria-hidden="true">
                      <use xlinkHref="#icon-wutupian" />
                    </svg>
                    <p>暂无图片</p>
                  </div>
                )}
              </div>

              {/* 缩略图预览区域 */}
              {images.length > 0 && (
                <div className={styles.thumbnailSection}>
                  <div className={styles.thumbnailContainer} ref={thumbnailContainerRef}>
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className={`${styles.thumbnail} ${index === currentImageIndex ? styles.thumbnailActive : ''}`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        <img
                          src={image}
                          alt={`缩略图-${index + 1}`}
                          className={styles.thumbnailImage}
                        />
                      </div>
                    ))}
                  </div>

                  {/* 导航按钮 */}
                  {images.length > 1 && (
                    <>
                      <button
                        className={`${styles.navButton} ${styles.prevButton}`}
                        onClick={handlePrev}
                      >
                        ‹
                      </button>
                      <button
                        className={`${styles.navButton} ${styles.nextButton}`}
                        onClick={handleNext}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 右侧基础信息 */}
            <div className={styles.basicInfoSection}>
              {buildingInfo && (
                <>
                  {/* 价格信息 */}
                  <div className={styles.priceInfo}>
                    <div className={styles.priceRow}>
                      {/* <div className={styles.priceItem}>
                        <div className={styles.priceLabel}>估算总价</div>
                        <div className={styles.priceValue}>
                          {totalPrice ? `${totalPrice} 万元` : '-'}
                        </div>
                      </div> */}
                      <div className={styles.priceItem}>
                        {/* <div className={styles.priceLabel}>单价</div> */}
                        <div className={styles.priceValue}>
                          {formatUnitPrice(buildingInfo.price, buildingInfo.unit)}

                        </div>
                      </div>
                    </div>

                    <div className={styles.areaRow}>
                      {/* <div className={styles.areaItem}>
                        <div className={styles.areaLabel}>数量/面积</div>
                        <span className={styles.areaValue}>
                          {formatArea(buildingInfo.area, buildingInfo.unit)}
                        </span>
                      </div> */}
                      {/* <div className={styles.areaItem}>
                        <div className={styles.areaLabel}>单位</div>
                        <span className={styles.areaValue}>{buildingInfo.unit || '-'}</span>
                      </div> */}
                    </div>
                  </div>

                  {/* 建筑物信息 */}
                  <div className={styles.buildingInfo}>
                    <div className={styles.buildingRow}>
                      <div className={styles.buildingItem}>
                        <span className={styles.buildingLabel}>名称</span>
                        <span className={styles.buildingValue}>{buildingInfo.name || '-'}</span>
                      </div>
                      <div className={styles.buildingItem}>
                        <span className={styles.buildingLabel}>结构</span>
                        <span className={styles.buildingValue}>{buildingInfo.structure || '-'}</span>
                      </div>
                    </div>

                    <div className={styles.buildingRow}>
                      <div className={styles.buildingItem}>
                        <span className={styles.buildingLabel}>区域</span>
                        <span className={styles.buildingValue}>{buildingInfo.area || '-'}</span>
                      </div>
                      <div className={styles.buildingItem}>
                        <span className={styles.buildingLabel}>创建日期</span>
                        <span className={styles.buildingValue}>{formatDate(buildingInfo.createdDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 备注信息 */}
                  <div className={styles.notesSection}>
                    <div className={styles.notesHeader}>
                      <h4 className={styles.notesTitle}>备注信息</h4>
                    </div>
                    <div className={styles.notesContent}>
                      {buildingInfo.notes ? (
                        <div className={styles.notesText}>
                          {buildingInfo.notes}
                        </div>
                      ) : (
                        <div className={styles.noNotes}>暂无备注信息</div>
                      )}
                    </div>
                  </div>

                  {/* 联系信息卡片 */}
                  <div className={styles.contactInfoCard}>
                    <div className={styles.contactHeader}>
                      <h3 className={styles.contactTitle}>
                        <svg className={styles.titleIcon} aria-hidden="true">
                          <use xlinkHref="#icon-lianxiren"></use>
                        </svg>
                        联系信息
                      </h3>
                      <div className={styles.contactTags}>
                        <span className={styles.tag}>专业</span>
                        <span className={styles.tag}>可靠</span>
                        <span className={styles.tag}>快速响应</span>
                      </div>
                    </div>

                    <div className={styles.contactContent}>
                      <div className={styles.contactMain}>
                        <div className={styles.avatarSection}>
                          <div className={styles.avatarCircle}>
                            <svg className={styles.avatarIcon} aria-hidden="true">
                              <use xlinkHref="#icon-ertongleyuan" />
                            </svg>
                          </div>
                          <div className={styles.avatarStatus}>
                            <div className={styles.statusDot}></div>
                            <span className={styles.statusText}>在线</span>
                          </div>
                        </div>

                        <div className={styles.infoSection}>
                          <div className={styles.contactName}>
                            <span className={styles.nameText}>造价工程师</span>
                            <span className={styles.nameBadge}>资深评估师</span>
                          </div>

                          <div className={styles.contactDetails}>
                            <div className={styles.detailItem}>
                              <svg className={styles.detailIcon} aria-hidden="true">
                                <use xlinkHref="#icon-dianhua"></use>
                              </svg>
                              <span className={styles.detailText}>138-xxxx-8888</span>
                            </div>

                            <div className={styles.detailItem}>
                              <svg className={styles.detailIcon} aria-hidden="true">
                                <use xlinkHref="#icon-shijian"></use>
                              </svg>
                              <span className={styles.detailText}>工作时间：8:30-17:30</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.buttonSection}>
                          <button className={styles.primaryButton}>
                            <svg className={styles.buttonIcon} aria-hidden="true">
                              <use xlinkHref="#icon-dianhua"></use>
                            </svg>
                            立即咨询
                          </button>
                          <button className={styles.secondaryButton}>
                            <svg className={styles.buttonIcon} aria-hidden="true">
                              <use xlinkHref="#icon-xiaoxi"></use>
                            </svg>
                            在线留言
                          </button>
                        </div>
                      </div>

                      <div className={styles.contactFooter}>
                        <p className={styles.footerText}>
                          <svg className={styles.footerIcon} aria-hidden="true">
                            <use xlinkHref="#icon-tishi"></use>
                          </svg>
                          专业造价工程师，为您提供工程估价服务
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 第二行：详细信息 */}
          <div className={styles.secondRow}>
            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>参数</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailColumn}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>ID</span>
                    <span className={styles.detailValue}>{buildingsPriceid || '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>结构类型</span>
                    <span className={styles.detailValue}>{buildingInfo?.structure || '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>计量单位</span>
                    <span className={styles.detailValue}>{buildingInfo?.unit || '-'}</span>
                  </div>
                </div>

                <div className={styles.detailColumn}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>单价</span>
                    <span className={styles.detailValue}>
                      {formatUnitPrice(buildingInfo?.price, buildingInfo?.unit)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>区域</span>
                    <span className={styles.detailValue}>
                      {formatArea(buildingInfo?.area)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>总价</span>
                    <span className={styles.detailValue}>
                      {totalPrice ? `${totalPrice} 万元` : '-'}
                    </span>
                  </div>
                </div>

                <div className={styles.detailColumn}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>创建时间</span>
                    <span className={styles.detailValue}>
                      {formatDate(buildingInfo?.createdDate)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>更新时间</span>
                    <span className={styles.detailValue}>
                      {formatDate(buildingInfo?.updatedDate) || '-'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>状态</span>
                    <span className={styles.detailValue}>有效</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.secondRow}>
            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>备注</h4>
              {/* 备注信息 */}
             
                 
                <div className={styles.notesContent}>
                  {buildingInfo.notes ? (
                    <div className={styles.notesText}>
                      {buildingInfo.notes}
                    </div>
                  ) : (
                    <div className={styles.noNotes}>暂无备注信息</div>
                  )}
                </div>
               
            </div>

          </div>

          {/* 第三行：图片管理 */}
          {/* <div className={styles.thirdRow}>
            <div className={styles.imagesSection}>
              <div className={styles.imagesHeader}>
                <h4 className={styles.sectionTitle}>图片管理</h4>
                <span className={styles.imagesCount}>
                  共 {images.length} 张图片
                </span>
              </div>
              
              {images.length > 0 ? (
                <div className={styles.imagesGrid}>
                  {images.map((image, index) => (
                    <div 
                      key={index} 
                      className={`${styles.imageItem} ${index === currentImageIndex ? styles.imageItemActive : ''}`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img
                        src={image}
                        alt={`建筑物图片-${index + 1}`}
                        className={styles.gridImage}
                      />
                      <div className={styles.imageNumber}>
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noImagesMessage}>
                  <svg className={styles.noImagesIcon} aria-hidden="true">
                    <use xlinkHref="#icon-tupian" />
                  </svg>
                  <p>暂无图片，请点击上传按钮添加图片</p>
                </div>
              )}

              <div className={styles.uploadSection}>
                <button 
                  className={styles.uploadButton}
                  onClick={() => {
                    // 这里可以添加上传功能
                    const params = {
                      buildingsPriceid: buildingsPriceid,
                      name: name,
                      structure: buildingInfo?.structure,
                      area: buildingInfo?.area,
                      unit: buildingInfo?.unit,
                      price: buildingInfo?.price
                    };
                    const queryParams = new URLSearchParams(params).toString();
                    window.open(`/app/office/UploadBuildingsPricePicture?${queryParams}`, '_blank');
                  }}
                >
                  <svg className={styles.uploadIcon} aria-hidden="true">
                    <use xlinkHref="#icon-shangchuan" />
                  </svg>
                  管理/上传图片
                </button>
              </div>
            </div>
          </div> */}
        </>
      )}
    </div>
  );
};

export default LookBuildingsPricePicture;