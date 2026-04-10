import axios from 'axios';
import React, { useState, useContext, useRef, useEffect } from 'react';
import './AccountingAdd.css';
import { useAccounting } from './AccountingDataContext/AccountingContext';
import { useAuth } from '../../../context/AuthContext';


// 导入自定义通知组件
import ConfirmationDialogManager from './Notification/ConfirmationDialogManager';
import WordReportGeneratorLoader from './Notification/WordReportGeneratorLoader';
import NotificationManager from './Notification/NotificationManager';

const AccountingAdd = () => {
    const [formData, setFormData] = useState({
        transaction_date: new Date().toISOString().slice(0, 10),
        amount: '',
        transaction_type: '支出',
        category: '餐饮',
        payment_method: '微信支付',
        description: ''
    });
    const [categories, setCategories] = useState([]); // 从API获取的分类数据
    const [showLoader, setShowLoader] = useState(false);;//添加WordReportGeneratorLoader的引用
    const { user } = useAuth();
    const username = user?.username; // 从 user 对象中获取 username
    const { socket } = useAccounting();

    // 创建通知组件的引用
    const notificationRef = useRef();

    const paymentMethods = ["现金", "微信支付", "支付宝", "银行卡", "信用卡"];

    // 获取分类图标数据
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('https://cqrdpg.com:5202/getCategoryIcons');
                if (response.data) {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error('获取分类图标失败:', error);
                notificationRef.current.addNotification(
                    `获取分类图标失败: ${error.response?.data?.message || error.message}`,
                    'error'
                );
            }
        };

        fetchCategories();
    }, []);

    // 根据交易类型过滤分类
    const getFilteredCategories = () => {
        return categories.filter(category => category.icon_type === formData.transaction_type);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // 如果交易类型发生变化，重置类别
        if (name === 'transaction_type') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                category: '' // 重置类别选择
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // 显示加载遮罩
        setShowLoader(true);
        const submitData = {
            ...formData,
            created_by: username,
            amount: parseFloat(formData.amount),
            transaction_date: formData.transaction_date
        };

        try {
            const response = await axios.post(
                'https://cqrdpg.com:5202/api/lifebookkeepingaddRecord',
                submitData,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.success) {
                //alert('记录添加成功');
                // 使用自定义通知替代 alert
                notificationRef.current.addNotification('记录添加成功', 'success');
                setFormData({
                    transaction_date: new Date().toISOString().slice(0, 10),
                    amount: '',
                    transaction_type: '支出',
                    category: '',
                    payment_method: '微信支付',
                    description: ''
                });

                 
            } else {
                //alert(response.data.message || '添加失败');
                // 使用自定义通知替代 alert
                notificationRef.current.addNotification(
                    response.data.message || '添加失败',
                    'error'
                );
            }
        } catch (error) {
            // console.error('添加失败:', error);
            notificationRef.current.addNotification(
                `添加失败: ${error.response?.data?.message || error.message}`,
                'error'
            );
        } finally {
            // 无论成功或失败，都隐藏加载遮罩
            setShowLoader(false);
        }
    };

    return (
        <div className="accountingadd-tab-content"
            >
            {/* 添加通知管理器 */}
            <NotificationManager ref={notificationRef} />
            {/* 添加加载遮罩组件 */}
            {/* 有条件的显示加载遮罩组件 */}
            {showLoader && <WordReportGeneratorLoader />}

            <form className="accountingadd-add-form" onSubmit={handleSubmit}>
                {/* 交易日期 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">日&nbsp;&nbsp;&nbsp;期:</label>
                    <input
                        type="date"
                        name="transaction_date"
                        value={formData.transaction_date}
                        onChange={handleChange}
                        className="accountingadd-form-input"
                        required
                    />
                </div>

                {/* 金额 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">金&nbsp;&nbsp;&nbsp;额:</label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="accountingadd-form-input"
                        required
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                    />
                </div>

                {/* 交易类型 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">类&nbsp;&nbsp;&nbsp;型:</label>
                    <select
                        name="transaction_type"
                        value={formData.transaction_type}
                        onChange={handleChange}
                        className="accountingadd-form-select"
                        required
                    >
                        <option value="支出">支出</option>
                        <option value="收入">收入</option>
                    </select>
                </div>

                {/* 类别 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">类&nbsp;&nbsp;&nbsp;别:</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="accountingadd-form-select"
                    >
                        <option value="">请选择类别</option>
                        {getFilteredCategories().map(category => (
                            <option key={category.icon_name} value={category.icon_name}>
                                {category.icon_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 支付方式 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">方&nbsp;&nbsp;&nbsp;式:</label>
                    <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="accountingadd-form-select"
                    >
                        <option value="">请选择支付方式</option>
                        {paymentMethods.map(method => (
                            <option key={method} value={method}>{method}</option>
                        ))}
                    </select>
                </div>

                {/* 描述 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">描&nbsp;&nbsp;&nbsp;述:</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="accountingadd-form-input"
                        placeholder="简要描述交易内容"
                        maxLength="255"
                    />
                </div>

                <button type="submit" className="accountingadd-form-submit">
                    提交
                </button>
            </form>
        </div>
    );
};

export default AccountingAdd;