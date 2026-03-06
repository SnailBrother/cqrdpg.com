import React, { useState, useEffect, useContext } from 'react';
import {
    Card,
    Button,
    Modal,
    Select,
    Input,
    DatePicker,
    Calendar,
    Spin,
    Alert,
    Tabs,
    Row,
    Col,
    Tag,
    Image,
    Carousel,
    Form,
    InputNumber,
    ConfigProvider,
    theme
} from 'antd';
import {
    SearchOutlined,
    CalendarOutlined,
    CloudOutlined,
    FileTextOutlined,
    LeftOutlined,
    RightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/locale/zh_CN';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import io from 'socket.io-client';
import './DressingGuidelines.css';

dayjs.locale('zh-cn');
const { Option } = Select;

// 评论组件（现在作为内部组件）
const DressingComment = ({ weatherdata_id, date }) => {
    const API_BASE_URL = 'http://121.4.22.55:5202/api';
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user, logout } = useAuth();
    const username = user?.username; // 从 user 对象中获取 username
    const [socket, setSocket] = useState(null);

    // 初始化Socket连接
    useEffect(() => {
        const newSocket = io('http://121.4.22.55:5202');
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // 订阅评论更新
    useEffect(() => {
        if (!socket || !weatherdata_id) return;

        socket.emit('subscribe_comments', weatherdata_id);

        socket.on('newComment', (comment) => {
            if (comment.weatherdata_id === weatherdata_id) {
                setComments(prev => [comment, ...prev]); // 新评论放在前面
            }
        });

        return () => {
            socket.off('newComment');
            socket.emit('unsubscribe_comments', weatherdata_id);
        };
    }, [socket, weatherdata_id]);

    // 获取已有评论
    useEffect(() => {
        const fetchComments = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE_URL}/dressing-comments/${weatherdata_id}`);
                setComments(response.data);
                setLoading(false);
            } catch (err) {
                setError('获取评论失败');
                setLoading(false);
                console.error('Error fetching comments:', err);
            }
        };

        if (weatherdata_id) {
            fetchComments();
        }
    }, [weatherdata_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !username) return;

        try {
            setLoading(true);
            console.log('准备提交的参数：', {
                weatherdata_id: weatherdata_id,
                comment: newComment,
                user_name: username
            }); // 添加日志输出参数
            const response = await axios.post(`${API_BASE_URL}/dressing-comments`, {
                weatherdata_id: weatherdata_id,
                comment: newComment,
                user_name: username
            });

            console.log('评论提交成功:', response.data);
            setNewComment('');
        } catch (err) {
            console.error('评论提交错误详情:', err.response?.data || err.message);
            setError(`提交评论失败: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="dressing-comments-section">
            <div className="dressing-comment-header">
                <h3>评论：</h3>
            </div>

            {error && <div className="dressing-comment-error">{error}</div>}

            <div className="dressing-comment-list">
                {loading && comments.length === 0 ? (
                    <div className="dressing-comment-loading">加载中...</div>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="dressing-comment-item">
                            <div className="dressing-comment-user">
                                <span className="dressing-comment-username">{comment.user_name}</span>
                                <span className="dressing-comment-time">{formatDate(comment.created_at)}</span>
                            </div>
                            <div className="dressing-comment-content">{comment.comment}</div>
                        </div>
                    ))
                ) : (
                    <div className="dressing-comment-empty">暂无评论</div>
                )}
            </div>

            {username && (
                <form onSubmit={handleSubmit} className="dressing-comment-form">
                    <textarea
                        className="dressing-comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="写下你的评论..."
                        rows="3"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="dressing-comment-submit"
                        disabled={!newComment.trim() || loading}
                    >
                        {loading ? '提交中...' : '提交评论'}
                    </button>
                </form>
            )}
        </div>
    );
};

