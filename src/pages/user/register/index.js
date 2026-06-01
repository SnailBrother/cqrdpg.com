import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './register.module.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        inviteCode: ''           // 邀请码
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // 验证码相关状态
    const [captchaCode, setCaptchaCode] = useState('');
    const [userInputCode, setUserInputCode] = useState('');
    const [captchaError, setCaptchaError] = useState(false);
    const canvasRef = useRef(null);

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

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username) {
            newErrors.username = '用户名不能为空';
        }

        if (!formData.email) {
            newErrors.email = '邮箱不能为空';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = '邮箱格式不正确';
        }

        if (!formData.password) {
            newErrors.password = '密码不能为空';
        } else if (formData.password.length < 6) {
            newErrors.password = '密码至少6位';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = '请确认密码';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '两次密码不一致';
        }

        if (!userInputCode) {
            newErrors.verificationCode = '请输入验证码';
        } else if (userInputCode !== captchaCode) {
            newErrors.verificationCode = '验证码错误';
        }

        if (!formData.inviteCode) {
            newErrors.inviteCode = '请输入邀请码';
        } else if (formData.inviteCode !== 'F8d@jR1*wC5$vE7^aL') {
            newErrors.inviteCode = '邀请码错误';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 验证码验证
        if (userInputCode !== captchaCode) {
            setCaptchaError(true);
            setErrors(prev => ({ ...prev, verificationCode: '验证码错误' }));
            refreshCaptcha();
            return;
        }

        if (validateForm()) {
            setLoading(true);
            try {
                // 并行调用两个注册接口
                const [authResponse, chatResponse] = await Promise.all([
                    // 调用现有的注册接口，传入邀请码
                    axios.post('/api/auth/register', {
                        username: formData.username,
                        email: formData.email,
                        password: formData.password,
                        inviteCode: formData.inviteCode      // 邀请码
                    }),
                    // 调用新的Chat注册接口（只传用户名和密码）
                    axios.post('/api/ChatRegister', {
                        username: formData.username,
                        password: formData.password
                    })
                ]);

                // 检查两个接口是否都成功
                const authSuccess = authResponse.data && authResponse.data.success;
                const chatSuccess = chatResponse.data && chatResponse.data.message === '注册成功';

                if (authSuccess && chatSuccess) {
                    // 两个注册都成功后跳转到登录页面
                    navigate('/login', {
                        state: {
                            message: '注册成功！请使用您的账户登录。',
                            email: formData.email
                        }
                    });
                } else {
                    // 如果有任何一个失败，尝试回滚已成功的注册
                    let errorMessages = [];

                    if (!authSuccess) {
                        errorMessages.push(authResponse.data?.message || '主注册失败');
                    }

                    if (!chatSuccess) {
                        errorMessages.push(chatResponse.data?.message || '聊天系统注册失败');
                    }

                    // 尝试删除已经注册成功的账号（如果有的话）
                    if (chatSuccess && !authSuccess) {
                        try {
                            await axios.delete('/api/ChatRegister', {
                                data: { username: formData.username }
                            });
                        } catch (deleteError) {
                            console.error('回滚Chat注册失败:', deleteError);
                        }
                    }

                    throw new Error(errorMessages.join('，'));
                }
            } catch (error) {
                console.error('注册错误:', error);
                let errorMessage = '注册失败，请稍后重试';

                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                // 处理特定的错误消息
                if (errorMessage.includes('用户名已存在') || errorMessage.includes('该账号已存在')) {
                    setErrors({ submit: '用户名已存在，请选择其他用户名' });
                } else if (errorMessage.includes('邀请码')) {
                    setErrors({ submit: errorMessage });
                } else {
                    setErrors({ submit: errorMessage });
                }

                // 刷新验证码
                refreshCaptcha();
            } finally {
                setLoading(false);
            }
        }
    };

    const goToLogin = () => {
        navigate('/login');
    };

    return (
        <div className={styles.registerContainer}>
            <div className={styles.registerBackground}>
                <div className={styles.registerShapes}>
                    <div className={styles.shape1}></div>
                    <div className={styles.shape2}></div>
                    <div className={styles.shape3}></div>
                </div>
            </div>

            <div className={styles.registerCard}>
                <div className={styles.registerHeader}>
                    <div className={styles.registerLogo}>
                        <span className={styles.logoIcon}>
                            <svg className={styles.githublogoIcon} aria-hidden="true">
                                <use xlinkHref="#icon-github"></use>
                            </svg>
                        </span>
                        <h1>重庆专业评估</h1>
                    </div>
                    <p className={styles.registerSubtitle}>
                        创建新账户，开始使用我们的服务
                    </p>
                </div>

                <form className={styles.registerForm} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username" className={styles.formLabel}>用户名</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className={`${styles.formInput} ${errors.username ? styles.inputError : ''}`}
                            placeholder="请输入用户名"
                            required
                        />
                        {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.formLabel}>邮箱地址</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`${styles.formInput} ${errors.email ? styles.inputError : ''}`}
                            placeholder="请输入邮箱地址"
                            required
                        />
                        {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.formLabel}>密码</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={`${styles.formInput} ${errors.password ? styles.inputError : ''}`}
                            placeholder="请输入密码"
                            required
                        />
                        {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword" className={styles.formLabel}>确认密码</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={`${styles.formInput} ${errors.confirmPassword ? styles.inputError : ''}`}
                            placeholder="请再次输入密码"
                            required
                        />
                        {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
                    </div>
                    {/* 邀请码输入框 */}
                    <div className={styles.formGroup}>
                        <label htmlFor="inviteCode" className={styles.formLabel}>邀请码</label>
                        <input
                            type="text"
                            id="inviteCode"
                            name="inviteCode"
                            value={formData.inviteCode}
                            onChange={(e) => handleInputChange('inviteCode', e.target.value)}
                            className={`${styles.formInput} ${errors.inviteCode ? styles.inputError : ''}`}
                            placeholder="请输入邀请码"
                            required
                        />
                        {errors.inviteCode && <span className={styles.errorMessage}>{errors.inviteCode}</span>}
                    </div>
                    {/* 验证码区域 */}
                    <div className={styles.formGroup}>
                         <label className={styles.formLabel}>验证码</label>
                         <input
                            type="text"
                            placeholder="请输入验证码"
                            value={userInputCode}
                            onChange={(e) => {
                                setUserInputCode(e.target.value.toUpperCase());
                                setCaptchaError(false);
                                if (errors.verificationCode) {
                                    setErrors(prev => ({ ...prev, verificationCode: '' }));
                                }
                            }}
                            className={`${styles.formInput} ${styles.captchaInput} ${errors.verificationCode ? styles.inputError : ''}`}
                            maxLength="4"
                            required
                        />
                       
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
                       
                        {errors.verificationCode && <span className={styles.errorMessage}>{errors.verificationCode}</span>}
                    </div>



                    {errors.submit && (
                        <div className={styles.submitError}>{errors.submit}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`${styles.registerButton} ${loading ? styles.loading : ''}`}
                    >
                        {loading ? '注册中...' : '注册'}
                    </button>
                </form>

                <div className={styles.registerFooter}>
                    <p className={styles.switchMode}>
                        已有账户？
                        <button
                            type="button"
                            onClick={goToLogin}
                            className={styles.switchButton}
                        >
                            立即登录
                        </button>
                    </p>

                    <div className={styles.divider}>
                        <span>或</span>
                    </div>

                    <div className={styles.socialRegister}>
                        <button
                            type="button"
                            className={styles.socialButton}
                        >
                            <span className={styles.socialIcon}>
                                <svg className={styles.githublogoIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-qitadenglu_QQdenglu_hover"></use>
                                </svg>
                            </span>
                            使用 QQ 注册
                        </button>
                        <button
                            type="button"
                            className={styles.socialButton}
                        >
                            <span className={styles.socialIcon}>
                                <svg className={styles.githublogoIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-denglu-weixindenglu"></use>
                                </svg>
                            </span>
                            使用 微信 注册
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;