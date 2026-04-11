import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './UpdateWear.module.css';
import DragonLoadingAnimation from '../../../components/Animation/Loading/DragonLoadingAnimation';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loading } from '../../../components/UI';

const UpdateWear = () => {
    const [activeTab, setActiveTab] = useState('basic');
    const [date, setDate] = useState('');
    const [minTemperature, setMinTemperature] = useState('');
    const [maxTemperature, setMaxTemperature] = useState('');
    const [weather, setWeather] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [images, setImages] = useState([]);
    const [compressedImages, setCompressedImages] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    
    // 压缩相关状态
    const [scalePercentage, setScalePercentage] = useState(80);
    const [compressionMode, setCompressionMode] = useState(false);
    const [totalSize, setTotalSize] = useState(0);
    const [showCompressionPanel, setShowCompressionPanel] = useState(false);
    
    // 放大预览状态
    const [previewImage, setPreviewImage] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewImageInfo, setPreviewImageInfo] = useState({});

    //判断登录3.2
    const [showAlert, setShowAlert] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const username = user?.username;
    
    // 添加这个useEffect来检查用户登录状态
    const [countdown, setCountdown] = useState(5);
    useEffect(() => {
        if (username !== "李中敬" && username !== "陈彦羽") {
            setShowAlert(true);
            setCountdown(5);
            const timer = setInterval(() => {
                setCountdown((prevCountdown) => {
                    if (prevCountdown > 1) {
                        return prevCountdown - 1;
                    } else {
                        clearInterval(timer);
                        navigate('/login');
                        return 0;
                    }
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [username, navigate]);

    // 计算总文件大小
    useEffect(() => {
        const imagesToCalculate = compressionMode ? compressedImages : images;
        if (imagesToCalculate.length > 0) {
            const total = imagesToCalculate.reduce((sum, image) => 
                sum + (image.compressedSize || image.file?.size || 0), 0);
            setTotalSize(total);
        } else {
            setTotalSize(0);
        }
    }, [images, compressedImages, compressionMode]);

    // 在组件卸载时释放预览URL
    useEffect(() => {
        return () => {
            [...images, ...compressedImages].forEach(image => {
                if (image.preview) {
                    URL.revokeObjectURL(image.preview);
                }
            });
        };
    }, [images, compressedImages]);

    // 处理图片添加
    const handleImageAdd = () => {
        const newImages = [...images, { file: null, type: '', description: '', preview: null }];
        setImages(newImages);
        setShowCompressionPanel(newImages.length > 0);
    };

    // 处理图片删除
    const handleImageRemove = (index) => {
        if (compressionMode) {
            const newCompressedImages = [...compressedImages];
            newCompressedImages.splice(index, 1);
            setCompressedImages(newCompressedImages);
            if (newCompressedImages.length === 0) {
                setCompressionMode(false);
                setShowCompressionPanel(images.length > 0);
            }
        } else {
            const newImages = [...images];
            newImages.splice(index, 1);
            setImages(newImages);
            setShowCompressionPanel(newImages.length > 0);
        }
    };

    // 图片压缩函数
    const compressImage = (file, scalePercentage) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                const scaleFactor = scalePercentage / 100;
                const targetWidth = Math.floor(img.width * scaleFactor);
                const targetHeight = Math.floor(img.height * scaleFactor);

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                // 白色背景（防止透明变黑）
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                // 使用固定的质量参数
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("无法生成压缩图片"));
                            return;
                        }
                        
                        // 生成新的文件名
                        const originalName = file.name;
                        const extension = originalName.split('.').pop();
                        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
                        const compressedName = `${baseName}_compressed.${extension}`;
                        
                        // 创建新的 File 对象
                        const compressedFile = new File([blob], compressedName, { type: "image/jpeg" });
                        const previewUrl = URL.createObjectURL(blob);
                        
                        resolve({
                            file: compressedFile,
                            width: targetWidth,
                            height: targetHeight,
                            compressedSize: blob.size,
                            originalSize: file.size,
                            name: compressedName,
                            preview: previewUrl,
                            originalFile: file, // 保存原始文件用于重新压缩
                            originalPreview: file.preview // 保存原始预览
                        });
                    },
                    "image/jpeg",
                    0.85 // 固定质量参数
                );
            };

            img.onerror = (error) => {
                reject(error);
            };
        });
    };

    // 压缩所有图片
    const handleCompressImages = async () => {
        if (images.length === 0) {
            setMessage("请先添加图片");
            return;
        }

        // 检查是否有未填写的图片信息
        for (let i = 0; i < images.length; i++) {
            if (!images[i].file || !images[i].type || !images[i].description) {
                setMessage("请为每张图片选择文件并填写类型和描述");
                return;
            }
        }

        setIsCompressing(true);
        setMessage("正在压缩图片...");

        try {
            const compressionResults = [];
            for (const image of images) {
                if (image.file && (image.file.type === "image/jpeg" || image.file.type === "image/jpg")) {
                    const compressedData = await compressImage(image.file, scalePercentage);
                    compressionResults.push({
                        ...compressedData,
                        type: image.type,
                        description: image.description
                    });
                } else {
                    // 如果不是图片文件，直接添加原始文件
                    compressionResults.push({
                        ...image,
                        compressedSize: image.file?.size || 0,
                        name: image.file?.name || '未命名文件'
                    });
                }
            }

            setCompressedImages(compressionResults);
            setCompressionMode(true);
            setMessage("压缩完成！");
        } catch (error) {
            setMessage("压缩失败：" + error.message);
        } finally {
            setIsCompressing(false);
        }
    };

    // 跳过压缩
    const handleSkipCompression = () => {
        const skipImages = images.map(img => ({
            ...img,
            compressedSize: img.file?.size || 0,
            originalFile: img.file, // 保存原始文件
            originalPreview: img.preview // 保存原始预览
        }));
        setCompressedImages(skipImages);
        setCompressionMode(true);
    };

    // 重新选择图片 - 显示原始图片
    const handleResetImages = () => {
        setCompressedImages([]);
        setCompressionMode(false);
        setShowCompressionPanel(true);
        setMessage("已返回原始图片，可以重新调整压缩设置");
    };

    // 处理图片文件选择
    const handleImageFileChange = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 检查文件类型
        if (!file.type.match(/image\/jpeg/) && !file.type.match(/image\/jpg/)) {
            setMessage("只支持 .jpg 或 .jpeg 格式的图片");
            return;
        }

        // 检查文件大小
        if (file.size > 10 * 1024 * 1024) {
            setMessage(`图片 "${file.name}" 大小不能超过 10MB`);
            return;
        }

        // 创建预览URL
        const previewUrl = URL.createObjectURL(file);

        // 获取当前时间并格式化为YYYYMMDDHHmm
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timestamp = `${year}${month}${day}${hours}${minutes}`;

        // 获取文件扩展名
        const extension = file.name.split('.').pop();

        // 生成新文件名: index+1-timestamp.extension
        const newFileName = `${index + 1}-${timestamp}.${extension}`;

        const newImages = [...images];
        newImages[index] = {
            ...newImages[index],
            file: new File([file], newFileName, { type: file.type }),
            preview: previewUrl
        };
        setImages(newImages);
        setShowCompressionPanel(true);
        // 如果处于压缩模式，需要退出压缩模式以显示新的图片
        if (compressionMode) {
            setCompressionMode(false);
            setCompressedImages([]);
        }
    };

    // 处理图片类型变化
    const handleImageTypeChange = (index, e) => {
        if (compressionMode) {
            const newCompressedImages = [...compressedImages];
            newCompressedImages[index].type = e.target.value;
            setCompressedImages(newCompressedImages);
            // 同时更新原始图片的类型
            const newImages = [...images];
            newImages[index].type = e.target.value;
            setImages(newImages);
        } else {
            const newImages = [...images];
            newImages[index].type = e.target.value;
            setImages(newImages);
        }
    };

    // 处理图片描述变化
    const handleImageDescriptionChange = (index, e) => {
        if (compressionMode) {
            const newCompressedImages = [...compressedImages];
            newCompressedImages[index].description = e.target.value;
            setCompressedImages(newCompressedImages);
            // 同时更新原始图片的描述
            const newImages = [...images];
            newImages[index].description = e.target.value;
            setImages(newImages);
        } else {
            const newImages = [...images];
            newImages[index].description = e.target.value;
            setImages(newImages);
        }
    };

    // 打开图片预览
    const handlePreviewImage = (image, isCompressed = false) => {
        setPreviewImage(image.preview || URL.createObjectURL(image.file));
        setPreviewImageInfo({
            name: image.name || image.file?.name,
            size: (image.compressedSize || image.file?.size || 0) / 1024,
            isCompressed
        });
        setIsPreviewOpen(true);
    };

    // 关闭图片预览
    const handleClosePreview = () => {
        setIsPreviewOpen(false);
        setPreviewImage(null);
        setPreviewImageInfo({});
    };

    // 提交表单
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        // 验证基本数据
        if (!date || !minTemperature || !maxTemperature || !weather || !suggestion) {
            setMessage('请填写所有必填字段');
            setIsLoading(false);
            return;
        }

        // 验证图片数据
        const imagesToUpload = compressionMode ? compressedImages : images;
        if (imagesToUpload.length === 0) {
            setMessage('至少上传一张图片');
            setIsLoading(false);
            return;
        }

        for (let i = 0; i < imagesToUpload.length; i++) {
            const image = imagesToUpload[i];
            if (!image.file || !image.type || !image.description) {
                setMessage('请为每张图片选择文件并填写类型和描述');
                setIsLoading(false);
                return;
            }
        }

        // 检查总文件大小（限制为5MB）
        const totalSize = imagesToUpload.reduce((sum, image) => 
            sum + (image.compressedSize || image.file?.size || 0), 0);
        
        if (totalSize > 5 * 1024 * 1024) {
            setMessage('总文件大小不能超过5MB，请压缩图片或减少图片数量');
            setIsLoading(false);
            return;
        }

        try {
            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('date', date);
            formData.append('minTemperature', minTemperature);
            formData.append('maxTemperature', maxTemperature);
            formData.append('weather', weather);
            formData.append('suggestion', suggestion);

            // 添加图片数据
            imagesToUpload.forEach((image, index) => {
                formData.append(`images`, image.file);
                formData.append(`imageTypes`, image.type);
                formData.append(`imageDescriptions`, image.description);
            });

            // 发送请求
            const response = await axios.post('https://www.cqrdpg.com:5202/api/dressing-guidelines/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessage('穿搭数据上传成功！');
            console.log('Upload response:', response.data);

            // 重置表单
            setDate('');
            setMinTemperature('');
            setMaxTemperature('');
            setWeather('');
            setSuggestion('');
            setImages([]);
            setCompressedImages([]);
            setCompressionMode(false);
            setShowCompressionPanel(false);
            setTotalSize(0);
        } catch (error) {
            setMessage('上传失败: ' + (error.response?.data?.message || error.message));
            console.error('Upload error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const displayImages = compressionMode ? compressedImages : images;

    return (
        <div className={styles.container}>
            {/* 登录验证提示 */}
            {showAlert && (
                <div className={styles.alertOverlay}>
                    <div className={styles.alertContent}>
                        <div className={styles.alertText}>
                            {/* 您尚未登录或会话已过期，{countdown} 秒后将跳转到登录页面... */}
                        </div>
                        <DragonLoadingAnimation />
                    </div>
                </div>
            )}

            {/* 压缩加载遮盖层 */}
            {isCompressing && <Loading message="图片压缩中..." />}
            
            {/* 上传加载遮盖层 */}
            {isLoading && <Loading message="数据上传中..." />}

            {/* 图片预览模态框 */}
            {isPreviewOpen && (
                <div className={styles.previewModal} onClick={handleClosePreview}>
                    <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={handleClosePreview}>
                            ×
                        </button>
                        <img 
                            src={previewImage} 
                            alt="预览" 
                            className={styles.previewImage}
                        />
                        <div className={styles.previewInfo}>
                            <p>文件名: {previewImageInfo.name}</p>
                            <p>大小: {previewImageInfo.size.toFixed(2)} KB</p>
                            {previewImageInfo.isCompressed && (
                                <p className={styles.compressedTag}>已压缩</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 标签页 */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'basic' ? styles.active : ''}`}
                    onClick={() => setActiveTab('basic')}
                >
                    基本信息
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'images' ? styles.active : ''}`}
                    onClick={() => setActiveTab('images')}
                >
                    上传图片
                </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} encType="multipart/form-data">
                <div className={styles.formContent}>
                    {/* 基本信息标签页 */}
                    <div className={`${styles.tabContent} ${activeTab === 'basic' ? styles.active : ''}`}>
                        <div className={styles.basicInfoFormGroup}>
                            <label className={styles.basicInfoLabel}>日期:</label>
                            <input
                                type="date"
                                className={styles.basicInfoInput}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.basicInfoFormRow}>
                            <div className={styles.basicInfoFormGroup}>
                                <label className={styles.basicInfoLabel}>最低温度 (°C):</label>
                                <input
                                    type="number"
                                    className={styles.basicInfoInput}
                                    value={minTemperature}
                                    onChange={(e) => setMinTemperature(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.basicInfoFormGroup}>
                                <label className={styles.basicInfoLabel}>最高温度 (°C):</label>
                                <input
                                    type="number"
                                    className={styles.basicInfoInput}
                                    value={maxTemperature}
                                    onChange={(e) => setMaxTemperature(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.basicInfoFormGroup}>
                            <label className={styles.basicInfoLabel}>天气:</label>
                            <select
                                className={styles.basicInfoInput}
                                value={weather}
                                onChange={(e) => setWeather(e.target.value)}
                                required
                            >
                                <option value="">选择天气</option>
                                <option value="晴">晴</option>
                                <option value="多云">多云</option>
                                <option value="阴">阴</option>
                                <option value="小雨">小雨</option>
                                <option value="中雨">中雨</option>
                                <option value="大雨">大雨</option>
                                <option value="雪">雪</option>
                                <option value="雾">雾</option>
                                <option value="沙尘">沙尘</option>
                            </select>
                        </div>

                        <div className={styles.basicInfoFormGroup}>
                            <label className={styles.basicInfoLabel}>穿搭建议:</label>
                            <textarea
                                className={`${styles.basicInfoInput} ${styles.textarea}`}
                                value={suggestion}
                                onChange={(e) => setSuggestion(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* 图片上传标签页 */}
                    <div className={`${styles.tabContent} ${activeTab === 'images' ? styles.active : ''}`}>
                        {/* 压缩控制面板 */}
                        {showCompressionPanel && !compressionMode && (
                            <div className={styles.compressionPanel}>
                                <h3 className={styles.compressionTitle}>图片压缩设置</h3>
                                
                                <div className={styles.compressionSlider}>
                                    <label>
                                        缩放比例: <span className={styles.scaleValue}>{scalePercentage}%</span>
                                        <input
                                            type="range"
                                            min="20"
                                            max="100"
                                            value={scalePercentage}
                                            onChange={(e) => setScalePercentage(parseInt(e.target.value))}
                                            className={styles.sliderInput}
                                        />
                                    </label>
                                    <div className={styles.sliderLabels}>
                                        <span>较小</span>
                                        <span>原图大小</span>
                                    </div>
                                </div>

                                <div className={styles.compressionButtons}>
                                    <button
                                        type="button"
                                        className={styles.compressBtn}
                                        onClick={handleCompressImages}
                                        disabled={isCompressing}
                                    >
                                        {isCompressing ? '压缩中...' : '压缩图片'}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.skipBtn}
                                        onClick={handleSkipCompression}
                                    >
                                        跳过压缩
                                    </button>
                                </div>

                                <div className={styles.compressionInfo}>
                                    <p>提示：压缩可以减小文件大小，建议缩放比例为80%以获得较好的质量和大小平衡</p>
                                    <p>当前选择 {images.filter(img => img.file).length} 张图片，总大小: {(images.reduce((sum, img) => sum + (img.file?.size || 0), 0) / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                        )}

                        {/* 压缩后的信息显示 */}
                        {compressionMode && compressedImages.length > 0 && (
                            <div className={styles.compressionResult}>
                                <div className={styles.sizeSummary}>
                                    <p>
                                        压缩完成！总大小: <span className={styles.totalSize}>{(totalSize / 1024).toFixed(2)} KB</span>
                                        {totalSize > 5 * 1024 * 1024 && (
                                            <span className={styles.sizeWarning}> (超过5MB限制，请重新压缩或减少图片)</span>
                                        )}
                                    </p>
                                    <p className={styles.savings}>
                                        原始总大小: {(images.reduce((sum, img) => sum + (img.file?.size || 0), 0) / 1024).toFixed(2)} KB → 
                                        节省 {((1 - totalSize / images.reduce((sum, img) => sum + (img.file?.size || 0), 0)) * 100).toFixed(1)}%
                                    </p>
                                    <button
                                        type="button"
                                        className={styles.recompressBtn}
                                        onClick={handleResetImages}
                                    >
                                        重新压缩
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className={styles.imagesSection}>
                            <button
                                type="button"
                                className={styles.addImageBtn}
                                onClick={handleImageAdd}
                            >
                                添加图片
                            </button>

                            <div className={styles.imagesGrid}>
                                {displayImages.map((image, index) => (
                                    <div key={index} className={styles.imageCard}>
                                        <div className={styles.imageUploadContainer}>
                                            {image.preview || image.file ? (
                                                <div className={styles.imagePreview}>
                                                    <img 
                                                        src={image.preview || URL.createObjectURL(image.file)} 
                                                        alt="预览" 
                                                    />
                                                    <div className={styles.imageOverlay}>
                                                        <div className={styles.overlayTop}>
                                                            <button
                                                                type="button"
                                                                className={styles.enlargeBtn}
                                                                onClick={() => handlePreviewImage(image, compressionMode)}
                                                                title="放大查看"
                                                            >
                                                                <svg viewBox="0 0 24 24" width="16" height="16">
                                                                    <path fill="#fff" d="M15.5,14L20.5,19L19,20.5L14,15.5V14.71L13.73,14.43C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.43,13.73L14.71,14H15.5M9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14M12,10H10V12H9V10H7V9H9V7H10V9H12V10Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={styles.changeImageBtn}
                                                                onClick={() => document.getElementById(`file-input-${index}`).click()}
                                                            >
                                                                更换图片
                                                            </button>
                                                        </div>
                                                        <div className={styles.imageSize}>
                                                            {image.compressedSize ? 
                                                                `${(image.compressedSize / 1024).toFixed(1)}KB` : 
                                                                image.file ? `${(image.file.size / 1024).toFixed(1)}KB` : '0KB'
                                                            }
                                                        </div>
                                                    </div>
                                                    {compressionMode && image.compressedSize && (
                                                        <div className={styles.compressedBadge}>
                                                            已压缩
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <label
                                                    htmlFor={`file-input-${index}`}
                                                    className={styles.imageUploadArea}
                                                >
                                                    <div className={styles.uploadIcon}>+</div>
                                                    <div className={styles.uploadText}>点击上传图片</div>
                                                </label>
                                            )}
                                            <input
                                                id={`file-input-${index}`}
                                                type="file"
                                                className={styles.inputFile}
                                                accept="image/jpeg, image/jpg"
                                                onChange={(e) => handleImageFileChange(index, e)}
                                                required
                                                style={{ display: 'none' }}
                                            />
                                        </div>

                                        <div className={styles.imageMeta}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>图片标题（{index + 1}）:</label>
                                                <input
                                                    type="text"
                                                    className={styles.inputText}
                                                    value={image.type}
                                                    onChange={(e) => handleImageTypeChange(index, e)}
                                                    placeholder="如: 外套、鞋子等重点描述"
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>图片描述（{index + 1}）:</label>
                                                <input
                                                    type="text"
                                                    className={styles.inputText}
                                                    value={image.description}
                                                    placeholder="如体验感、美好回忆等描述"
                                                    onChange={(e) => handleImageDescriptionChange(index, e)}
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className={styles.removeImageBtn}
                                                onClick={() => handleImageRemove(index)}
                                            >
                                                删除图片
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 提交按钮区域 */}
                <div className={styles.footer}>
                    {(images.length > 0 || compressedImages.length > 0) && (
                        <div className={styles.sizeDisplay}>
                            <p>
                                总文件大小: <span className={styles.currentSize}>{(totalSize / 1024).toFixed(2)} KB</span>
                                {totalSize > 5 * 1024 * 1024 && (
                                    <span className={styles.sizeWarning}> (超过5MB限制)</span>
                                )}
                            </p>
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || totalSize > 5 * 1024 * 1024}
                    >
                        {isLoading ? '上传中...' : '提交'}
                    </button>
                </div>
            </form>

            {message && (
                <p className={`${styles.message} ${message.includes('成功') ? styles.success : styles.error}`}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default UpdateWear;