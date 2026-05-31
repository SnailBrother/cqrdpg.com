import React, { useState, useEffect, useRef } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

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

  const contactMethods = [
    { icon: '👤', label: '联系人', value: '李老师' },
    { icon: '📞', label: '电话', value: '18223626490' },
    { icon: '✉️', label: '邮箱', value: '644260249@qq.com' },
 
  ];

  return (
    <section className={styles.contactSection} ref={sectionRef}>
      <div className={styles.container}>
        <div className={`${styles.contactCard} ${isVisible ? styles.cardVisible : ''}`}>
          {/* 头部品牌区 - 白色主题 */}
          <div className={styles.brandHeader}>
            <div className={styles.tagLine}>
              <span className={styles.tagDot}></span>
              <span>一对一专业咨询</span>
            </div>
            <h2 className={styles.mainTitle}>
              让评估
              <span className={styles.gradientText}>更简单</span>
            </h2>

            
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>25000+</div>
                <div className={styles.statLabel}>服务客户</div>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>98%</div>
                <div className={styles.statLabel}>满意度</div>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>20年</div>
                <div className={styles.statLabel}>专业经验</div>
              </div>
            </div>
          </div>

          {/* 表单区域 */}
          <div className={styles.formWrapper}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  name="requestername"
                  placeholder="您的姓名 *"
                  value={formData.requestername}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <input
                  type="tel"
                  name="contact"
                  placeholder="联系电话 *"
                  value={formData.contact}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <textarea
                  name="description"
                  placeholder="请描述您的需求或问题 *"
                  value={formData.description}
                  onChange={handleChange}
                  className={styles.textarea}
                  rows="3"
                  required
                ></textarea>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className={styles.loader}></span>
                ) : (
                  '提交咨询'
                )}
              </button>

              {status.message && (
                <div className={`${styles.message} ${status.type === 'success' ? styles.successMsg : styles.errorMsg}`}>
                  {status.message}
                </div>
              )}
            </form>

            {/* 快捷联系方式 - 手机端一行显示 */}
            <div className={styles.quickContact}>
              <div className={styles.contactGrid}>
                {contactMethods.map((method, idx) => (
                  <div key={idx} className={styles.contactChip}>
                    <span className={styles.chipIcon}>{method.icon}</span>
                    <div className={styles.chipInfo}>
                      <div className={styles.chipLabel}>{method.label}</div>
                      <div className={styles.chipValue}>{method.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 二维码区域 */}
            <div className={styles.qrArea}>
              <div className={styles.qrWrapper}>
                <img src='/images/cqrdpg/home/ContactUs/qq.jpg' alt="QQ" />
                <span>QQ客服</span>
              </div>
              <div className={styles.qrWrapper}>
                <img src='/images/cqrdpg/home/ContactUs/wechat.png' alt="微信" />
                <span>微信客服</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;