// 主组件
const DressingGuidelines = () => {
    const API_BASE_URL = 'http://121.4.22.55:5202/api';
    const [currentDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [searchDate, setSearchDate] = useState('');
    const [searchWeather, setSearchWeather] = useState('');
    const [searchTempRange, setSearchTempRange] = useState([0, 40]);
    const [searchResult, setSearchResult] = useState(null);
    const [todayOutfit, setTodayOutfit] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchMode, setSearchMode] = useState('date');
    const [error, setError] = useState(null);
    const [dateList, setDateList] = useState([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const username = user?.username; // 从 user 对象中获取 username
    const [searchKeyword, setSearchKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('today');

    // 在组件加载时获取日期列表
    const [hasFetchedHistory, setHasFetchedHistory] = useState(false);

    useEffect(() => {
        if (activeTab === 'history' && !hasFetchedHistory) {
            fetchDateList();
            setHasFetchedHistory(true);
        }
    }, [activeTab, hasFetchedHistory]);

    // 或者如果希望只在打开历史标签页时获取一次
    useEffect(() => {
        if (activeTab === 'history' && dateList.length === 0) {
            fetchDateList();
        }
    }, [activeTab, dateList.length]);
    // 检查权限
    useEffect(() => {
        const allowedUsers = ['李中敬', '陈彦羽'];
        if (!allowedUsers.includes(username) || !username) {
            const timer = setTimeout(() => {
                navigate('/login');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [username, navigate]);

    // 获取随机历史穿搭作为今日推荐
    useEffect(() => {
        const fetchRandomOutfit = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${API_BASE_URL}/dressing-guidelines/random`);
                if (response.data) {
                    setTodayOutfit(response.data);
                }
                setLoading(false);
            } catch (err) {
                setError('获取随机穿搭数据失败');
                setLoading(false);
                console.error('Error fetching random outfit:', err);
            }
        };

        if (['李中敬', '陈彦羽'].includes(username)) {
            fetchRandomOutfit();
        }
    }, [username]);

    // 获取日期列表
    const fetchDateList = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/dressing-guidelines/dates`);
            setDateList(response.data);
            setLoading(false);
        } catch (err) {
            setError('获取日期列表失败');
            setLoading(false);
            console.error('Error fetching date list:', err);
        }
    };

    // 搜索特定条件的穿搭
    const handleSearch = async (dateOverride = null) => {
        try {
            setLoading(true);
            setError(null);
            setSearchResult(null);

            let params = {};
            const finalSearchDate = dateOverride || searchDate;

            if (searchMode === 'date') {
                if (!finalSearchDate) {
                    setError('请选择一个日期');
                    setLoading(false);
                    return;
                }
                const formattedDate = dayjs(finalSearchDate).format('YYYY-MM-DD');
                params = { mode: 'date', date: formattedDate };
            } else if (searchMode === 'weather') {
                params = { mode: 'weather', weather: searchWeather };
            } else if (searchMode === 'temperature') {
                params = {
                    mode: 'temperature',
                    minTemp: searchTempRange[0],
                    maxTemp: searchTempRange[1]
                };
            } else if (searchMode === 'keyword') {
                if (!searchKeyword.trim()) {
                    setError('请输入搜索关键词');
                    setLoading(false);
                    return;
                }
                params = { mode: 'keyword', keyword: searchKeyword.trim() };
            }

            const response = await axios.get(`${API_BASE_URL}/dressing-guidelines/search`, { params });
            const results = response.data.length > 0 ? response.data : null;
            setSearchResult(results);
            setLoading(false);
        } catch (err) {
            setError('搜索失败，请重试');
            setLoading(false);
            console.error('Error searching outfits:', err);
        }
    };

    // 图片加载错误处理
    const handleImageError = (e) => {
        e.target.src = '/images/default.jpg';
    };

    // 自定义日历渲染
    const CustomCalendar = ({ onDateSelect }) => {
        const [currentValue, setCurrentValue] = useState(dayjs());

        // 生成年份选项
        const yearOptions = [];
        for (let i = currentValue.year() - 10; i < currentValue.year() + 10; i += 1) {
            yearOptions.push(
                <option key={i} value={i} className="year-item">
                    {i}年
                </option>
            );
        }

        // 生成月份选项
        const monthOptions = [];
        for (let i = 0; i < 12; i += 1) {
            monthOptions.push(
                <option key={`month-${i}`} value={i} className="month-item">
                    {i + 1}月
                </option>
            );
        }

        // 自定义头部渲染
        const headerRender = () => (
            <div style={{ padding: 8 }}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <select
                        value={currentValue.year()}
                        onChange={(e) => {
                            const newValue = currentValue.clone().year(parseInt(e.target.value, 10));
                            setCurrentValue(newValue);
                        }}
                    >
                        {yearOptions}
                    </select>
                    <select
                        value={currentValue.month()}
                        onChange={(e) => {
                            const newValue = currentValue.clone().month(parseInt(e.target.value, 10));
                            setCurrentValue(newValue);
                        }}
                    >
                        {monthOptions}
                    </select>
                </div>
            </div>
        );

        // 自定义日期单元格渲染
        const dateFullCellRender = (current) => {
            const dateString = current.format('YYYY-MM-DD');
            const hasData = dateList.some(item => item.date === dateString);

            return (
                <div
                    className={`dressing-calendar-date-cell ${hasData ? 'has-data' : 'no-data'}`}
                    onClick={() => {
                        if (hasData) {
                            onDateSelect(dateString);
                        }
                    }}
                >
                    {current.date()}
                </div>
            );
        };

        return (
            <div className="dressing-calendar-container">
                <Calendar
                    fullscreen={false}
                    value={currentValue}
                    headerRender={headerRender}
                    dateFullCellRender={dateFullCellRender}
                    onChange={setCurrentValue}
                />
            </div>
        );
    };

    const handleDateSelect = (dateString) => {
        setSearchDate(dateString);
        setSearchMode('date');
        setShowSearchModal(false);
        handleSearch(dateString);
    };

    if (!['李中敬', '陈彦羽'].includes(username) || !username) {
        return (
            <div className="dressing-permission-denied">
                <Alert
                    message="权限不足"
                    description="您没有权限访问此页面，即将跳转到登录页面。"
                    type="warning"
                    showIcon
                />
            </div>
        );
    }

    return (
        <ConfigProvider locale={zhCN}
        // theme={{
        //     algorithm: theme.darkAlgorithm,
        //     token: {
        //         colorPrimary: '#722ed1',
        //         colorBgBase: '#0a0a1a',
        //         colorTextBase: '#ffffff',
        //         colorBgContainer: '#14142a',
        //         colorBorder: '#2a2a4a',
        //     }
        // }}
        >
            <div className="dressing-guide-container">
                {error && (
                    <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} className="dressing-error-alert" />
                )}

                <Card className="dressing-main-card" bordered={false}>
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                        { key: 'today', label: <span><CalendarOutlined />今日推荐</span> },
                        { key: 'history', label: <span><SearchOutlined />历史查询</span> }
                    ]} />

                    {activeTab === 'today' && (
                        <div className="dressing-today-section">
                            <div className="dressing-section-header">
                                <h2>今日穿搭推荐</h2>
                                <span className="dressing-date-badge">{currentDate}</span>
                            </div>

                            {loading && !todayOutfit ? (
                                <div className="dressing-loading-container"><Spin size="large" /><p>加载中...</p></div>
                            ) : todayOutfit ? (
                                <Card className="dressing-outfit-card" bordered={false}>
                                    <Row gutter={[24, 24]}>
                                        <Col xs={24} md={10}>
                                            <div className="dressing-weather-info-panel">
                                                <div className="dressing-weather-meta">
                                                    <Tag color="volcano">{todayOutfit.minTemperature}~{todayOutfit.maxTemperature}°C</Tag>
                                                    <Tag color="blue">{todayOutfit.weather}</Tag>
                                                </div>
                                                <p className="dressing-suggestion-text">{todayOutfit.suggestion}</p>
                                            </div>
                                        </Col>
                                        <Col xs={24} md={14}>
                                            <div className="dressing-image-gallery">
                                                {todayOutfit.images.length > 0 ? (
                                                    <Carousel
                                                        arrows
                                                        infinite={false}
                                                        dots={{ className: 'dressing-custom-dots' }}
                                                        prevArrow={<LeftOutlined />}
                                                        nextArrow={<RightOutlined />}
                                                    >
                                                        {todayOutfit.images.map((image, index) => (
                                                            <div key={index} className="dressing-carousel-item">
                                                                <div className="dressing-image-container">
                                                                    <Image
                                                                        src={image.url}
                                                                        alt={`穿搭示例 ${index + 1}`}
                                                                        onError={handleImageError}
                                                                        placeholder={<div className="dressing-image-placeholder"><Spin size="large" /></div>}
                                                                        preview={{
                                                                            src: image.url,
                                                                            title: `${image.type} - ${image.description}`
                                                                        }}
                                                                    />
                                                                    <div className="dressing-image-info">
                                                                        <h4>{image.type}</h4>
                                                                        <p>{image.description}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </Carousel>
                                                ) : (
                                                    <div className="dressing-no-images-placeholder">
                                                        <FileTextOutlined style={{ fontSize: '48px', color: '#555' }} />
                                                        <p>暂无穿搭图片</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                    {/* 移除了评论组件 */}
                                </Card>
                            ) : (
                                <div className="dressing-no-data-container"><p>暂无今日穿搭数据</p></div>
                            )}
                        </div>
                    )}
                    <div className="dressing-results-container-out">
                        {activeTab === 'history' && (
                            <div className="dressing-history-section">
                                <div className="dressing-search-controls">

                                    <div className="dressing-search-mode-selector">
                                        <Select value={searchMode} onChange={setSearchMode} className="dressing-mode-select">
                                            <Option value="date">日期查询</Option>
                                            <Option value="weather">天气查询</Option>
                                            <Option value="temperature">温度查询</Option>
                                            <Option value="keyword">关键词查询</Option>
                                        </Select>
                                    </div>

                                    <div className="dressing-search-inputs">
                                        {searchMode === 'date' && (
                                            <DatePicker
                                                value={searchDate ? dayjs(searchDate) : null}
                                                onChange={(date, dateString) => setSearchDate(dateString)}
                                                placeholder="选择日期"
                                                className="dressing-search-input dressing-search-input-DatePicker"
                                                popupClassName="dressing-datepicker-dropdown"
                                                suffixIcon={<CalendarOutlined />}
                                                disabledDate={(current) => {
                                                    if (!current) return true;
                                                    const dateString = current.format('YYYY-MM-DD');
                                                    return !dateList.some(item => item.date === dateString);
                                                }}
                                                dateRender={(current) => {
                                                    const dateString = current.format('YYYY-MM-DD');
                                                    const hasData = dateList.some(item => item.date === dateString);

                                                    return (
                                                        <div className={`custom-date-cell ${hasData ? 'dressing-has-data' : 'dressing-no-data'}`}>
                                                            {current.date()}
                                                        </div>
                                                    );
                                                }}
                                            />
                                        )}
                                        {searchMode === 'weather' && (
                                            <Select
                                                value={searchWeather}
                                                onChange={setSearchWeather}
                                                placeholder="选择天气类型"
                                                className="dressing-search-input"
                                                suffixIcon={<CloudOutlined />}
                                            >
                                                <Option value="晴">晴天</Option>
                                                <Option value="多云">多云</Option>
                                                <Option value="小雨">小雨</Option>
                                                <Option value="阴">阴天</Option>
                                            </Select>
                                        )}
                                        {searchMode === 'temperature' && (
                                            <div className="dressing-temp-range-input">
                                                <InputNumber
                                                    min={-20}
                                                    max={50}
                                                    value={searchTempRange[0]}
                                                    onChange={(value) => setSearchTempRange([value, searchTempRange[1]])}
                                                    placeholder="最低温度"
                                                    className="dressing-temp-input"
                                                />
                                                <span className="dressing-range-separator">~</span>
                                                <InputNumber
                                                    min={-20}
                                                    max={50}
                                                    value={searchTempRange[1]}
                                                    onChange={(value) => setSearchTempRange([searchTempRange[0], value])}
                                                    placeholder="最高温度"
                                                    className="dressing-temp-input"
                                                />
                                                <span className="dressing-temp-unit">°C</span>
                                            </div>
                                        )}
                                        {searchMode === 'keyword' && (
                                            <Input
                                                value={searchKeyword}
                                                onChange={(e) => setSearchKeyword(e.target.value)}
                                                placeholder="输入关键词(如:外套、裙子等)"
                                                className="dressing-search-input"
                                                suffixIcon={<SearchOutlined />}
                                            />
                                        )}

                                        <Button
                                            icon={<CalendarOutlined />}
                                            onClick={() => { fetchDateList(); setShowSearchModal(true); }}
                                            className="dressing-calendar-button"
                                        >
                                            {/* 日历 */}
                                        </Button>
                                        <Button
                                            type="primary"
                                            onClick={() => handleSearch()}
                                            loading={loading}
                                            icon={<SearchOutlined />}
                                            className="dressing-search-button"
                                        >
                                            {/* 查询 */}
                                        </Button>
                                    </div>
                                </div>

                                {/* 添加滚动容器 */}
                                <div className="dressing-results-container">
                                    {loading && !searchResult && (
                                        <div className="dressing-loading-container">
                                            <Spin size="large" />
                                            <p>查询中...</p>
                                        </div>)}

                                    {searchResult && !loading && (
                                        <div className="dressing-search-results">
                                            {searchResult.map((result) => (
                                                <Card key={result.id} className="dressing-result-card" bordered={false}>
                                                    <div className="dressing-result-header">
                                                        <div className="dressing-result-meta">
                                                            <span className="dressing-result-date">{dayjs(result.date).format('YYYY-MM-DD')}</span>
                                                            <Tag color="volcano">{result.minTemperature}~{result.maxTemperature}°C</Tag>
                                                            <Tag color="blue">{result.weather}</Tag>
                                                        </div>
                                                        <p className="dressing-result-suggestion">{result.suggestion}</p>
                                                    </div>

                                                    <div className="dressing-result-content">
                                                        {result.images.length > 0 ? (
                                                            <div className="dressing-image-grid-container">
                                                                <div className="dressing-image-grid">
                                                                    {result.images.map((image, imgIndex) => (
                                                                        <div key={imgIndex} className="dressing-grid-item">
                                                                            <div className="dressing-grid-image-wrapper">
                                                                                <Image
                                                                                    src={image.url}
                                                                                    alt={image.description}
                                                                                    onError={handleImageError}
                                                                                    preview={{
                                                                                        src: image.url,
                                                                                        title: `${image.type} - ${image.description}`
                                                                                    }}
                                                                                />
                                                                                <div className="dressing-grid-image-info">
                                                                                    <span>{image.type}</span>

                                                                                    <p>{image.description}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="dressing-no-images-placeholder">
                                                                <FileTextOutlined style={{ fontSize: '48px', color: '#555' }} />
                                                                <p>暂无穿搭图片</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 使用独立的评论组件 */}
                                                    <DressingComment
                                                        weatherdata_id={result.id}
                                                        date={dayjs(result.date).format('YYYY-MM-DD')}
                                                    />
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    {searchResult === null && !loading && (
                                        <div className="dressing-no-results-container">
                                            <p>没有找到匹配的穿搭记录，或请先发起查询。</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                <Modal
                    title="历史记录日历"
                    open={showSearchModal}
                    onCancel={() => setShowSearchModal(false)}
                    footer={null}
                    width={700}
                    className="dressing-calendar-modal"
                >
                    <CustomCalendar onDateSelect={handleDateSelect} />
                </Modal>
            </div>
        </ConfigProvider>
    );
};

export default DressingGuidelines;