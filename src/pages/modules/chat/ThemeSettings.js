import React, { useState, useContext, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import './ThemeSettings.css';

const ThemeSettings = () => {
    const { user } = useAuth();
       const username = user?.username; // 从 user 对象中获取 username

    // 默认值
    const defaultThemeSettings = {
        theirFontColor: '#000000',
        theirBubbleColor: '#ffffff',
        myFontColor: '#000000',
        myBubbleColor: '#ffffff',
        backgroundColor: '#f0f0f0',
        useBackgroundImage: false,
        navbarFontColor: '#FFFFFF', // 新增导航栏字体颜色
        navbarBackgroundColor: '#32502c', // 新增导航栏背景颜色
    };

    // 状态管理
    const [theirFontColor, setTheirFontColor] = useState(defaultThemeSettings.theirFontColor);
    const [theirBubbleColor, setTheirBubbleColor] = useState(defaultThemeSettings.theirBubbleColor);
    const [myFontColor, setMyFontColor] = useState(defaultThemeSettings.myFontColor);
    const [myBubbleColor, setMyBubbleColor] = useState(defaultThemeSettings.myBubbleColor);
    const [backgroundColor, setBackgroundColor] = useState(defaultThemeSettings.backgroundColor);
    const [useBackgroundImage, setUseBackgroundImage] = useState(defaultThemeSettings.useBackgroundImage);
    const [navbarFontColor, setNavbarFontColor] = useState(defaultThemeSettings.navbarFontColor); // 新增状态
    const [navbarBackgroundColor, setNavbarBackgroundColor] = useState(defaultThemeSettings.navbarBackgroundColor); // 新增状态
    const [backgroundImage, setBackgroundImage] = useState(null); // 背景图片文件
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); // 错误消息

    // 从数据库加载主题设置
    useEffect(() => {
        const loadThemeSettings = async () => {
            try {
                const response = await axios.get('https://www.cqrdpg.com:5202/api/getthemesettings', {
                    params: { username },
                });

                if (response.data.success) {
                    const settings = response.data.settings;
                    setTheirFontColor(settings.their_font_color || defaultThemeSettings.theirFontColor);
                    setTheirBubbleColor(settings.their_bubble_color || defaultThemeSettings.theirBubbleColor);
                    setMyFontColor(settings.my_font_color || defaultThemeSettings.myFontColor);
                    setMyBubbleColor(settings.my_bubble_color || defaultThemeSettings.myBubbleColor);
                    setBackgroundColor(settings.background_color || defaultThemeSettings.backgroundColor);
                    setUseBackgroundImage(settings.use_background_image || defaultThemeSettings.useBackgroundImage);
                    setNavbarFontColor(settings.navbar_font_color || defaultThemeSettings.navbarFontColor); // 加载导航栏字体颜色
                    setNavbarBackgroundColor(settings.navbar_background_color || defaultThemeSettings.navbarBackgroundColor); // 加载导航栏背景颜色
                } else {
                    console.log('未找到主题设置，使用默认值。');
                }
            } catch (error) {
                console.error('加载主题设置时出错:', error);
            }
        };

        loadThemeSettings();
    }, [username]);

    // 保存主题设置到数据库
    const saveThemeSettings = async () => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('theirFontColor', theirFontColor);
            formData.append('theirBubbleColor', theirBubbleColor);
            formData.append('myFontColor', myFontColor);
            formData.append('myBubbleColor', myBubbleColor);
            formData.append('backgroundColor', backgroundColor);
            formData.append('useBackgroundImage', useBackgroundImage ? '1' : '0');
            formData.append('navbarFontColor', navbarFontColor);
            formData.append('navbarBackgroundColor', navbarBackgroundColor);

            // 保存主题设置
            const themeResponse = await axios.post('https://www.cqrdpg.com:5202/api/savethemesettings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (themeResponse.data.success) {
                // 如果选择了背景图片，上传图片
                if (backgroundImage) {
                    const imageFormData = new FormData();
                    imageFormData.append('username', username);
                    imageFormData.append('image', backgroundImage);

                    const imageResponse = await axios.post(`https://www.cqrdpg.com:5202/backend/api/uploadchatbackground?username=${username}`, imageFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    if (imageResponse.data.imageUrl) {
                        console.log('背景图片上传成功:', imageResponse.data.imageUrl);
                    } else {
                        console.error('背景图片上传失败:', imageResponse.data.error);
                    }
                }

                alert('主题设置保存成功！');
                window.location.reload();
            } else {
                alert('保存失败，请重试。');
            }
        } catch (error) {
            console.error('保存主题设置时出错:', error);
            alert('保存失败，请检查网络连接。');
        }
    };

    // 处理图片选择
    const handleSelectFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // 检查文件大小
                if (file.size > 200 * 1024) { // 200KB
                    setErrorMessage('图片大小不能超过 200KB');
                    setBackgroundImage(null); // 清空已选择的图片
                } else {
                    setErrorMessage(''); // 清空错误消息
                    setBackgroundImage(file);
                    setShowImagePicker(false); // 关闭图片选择器
                }
            }
        };
        input.click();
    };

    return (
        <div className="themesettings-container">
            <h1 className="themesettings-title">主题设置</h1>
            <div className="themesettings-content">

                {/* 导航栏设置 */}
                <div className="themesettings-section">
                    <h2 className="themesettings-section-title">导航栏</h2>
                    <div className="themesettings-item-container">

                        <div className="themesettings-item">
                            <label>字体：</label>
                            <input
                                type="color"
                                value={navbarFontColor}
                                onChange={(e) => setNavbarFontColor(e.target.value)}
                            />
                            <input
                                type="text"
                                value={navbarFontColor}
                                onChange={(e) => setNavbarFontColor(e.target.value)}
                                className="themesettings-color-input"
                            />
                        </div>
                        <div className="themesettings-item">
                            <label>背景：</label>
                            <input
                                type="color"
                                value={navbarBackgroundColor}
                                onChange={(e) => setNavbarBackgroundColor(e.target.value)}
                            />
                            <input
                                type="text"
                                value={navbarBackgroundColor}
                                onChange={(e) => setNavbarBackgroundColor(e.target.value)}
                                className="themesettings-color-input"
                            />
                        </div>
                    </div>
                </div>

                {/* 对方设置 */}
                <div className="themesettings-section">
                    <h2 className="themesettings-section-title">好友对话框</h2>
                    <div className="themesettings-item-container">
                        <div className="themesettings-item">
                            <label>字体：</label>
                            <input
                                type="color"
                                value={theirFontColor}
                                onChange={(e) => setTheirFontColor(e.target.value)}
                            />
                            <input
                                type="text"
                                value={theirFontColor}
                                onChange={(e) => setTheirFontColor(e.target.value)}
                                className="themesettings-color-input"
                            />
                        </div>
                        <div className="themesettings-item">
                            <label>对话框：</label>
                            <input
                                type="color"
                                value={theirBubbleColor}
                                onChange={(e) => setTheirBubbleColor(e.target.value)}
                            />
                            <input
                                type="text"
                                value={theirBubbleColor}
                                onChange={(e) => setTheirBubbleColor(e.target.value)}
                                className="themesettings-color-input"
                            />
                        </div>
                    </div>
                </div>

                {/* 我的设置 */}
                <div className="themesettings-section">
                    <h2 className="themesettings-section-title">我的对话框</h2>
                    <div className="themesettings-item-container">
                        <div className="themesettings-item">
                            <label>字体：</label>
                            <input
                                type="color"
                                value={myFontColor}
                                onChange={(e) => setMyFontColor(e.target.value)}
                            />
                            <input
                                type="text"
                                value={myFontColor}
                                onChange={(e) => setMyFontColor(e.target.value)}
                                className="themesettings-color-input"
                            />
                        </div>
                        <div className="themesettings-item">
                            <label>对话框：</label>
                            <input
                                type="color"
                                value={myBubbleColor}
                                onChange={(e) => setMyBubbleColor(e.target.value)}
                            />
                            <input
                                type="text"
                                value={myBubbleColor}
                                onChange={(e) => setMyBubbleColor(e.target.value)}
                                className="themesettings-color-input"
                            />
                        </div>
                    </div>
                </div>

                {/* 背景颜色设置 */}
                <div className="themesettings-section">
                    <h2 className="themesettings-section-title">聊天背景</h2>
                    <div className="themesettings-item-container">
                    <div className="themesettings-item">
                        <label>背景：</label>
                        <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                        />
                        <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="themesettings-color-input"
                        />
                    </div>
                    <div className="themesettings-item">
                        <label>启用图片：</label>
                        <input
                            type="checkbox"
                            checked={useBackgroundImage}
                            onChange={(e) => setUseBackgroundImage(e.target.checked)}
                        />
                    </div>

                    {useBackgroundImage && (
                        <div className="themesettings-background-image">
                            <div
                                className="themesettings-image-preview"
                                onClick={handleSelectFile}
                            >
                                {backgroundImage ? (
                                    <img
                                        src={URL.createObjectURL(backgroundImage)}
                                        alt="背景图片预览"
                                        className="themesettings-preview-image"
                                        onLoad={() => URL.revokeObjectURL(backgroundImage)}
                                    />
                                ) : (
                                    <span>点击选择图片</span>
                                )}
                            </div>
                            {errorMessage && <p className="themesettings-error-message">{errorMessage}</p>}
                        </div>
                    )}
                    </div>
                </div>

            </div>

            <div className="themesettings-save-button-container">
                {/* 保存按钮 */}
                <button className="themesettings-save-button" onClick={saveThemeSettings}>
                    保存
                </button>
            </div>

        </div>
    );
};

export default ThemeSettings;