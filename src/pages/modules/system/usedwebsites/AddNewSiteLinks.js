import React, { useState } from 'react';
import './AddNewSiteLinks.css';

const AddNewSiteLinks = () => {
  const [formData, setFormData] = useState({
    type: '房地产',
    name: '',
    url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('http://121.4.22.55:5202/api/updateWebsites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ text: '网站链接添加成功!', type: 'success' });
        setFormData({
          type: '房地产',
          name: '',
          url: ''
        });
      } else {
        throw new Error(result.error || '添加失败');
      }
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="addnew-container">
      <div className="addnew-card">
        <h2 className="addnew-title">添加新网站链接</h2>
        
        {message.text && (
          <div className={`addnew-message addnew-message--${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="addnew-form" onSubmit={handleSubmit}>
          <div className="addnew-form-group">
            <label className="addnew-label" htmlFor="type">网站类型</label>
            <select
              className="addnew-select"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="房地产">房地产</option>
              <option value="资产">资产</option>
              <option value="苗木">苗木</option>
              <option value="土地">土地</option>
              <option value="娱乐">娱乐</option>
            </select>
          </div>

          <div className="addnew-form-group">
            <label className="addnew-label" htmlFor="name">网站名称</label>
            <input
              className="addnew-input"
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="输入网站名称"
              required
            />
          </div>

          <div className="addnew-form-group">
            <label className="addnew-label" htmlFor="url">网站URL</label>
            <input
              className="addnew-input"
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
              required
            />
          </div>

          <button
            className="addnew-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="addnew-spinner"></span>
                提交中...
              </>
            ) : '添加网站'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNewSiteLinks;