// src/pages/user/login/index.js
// src/pages/user/login/index.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './login.module.css';

const Login = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { setUserInfo } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // 添加 useEffect 来接收注册页面传递的邮箱
    useEffect(() => {
        if (location.state?.email) {
            setFormData(prev => ({
                ...prev,
                email: location.state.email
            }));
        }

        // 如果有注册成功的消息，可以显示给用户
        if (location.state?.message) {
            // 这里可以添加一个提示消息显示
            console.log(location.state.message); // 或者使用 message 组件显示
        }
    }, [location.state]);

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setLoading(true);
            try {
                // 直接使用 axios 调用登录接口
                const response = await axios.post('/api/auth/login', {
                    email: formData.email,
                    password: formData.password
                });

                console.log('登录响应:', response.data);

                if (response.data.success) {
                    // 创建用户数据
                    // const userData = {
                    //     id: response.data.user?.id || Date.now(),
                    //     username: response.data.user?.username || formData.email.split('@')[0],
                    //     email: response.data.user?.email || formData.email,

                    //     permission_level: response.data.user.permission_level,
                    //     profile_picture: response.data.user.profile_picture,
                    //     registration_date: response.data.user.registration_date,
                    //     last_login_time: response.data.user.last_login_time,
                    //     loginTime: new Date().toISOString()
                    // };
                    const userData = {
                        ...response.data.user,  // 展开后端返回的所有用户信息
                        loginTime: new Date().toISOString()
                    };
                    // 获取token
                    // const token = response.data.token ||
                    //     response.data.accessToken ||
                    //     response.data.access_token ||
                    //     response.data.authToken ||
                    //     response.data.user?.token;
                    // 获取token
                    const token = response.data.token;
                    // 使用 AuthContext 设置用户信息
                    setUserInfo(userData, token);

                    // 登录成功后跳转
                    const from = location.state?.from?.pathname || '/apps';
                    navigate(from, { replace: true });
                } else {
                    throw new Error(response.data.message || '登录失败');
                }
            } catch (error) {
                console.error('登录错误:', error);
                let errorMessage = '登录失败，请检查邮箱和密码';

                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                setErrors({ submit: errorMessage });
            } finally {
                setLoading(false);
            }
        }
    };

    const goToRegister = () => {
        navigate('/register');
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBackground}>
                <div className={styles.loginShapes}>
                    <div className={styles.shape1}></div>
                    <div className={styles.shape2}></div>
                    <div className={styles.shape3}></div>
                </div>
            </div>

            <div className={styles.loginCard}>
                <div className={styles.loginHeader}>
                    <div className={styles.loginLogo}>
                        <span className={styles.logoIcon}>
                            <svg className={styles.githublogoIcon} aria-hidden="true">
                                <use xlinkHref="#icon-github"></use>
                            </svg>
                        </span>
                        <h1>Rect Demo</h1>
                    </div>
                    <p className={styles.loginSubtitle}>
                        欢迎回来，请登录您的账户
                    </p>
                </div>

                <form className={styles.loginForm} onSubmit={handleSubmit}>
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

                    <div className={styles.formOptions}>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" className={styles.checkboxInput} />
                            <span className={styles.checkboxText}>记住我</span>
                        </label>
                        <a href="#" className={styles.forgotLink}>忘记密码？</a>
                    </div>

                    {errors.submit && (
                        <div className={styles.submitError}>{errors.submit}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`${styles.loginButton} ${loading ? styles.loading : ''}`}
                    >
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>

                <div className={styles.loginFooter}>
                    <p className={styles.switchMode}>
                        还没有账户？
                        <button
                            type="button"
                            onClick={goToRegister}
                            className={styles.switchButton}
                        >
                            立即注册
                        </button>
                    </p>

                    <div className={styles.divider}>
                        <span>或</span>
                    </div>

                    <div className={styles.socialLogin}>
                        <button
                            type="button"
                            className={styles.socialButton}
                        >
                            <span className={styles.socialIcon}>
                                <svg className={styles.githublogoIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-qitadenglu_QQdenglu_hover"></use>
                                </svg>
                            </span>
                            使用 QQ 登录
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
                            使用 微信 登录
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;