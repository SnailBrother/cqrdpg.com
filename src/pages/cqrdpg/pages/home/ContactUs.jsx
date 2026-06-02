import React, { useState, useEffect, useRef } from 'react';
import styles from './ContactUs.module.css';
import axios from 'axios';
import { PendingBox } from '../../../../components/UI';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    requestername: '',
    contact: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const [pendingBox, setPendingBox] = useState({
    visible: false,
    message: '',
    type: 'success',
    duration: 5
  });

  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);

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

    fetchCaptcha();

    return () => observer.disconnect();
  }, []);

  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const response = await axios.get('/api/CodeDatabase/captcha');

      if (response.data.success) {
        setCaptchaId(response.data.captchaId);
        setCaptchaSvg(response.data.captchaSvg);
        setUserInputCode('');
        setCaptchaError(false);
      } else {
        showErrorMessage(response.data.message || '验证码加载失败');
      }
    } catch (error) {
      console.error('获取验证码失败:', error);
      showErrorMessage('验证码加载失败，请稍后重试');
    } finally {
      setCaptchaLoading(false);
    }
  };

  const refreshCaptcha = () => {
    fetchCaptcha();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showSuccessMessage = (message) => {
    setPendingBox({
      visible: true,
      message,
      type: 'success',
      duration: 5
    });
  };

  const showErrorMessage = (message) => {
    setPendingBox({
      visible: true,
      message,
      type: 'error',
      duration: 5
    });
  };

  const closePendingBox = () => {
    setPendingBox(prev => ({ ...prev, visible: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.requestername || !formData.description) {
      showErrorMessage('请填写姓名和问题描述。');
      setIsSubmitting(false);
      return;
    }

    if (!userInputCode.trim()) {
      setCaptchaError(true);
      showErrorMessage('请输入验证码');
      setIsSubmitting(false);
      return;
    }

    if (!captchaId) {
      showErrorMessage('验证码无效，请刷新后重试');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post('/api/CodeDatabase/submitContact', {
        ...formData,
        captchaId,
        captchaCode: userInputCode
      });

      if (response.data.success) {
        showSuccessMessage('提交成功！我们会尽快联系您。');
        setFormData({
          requestername: '',
          contact: '',
          description: ''
        });
        setUserInputCode('');
        setCaptchaError(false);
        fetchCaptcha();
      } else {
        showErrorMessage(response.data.message || '提交失败，请稍后重试。');
        fetchCaptcha();
      }
    } catch (error) {
      console.error('提交错误:', error);

      if (error.response && error.response.status === 429) {
        showErrorMessage(error.response.data.message || '提交过于频繁，请10分钟后再试');
      } else if (error.response && error.response.data && error.response.data.message) {
        showErrorMessage(error.response.data.message);
      } else {
        showErrorMessage('网络错误，请稍后重试。');
      }

      setCaptchaError(true);
      fetchCaptcha();
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
    <>
      <PendingBox
        visible={pendingBox.visible}
        message={pendingBox.message}
        duration={pendingBox.duration}
        type={pendingBox.type}
        onClose={closePendingBox}
      />

      <section className={styles.contactSection} ref={sectionRef}>
        <div className={styles.container}>
          <div className={`${styles.contactCard} ${isVisible ? styles.cardVisible : ''}`}>
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

                <div className={styles.captchaGroup}>
                  <input
                    type="text"
                    placeholder="请输入验证码 *"
                    value={userInputCode}
                    onChange={(e) => {
                      setUserInputCode(e.target.value.toUpperCase());
                      setCaptchaError(false);
                    }}
                    className={`${styles.input} ${styles.captchaInput} ${captchaError ? styles.errorInput : ''}`}
                    maxLength="4"
                    required
                  />

                  <div className={styles.captchaWrapper}>
                    <div
                      className={styles.captchaImageBox}
                      onClick={refreshCaptcha}
                      style={{ cursor: 'pointer' }}
                      title="点击刷新验证码"
                    >
                      {captchaLoading ? (
                        <div className={styles.captchaLoading}>加载中...</div>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: captchaSvg }} />
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.refreshCaptchaBtn}
                      onClick={refreshCaptcha}
                    >
                      ↻ 刷新
                    </button>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting || captchaLoading}>
                  {isSubmitting ? (
                    <span className={styles.loader}></span>
                  ) : (
                    '提交咨询'
                  )}
                </button>
              </form>

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
    </>
  );
};

export default ContactUs;