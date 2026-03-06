import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccountingHomePage.css';
import Modal from 'react-modal';
import WordReportGeneratorLoader from './Notification/WordReportGeneratorLoader';

// 获取当月第一天（如2025-04-01）
const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

// 获取当月最后一天（如2025-04-30）
const getEndOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

const AccountingHomePage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(getStartOfMonth());
    const [endDate, setEndDate] = useState(getEndOfMonth());
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get('http://121.4.22.55:5202/api/lifebookkeepinggetRecords');
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

    const filterDataByDate = (data) => {
        return data.filter(item => {
            const transactionDate = new Date(item.transaction_date);
            // 确保比较时忽略时间部分
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            return transactionDate >= start && transactionDate <= end;
        });
    };

    const calculateCategorySummary = (data) => {
        const incomeSummary = {};
        const expenseSummary = {};

        data.forEach(item => {
            if (item.transaction_type === '收入') {
                if (!incomeSummary[item.category]) {
                    incomeSummary[item.category] = 0;
                }
                incomeSummary[item.category] += item.amount;
            } else {
                if (!expenseSummary[item.category]) {
                    expenseSummary[item.category] = 0;
                }
                expenseSummary[item.category] += item.amount;
            }
        });

        return { incomeSummary, expenseSummary };
    };

    const calculateTotal = (data) => {
        let income = 0;
        let expense = 0;

        data.forEach(item => {
            if (item.transaction_type === '收入') {
                income += item.amount;
            } else {
                expense += item.amount;
            }
        });

        return { income, expense, balance: income - expense };
    };

    const filteredData = filterDataByDate(data);
    const { incomeSummary, expenseSummary } = calculateCategorySummary(filteredData);
    const { income, expense, balance } = calculateTotal(filteredData);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const getDateDisplay = () => {
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth() + 1;

        if (startYear === endYear && startMonth === endMonth) {
            return (
                <>
                    <span className="accountinghomepage-date-year">{startYear}年</span>
                    <span className="accountinghomepage-date-month">{startMonth}月</span>
                </>
            );
        } else {
            return (
                <>
                    <span className="accountinghomepage-date-year">{startYear}年 - {endYear}年</span>
                    <span className="accountinghomepage-date-month">{startMonth}月 - {endMonth}月</span>
                </>
            );
        }
    };

    if (loading) {
        return <div className="accountinghomepage-loading">
            {/* 加载中... */}
            <WordReportGeneratorLoader/>
            </div>;
    }

    if (error) {
        return <div className="accountinghomepage-error">{error}</div>;
    }

    return (
        <div className="accountinghomepage-tab-content"
        //  style={{
        //             backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${process.env.PUBLIC_URL}/images/lifebookkeeping-background-image.jpg)`,
        //             backgroundRepeat: 'no-repeat',
        //             backgroundPosition: 'center',
        //             backgroundSize: 'contain'  
                    
        //         }}
                >
                 
            <div className="accountinghomepage-summary">
                <div className="accountinghomepage-date-selector" onClick={openModal}>
                    {getDateDisplay()}
                </div>
                <div className="accountinghomepage-summary-item">
                    <span className="accountinghomepage-summary-label">总收入</span>
                    <span className="accountinghomepage-summary-value income">¥{income.toFixed(2)}</span>
                </div>
                <div className="accountinghomepage-summary-item">
                    <span className="accountinghomepage-summary-label">总支出</span>
                    <span className="accountinghomepage-summary-value expense">¥{expense.toFixed(2)}</span>
                </div>
                <div className="accountinghomepage-summary-item">
                    <span className="accountinghomepage-summary-label">结余</span>
                    <span className="accountinghomepage-summary-value balance">¥{balance.toFixed(2)}</span>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                contentLabel="日期选择模态框"
                className="accountinghomepage-modal"
                overlayClassName="accountinghomepage-modal-overlay"
            >
                <button className="accountinghomepage-modal-close" onClick={closeModal}>关闭</button>
                <h2 className="accountinghomepage-modal-title">日期范围:</h2>
                <div className="accountinghomepage-date-filter">
                    <div className="accountinghomepage-date-filter-div">
                        <label htmlFor="start-date">开始:</label>
                        <input
                            type="date"
                            id="start-date"
                            value={formatDate(startDate)}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date">结束:</label>
                        <input
                            type="date"
                            id="end-date"
                            value={formatDate(endDate)}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                        />
                    </div>
                </div>
            </Modal>
            <div className="accountinghomepage-category-summary">
                <div className="accountinghomepage-income-summary">
                    <h3 className="accountinghomepage-summary-title">收入:</h3>
                    {Object.keys(incomeSummary).length > 0 ? (
                        <ul className="accountinghomepage-category-list">
                            {Object.entries(incomeSummary).map(([category, amount]) => (
                                <li key={`income-${category}`} className="accountinghomepage-category-item">
                                    <span className="accountinghomepage-category-name">{category}</span>
                                    <span className="accountinghomepage-category-amount income">+¥{amount.toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="accountinghomepage-no-data">暂无收入数据</p>
                    )}
                </div>
                <div className="accountinghomepage-expense-summary">
                    <h3 className="accountinghomepage-summary-title">支出:</h3>
                    {Object.keys(expenseSummary).length > 0 ? (
                        <ul className="accountinghomepage-category-list">
                            {Object.entries(expenseSummary).map(([category, amount]) => (
                                <li key={`expense-${category}`} className="accountinghomepage-category-item">
                                    <span className="accountinghomepage-category-name">{category}</span>
                                    <span className="accountinghomepage-category-amount expense">-¥{amount.toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="accountinghomepage-no-data">暂无支出数据</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountingHomePage;