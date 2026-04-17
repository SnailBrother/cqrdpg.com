import React, { useState, useRef } from 'react';
import axios from 'axios';
import './UploadMusic.css';
import io from 'socket.io-client';
// 初始化 socket 连接
const socket = io('https://www.cqrdpg.com:5202'); // 添加这行

const UploadMusic = () => {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [lyricsFile, setLyricsFile] = useState(null);
    const [genre, setGenre] = useState('华语');
    const [isUploading, setIsUploading] = useState(false);

    const audioRef = useRef(null);
    const coverRef = useRef(null);
    const lyricsRef = useRef(null);
    // 在组件中添加状态 歌曲名和歌手不能一样，输入的时候就检查
    const [titleArtistSame, setTitleArtistSame] = useState(false);

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveFile = (type) => {
        switch (type) {
            case 'audio':
                setAudioFile(null);
                if (audioRef.current) {
                    audioRef.current.value = '';
                }
                break;
            case 'cover':
                setCoverFile(null);
                setCoverPreview(null);
                if (coverRef.current) {
                    coverRef.current.value = '';
                }
                break;
            case 'lyrics':
                setLyricsFile(null);
                if (lyricsRef.current) {
                    lyricsRef.current.value = '';
                }
                break;
            default:
                break;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 新增验证：歌曲名和歌手不能相同
        if (title.trim().toLowerCase() === artist.trim().toLowerCase()) {
            setMessage({ text: '歌曲名和歌手不能相同,请认真检查', type: 'error' });
            return;
        }

        if (!title.trim() || !artist.trim() || !audioFile || !coverFile) {
            setMessage({ text: '请填写所有必填字段并上传音频和封面', type: 'error' });
            return;
        }

        setIsUploading(true);
        setMessage({ text: '上传中...', type: 'info' });

        const formData = new FormData();
        formData.append('title', title);
        formData.append('artist', artist);
        formData.append('audio', audioFile);
        formData.append('cover', coverFile);
        formData.append('genre', genre);
        if (lyricsFile) {
            formData.append('lyrics', lyricsFile);
        }

        try {
            const response = await axios.post('/api/uploadmusic', formData);
            setMessage({ text: '音乐上传成功!', type: 'success' });
            console.log('Upload response:', response.data);
            // 通知所有客户端音乐列表已更新
            socket.emit('music-uploaded');  // 添加这行
            // 清空所有表单字段
            setTitle('');
            setArtist('');
            setAudioFile(null);
            setCoverFile(null);
            setCoverPreview(null);
            setLyricsFile(null);
            setGenre('华语');

            // 清空文件输入框的值
            if (audioRef.current) audioRef.current.value = '';
            if (coverRef.current) coverRef.current.value = '';
            if (lyricsRef.current) lyricsRef.current.value = '';

        } catch (error) {
            setMessage({ text: '上传失败: ' + (error.response?.data?.message || error.message), type: 'error' });
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="uploadmusic-container">
            {/* <div className="uploadmusic-header">
                <h1 className="uploadmusic-title">上传音乐</h1>
                <p className="uploadmusic-subtitle">分享你的音乐作品给全世界</p>
            </div> */}

            <form className="uploadmusic-form" onSubmit={handleSubmit}>
                <div className="uploadmusic-scrollable">
                    <div className="uploadmusic-form-section">
                        <h2 className="uploadmusic-section-title">基本信息</h2>
                        <div className="uploadmusic-form-group">
                            <label className="uploadmusic-label">歌曲名 *</label>
                            <input
                                type="text"
                                className="uploadmusic-input"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setTitleArtistSame(e.target.value.trim().toLowerCase() === artist.trim().toLowerCase());
                                }}
                                placeholder="请输入歌曲名称"
                                required
                            />
                        </div>
                        <div className="uploadmusic-form-group">
                            <label className="uploadmusic-label">歌手 *</label>
                            <input
                                type="text"
                                className="uploadmusic-input"
                                value={artist}
                                onChange={(e) => {
                                    setArtist(e.target.value);
                                    setTitleArtistSame(title.trim().toLowerCase() === e.target.value.trim().toLowerCase());
                                }}
                                placeholder="请输入歌手名称"
                                required
                            />
                        </div>
                        {/* // 在表单中显示提示信息（可以放在artist输入框下面） */}
                        {titleArtistSame && (
                            <div className="uploadmusic-message uploadmusic-message-error">
                                歌曲名和歌手不能相同
                            </div>
                        )}
                        <div className="uploadmusic-form-group">
                            <label className="uploadmusic-label">歌曲类型 *</label>
                            <select
                                className="uploadmusic-select"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                required
                            >
                                <option value="华语">华语</option>
                                <option value="欧美">欧美</option>
                                <option value="日韩">日韩</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>
                    </div>

                    <div className="uploadmusic-form-sections-row">
                        <div className="uploadmusic-form-section">
                            <h2 className="uploadmusic-section-title">封面图片 *</h2>
                            <div className="uploadmusic-file-upload">
                                {!coverFile ? (
                                    <div className="uploadmusic-file-dropzone">
                                        <input
                                            type="file"
                                            className="uploadmusic-file-input"
                                            accept="image/*"
                                            onChange={handleCoverChange}
                                            ref={coverRef}
                                            required
                                        />
                                        <div className="uploadmusic-dropzone-content">
                                            <i className="uploadmusic-icon uploadmusic-icon-image"></i>
                                            <p>点击或拖拽封面图片到这里</p>
                                            <small>支持 JPG, PNG 等格式</small>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="uploadmusic-cover-preview-container">
                                        <div className="uploadmusic-cover-preview">
                                            <img src={coverPreview} alt="封面预览" />
                                            <button
                                                type="button"
                                                className="uploadmusic-remove-btn"
                                                onClick={() => handleRemoveFile('cover')}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="uploadmusic-form-section">
                            <h2 className="uploadmusic-section-title">音乐文件 *</h2>
                            <div className="uploadmusic-file-upload">
                                {!audioFile ? (
                                    <div className="uploadmusic-file-dropzone">
                                        <input
                                            type="file"
                                            className="uploadmusic-file-input"
                                            accept="audio/*"
                                            onChange={(e) => setAudioFile(e.target.files[0])}
                                            ref={audioRef}
                                            required
                                        />
                                        <div className="uploadmusic-dropzone-content">
                                            <i className="uploadmusic-icon uploadmusic-icon-music"></i>
                                            <p>点击或拖拽音频文件到这里</p>
                                            <small>支持 MP3, WAV, AAC 等格式</small>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="uploadmusic-file-preview">
                                        <div className="uploadmusic-file-info">
                                            <i className="uploadmusic-icon uploadmusic-icon-music"></i>
                                            <div>
                                                <p>{audioFile.name}</p>
                                                <small>{(audioFile.size / 1024 / 1024).toFixed(2)} MB</small>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="uploadmusic-remove-btn"
                                            onClick={() => handleRemoveFile('audio')}
                                        >
                                            删除
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>


                        <div className="uploadmusic-form-section">
                            <h2 className="uploadmusic-section-title">歌词文件 (可选)</h2>
                            <div className="uploadmusic-file-upload">
                                {!lyricsFile ? (
                                    <div className="uploadmusic-file-dropzone">
                                        <input
                                            type="file"
                                            className="uploadmusic-file-input"
                                            accept=".lrc"
                                            onChange={(e) => setLyricsFile(e.target.files[0])}
                                            ref={lyricsRef}
                                        />
                                        <div className="uploadmusic-dropzone-content">
                                            <i className="uploadmusic-icon uploadmusic-icon-text"></i>
                                            <p>点击或拖拽歌词文件到这里</p>
                                            <small>支持 .lrc 格式</small>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="uploadmusic-file-preview">
                                        <div className="uploadmusic-file-info">
                                            <i className="uploadmusic-icon uploadmusic-icon-text"></i>
                                            <div>
                                                <p>{lyricsFile.name}</p>
                                                <small>{(lyricsFile.size / 1024).toFixed(2)} KB</small>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="uploadmusic-remove-btn"
                                            onClick={() => handleRemoveFile('lyrics')}
                                        >
                                            删除
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {message.text && (
                        <div className={`uploadmusic-message uploadmusic-message-${message.type}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                <div className="uploadmusic-form-actions">
                    <button
                        type="submit"
                        className="uploadmusic-submit-btn"
                        disabled={isUploading}
                    >
                        {isUploading ? '上传中...' : '上传音乐'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UploadMusic;