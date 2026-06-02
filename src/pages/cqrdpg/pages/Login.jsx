import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';
import styles from './Login.module.css';

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

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

  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);
  const eyePurpleLeftRef = useRef(null);
  const eyePurpleRightRef = useRef(null);
  const eyeBlackLeftRef = useRef(null);
  const eyeBlackRightRef = useRef(null);

  const logoImg = 'https://www.cqrdpg.com/images/ruida/favicon.ico';
  const companyName = '重庆评估';
  const backgroundImg = 'https://www.cqrdpg.com/images/cqrdpg/home/CompanyProfile/Service.jpg';

  const getDeviceInfo = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('device_id', deviceId);
    }

    const getDeviceType = () => {
      const ua = navigator.userAgent.toLowerCase();

      if (
        /(ipad|tablet|(android(?!.*mobile)))/i.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      ) {
        return 'tablet';
      }

      if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
        if (/android/i.test(ua)) return 'android';
        if (/iphone|ipod|ios/i.test(ua)) return 'ios';
        return 'mobile';
      }

      return 'pc';
    };

    return { deviceId, deviceType: getDeviceType() };
  };

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
        setSubmitError(response.data.message || '验证码加载失败');
      }
    } catch (error) {
      console.error('获取验证码失败:', error);
      setSubmitError('验证码加载失败，请稍后重试');
    } finally {
      setCaptchaLoading(false);
    }
  };

  const refreshCaptcha = () => {
    fetchCaptcha();
    setUserInputCode('');
    setCaptchaError(false);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    }
    setIsLookingAtEachOther(false);
  }, [isTyping]);

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

  const purpleForce = (password.length > 0 && showPassword)
    ? { x: isPurplePeeking ? 4 : -4, y: isPurplePeeking ? 5 : -4 }
    : isLookingAtEachOther ? { x: 3, y: 4 } : {};

  const blackForce = (password.length > 0 && showPassword)
    ? { x: -4, y: -4 }
    : isLookingAtEachOther ? { x: 0, y: -4 } : {};

  const othersForce = (password.length > 0 && showPassword) ? { x: -5, y: -4 } : {};

  useEffect(() => {
    fetchCaptcha();

    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, []);

  useEffect(() => {
    setIsTyping(email.length > 0 || password.length > 0);
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setCaptchaError(false);

    if (!email || !password) {
      setSubmitError('请输入邮箱和密码');
      return;
    }

    if (!userInputCode.trim()) {
      setCaptchaError(true);
      setSubmitError('请输入验证码');
      return;
    }

    if (!captchaId) {
      setCaptchaError(true);
      setSubmitError('验证码无效，请刷新后重试');
      return;
    }

    setLoading(true);

    const { deviceId, deviceType } = getDeviceInfo();

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
        device_id: deviceId,
        device_type: deviceType,
        captchaId,
        captchaCode: userInputCode
      });

      if (response.data.success) {
        localStorage.setItem('device_id', deviceId);
        localStorage.setItem('device_type', deviceType);

        const userData = {
          ...response.data.user,
          loginTime: new Date().toISOString()
        };

        const token = response.data.token;

        if (!token) {
          throw new Error('服务器未返回Token');
        }

        setUserInfo(userData, token);

        const from = location.state?.from?.pathname || '/home';
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
      setCaptchaError(true);
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

      <div className={styles.splitContainer}>
        <div className={styles.charactersArea}>
          <div className={styles.charactersContainer}>
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

            <div ref={blackRef} className={styles.blackCharacter} style={getBlackStyle()}>
              <div className={styles.blackEyes} style={{
                left: (password.length > 0 && showPassword) ? '10px' : isLookingAtEachOther ? '32px' : `${26 + blackPos.faceX}px`,
                top: (password.length > 0 && showPassword) ? '28px' : isLookingAtEachOther ? '12px' : `${32 + blackPos.faceY}px`,
              }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking} forceLookX={blackForce.x} forceLookY={blackForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={eyeBlackLeftRef} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking} forceLookX={blackForce.x} forceLookY={blackForce.y} mouseX={mouseX} mouseY={mouseY} parentRef={eyeBlackRightRef} />
              </div>
            </div>

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
                <div
                  className={styles.captchaSvgBox}
                  title="点击刷新"
                  onClick={refreshCaptcha}
                >
                  {captchaLoading ? (
                    <span>加载中...</span>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: captchaSvg }} />
                  )}
                </div>
                <button
                  type="button"
                  className={styles.refreshBtn}
                  onClick={refreshCaptcha}
                  disabled={loading || captchaLoading}
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
                    setUserInputCode(e.target.value.toUpperCase());// 👈 这里自动转成了大写
                  //  setUserInputCode(e.target.value); // 不自动转换
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
                disabled={loading || captchaLoading}
              >
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                {loading ? '登录中...' : '登 录'}
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