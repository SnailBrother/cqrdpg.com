import React, { useState, useEffect } from 'react';
import styles from './PublishNews.module.css';

const API_BASE = '/api/publish-news';
// 定义服务器基础地址
const SERVER_BASE_URL = 'http://121.4.22.55:80/backend';
// 定义默认图片的完整路径
const DEFAULT_IMAGE_URL = `${SERVER_BASE_URL}/images/PublishNewsPictures/Defaultbackground.jpg`;

const PublishNews = () => {
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
    const [editingId, setEditingId] = useState(null);

    // 列表状态
    const [newsList, setNewsList] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(false);

    // 表单状态
    const [formData, setFormData] = useState({
        title: '',
        category: '公司新闻',
        summary: '',
        content: '',
        publishDate: new Date().toISOString().split('T')[0],
        imageFile: null,
        imageUrl: ''
    });

    const categories = ['公司新闻', '行业动态', '政策法规'];

    useEffect(() => {
        if (viewMode === 'list') {
            fetchNewsList();
        }
    }, [activeCategory, viewMode]);

    const fetchNewsList = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/list?page=1&limit=20&category=${activeCategory}`);
            const data = await res.json();
            setNewsList(data.list || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                imageFile: file,
                imageUrl: URL.createObjectURL(file) // 本地预览
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title) return alert('标题不能为空');

        try {
            let currentId = editingId;

            // 1. 如果是新增，先创建记录获取 ID
            if (!currentId) {
                const createRes = await fetch(API_BASE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const createData = await createRes.json();
                if (!createData.success) throw new Error(createData.error);
                currentId = createData.id;
            } else {
                // 2. 如果是编辑，更新文本信息
                const updateRes = await fetch(`${API_BASE}/${currentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (!updateRes.ok) throw new Error('Update text failed');
            }

            // 3. 如果有图片，上传图片
            if (formData.imageFile) {
                const imgFormData = new FormData();
                imgFormData.append('image', formData.imageFile);
                // newsId append 在这里其实后端主要靠 URL 参数，但留着也没事
                imgFormData.append('newsId', currentId);

                const uploadRes = await fetch(`${API_BASE}/upload-image?newsId=${currentId}`, {
                    method: 'POST',
                    body: imgFormData
                });
                const uploadData = await uploadRes.json();
                if (!uploadData.success) throw new Error(uploadData.error);
            }

            alert('发布成功！');
            resetForm();
            setViewMode('list');
            fetchNewsList();
        } catch (err) {
            alert('操作失败: ' + err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            category: '公司新闻',
            summary: '',
            content: '',
            publishDate: new Date().toISOString().split('T')[0],
            imageFile: null,
            imageUrl: ''
        });
        setEditingId(null);
    };

    const handleEdit = (news) => {
        // 判断是否是默认图片，如果是则不显示预览（或者显示默认图），这里逻辑设为：如果是默认图则清空预览，让用户知道可以重新上传
        const isDefault = !news.ImageUrl || news.ImageUrl === 'Defaultbackground.jpg' || news.ImageUrl.includes('Defaultbackground.jpg');
        
        setFormData({
            title: news.Title,
            category: news.Category,
            summary: '', 
            content: news.Content || '',
            publishDate: news.PublishDate,
            imageFile: null,
            // 如果是默认图，预览留空；否则显示服务器上的图
            imageUrl: isDefault ? '' : `${SERVER_BASE_URL}${news.ImageUrl}`
        });
        setEditingId(news.Id);
        setViewMode('form');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这条新闻吗？')) return;
        try {
            await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            fetchNewsList();
        } catch (err) {
            alert('删除失败');
        }
    };

    // --- 新增：图片路径处理逻辑 ---
    const getFinalImageUrl = (urlFromDb) => {
        if (!urlFromDb) return DEFAULT_IMAGE_URL;
        
        // 如果数据库里存的就是默认图文件名
        if (urlFromDb === 'Defaultbackground.jpg' || urlFromDb.includes('Defaultbackground.jpg')) {
            return DEFAULT_IMAGE_URL;
        }

        // 如果已经是完整 http 开头，直接返回（以防万一）
        if (urlFromDb.startsWith('http')) return urlFromDb;

        // 拼接服务器地址
        // 确保 urlFromDb 以 / 开头，SERVER_BASE_URL 不以 / 结尾
        const path = urlFromDb.startsWith('/') ? urlFromDb : `/${urlFromDb}`;
        return `${SERVER_BASE_URL}${path}`;
    };

    return (
        <div className={styles.container}>
            {viewMode === 'list' ? (
                /* ================= 列表视图 ================= */
                <div className={styles.listView}>
                    <div className={styles.header}>
                        <h2>动态</h2>
                        <button className={styles.addBtn} onClick={() => { resetForm(); setViewMode('form'); }}>
                            + 发布
                        </button>
                    </div>

                    <div className={styles.filterBar}>
                        <button
                            className={`${styles.catBtn} ${activeCategory === 'all' ? styles.active : ''}`}
                            onClick={() => setActiveCategory('all')}
                        >全部</button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`${styles.catBtn} ${activeCategory === cat ? styles.active : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >{cat}</button>
                        ))}
                    </div>

                    {loading ? <p>加载中...</p> : (
                        <div className={styles.newsGrid}>
                            {newsList.length === 0 ? <p>暂无数据</p> : newsList.map(news => {
                                // 计算初始显示的 src
                                const initialSrc = getFinalImageUrl(news.ImageUrl);
                                
                                return (
                                    <div key={news.Id} className={styles.card}>
                                        <div className={styles.cardImgBox}>
                                            <img 
                                                src={initialSrc} 
                                                alt={news.Title} 
                                                onError={(e) => {
                                                    // 如果图片加载失败（404等），强制替换为默认图
                                                    e.target.onerror = null; // 防止死循环
                                                    e.target.src = DEFAULT_IMAGE_URL;
                                                }}
                                            />
                                            <span className={styles.tag}>{news.Category}</span>
                                        </div>
                                        <div className={styles.cardBody}>
                                            <h3>{news.Title}</h3>
                                            <p className={styles.date}>{news.PublishDate}</p>
                                            <p className={styles.summary}>
                                                {news.Content ? news.Content.substring(0, 50) + '...' : '暂无内容'}
                                            </p>
                                            <div className={styles.actions}>
                                                <button onClick={() => handleEdit(news)}>编辑</button>
                                                <button className={styles.delBtn} onClick={() => handleDelete(news.Id)}>删除</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* ================= 表单视图 ================= */
                <div className={styles.formView}>
                    <div className={styles.formHeader}>
                        <h2>{editingId ? '编辑新闻' : '发布新新闻'}</h2>
                        <button className={styles.backBtn} onClick={() => setViewMode('list')}>返回列表</button>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>标题 *</label>
                            <input name="title" value={formData.title} onChange={handleInputChange} required />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label>分类</label>
                                <select name="category" value={formData.category} onChange={handleInputChange}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>发布日期</label>
                                <input type="date" name="publishDate" value={formData.publishDate} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>摘要 (可选 - 已停用)</label>
                            <textarea name="summary" value={formData.summary} onChange={handleInputChange} rows="2" disabled placeholder="该字段已从数据库移除" style={{background:'#f0f0f0'}} />
                        </div>

                        <div className={styles.formGroup}>
                            <label>正文内容</label>
                            <textarea name="content" value={formData.content} onChange={handleInputChange} rows="10" />
                        </div>

                        <div className={styles.formGroup}>
                            <label>封面图片 (JPG/PNG)</label>
                            <div className={styles.uploadBox}>
                                {formData.imageUrl ? (
                                    <img 
                                        src={formData.imageUrl} 
                                        alt="Preview" 
                                        className={styles.previewImg} 
                                        onError={(e) => { e.target.src = DEFAULT_IMAGE_URL; }}
                                    />
                                ) : (
                                    <div className={styles.placeholder}>无图片 (将使用默认背景)</div>
                                )}
                                <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} />
                            </div>
                        </div>

                        <div className={styles.submitBar}>
                            <button type="submit" className={styles.submitBtn}>保存发布</button>
                            <button type="button" onClick={() => setViewMode('list')}>取消</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PublishNews;