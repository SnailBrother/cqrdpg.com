import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AccountingCharts.css';
import Modal from'react-modal';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from'recharts';
import { useAuth } from '../../../context/AuthContext';

// #region start 辅助函数
// 辅助函数
const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getEndOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
// #endregion end

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AccountingCharts = () => {
  const { user } = useAuth();
          const username = user?.username; // 从 user 对象中获取 username
    // #region start 状态管理
    // 状态管理
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(getStartOfMonth());
    const [endDate, setEndDate] = useState(getEndOfMonth());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [chartType, setChartType] = useState('bar');
    // 修改 selectedPerson 的初始值为 username
    const [selectedPerson, setSelectedPerson] = useState(username);
    const [displayType, setDisplayType] = useState('expense'); 
    // #endregion end

    // #region start 数据获取
    // 数据获取
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get('https://www.cqrdpg.com:5202/api/lifebookkeepinggetRecords');
                setData(response.data);
            } catch (err) {
                console.error('获取数据失败:', err);
                setError('获取数据失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    // #endregion end

    // #region start 日期显示格式
    // 日期显示格式
    const getDateDisplay = () => {
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth() + 1;

        if (startYear === endYear && startMonth === endMonth) {
            return `${startYear}年${startMonth}月`;
        } else {
            return `${startYear}年${startMonth}月 - ${endYear}年${endMonth}月`;
        }
    };
    // #endregion end

    // #region start 筛选数据
    // 筛选数据
    const filterDataByDateAndPerson = (dataToFilter) => {
        if (!Array.isArray(dataToFilter)) return [];
        return dataToFilter.filter(item => {
            // 按人员筛选
            if (selectedPerson!== '全部' && item.created_by!== selectedPerson) {
                return false;
            }

            // 按日期筛选
            const transactionDate = new Date(item.transaction_date);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            return transactionDate >= start && transactionDate <= end;
        });
    };

    const filteredData = filterDataByDateAndPerson(data);
    // #endregion end

    // #region start 计算分类汇总
    // 计算分类汇总
    const calculateCategorySummary = (dataToCalculate) => {
        const incomeSummary = {};
        const expenseSummary = {};

        dataToCalculate.forEach(item => {
            if (item.transaction_type === '收入') {
                incomeSummary[item.category] = (incomeSummary[item.category] || 0) + item.amount;
            } else {
                expenseSummary[item.category] = (expenseSummary[item.category] || 0) + item.amount;
            }
        });

        return { incomeSummary, expenseSummary };
    };

    const { incomeSummary, expenseSummary } = calculateCategorySummary(filteredData);
    // #endregion end

    // #region start 计算总额
    // 计算总额
    const calculateTotal = (dataToCalculate) => {
        return dataToCalculate.reduce((acc, item) => {
            if (item.transaction_type === '收入') {
                acc.income += item.amount;
            } else {
                acc.expense += item.amount;
            }
            acc.balance = acc.income - acc.expense;
            return acc;
        }, { income: 0, expense: 0, balance: 0 });
    };

    const { income, expense, balance } = calculateTotal(filteredData);
    // #endregion end

    // #region start 准备图表数据
    // 准备图表数据
    const prepareChartData = (summaryData) => {
        return Object.entries(summaryData)
           .map(([category, amount]) => ({ name: category, value: amount }))
           .sort((a, b) => b.value - a.value);
    };

    const incomeChartData = prepareChartData(incomeSummary);
    const expenseChartData = prepareChartData(expenseSummary);
    // #endregion end

    // #region start 渲染图表
    // 渲染图表
    const renderChart = () => {
        const dataToDisplay = displayType === 'income'? incomeChartData : expenseChartData;
        const title = displayType === 'income'? '收入分类' : '支出分类';
        const color = displayType === 'income'? '#4CAF50' : '#F44336';

        if (dataToDisplay.length === 0) {
            return <div className="accountingcharts-no-data">当前没有{displayType === 'income'? '收入' : '支出'}数据</div>;
        }

        if (chartType === 'pie') {
            return (
                <div className="accountingcharts-chart-section">
                    <h3 className="accountingcharts-chart-title">{title}</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={dataToDisplay}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {dataToDisplay.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`¥${value.toFixed(2)}`, '金额']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="accountingcharts-chart-section">
                    <h3 className="accountingcharts-chart-title">{title}</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={dataToDisplay}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`¥${value.toFixed(2)}`, '金额']} />
                                <Legend />
                                <Bar dataKey="value" name="金额" fill={color} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }
    };
    // #endregion end

    if (loading) return <div className="accountingcharts-loading">加载中...</div>;
    if (error) return <div className="accountingcharts-error">{error}</div>;

    return (
        <div className="accountingcharts-tab-content"
        
        >
            {/* 时间选择器 */}
            <div className="accountingcharts-date-selector" onClick={() => setIsModalOpen(true)}>
                {getDateDisplay()}
                <span className="accountingcharts-date-edit">编辑</span>
            </div>

            {/* 汇总卡片 */}
            <div className="accountingcharts-summary-cards">
                <div 
                    className={`accountingcharts-summary-card income ${displayType === 'income'? 'active' : ''}`}
                    onClick={() => setDisplayType('income')}
                >
                    <h3>总收入</h3>
                    <p>¥{income.toFixed(2)}</p>
                </div>
                <div 
                    className={`accountingcharts-summary-card expense ${displayType === 'expense'? 'active' : ''}`}
                    onClick={() => setDisplayType('expense')}
                >
                    <h3>总支出</h3>
                    <p>¥{expense.toFixed(2)}</p>
                </div>
                <div className="accountingcharts-summary-card balance">
                    <h3>结余</h3>
                    <p>¥{balance.toFixed(2)}</p>
                </div>
            </div>

            {/* 图表显示 */}
            {renderChart()}

            {/* 时间筛选模态框 */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                className="accountingcharts-modal"
                overlayClassName="accountingcharts-modal-overlay"
                ariaHideApp={false}
            >
                <div className="accountingcharts-modal-header">
                    <h2>筛选设置</h2>
                    <button 
                        className="accountingcharts-modal-close-btn"
                        onClick={() => setIsModalOpen(false)}
                    >
                        ×
                    </button>
                </div>
                
                <div className="accountingcharts-modal-content">
                    <div className="accountingcharts-modal-section">
                        <h3>日期范围</h3>
                        <div className="accountingcharts-date-filters">
                            <div className="accountingcharts-date-filter">
                                <label>开始日期</label>
                                <input
                                    type="date"
                                    value={formatDate(startDate)}
                                    onChange={(e) => setStartDate(new Date(e.target.value))}
                                />
                            </div>
                            <div className="accountingcharts-date-filter">
                                <label>结束日期</label>
                                <input
                                    type="date"
                                    value={formatDate(endDate)}
                                    onChange={(e) => setEndDate(new Date(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="accountingcharts-modal-section">
                        <h3>人员筛选</h3>
                        <select
                            value={selectedPerson}
                            onChange={(e) => setSelectedPerson(e.target.value)}
                            className="accountingcharts-person-select"
                        >
                            <option value="全部">全部</option>
                            <option value="李中敬">李中敬</option>
                            <option value="陈彦羽">陈彦羽</option>
                        </select>
                    </div>

                    <div className="accountingcharts-modal-section">
                        <h3>图表类型</h3>
                        <div className="accountingcharts-chart-type-selector">
                            <label>
                                <input
                                    type="radio"
                                    value="bar"
                                    checked={chartType === 'bar'}
                                    onChange={() => setChartType('bar')}
                                />
                                柱状图
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="pie"
                                    checked={chartType === 'pie'}
                                    onChange={() => setChartType('pie')}
                                />
                                饼状图
                            </label>
                        </div>
                    </div>
                </div>

                <button 
                    className="accountingcharts-modal-confirm"
                    onClick={() => setIsModalOpen(false)}
                >
                    确定
                </button>
            </Modal>
        </div>
    );
};

export default AccountingCharts;    