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
  
  // 验证码相关状态
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const canvasRef = useRef(null);
  
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
    
    // 初始化验证码
    generateCaptcha();

    return () => observer.disconnect();
  }, []);

  // 生成验证码
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    drawCaptcha(code);
  };

  // 绘制验证码
  const drawCaptcha = (code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, w, h);

    // 干扰线
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }

    // 干扰点
    ctx.fillStyle = '#999';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 文字
    const charWidth = w / code.length;
    for (let i = 0; i < code.length; i++) {
      ctx.fillStyle = `rgb(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100})`;
      const fontSize = 28 + Math.random() * 6;
      ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
      const angle = (Math.random() - 0.5) * 0.3;

      ctx.save();
      const x = charWidth * i + charWidth * 0.3 + Math.random() * 8;
      const y = h * 0.7 + Math.random() * 8;

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }
  };

  // 刷新验证码
  const refreshCaptcha = () => {
    generateCaptcha();
    setUserInputCode('');
    setCaptchaError(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showSuccessMessage = (message) => {
    setPendingBox({
      visible: true,
      message: message,
      type: 'success',
      duration: 5
    });
  };

  const showErrorMessage = (message) => {
    setPendingBox({
      visible: true,
      message: message,
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
    
    // 验证码验证
    if (userInputCode.toUpperCase() !== captchaCode) {
      setCaptchaError(true);
      showErrorMessage('验证码错误，请重新输入');
      refreshCaptcha();
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post('/api/CodeDatabase/submitContact', formData);

      if (response.data.success) {
        showSuccessMessage('提交成功！我们会尽快联系您。');
        setFormData({ requestername: '', contact: '', description: '' });
        setUserInputCode('');
        refreshCaptcha();
      } else {
        showErrorMessage(response.data.message || '提交失败，请稍后重试。');
        // 如果是频率限制错误，刷新验证码
        if (response.data.message && response.data.message.includes('频繁')) {
          refreshCaptcha();
        }
      }
    } catch (error) {
      console.error('提交错误:', error);
      // 处理429频率限制错误
      if (error.response && error.response.status === 429) {
        showErrorMessage(error.response.data.message || '提交过于频繁，请10分钟后再试');
        refreshCaptcha();
      } else {
        showErrorMessage('网络错误，请稍后重试。');
      }
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

              {/* 验证码区域 */}
              <div className={styles.captchaGroup}>
                <div className={styles.captchaWrapper}>
                  <canvas
                    ref={canvasRef}
                    width="120"
                    height="40"
                    className={styles.captchaCanvas}
                    onClick={refreshCaptcha}
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    className={styles.refreshCaptchaBtn}
                    onClick={refreshCaptcha}
                  >
                    ↻ 刷新
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="请输入验证码 *"
                  value={userInputCode}
                  onChange={(e) => {
                    setUserInputCode(e.target.value.toUpperCase());
                    setCaptchaError(false);
                  }}
                  className={`${styles.captchaInput} ${captchaError ? styles.errorInput : ''}`}
                  maxLength="4"
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
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