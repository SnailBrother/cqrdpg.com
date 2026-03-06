import React, { useState } from 'react';
import styles from './ContactUs.module.css';
import axios from 'axios';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    requestername: '',
    contact: '',
    description: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    if (!formData.requestername || !formData.description) {
      setStatus({ type: 'error', message: '请填写姓名和问题描述。' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post('/api/CodeDatabase/submitContact', formData);

      if (response.data.success) {
        setStatus({ type: 'success', message: '提交成功！我们会尽快联系您。' });
        setFormData({ requestername: '', contact: '', description: '' });
      } else {
        setStatus({ type: 'error', message: response.data.message || '提交失败。' });
      }
    } catch (error) {
      console.error('提交错误:', error);
      setStatus({ type: 'error', message: '网络错误，请稍后重试。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.contactSection}>
      <div className={styles.container}>
        
        {/* 【修改点】先渲染右侧表单区域 (移动端会显示在上面) */}
        <div className={styles.rightCol}>
          <h3 className={styles.formTitle}>专业评估</h3>
          <h4 className={styles.formTitleprompt}>有任何问题？请告诉我们，我们会第一时间回复您</h4>
         
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>姓名：</label>
              <input
                type="text"
                name="requestername"
                className={styles.formInput}
                placeholder="请输入您的姓名"
                value={formData.requestername}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>电话：</label>
              <input
                type="tel"
                name="contact"
                className={styles.formInput}
                placeholder="请输入您的电话"
                value={formData.contact}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>描述：</label>
              <textarea
                name="description"
                className={styles.formTextarea}
                placeholder="请输入您的需求描述"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '提交'}
            </button>

            {status.message && (
              <div className={`${styles.statusMessage} ${status.type === 'success' ? styles.success : styles.error}`}>
                {status.message}
              </div>
            )}
          </form>
        </div>

        {/* 【修改点】后渲染左侧图片和信息区域 (移动端会显示在下面) */}
        <div className={styles.leftCol}>
          <div className={styles.imageWrapper}>
            <img
              src='/images/cqrdpg/home/ContactUs/1.jpg'
              alt="联系我们"
              className={styles.contactImage}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=Contact+Image'; }}
            />
          </div>

          <div className={styles.contactInfo}>
            <h3 className={styles.infoTitle}>联系方式</h3>
            <ul className={styles.infoList}>
              <li className={styles.infoItem}><span className={styles.label}>联系人：</span><span className={styles.value}>李先生</span></li>
              <li className={styles.infoItem}><span className={styles.label}>电话：</span><span className={styles.value}>18983033184</span></li>
              <li className={styles.infoItem}><span className={styles.label}>公司地址：</span><span className={styles.value}>重庆市渝中区和平路7号6-19号、6-20号</span></li>
              <li className={styles.infoItem}><span className={styles.label}>公司邮箱：</span><span className={styles.value}>644260249@qq.com</span></li>
              <li className={styles.infoItem}><span className={styles.label}>公司邮编：</span><span className={styles.value}>400010</span></li>
              <li className={styles.infoItem}><span className={styles.label}>客服QQ：</span><span className={styles.value}>644260249</span></li>

              <li className={styles.qrCodeItem}>
                <div className={styles.qrCodeWrapper}>
                  <span className={styles.qrLabel}>QQ</span>
                  <img src='/images/cqrdpg/home/ContactUs/qq.jpg' alt="QQ二维码" className={styles.qrImage} />
                </div>
                <div className={styles.qrCodeWrapper}>
                  <span className={styles.qrLabel}>微信</span>
                  <img src='/images/cqrdpg/home/ContactUs/wechat.png' alt="微信二维码" className={styles.qrImage} />
                </div>
                <div className={styles.qrCodeWrapper}>
                  <span className={styles.qrLabel}>公众号</span>
                  <img src='/images/cqrdpg/home/ContactUs/fuwuhao.jpg' alt="公众号" className={styles.qrImage} />
                </div>
                <div className={styles.qrCodeWrapper}>
                  <span className={styles.qrLabel}>微博号</span>
                  <img src='/images/cqrdpg/home/ContactUs/fuwuhao.jpg' alt="微博号" className={styles.qrImage} />
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ContactUs;