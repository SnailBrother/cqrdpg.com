import React, { useState, useEffect } from 'react';
import './AccountingDetails.css';
import useSocketEvents from './useSocketEvents';
import AccountingDetailsChange from './AccountingDetailsChange';
import { Loading } from '../../../components/UI';
import ErrorMessage from './ErrorMessage';
import Modal from 'react-modal';
import axios from 'axios';
import io from 'socket.io-client';

const AccountingDetails = () => {
    const [records, setRecords] = useState([]);
    const [categoryIcons, setCategoryIcons] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);
    //  中添加一个状态来存储原始分类数据
    const [allCategories, setAllCategories] = useState([]); // 存储所有分类数据
    // 默认日期范围（当月）
    const getStartOfMonth = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    };

    const getEndOfMonth = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    };

    const [startDate, setStartDate] = useState(getStartOfMonth());
    const [endDate, setEndDate] = useState(getEndOfMonth());

    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    // 新增状态变量来存储人员选择
    const [selectedPerson, setSelectedPerson] = useState('全部');
    const [searchKeyword, setSearchKeyword] = useState('');//添加关键字状态

    // 初始化 WebSocket 连接
    useEffect(() => {
        const newSocket = io('http://121.4.22.55:5202');
        setSocket(newSocket);

        // 监听服务器事件
        newSocket.on('newRecordAdded', (newRecord) => {
            addRecord(newRecord);
        });

        newSocket.on('updateRecord', (updatedRecord) => {
            updateRecord(updatedRecord);
        });

        newSocket.on('deleteRecord', (deletedId) => {
            deleteRecord(deletedId);
        });

        return () => newSocket.disconnect();
    }, []);

    // 获取初始数据
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [recordsResponse, iconsResponse] = await Promise.all([
                axios.get('http://121.4.22.55:5202/api/lifebookkeepinggetRecords'),
                axios.get('http://121.4.22.55:5202/getCategoryIcons')
            ]);

            setRecords(recordsResponse.data);
            setAllCategories(iconsResponse.data); // 保存所有分类数据

            const iconMap = {};
            iconsResponse.data.forEach((icon) => {
                iconMap[icon.icon_name] = icon.unicode;
            });
            setCategoryIcons(iconMap);
        } catch (err) {
            console.error('获取数据失败:', err);
            setError('获取数据失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    // 初始化加载数据
    useEffect(() => {
        fetchData();
    }, []);

    // 添加记录
    const addRecord = (newRecord) => {
        setRecords(prev => [...prev, newRecord]);
    };

    // 更新记录
    const updateRecord = (updatedRecord) => {
        setRecords(prev =>
            prev.map(item =>
                item.transaction_id === updatedRecord.transaction_id ? updatedRecord : item
            )
        );
    };

    // 删除记录
    const deleteRecord = (recordId) => {
        setRecords(prev => prev.filter(item =>
            item.transaction_id !== parseInt(recordId)
        ));
    };

    // 设置WebSocket事件处理
    useSocketEvents({
        onNewRecord: (newRecord) => {
            updateRecord(newRecord);
        },
        onUpdateRecord: (updatedRecord) => {
            updateRecord(updatedRecord);
        },
        onDeleteRecord: (deletedId) => {
            deleteRecord(deletedId);
        },
        onError: (message, error) => {
            console.error(message, error);
        }
    });

    const filterDataByDate = (data) => {
        const filteredData = data.filter(item => {
            const transactionDate = new Date(item.transaction_date);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            return transactionDate >= start && transactionDate <= end;
        });

        // 按日期降序排序
        return filteredData.sort((a, b) => {
            const dateA = new Date(a.transaction_date);
            const dateB = new Date(b.transaction_date);
            return dateB - dateA;
        });
    };

    // 修改过滤函数以根据人员选择过滤数据
    const filterDataByPerson = (data) => {
        if (selectedPerson === '全部') {
            return data;
        }
        return data.filter(item => item.created_by === selectedPerson);
    };

    const groupDataByDate = (data) => {
        const grouped = {};
        data.forEach(item => {
            const date = new Date(item.transaction_date).toLocaleDateString();
            if (!grouped[date]) {
                grouped[date] = {
                    items: [],
                    income: 0,      // 添加收入统计
                    expense: 0,     // 添加支出统计
                    netIncome: 0    // 添加净收入
                };
            }
            grouped[date].items.push(item);

            // 分别统计收入和支出
            if (item.transaction_type === '收入') {
                grouped[date].income += item.amount;
            } else {
                grouped[date].expense += item.amount;
            }

            // 计算净收入
            grouped[date].netIncome = grouped[date].income - grouped[date].expense;
        });

        // 对每个日期的 items 按 transaction_id 降序排序
        Object.keys(grouped).forEach(date => {
            grouped[date].items.sort((a, b) => b.transaction_id - a.transaction_id);
        });

        return grouped;
    };

    const calculateIncomeAndExpense = (data) => {
        let income = 0;
        let expense = 0;
        data.forEach(item => {
            if (item.transaction_type === '收入') {
                income += item.amount;
            } else {
                expense += item.amount;
            }
        });
        return { income, expense };
    };

    const handleRecordClick = (record) => {
        setSelectedRecord(record);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleUpdateSuccess = (updatedRecord) => {
        updateRecord(updatedRecord);
        setShowModal(false);
    };

    const handleDeleteSuccess = (deletedId) => {
        deleteRecord(deletedId);
        setShowModal(false);
    };

    const handleRetry = () => {
        fetchData();
    };

    const openDateModal = () => {
        setIsDateModalOpen(true);
    };

    const closeDateModal = () => {
        setIsDateModalOpen(false);
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDateDisplay = () => {
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth() + 1;

        if (startYear === endYear && startMonth === endMonth) {
            return (
                <>
                    <span className="accountingdetails-date-year">{startYear}年</span>
                    <span className="accountingdetails-date-month">{startMonth}月</span>
                </>
            );
        } else {
            return (
                <>
                    <span className="accountingdetails-date-year">{startYear}年 - {endYear}年</span>
                    <span className="accountingdetails-date-month">{startMonth}月 - {endMonth}月</span>
                </>
            );
        }
    };

    //过滤函数以包含关键字筛选
    const filterDataByKeyword = (data) => {
        if (!searchKeyword.trim()) {
            return data;
        }
        const keyword = searchKeyword.toLowerCase();
        return data.filter(item =>
            item.description.toLowerCase().includes(keyword) ||
            item.category.toLowerCase().includes(keyword)
        );
    };

    // 修改后的数据过滤流程
    const filteredData = filterDataByDate(records);
    const filteredDataByPerson = filterDataByPerson(filteredData);
    const filteredDataByKeyword = filterDataByKeyword(filteredDataByPerson);
    const groupedData = groupDataByDate(filteredDataByKeyword);
    const { income, expense } = calculateIncomeAndExpense(filteredDataByKeyword);

    if (loading) {
        return <Loading message="数据加载中..." />;
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={handleRetry} />;
    }

    return (
        <div className="accountingdetails-container"
 
        >

            <div className="accountingdetails-header">
                <div className="accountingdetails-date-selector" onClick={openDateModal}>
                    <div className="date-display-wrapper">
                        {getDateDisplay()}
                    </div>
                </div>
                <div className="accountingdetails-summary">
                    <div className="accountingdetails-summary-item">
                        <span>收入</span>
                        <span className="accountingdetails-summary-amount income">¥{income.toFixed(2)}</span>
                    </div>
                </div>
                <div className="accountingdetails-summary">
                    <div className="accountingdetails-summary-item">
                        <span>支出</span>
                        <span className="accountingdetails-summary-amount expense">¥{expense.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isDateModalOpen}
                onRequestClose={closeDateModal}
                contentLabel="日期选择模态框"
                className="accountingdetails-modal"
                overlayClassName="accountingdetails-modal-overlay"
            >
                <button className="accountingdetails-modal-close" onClick={closeDateModal}>关闭</button>
                {/* 新增关键字搜索部分 */}
                <h2 className="accountingdetails-modal-title">关键字搜索:</h2>
                <div className="accountingdetails-keyword-filter">
                    <input
                        type="text"
                        placeholder="输入描述或分类关键字"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="accountingdetails-keyword-input"
                    />
                </div>


                <h2 className="accountingdetails-modal-title">日期范围:</h2>
                <div className="accountingdetails-date-filter">
                    <div className="accountingdetails-date-filter-item">
                        <label htmlFor="start-date">开始:</label>
                        <input
                            type="date"
                            id="start-date"
                            value={formatDate(startDate)}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                        />
                    </div>
                    <div className="accountingdetails-date-filter-item">
                        <label htmlFor="end-date">结束:</label>
                        <input
                            type="date"
                            id="end-date"
                            value={formatDate(endDate)}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                        />
                    </div>
                </div>
                {/* 添加人员选择部分 */}
                <h2 className="accountingdetails-modal-title">人员选择:</h2>
                <div className="accountingdetails-date-filter">
                    <div className="accountingdetails-date-filter-item">
                        <label htmlFor="person-select">选择人员:</label>
                        <select
                            id="person-select"
                            value={selectedPerson}
                            onChange={(e) => setSelectedPerson(e.target.value)}
                        >
                            <option value="全部">全部</option>
                            <option value="李中敬">李中敬</option>
                            <option value="陈彦羽">陈彦羽</option>
                        </select>
                    </div>
                </div>
            </Modal>

            <div className="accountingdetails-content">
                {Object.entries(groupedData).map(([date, group]) => (
                    <div key={date} className="accountingdetails-date-group">
                        <div className="accountingdetails-date-summary">
                            <span className="accountingdetails-date">{date}</span>
                            <span className={`accountingdetails-summary-amount ${group.netIncome >= 0 ? 'income' : 'expense'}`}>
                                ¥{Math.abs(group.netIncome).toFixed(2)}
                            </span>
                        </div>

                        <ul className="accountingdetails-details-list">
                            {group.items.map(item => (
                                <li
                                    key={item.transaction_id}
                                    className="accountingdetails-details-item"
                                    onClick={() => handleRecordClick(item)}
                                >
                                    <div className="accountingdetails-details-category">
                                        {categoryIcons[item.category] && (
                                            <svg className="accountingdetails-details-icon" aria-hidden="true">
                                                <use xlinkHref={`#${categoryIcons[item.category]}`}></use>
                                            </svg>
                                        )}
                                    </div>

                                    <div className="accountingdetails-details-description">{item.description}</div>

                                    <div className={`accountingdetails-details-amount ${item.transaction_type === '收入' ? 'income' : 'expense'}`}>
                                        {item.transaction_type === '收入' ? '+' : '-'}{item.amount.toFixed(2)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {showModal && (
                    <AccountingDetailsChange
                        record={selectedRecord}
                        onClose={handleCloseModal}
                        onUpdateSuccess={handleUpdateSuccess}
                        onDeleteSuccess={handleDeleteSuccess}
                        allCategories={allCategories} // 传递分类数据
                    />
                )}
            </div>
        </div>
    );
};

export default AccountingDetails;