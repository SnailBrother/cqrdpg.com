import React, { useState, useContext } from "react";
import './AccountingMy.css';
import { useAuth } from '../../../context/AuthContext';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Link, useNavigate } from 'react-router-dom';

const AccountingMy = () => {
    const { user, logout } = useAuth();
    const username = user?.username;
    const [isLoading, setIsLoading] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const [imageError, setImageError] = useState(false);
    const navigate = useNavigate();

    const handleDownload = async () => {
        setShowDateModal(true);
    };

    const confirmDownload = async () => {
        setIsLoading(true);
        setShowDateModal(false);

        try {
            const formattedStart = startDate.toISOString().split('T')[0];
            const formattedEnd = endDate.toISOString().split('T')[0];

            const response = await fetch(`http://121.4.22.55:5202/api/transactions?start=${formattedStart}&end=${formattedEnd}&username=${username}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`获取账单数据失败: ${response.status}`);
            }

            const data = await response.json();

            // 准备Excel数据，添加连续序号
            const excelData = data.map((item, index) => ({
                '序号': index + 1,
                '交易时间': item.transaction_date,
                '交易金额': item.amount,
                '交易类型': item.transaction_type,
                '交易类别': item.category,
                '支付方式': item.payment_method,
                '交易描述': item.description,
                '记录创建人': item.created_by
            }));

            // 创建工作表
            const ws = XLSX.utils.json_to_sheet(excelData);

            // 设置列宽
            ws['!cols'] = [
                { wch: 8 },  // 序号
                { wch: 20 }, // 交易时间
                { wch: 12 }, // 交易金额
                { wch: 12 }, // 交易类型
                { wch: 15 }, // 交易类别
                { wch: 12 }, // 支付方式
                { wch: 30 }, // 交易描述
                { wch: 15 }  // 记录创建人
            ];

            // 创建工作簿
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "账单数据");

            // 生成Excel文件并下载
            XLSX.writeFile(wb, `${username}_账单_${formattedStart}_至_${formattedEnd}.xlsx`);

        } catch (error) {
            console.error('下载账单失败:', error);
            alert(error.message || '下载账单失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 退出登录功能 - 与 Header.js 中的完全一致
    const handleLogout = async () => {
        try {
            // 先执行退出登录
            await logout();

            // 等待状态更新完成后再跳转
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 100);

        } catch (error) {
            console.error('退出登录失败:', error);
            // 即使失败也强制跳转
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="accountingmy-tab-content"
        >
            <div className="accountingmy-profile">
                <div className="accountingmy-profile-avatar">
                    {!imageError && username && (
                        <img
                            src={`http://121.4.22.55:80/backend/images/ChatApp/${username}/headpicture/avatar.png`}
                            alt="Avatar"
                            onError={() => setImageError(true)}
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                        />
                    )}
                    {imageError || !username && (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#e0e0e0' }}></div>
                    )}
                </div>
                <h3 className="accountingmy-profile-name">{username}</h3>
            </div>

            <div className="accountingmy-settings">
                <h3 className="accountingmy-settings-title">设置</h3>
                <ul className="accountingmy-settings-list">
                    <li className="accountingmy-settings-item">分类管理</li>
                    <li className="accountingmy-settings-item">数据备份</li>
                    <li className="accountingmy-settings-item">数据恢复</li>
                    <li
                        className="accountingmy-settings-item"
                        onClick={handleDownload}
                        style={{
                            cursor: isLoading ? 'wait' : 'pointer',
                            color: isLoading ? '#999' : 'inherit'
                        }}
                    >
                        {isLoading ? '正在生成账单...' : '下载账单'}
                    </li>
                    <li className="accountingmy-settings-item">
                        <Link to="/chat" className="accountingmy-link">联系我们</Link>
                    </li>
                    <li
                        className="accountingmy-settings-item"
                        onClick={handleLogout}
                        style={{ cursor: 'pointer' }}
                    >
                        切换账号
                    </li>
                    <li className="accountingmy-settings-item">
                        <Link to="/apps" className="accountingmy-link">首&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;页</Link>
                    </li>

                    <li className="accountingmy-settings-item">关&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;于</li>
                </ul>
            </div>

            {/* 日期选择模态框 */}
            {showDateModal && (
                <div className="accountingmy-modal">
                    <div className="accountingmy-modal-content">
                        <h3>选择日期范围</h3>
                        <div className="accountingmy-date-picker">
                            <label>开始日期:</label>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                dateFormat="yyyy-MM-dd"
                            />
                        </div>
                        <div className="accountingmy-date-picker">
                            <label>结束日期:</label>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                dateFormat="yyyy-MM-dd"
                            />
                        </div>
                        <div className="accountingmy-modal-buttons">
                            <button onClick={() => setShowDateModal(false)}>取消</button>
                            <button onClick={confirmDownload}>确认下载</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountingMy;