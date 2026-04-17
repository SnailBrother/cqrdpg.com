import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import './AvatarSettings.css';

const AvatarSettings = () => {
   const { user, logout } = useAuth();
       const username = user?.username; // 从 user 对象中获取 username
    const [userHeadImage, setUserHeadImage] = useState(null); // 存储用户头像 URL
    const [selectedFile, setSelectedFile] = useState(null); // 存储用户选择的文件
    const [uploading, setUploading] = useState(false); // 标记是否正在上传
    const [uploadSuccess, setUploadSuccess] = useState(false); // 标记上传是否成功
    const [uploadError, setUploadError] = useState(''); // 存储上传错误信息

    // 获取用户头像
    const fetchUserHeadImage = useCallback(async () => {
        try {
            const response = await axios.get('https://www.cqrdpg.com:5202/api/getuserheadimage', {
                params: { username }
            });
            if (response.data.imageUrl) {
                setUserHeadImage(response.data.imageUrl); // 设置头像 URL
            }
        } catch (error) {
            console.error('Error fetching user head image:', error);
        }
    }, [username]);

    // 组件加载时调用 fetchUserHeadImage
    useEffect(() => {
        fetchUserHeadImage();
    }, [fetchUserHeadImage]);

    // 处理选择文件按钮点击事件
    const handleSelectFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // 检查文件大小是否超过 200KB
                if (file.size > 200 * 1024) { // 200KB = 200 * 1024 bytes
                    setUploadError('文件大小不能超过 200KB');
                    setSelectedFile(null); // 清空选中的文件
                    return;
                }
                setUploadError(''); // 清空错误信息
                setSelectedFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setUserHeadImage(reader.result);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // 处理上传按钮点击事件
    const handleUpload = async () => {
        if (selectedFile) {
            // 再次检查文件大小（防止用户绕过前端检查）
            if (selectedFile.size > 200 * 1024) {
                setUploadError('文件大小不能超过 200KB');
                return;
            }

            setUploading(true);
            setUploadSuccess(false);
            setUploadError('');
            try {
                const formData = new FormData();
                formData.append('image', selectedFile);

                // 上传图片到服务器
                const response = await axios.post(
                    `/api/uploaduserheadimage?username=${username}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (response.data.imageUrl) {
                    setUserHeadImage(response.data.imageUrl); // 更新头像 URL
                    setUploadSuccess(true);
                }
            } catch (error) {
                console.error('Error uploading user head image:', error);
                setUploadError('上传失败，请稍后重试。');
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="avatarsettings-container">
            <h1 className="avatarsettings-title">头像设置</h1>
            <div className="avatarsettings-avatar-container">
                {userHeadImage ? (
                    <img
                        src={userHeadImage}
                        alt="User Avatar"
                        className="avatarsettings-avatar"
                    />
                ) : (
                    <svg className="avatarsettings-avatar-icon" aria-hidden="true">
                        <use xlinkHref="#icon-a-gerenyonghu"></use>
                    </svg>
                )}
            </div>
            <p className="avatarsettings-username">{username}</p>
            <button className="avatarsettings-select-button" onClick={handleSelectFile}>
                选择文件
            </button>
            {selectedFile && (
                <button
                    className="avatarsettings-upload-button"
                    onClick={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? '上传中...' : '上传'}
                </button>
            )}
            {uploadSuccess && <p className="avatarsettings-message success">上传成功！</p>}
            {uploadError && <p className="avatarsettings-message error">{uploadError}</p>}
        </div>
    );
};

export default AvatarSettings;