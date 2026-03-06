import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddNewPublicNews.css';

const AddNewPublicNews = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证输入
    if (!title.trim()) {
      setError('公告标题不能为空');
      return;
    }
    
    if (!content.trim()) {
      setError('公告内容不能为空');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post('http://121.4.22.55:5202/api/addMessage', {
        title,
        content
      });

      if (response.data.success) {
        // 添加成功，返回公告列表
        navigate('/home/publicNews');
      } else {
        setError('添加公告失败，请重试');
      }
    } catch (err) {
      console.error('添加公告错误:', err);
      setError(err.response?.data?.error || '服务器错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="addnewpublicnews-container">
      <h2 className="addnewpublicnews-title">发布新公告</h2>
      
      {error && <div className="addnewpublicnews-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="addnewpublicnews-form">
        <div className="addnewpublicnews-form-group">
          <label htmlFor="title" className="addnewpublicnews-label">公告标题</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="addnewpublicnews-input"
            placeholder="请输入公告标题"
            maxLength="255"
          />
        </div>
        
        <div className="addnewpublicnews-form-group">
          <label htmlFor="content" className="addnewpublicnews-label">公告内容</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="addnewpublicnews-textarea"
            placeholder="请输入公告内容"
            rows="10"
          />
        </div>
        
        <div className="addnewpublicnews-button-group">
          <button
            type="button"
            onClick={() => navigate('/home/publicNews')}
            className="addnewpublicnews-cancel-button"
            disabled={isSubmitting}
          >
            取消
          </button>
          
          <button
            type="submit"
            className="addnewpublicnews-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '发布中...' : '发布公告'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddNewPublicNews;