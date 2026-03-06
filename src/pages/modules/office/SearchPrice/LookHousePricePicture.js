import React, { useState, useEffect, useRef } from 'react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './LookHousePricePicture.module.css';
import { useSearchParams } from 'react-router-dom';
import WordReportGeneratorLoader from '../../accounting/Notification/WordReportGeneratorLoader';

const LookHousePricePicture = () => {
  useEffect(() => {
    document.title = '现状照片';
  }, []);

  const [searchParams] = useSearchParams();
  const reportsID = searchParams.get('reportsID') || "";
  const location = searchParams.get('location') || "";

  const [images, setImages] = useState([]);
  const [reportInfo, setReportInfo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const thumbnailContainerRef = useRef(null);

  // 计算总价
  const calculateTotalPrice = () => {
    // 校验必要参数是否存在，不存在则返回 null
    if (!reportInfo || !reportInfo.valuationPrice || !reportInfo.buildingArea) return null;

    // 1. 转成浮点数 → 2. 相乘 → 3. 除以 10000 → 4. 保留两位小数
    const total = (parseFloat(reportInfo.valuationPrice) * parseFloat(reportInfo.buildingArea)) / 10000;
    return total.toFixed(2);
  };
  // 获取电梯状态文字
  const getElevatorText = (elevator) => {
    return elevator ? '有电梯' : '无电梯';
  };

  // 获取通气状态文字
  const getVentilationText = (ventilation) => {
    return ventilation ? '通气' : '不通气';
  };

  // 获取是否包含家具家电文字
  const getFurnitureText = (hasFurniture) => {
    return hasFurniture ? '包含' : '不包含';
  };

  // 获取抵押状态文字
  const getMortgageText = (mortgage) => {
    return mortgage ? '已抵押' : '未抵押';
  };

  // 获取查封状态文字
  const getSeizureText = (seizure) => {
    return seizure ? '已查封' : '未查封';
  };

  // 获取是否考虑租约文字
  const getLeaseText = (lease) => {
    return lease ? '考虑租约' : '不考虑租约';
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  // 获取装饰装修的简短描述（取前50个字符）
  const getShortDecoration = (decoration) => {
    if (!decoration) return '';
    return decoration.length > 50 ? decoration.substring(0, 50) + '...' : decoration;
  };

  // 获取配套设施的简短列表
  const getFacilitiesList = () => {
    if (!reportInfo) return [];
    const facilities = [];

    if (reportInfo.bank) facilities.push({ label: '银行', value: reportInfo.bank });
    if (reportInfo.supermarket) facilities.push({ label: '超市', value: reportInfo.supermarket });
    if (reportInfo.hospital) facilities.push({ label: '医院', value: reportInfo.hospital });
    if (reportInfo.school) facilities.push({ label: '学校', value: reportInfo.school });
    if (reportInfo.busStopName) facilities.push({ label: '公交站', value: reportInfo.busStopName });
    if (reportInfo.busRoutes) facilities.push({ label: '公交线路', value: reportInfo.busRoutes });
    if (reportInfo.areaRoad) facilities.push({ label: '区域道路', value: reportInfo.areaRoad });
    if (reportInfo.nearbyCommunity) facilities.push({ label: '附近小区', value: reportInfo.nearbyCommunity });

    return facilities;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!reportsID) {
        setError('报告ID不能为空');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // 并行获取图片和报告信息
        const [imagesResponse, reportResponse] = await Promise.all([
          fetch(`/api/GetHousePricePictures?reportsID=${encodeURIComponent(reportsID)}`),
          fetch(`/api/GetHousePricePicturesWordReportInfo?reportsID=${encodeURIComponent(reportsID)}`)
        ]);

        if (!imagesResponse.ok || !reportResponse.ok) {
          throw new Error('获取数据失败');
        }

        const imagesData = await imagesResponse.json();
        const reportData = await reportResponse.json();

        if (imagesData.success && imagesData.images) {
          const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
          const imageUrls = imagesData.images.map(image =>
            `${baseUrl}/backend/images/HousePricePictures/${reportsID}/${image.pictureFileName}`
          );
          setImages(imageUrls);
        } else {
          setImages([]);
        }

        if (reportData.success) {
          setReportInfo(reportData.reportInfo);
        } else {
          setError('获取报告信息失败');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('加载数据失败，请稍后重试');
        setImages([]);
        setReportInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
      <div className={styles.container}>
        <WordReportGeneratorLoader />
      </div>
    );
  }

  const totalPrice = calculateTotalPrice();
  const facilitiesList = getFacilitiesList();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{location}</h3>
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
                      alt={`房价图片-${currentImageIndex + 1}`}
                      className={styles.mainImage}
                    />
                    <div className={styles.imageCounter}>
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                ) : (
                  <div className={styles.noImagePlaceholder}>
                    暂无图片数据
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
              {reportInfo && (
                <>
                  {/* 价格信息 */}
                  <div className={styles.priceInfo}>
                    <div className={styles.priceRow}>
                      <div className={styles.priceItem}>

                        <div className={styles.priceValue}>
                          {totalPrice ? `${totalPrice}万` : '-'}
                        </div>
                      </div>
                      <div className={styles.priceItem}>

                        <div className={styles.priceValue}>
                          {reportInfo.valuationPrice ? `${reportInfo.valuationPrice}元/㎡` : '-'}
                        </div>
                      </div>
                    </div>

                    <div className={styles.areaRow}>
                      <div className={styles.areaItem}>

                        <span className={styles.areaValue}>{reportInfo.buildingArea || '-'}㎡</span>
                      </div>
                      <div className={styles.areaItem}>

                        <span className={styles.areaValue}>{reportInfo.interiorArea || '-'}㎡</span>
                      </div>
                    </div>
                  </div>

                  {/* 物业信息 */}
                  <div className={styles.propertyInfo}>
                    <div className={styles.propertyRow}>
                      <div className={styles.propertyItem}>
                        <span className={styles.propertyLabel}>小区</span>
                        <span className={styles.propertyValue}>{reportInfo.communityName || '-'}</span>
                      </div>
                      <div className={styles.propertyItem}>
                        <span className={styles.propertyLabel}>年代</span>
                        <span className={styles.propertyValue}>{reportInfo.yearBuilt || '-'}</span>
                      </div>
                    </div>

                    <div className={styles.propertyRow}>
                      <div className={styles.propertyItem}>
                        <span className={styles.propertyLabel}>总楼层</span>
                        <span className={styles.propertyValue}>{reportInfo.totalFloors || '-'}</span>
                      </div>
                      <div className={styles.propertyItem}>
                        <span className={styles.propertyLabel}>所在楼层</span>
                        <span className={styles.propertyValue}>{reportInfo.floorNumber || '-'}</span>
                      </div>
                    </div>

                    <div className={styles.propertyRow}>
                      <div className={styles.propertyItem}>
                        <span className={styles.propertyLabel}>房屋用途</span>
                        <span className={styles.propertyValue}>{reportInfo.housePurpose || '-'}</span>
                      </div>
                      <div className={styles.propertyItem}>
                        <span className={styles.propertyLabel}>土地用途</span>
                        <span className={styles.propertyValue}>{reportInfo.landPurpose || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 其他关键信息 */}
                  <div className={styles.otherInfo}>
                    {/* <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>坐落：</span>
                      <span className={styles.infoValue}>{reportInfo.location || '-'}</span>
                    </div> */}
                    {/* <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>结构：</span>
                      <span className={styles.infoValue}>{reportInfo.houseStructure || '-'}</span>
                    </div> */}
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>装修：</span>
                      <span className={styles.infoValue}>{getShortDecoration(reportInfo.decorationStatus) || '-'}</span>
                    </div>
                  </div>


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
                              <use xlinkHref="#icon-ertongleyuan"></use>
                            </svg>
                          </div>
                          <div className={styles.avatarStatus}>
                            <div className={styles.statusDot}></div>
                            <span className={styles.statusText}>在线</span>
                          </div>
                        </div>

                        <div className={styles.infoSection}>
                          <div className={styles.contactName}>
                            <span className={styles.nameText}>陈Baby</span>
                            <span className={styles.nameBadge}>资深估价师</span>
                          </div>

                          <div className={styles.contactDetails}>
                            <div className={styles.detailItem}>
                              <svg className={styles.detailIcon} aria-hidden="true">
                                <use xlinkHref="#icon-dianhua"></use>
                              </svg>
                              <span className={styles.detailText}>138-xxxx-8000</span>
                            </div>

                            <div className={styles.detailItem}>
                              <svg className={styles.detailIcon} aria-hidden="true">
                                <use xlinkHref="#icon-shijian"></use>
                              </svg>
                              <span className={styles.detailText}>工作时间：9:00-17:00</span>
                            </div>
                          </div>
                        </div>

                        {/* 按钮区域放在详情后面 */}
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
                          专业评估师，为您提供1对1咨询服务
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
              <h4 className={styles.sectionTitle}>详细信息</h4>
              <div className={styles.detailGrid}>

                <div className={styles.detailColumn}>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>电梯：</span>
                    <span className={styles.detailValue}>{getElevatorText(reportInfo?.elevator)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>通气：</span>
                    <span className={styles.detailValue}>{getVentilationText(reportInfo?.ventilationStatus)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>朝向：</span>
                    <span className={styles.detailValue}>{reportInfo?.orientation || '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>外墙面：</span>
                    <span className={styles.detailValue}>{reportInfo?.exteriorWallMaterial || '-'}</span>
                  </div>
                </div>

                <div className={styles.detailColumn}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>家具家电：</span>
                    <span className={styles.detailValue}>
                      {getFurnitureText(reportInfo?.hasFurnitureElectronics)}
                      {reportInfo?.hasFurnitureElectronics && reportInfo?.furnitureElectronicsEstimatedPrice &&
                        ` (${reportInfo.furnitureElectronicsEstimatedPrice}元)`
                      }
                    </span>
                  </div>
                  {/* <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>抵押状况：</span>
                    <span className={styles.detailValue}>
                      {getMortgageText(reportInfo?.mortgageStatus)}
                      {reportInfo?.mortgageStatus && reportInfo?.mortgageBasis && 
                        ` - ${reportInfo.mortgageBasis}`
                      }
                    </span>
                  </div>
                   */}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>临街：</span>
                    <span className={styles.detailValue}>
                      {reportInfo.streetStatus || '-'}
                    </span>
                  </div>


                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>方位：</span>
                    <span className={styles.detailValue}>
                      {reportInfo.direction || '-'}
                    </span>
                  </div>

                  {/* <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>查封状况：</span>
                    <span className={styles.detailValue}>
                      {getSeizureText(reportInfo?.seizureStatus)}
                      {reportInfo?.seizureStatus && reportInfo?.seizureBasis &&
                        ` - ${reportInfo.seizureBasis}`
                      }
                    </span>
                  </div> */}


                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>空间布局：</span>
                    <span className={styles.detailValue}>{reportInfo?.spaceLayout || '-'}</span>
                  </div>
                </div>

                <div className={styles.detailColumn}>
                  {/* <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>租约：</span>
                    <span className={styles.detailValue}>
                      {getLeaseText(reportInfo?.isLeaseConsidered)}
                      {reportInfo?.isLeaseConsidered && reportInfo?.rent && 
                        ` (${reportInfo.rent}元/月)`
                      }
                    </span>
                  </div> */}

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>结构：</span>
                    <span className={styles.detailValue}>
                      {reportInfo.houseStructure || '-'}

                    </span>
                  </div>


                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>权利性质：</span>
                    <span className={styles.detailValue}>{reportInfo?.rightsNature || '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>共有情况：</span>
                    <span className={styles.detailValue}>{reportInfo?.coOwnershipStatus || '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>四至：</span>
                    <span className={styles.detailValue}>{reportInfo?.boundaries || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 第三行：配套信息 */}
          <div className={styles.thirdRow}>
            <div className={styles.facilitiesSection}>
              <h4 className={styles.sectionTitle}>配套信息</h4>
              <div className={styles.facilitiesGrid}>
                {facilitiesList.length > 0 ? (
                  facilitiesList.map((facility, index) => (
                    <div key={index} className={styles.facilityItem}>
                      <span className={styles.facilityLabel}>{facility.label}：</span>
                      <span className={styles.facilityValue}>{facility.value}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.noFacilities}>暂无配套信息</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LookHousePricePicture;