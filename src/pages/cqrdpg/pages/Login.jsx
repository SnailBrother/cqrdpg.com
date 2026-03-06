// src/pages/Login.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
//import { useAuth } from '../hooks/useAuth'; // 确保路径正确
import { useAuth } from '../../../hooks/useAuth';
import styles from './Login.module.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserInfo } = useAuth();

  // 表单状态 (沿用旧逻辑的 email 字段，但UI显示可灵活调整)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 验证码状态 (保留新UI的Canvas逻辑)
  const [userInputCode, setUserInputCode] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  
  // 通用状态
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const canvasRef = useRef(null);

  // 静态资源
  const logoImg = '/RuidaLogo.jpg';
  const companyName = '重庆瑞达评估';
  const backgroundImg = '/images/cqrdpg/home/CompanyProfile/Purpose.jpg';

  // --- Canvas 验证码逻辑 (保持不变) ---
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    drawCaptcha(code);
  };

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

  const refreshCaptcha = () => {
    generateCaptcha();
    setUserInputCode('');
    setCaptchaError(false);
    setSubmitError('');
  };

  useEffect(() => {
    generateCaptcha();
    
    // 处理从注册页面跳转过来的预填充
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.message) {
      console.log(location.state.message); 
      // 可以在这里加一个 Toast 提示 "注册成功，请登录"
    }
  }, []);

  // --- 核心登录逻辑 (移植自旧文件) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setCaptchaError(false);

    // 1. 前端基础验证
    if (!email || !password) {
      setSubmitError('请输入邮箱和密码');
      return;
    }

    // 2. 验证码验证 (保留前端Canvas校验作为第一道防线)
    if (userInputCode.toUpperCase() !== captchaCode) {
      setCaptchaError(true);
      refreshCaptcha();
      setSubmitError('验证码错误');
      return;
    }

    setLoading(true);

    try {
      // 3. 调用后端 API
      const response = await axios.post('/api/auth/login', {
        email: email,
        password: password
      });

      console.log('登录响应:', response.data);

      if (response.data.success) {
        // 4. 构建用户数据
        const userData = {
          ...response.data.user,
          loginTime: new Date().toISOString()
        };

        // 5. 获取 Token
        const token = response.data.token;

        if (!token) {
          throw new Error('服务器未返回Token');
        }

        // 6. 更新全局 Auth 状态
        setUserInfo(userData, token);

        // 7. 路由跳转
        // 优先跳转到来源页面，否则跳转到模块选择页 (/apps)
        const from = location.state?.from?.pathname || '/apps';
        navigate(from, { replace: true });
      } else {
        throw new Error(response.data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      let errorMessage = '登录失败，请检查网络或账号密码';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSubmitError(errorMessage);
      refreshCaptcha(); // 失败后刷新验证码以防暴力破解
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div 
      className={styles.body} 
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className={styles.overlay}></div>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <img src={logoImg} alt="公司Logo" className={styles.logo} />
          <h1 className={styles.companyName}>{companyName}</h1>
        </div>
        <h2 className={styles.prompt}>请登录</h2>
        
        <form onSubmit={handleSubmit}>
          {/* 邮箱输入框 (原为用户名，现改为邮箱以匹配后端逻辑) */}
          <div className={styles.userBox}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if(submitError) setSubmitError('');
              }}
              // placeholder="请输入邮箱地址"
              disabled={loading}
              data-filled={email ? "true" : "false"} 
            />
            <label className={styles.floatingLabel}>邮箱地址</label>
          </div>

          {/* 密码输入框 */}
          <div className={styles.userBox}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if(submitError) setSubmitError('');
              }}
              // placeholder="请输入密码"
              disabled={loading}
              data-filled={password ? "true" : "false"}
            />
            <label className={styles.floatingLabel}>密码</label>
          </div>
          
          {/* 验证码区域 */}
          <div className={styles.captchaBox}>
            <canvas
              ref={canvasRef}
              width="150"
              height="50"
              className={styles.captchaCanvas}
              title="点击刷新"
              onClick={refreshCaptcha}
            ></canvas>
            <button 
              type="button" 
              className={styles.refreshBtn}
              onClick={refreshCaptcha}
              disabled={loading}
            >
              ↻ 刷新
            </button>
          </div>
          
          <div className={styles.userBox}>
            <input
              type="text"
              required
              value={userInputCode}
              onChange={(e) => {
                setUserInputCode(e.target.value);
                setCaptchaError(false);
                if(submitError) setSubmitError('');
              }}
              className={`${captchaError ? styles.errorInput : ''}`}
              placeholder="请输入验证码"
              maxLength="4"
              disabled={loading}
              data-filled={userInputCode ? "true" : "false"}
            />
          </div>
          
          {/* 错误信息显示 */}
          {submitError && (
            <div className={styles.submitError} style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
              {submitError}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <span>登录中...</span>
            ) : (
              <>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                登 录
              </>
            )}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p className={styles.switchMode}>
            还没有账户？
            <button
              type="button"
              onClick={goToRegister}
              className={styles.switchButton}
              disabled={loading}
            >
              立即注册
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;