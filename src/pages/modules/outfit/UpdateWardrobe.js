
    //   <p><strong>用户名:</strong> {user.username}</p>
    //   <p><strong>邮箱:</strong> {user.email}</p>
    //   <p><strong>用户ID:</strong> {user.id}</p>

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import './UpdateWardrobe.css';

const UpdateWardrobeSteward = () => {
    const { user, isAuthenticated } = useAuth();
    
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        season: '夏季',
        category: '衣服',
        sub_category: '基础款',
        item_name: ''
    });
    const [itemImage, setItemImage] = useState(null);
    const [effectImage, setEffectImage] = useState(null);
    const [itemImagePreview, setItemImagePreview] = useState(null);
    const [effectImagePreview, setEffectImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const itemImageInputRef = useRef(null);
    const effectImageInputRef = useRef(null);

    const seasons = ['夏季', '冬季', '四季'];
    const categories = ['衣服', '裤子', '连衣裙', '鞋子', '配饰'];
    const subCategories = {
        '衣服': ['基础款', '外套类', '毛衣', '衬衫', 'T恤', '其他'],
        '裤子': ['基础款', '长裤', '短裤', '牛仔裤', '休闲裤' , '其他'],
        '连衣裙': ['基础款', '短裙', '长裙', '礼服', '日常裙', '其他'],
        '鞋子': ['基础款', '运动鞋', '皮鞋', '凉鞋', '靴子', '其他'],
        '配饰': ['基础款', '帽子', '围巾', '手套', '腰带', '其他']
    };

    // 监听用户认证状态变化
    React.useEffect(() => {
        if (isAuthenticated && user) {
            setFormData(prev => ({
                ...prev,
                username: user.username,
                email: user.email
            }));
        }
    }, [isAuthenticated, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemImageChange = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
            setItemImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setItemImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setErrorMessage('请选择PNG或JPG格式的图片');
        }
    };

    const handleEffectImageChange = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
            setEffectImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEffectImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setErrorMessage('请选择PNG或JPG格式的图片');
        }
    };

    const openImageModal = (image) => {
        setModalImage(image);
        setShowImageModal(true);
    };

    const removeImage = (type) => {
        if (type === 'item') {
            setItemImage(null);
            setItemImagePreview(null);
            if (itemImageInputRef.current) {
                itemImageInputRef.current.value = '';
            }
        } else {
            setEffectImage(null);
            setEffectImagePreview(null);
            if (effectImageInputRef.current) {
                effectImageInputRef.current.value = '';
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 检查用户是否已认证
        if (!isAuthenticated || !user) {
            setErrorMessage('请先登录后再添加服装');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        if (!itemImage || !effectImage) {
            setErrorMessage('请上传服装图片和上身效果图片');
            setIsSubmitting(false);
            return;
        }

        try {
            // 确保用户信息是最新的
            const submitData = {
                ...formData,
                username: user.username,
                email: user.email
            };

            // First create the item to get the item_code
            const response = await axios.post('https://www.cqrdpg.com:5202/api/Reactwardrobe/add', submitData);
            const itemCode = response.data.item_code;

            // Then upload images
            const formDataImages = new FormData();
            formDataImages.append('item_code', itemCode);
            formDataImages.append('category', formData.category);
            formDataImages.append('username', user.username); // 添加用户名到图片上传
            formDataImages.append('item_image', itemImage);
            formDataImages.append('effect_image', effectImage);

            await axios.post('https://www.cqrdpg.com:5202/api/Reactwardrobe/upload-images', formDataImages, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccessMessage(`服装添加成功！物品编码: ${itemCode}`);
            
            // Reset form (保持用户信息不变)
            setFormData(prev => ({
                ...prev,
                season: '夏季',
                category: '衣服',
                sub_category: '基础款',
                item_name: ''
            }));
            setItemImage(null);
            setEffectImage(null);
            setItemImagePreview(null);
            setEffectImagePreview(null);
            if (itemImageInputRef.current) itemImageInputRef.current.value = '';
            if (effectImageInputRef.current) effectImageInputRef.current.value = '';
        } catch (error) {
            console.error('错误详情:', error);
            const errorMsg = error.response?.data?.error || 
                            error.message || 
                            '添加服装失败，请重试';
            setErrorMessage(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 如果用户未认证，显示提示信息
    if (!isAuthenticated) {
        return (
            <div className="updatewardrobe-container">
                <h2 className="updatewardrobe-title">添加新服装</h2>
                <div className="updatewardrobe-alert updatewardrobe-alert-error">
                    请先登录后再添加服装
                </div>
            </div>
        );
    }

    return (
        <div className="updatewardrobe-container">
            <h2 className="updatewardrobe-title">添加新服装</h2>

            {/* 用户信息显示 */}
            {/* <div className="updatewardrobe-user-info">
                <p><strong>用户名:</strong> {user.username}</p>
                <p><strong>邮箱:</strong> {user.email}</p>
            </div> */}

            {successMessage && (
                <div className="updatewardrobe-alert updatewardrobe-alert-success">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="updatewardrobe-alert updatewardrobe-alert-error">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="updatewardrobe-form">
                {/* 季节选择 */}
                <div className="updatewardrobe-form-group">
                    <label className="updatewardrobe-label">季节:</label>
                    <select
                        name="season"
                        value={formData.season}
                        onChange={handleChange}
                        className="updatewardrobe-select"
                        required
                    >
                        {seasons.map(season => (
                            <option key={season} value={season}>{season}</option>
                        ))}
                    </select>
                </div>

                {/* 类别选择 */}
                <div className="updatewardrobe-form-group">
                    <label className="updatewardrobe-label">类别:</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={(e) => {
                            handleChange(e);
                            // 当类别变化时重置子类别
                            setFormData(prev => ({
                                ...prev,
                                sub_category: subCategories[e.target.value][0]
                            }));
                        }}
                        className="updatewardrobe-select"
                        required
                    >
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>

                {/* 子类别选择 */}
                <div className="updatewardrobe-form-group">
                    <label className="updatewardrobe-label">子类别:</label>
                    <select
                        name="sub_category"
                        value={formData.sub_category}
                        onChange={handleChange}
                        className="updatewardrobe-select"
                        required
                    >
                        {subCategories[formData.category]?.map(subCat => (
                            <option key={subCat} value={subCat}>{subCat}</option>
                        ))}
                    </select>
                </div>

                {/* 服装名称输入 */}
                <div className="updatewardrobe-form-group">
                    <label className="updatewardrobe-label">服装名称:</label>
                    <input
                        type="text"
                        name="item_name"
                        value={formData.item_name}
                        onChange={handleChange}
                        className="updatewardrobe-input"
                        placeholder="请输入服装名称"
                        required
                    />
                </div>

                {/* 服装图片上传 */}
                <div className="updatewardrobe-form-group">
                    <label className="updatewardrobe-label">服装图片 (PNG/JPG):</label>
                    <div className="updatewardrobe-image-upload">
                        <input
                            type="file"
                            ref={itemImageInputRef}
                            onChange={handleItemImageChange}
                            accept="image/png, image/jpeg, image/jpg"
                            style={{ display: 'none' }}
                            required
                        />
                        {itemImagePreview ? (
                            <div className="updatewardrobe-image-preview">
                                <img 
                                    src={itemImagePreview} 
                                    alt="服装预览" 
                                    onClick={() => openImageModal(itemImagePreview)}
                                />
                                <button 
                                    type="button" 
                                    className="updatewardrobe-remove-image"
                                    onClick={() => removeImage('item')}
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div 
                                className="updatewardrobe-image-upload-placeholder"
                                onClick={() => itemImageInputRef.current.click()}
                            >
                                <span>+</span>
                                <p>点击上传服装图片</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 上身效果图片上传 */}
                <div className="updatewardrobe-form-group">
                    <label className="updatewardrobe-label">上身效果图片 (PNG/JPG):</label>
                    <div className="updatewardrobe-image-upload">
                        <input
                            type="file"
                            ref={effectImageInputRef}
                            onChange={handleEffectImageChange}
                            accept="image/png, image/jpeg, image/jpg"
                            style={{ display: 'none' }}
                            required
                        />
                        {effectImagePreview ? (
                            <div className="updatewardrobe-image-preview">
                                <img 
                                    src={effectImagePreview} 
                                    alt="上身效果预览" 
                                    onClick={() => openImageModal(effectImagePreview)}
                                />
                                <button 
                                    type="button" 
                                    className="updatewardrobe-remove-image"
                                    onClick={() => removeImage('effect')}
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div 
                                className="updatewardrobe-image-upload-placeholder"
                                onClick={() => effectImageInputRef.current.click()}
                            >
                                <span>+</span>
                                <p>点击上传上身效果图片</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 提交按钮 */}
                <button
                    type="submit"
                    className="updatewardrobe-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '提交中...' : '添加服装'}
                </button>
            </form>

            {/* 图片预览模态框 */}
            {showImageModal && (
                <div className="updatewardrobe-modal" onClick={() => setShowImageModal(false)}>
                    <div className="updatewardrobe-modal-content">
                        <img src={modalImage} alt="预览" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdateWardrobeSteward;