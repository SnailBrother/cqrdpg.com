import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './UpdateWear.css';
import DragonLoadingAnimation from '../../../components/Animation/Loading/DragonLoadingAnimation'; // 引入新组件
import { useAuth } from '../../../context/AuthContext';//引用用户名
import { useNavigate } from 'react-router-dom';

const UpdateWear = () => {
    const [activeTab, setActiveTab] = useState('basic');
    const [date, setDate] = useState('');
    const [minTemperature, setMinTemperature] = useState('');
    const [maxTemperature, setMaxTemperature] = useState('');
    const [weather, setWeather] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [images, setImages] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    //判断登录3.2
    //用于校验是否有登录
    const [showAlert, setShowAlert] = useState(false);
    const navigate = useNavigate();
     const { user,} = useAuth();
           const username = user?.username; // 从 user 对象中获取 username
    // 添加这个useEffect来检查用户登录状态
    const [countdown, setCountdown] = useState(5);//五秒倒计时
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


    // 处理图片添加
    const handleImageAdd = () => {
        setImages([...images, { file: null, type: '', description: '' }]);
    };

    // 处理图片删除
    const handleImageRemove = (index) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    // 处理图片文件选择 - 支持预览
    const handleImageFileChange = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

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
    };

    // 在组件卸载时释放预览URL
    React.useEffect(() => {
        return () => {
            images.forEach(image => {
                if (image.preview) {
                    URL.revokeObjectURL(image.preview);
                }
            });
        };
    }, [images]);

    // 处理图片类型变化
    const handleImageTypeChange = (index, e) => {
        const newImages = [...images];
        newImages[index].type = e.target.value;
        setImages(newImages);
    };

    // 处理图片描述变化
    const handleImageDescriptionChange = (index, e) => {
        const newImages = [...images];
        newImages[index].description = e.target.value;
        setImages(newImages);
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
        if (images.length === 0) {
            setMessage('至少上传一张图片');
            setIsLoading(false);
            return;
        }

        for (let i = 0; i < images.length; i++) {
            if (!images[i].file || !images[i].type || !images[i].description) {
                setMessage('请为每张图片选择文件并填写类型和描述');
                setIsLoading(false);
                return;
            }
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
            images.forEach((image, index) => {
                formData.append(`images`, image.file);
                formData.append(`imageTypes`, image.type);
                formData.append(`imageDescriptions`, image.description);
            });

            // 发送请求
            const response = await axios.post('http://121.4.22.55:5202/api/dressing-guidelines/upload', formData, {
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
        } catch (error) {
            setMessage('上传失败: ' + (error.response?.data?.message || error.message));
            console.error('Upload error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="update-wear-container">
             {/* //判断登录3.3 */}
             {showAlert && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        position: 'relative',
                        textAlign: 'center'
                    }}>
                        {/* 提示文字部分，使用绝对定位使其在父元素内悬浮在上方 */}
                        <div style={{
                            position: 'absolute',
                            top: '70%',
                            width: '100%',
                            textAlign: 'center',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold',

                        }}>
                            {/* 您尚未登录或会话已过期，{countdown} 秒后将跳转到登录页面... */}
                        </div>
                        <DragonLoadingAnimation />
                    </div>
                </div>
            )}

            {/* <h1 className="update-wear-title">上传穿搭数据</h1> */}

            <div className="update-wear-tabs">
                <button
                    className={`update-wear-tab ${activeTab === 'basic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('basic')}
                >
                    基本信息
                </button>
                <button
                    className={`update-wear-tab ${activeTab === 'images' ? 'active' : ''}`}
                    onClick={() => setActiveTab('images')}
                >
                    上传图片
                </button>
            </div>

            <form className="update-wear-form" onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="update-wear-form-content">

                    <div className={`update-wear-tab-content ${activeTab === 'basic' ? 'active' : ''}`}>
                        <div className="update-wear-basic-info-form-group">
                            <label className="update-wear-basic-info-label">日期:</label>
                            <input
                                type="date"
                                className="update-wear-basic-info-input"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="update-wear-basic-info-form-row">
                            <div className="update-wear-basic-info-form-group">
                                <label className="update-wear-basic-info-label">最低温度 (°C):</label>
                                <input
                                    type="number"
                                    className="update-wear-basic-info-input"
                                    value={minTemperature}
                                    onChange={(e) => setMinTemperature(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="update-wear-basic-info-form-group">
                                <label className="update-wear-basic-info-label">最高温度 (°C):</label>
                                <input
                                    type="number"
                                    className="update-wear-basic-info-input"
                                    value={maxTemperature}
                                    onChange={(e) => setMaxTemperature(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="update-wear-basic-info-form-group">
                            <label className="update-wear-basic-info-label">天气:</label>
                            <select
                                className="update-wear-basic-info-input"
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

                        <div className="update-wear-basic-info-form-group">
                            <label className="update-wear-basic-info-label">穿搭建议:</label>
                            <textarea
                                className="update-wear-basic-info-input update-wear-basic-info-textarea"
                                value={suggestion}
                                onChange={(e) => setSuggestion(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={`update-wear-tab-content ${activeTab === 'images' ? 'active' : ''}`}>
                        <div className="update-wear-images-section">
                            <button
                                type="button"
                                className="update-wear-add-image-btn"
                                onClick={handleImageAdd}
                            >
                                添加图片
                            </button>

                            <div className="update-wear-images-grid">
                                {images.map((image, index) => (
                                    <div key={index} className="update-wear-image-card">
                                        <div className="update-wear-image-upload-container">
                                            {image.preview ? (
                                                <div className="update-wear-image-preview">
                                                    <img src={image.preview} alt="预览" />
                                                    <button
                                                        type="button"
                                                        className="update-wear-change-image-btn"
                                                        onClick={() => document.getElementById(`file-input-${index}`).click()}
                                                    >
                                                        更换图片
                                                    </button>
                                                </div>
                                            ) : (
                                                <label
                                                    htmlFor={`file-input-${index}`}
                                                    className="update-wear-image-upload-area"
                                                >
                                                    <div className="update-wear-upload-icon">+</div>
                                                    <div className="update-wear-upload-text">点击上传图片</div>
                                                </label>
                                            )}
                                            <input
                                                id={`file-input-${index}`}
                                                type="file"
                                                className="update-wear-input-file"
                                                accept="image/*"
                                                onChange={(e) => handleImageFileChange(index, e)}
                                                required
                                                style={{ display: 'none' }}
                                            />
                                        </div>

                                        <div className="update-wear-image-meta">
                                            <div className="update-wear-form-group">
                                                <label className="update-wear-label">图片标题（{index + 1}）:</label>
                                                <input
                                                    type="text"
                                                    className="update-wear-input-text"
                                                    value={image.type}
                                                    onChange={(e) => handleImageTypeChange(index, e)}
                                                    placeholder="如: 外套、鞋子等重点描述"
                                                    required
                                                />
                                            </div>
                                            <div className="update-wear-form-group">
                                                <label className="update-wear-label">图片描述（{index + 1}）:</label>
                                                <input
                                                    type="text"
                                                    className="update-wear-input-text"
                                                    value={image.description}
                                                    placeholder="如体验感、美好回忆等描述"
                                                    onChange={(e) => handleImageDescriptionChange(index, e)}
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="update-wear-remove-image-btn"
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

                <div className="update-wear-footer">
                    <button
                        type="submit"
                        className="update-wear-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? '上传中...' : '提交'}
                    </button>
                </div>
            </form>

            {message && (
                <p className={`update-wear-message ${message.includes('成功') ? 'success' : 'error'}`}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default UpdateWear;