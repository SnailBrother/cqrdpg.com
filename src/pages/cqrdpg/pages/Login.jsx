// src/pages/Login.jsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';
import styles from './Login.module.css';

// --- 辅助组件（动画角色）---

/**
 * 瞳孔组件
 */
const Pupil = ({ size = 12, maxDistance = 5, pupilColor = "#2D2D2D", forceLookX, forceLookY, mouseX, mouseY, parentRef }) => {
  const position = useMemo(() => {
    if (!parentRef?.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const rect = parentRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }, [mouseX, mouseY, forceLookX, forceLookY, maxDistance, parentRef]);

  return (
    <div
      className={styles.pupil}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    />
  );
};

/**
 * 眼白组件
 */
const EyeBall = ({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  isBlinking = false,
  forceLookX,
  forceLookY,
  mouseX,
  mouseY,
  parentRef
}) => {
  return (
    <div
      ref={parentRef}
      className={styles.eyeBall}
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: 'white',
      }}
    >
      {!isBlinking && (
        <Pupil
          size={pupilSize}
          maxDistance={maxDistance}
          forceLookX={forceLookX}
          forceLookY={forceLookY}
          mouseX={mouseX}
          mouseY={mouseY}
          parentRef={parentRef}
        />
      )}
    </div>
  );
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserInfo } = useAuth();

  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 动画状态
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const [mouthShape, setMouthShape] = useState('circle');
  const [purpleMouthShape, setPurpleMouthShape] = useState('circle');
  const [showPassword, setShowPassword] = useState(false);

  // DOM元素引用
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);
  const eyePurpleLeftRef = useRef(null);
  const eyePurpleRightRef = useRef(null);
  const eyeBlackLeftRef = useRef(null);
  const eyeBlackRightRef = useRef(null);

  const canvasRef = useRef(null);

  // 静态资源
  const logoImg = '/images/logo192.png';
  const companyName = '宝宝乐园';
  const backgroundImg = '/images/love/Background.jpg';

  // --- Canvas 验证码逻辑 ---
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

  // 全局鼠标监听
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 橙色角色的嘴巴形状逻辑
  useEffect(() => {
    const updateMouth = () => {
      if (!orangeRef.current) return;
      const rect = orangeRef.current.getBoundingClientRect();
      const isNearOrange = (
        mouseX > rect.left - 50 &&
        mouseX < rect.right + 50 &&
        mouseY > rect.top - 50 &&
        mouseY < rect.bottom + 50
      );

      if (isNearOrange) {
        setMouthShape('circle');
      } else if (showPassword) {
        setMouthShape('foldUp');
      } else if (password.length > 0 && !showPassword) {
        setMouthShape('foldDown');
      } else {
        setMouthShape('circle');
      }
    };
    updateMouth();
  }, [mouseX, mouseY, showPassword, password]);

  // 紫色角色的嘴巴形状逻辑
  useEffect(() => {
    const updatePurpleMouth = () => {
      if (isTyping) {
        setPurpleMouthShape('foldDown');
      } else if (password.length > 0 && showPassword) {
        setPurpleMouthShape('foldUp');
      } else {
        setPurpleMouthShape('circle');
      }
    };
    updatePurpleMouth();
  }, [isTyping, password, showPassword]);

  // 眨眼逻辑
  useEffect(() => {
    const createBlinker = (setState) => {
      const schedule = () => {
        const timeout = setTimeout(() => {
          setState(true);
          setTimeout(() => {
            setState(false);
            schedule();
          }, 150);
        }, Math.random() * 4000 + 3000);
        return timeout;
      };
      return schedule();
    };

    const timerPurple = createBlinker(setIsPurpleBlinking);
    const timerBlack = createBlinker(setIsBlackBlinking);

    return () => {
      clearTimeout(timerPurple);
      clearTimeout(timerBlack);
    };
  }, []);

  // 打字交互逻辑
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    }
    setIsLookingAtEachOther(false);
  }, [isTyping]);

  // 偷看逻辑
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const timer = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => setIsPurplePeeking(false), 800);
        }, Math.random() * 3000 + 2000);
        return timer;
      };
      const timer = schedulePeek();
      return () => clearTimeout(timer);
    }
    setIsPurplePeeking(false);
  }, [password, showPassword]);

  // 位置计算辅助函数
  const calculatePosition = (ref) => {
    if (!ref?.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
    };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const isHidingPassword = password.length > 0 && !showPassword;

  // 动态样式计算
  const getPurpleStyle = () => ({
    height: isTyping || isHidingPassword ? '440px' : '400px',
    transform: (password.length > 0 && showPassword)
      ? `skewX(0deg)`
      : (isTyping || isHidingPassword)
        ? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
        : `skewX(${purplePos.bodySkew}deg)`,
  });

  const getBlackStyle = () => ({
    transform: (password.length > 0 && showPassword)
      ? `skewX(0deg)`
      : isLookingAtEachOther
        ? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(20px)`
        : (isTyping || isHidingPassword)
          ? `skewX(${blackPos.bodySkew * 1.5}deg)`
          : `skewX(${blackPos.bodySkew}deg)`,
  });

  const getOrangeStyle = () => ({
    transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew}deg)`,
  });

  const getYellowStyle = () => ({
    transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew}deg)`,
  });

  // 强制看向位置辅助
  const purpleForce = (password.length > 0 && showPassword)
    ? { x: isPurplePeeking ? 4 : -4, y: isPurplePeeking ? 5 : -4 }
    : isLookingAtEachOther ? { x: 3, y: 4 } : {};

  const blackForce = (password.length > 0 && showPassword)
    ? { x: -4, y: -4 }
    : isLookingAtEachOther ? { x: 0, y: -4 } : {};

  const othersForce = (password.length > 0 && showPassword) ? { x: -5, y: -4 } : {};

  useEffect(() => {
    generateCaptcha();

    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.message) {
      console.log(location.state.message);
    }
  }, []);

  // 监听输入变化，更新打字状态
  useEffect(() => {
    setIsTyping(email.length > 0 || password.length > 0);
  }, [email, password]);

  // 核心登录逻辑
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setCaptchaError(false);

    if (!email || !password) {
      setSubmitError('请输入邮箱和密码');
      return;
    }

    if (userInputCode.toUpperCase() !== captchaCode) {
      setCaptchaError(true);
      refreshCaptcha();
      setSubmitError('验证码错误');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email: email,
        password: password
      });

      console.log('登录响应:', response.data);

      if (response.data.success) {
        const userData = {
          ...response.data.user,
          loginTime: new Date().toISOString()
        };

        const token = response.data.token;

        if (!token) {
          throw new Error('服务器未返回Token');
        }

        setUserInfo(userData, token);

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
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className={styles.body}
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className={styles.overlay}></div>

      {/* 左右布局容器 */}
      <div className={styles.splitContainer}>
        {/* 左侧 - 动画角色区域 (桌面端显示) */}
        <div className={styles.charactersArea}>
          <div className={styles.charactersContainer}>

            {/* 紫色角色 */}
            <div ref={purpleRef} className={styles.purpleCharacter} style={getPurpleStyle()} data-mouth={purpleMouthShape}>
              <div className={styles.purpleEyes} style={{
                left: (password.length > 0 && showPassword) ? '20px' : isLookingAtEachOther ? '55px' : `${45 + purplePos.faceX}px`,
                top: (password.length > 0 && showPassword) ? '35px' : isLookingAtEachOther ? '65px' : `${40 + purplePos.faceY}px`,
              }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isPurpleBlinking} forceLookX={purpleForce.x} forceLookY={purpleForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={eyePurpleLeftRef} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isPurpleBlinking} forceLookX={purpleForce.x} forceLookY={purpleForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={eyePurpleRightRef} />
              </div>
              <div className={styles.purpleMouth} style={{
                left: (password.length > 0 && showPassword) ? '40px' : isLookingAtEachOther ? '75px' : `${70 + purplePos.faceX}px`,
                top: (password.length > 0 && showPassword) ? '90px' : isLookingAtEachOther ? '100px' : `${85 + purplePos.faceY}px`,
              }}>
                <div className={styles.purpleMouthContainer}>
                  <div className={styles.purpleMouthShape}></div>
                </div>
              </div>
            </div>

            {/* 黑色角色 */}
            <div ref={blackRef} className={styles.blackCharacter} style={getBlackStyle()}>
              <div className={styles.blackEyes} style={{
                left: (password.length > 0 && showPassword) ? '10px' : isLookingAtEachOther ? '32px' : `${26 + blackPos.faceX}px`,
                top: (password.length > 0 && showPassword) ? '28px' : isLookingAtEachOther ? '12px' : `${32 + blackPos.faceY}px`,
              }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking} forceLookX={blackForce.x} forceLookY={blackForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={eyeBlackLeftRef} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking} forceLookX={blackForce.x} forceLookY={blackForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={eyeBlackRightRef} />
              </div>
            </div>

            {/* 橙色角色 */}
            <div ref={orangeRef} className={styles.orangeCharacter} data-mouth={mouthShape} style={getOrangeStyle()}>
              <div className={styles.orangeEyes} style={{
                left: (password.length > 0 && showPassword) ? '50px' : `${82 + orangePos.faceX}px`,
                top: (password.length > 0 && showPassword) ? '85px' : `${90 + orangePos.faceY}px`,
              }}>
                <Pupil size={12} maxDistance={5} forceLookX={othersForce.x} forceLookY={othersForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={orangeRef} />
                <Pupil size={12} maxDistance={5} forceLookX={othersForce.x} forceLookY={othersForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={orangeRef} />
              </div>
              <div className={styles.orangeMouth} style={{
                left: (password.length > 0 && showPassword) ? '60px' : `${100 + orangePos.faceX}px`,
                top: (password.length > 0 && showPassword) ? '128px' : `${133 + orangePos.faceY}px`,
              }}>
                <div className={styles.mouthContainer}>
                  <div className={styles.mouthShape}></div>
                </div>
              </div>
            </div>

            {/* 黄色角色 */}
            <div ref={yellowRef} className={styles.yellowCharacter} style={getYellowStyle()}>
              <div className={styles.yellowEyes} style={{
                left: (password.length > 0 && showPassword) ? '20px' : `${52 + yellowPos.faceX}px`,
                top: (password.length > 0 && showPassword) ? '35px' : `${40 + yellowPos.faceY}px`,
              }}>
                <Pupil size={12} maxDistance={5} forceLookX={othersForce.x} forceLookY={othersForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={yellowRef} />
                <Pupil size={12} maxDistance={5} forceLookX={othersForce.x} forceLookY={othersForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={yellowRef} />
              </div>
              <div className={styles.yellowMouth} style={{
                left: (password.length > 0 && showPassword) ? '10px' : `${40 + yellowPos.faceX}px`,
                top: (password.length > 0 && showPassword) ? '88px' : `${88 + yellowPos.faceY}px`,
              }} />
            </div>

          </div>
        </div>

        {/* 右侧 - 登录表单 */}
        <div className={styles.formArea}>
          <div className={styles.loginBox}>
            <div className={styles.header}>
              <img src={logoImg} alt="公司Logo" className={styles.logo} />
              <h1 className={styles.companyName}>{companyName}</h1>
            </div>
            <h2 className={styles.prompt}>请登录</h2>

            <form onSubmit={handleSubmit}>
              <div className={styles.userBox}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (submitError) setSubmitError('');
                  }}
                  disabled={loading}
                  data-filled={email ? "true" : "false"}
                />
                <label className={styles.floatingLabel}>邮箱地址</label>
              </div>

              <div className={styles.userBox}>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (submitError) setSubmitError('');
                    }}
                    disabled={loading}
                    data-filled={password ? "true" : "false"}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                  >
                    {showPassword ? "隐藏" : "显示"}
                  </button>
                </div>
                <label className={styles.floatingLabel}>密码</label>
              </div>

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
                    if (submitError) setSubmitError('');
                  }}
                  className={`${captchaError ? styles.errorInput : ''}`}
                  placeholder="请输入验证码"
                  maxLength="4"
                  disabled={loading}
                  data-filled={userInputCode ? "true" : "false"}
                />
              </div>

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
      </div>
    </div>
  );
}

export default Login;