import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import './AccountingAdd.css';
import { useAuth } from '../../../context/AuthContext';
import { TextBox } from '../../../components/UI';

import ConfirmationDialogManager from './Notification/ConfirmationDialogManager';
import WordReportGeneratorLoader from './Notification/WordReportGeneratorLoader';
import NotificationManager from './Notification/NotificationManager';

const AccountingAdd = () => {
    const [formData, setFormData] = useState({
        transaction_date: new Date().toISOString().slice(0, 10),
        amount: '',
        transaction_type: '',
        category: '',
        payment_method: '',
        description: ''
    });
    const [transactionTypes, setTransactionTypes] = useState([]);
    const [categoryNames, setCategoryNames] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showLoader, setShowLoader] = useState(false);
    const { user } = useAuth();
    const username = user?.username;

    const notificationRef = useRef();

    const fetchOptions = async () => {
        try {
            const response = await axios.get('/api/AccountingApp/getAccountingOptions');
            if (response.data) {
                if (response.data.transactionTypes) {
                    setTransactionTypes(response.data.transactionTypes);
                }
                
                if (response.data.categories) {
                    const names = response.data.categories.map(cat => cat.name);
                    setCategoryNames(names);
                }
                
                if (response.data.paymentMethods) {
                    setPaymentMethods(response.data.paymentMethods);
                }
            }
        } catch (error) {
            console.error('获取选项数据失败:', error);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowLoader(true);

        try {
            // 先同步新增的选项
            const isNewType = formData.transaction_type && !transactionTypes.includes(formData.transaction_type);
            const isNewCategory = formData.category && !categoryNames.includes(formData.category);
            const isNewPayment = formData.payment_method && !paymentMethods.includes(formData.payment_method);

            if (isNewType || isNewCategory || isNewPayment) {
                await axios.post('/api/AccountingApp/addAccountingOptions', {
                    transaction_type: isNewType ? formData.transaction_type : null,
                    category: isNewCategory ? formData.category : null,
                    payment_method: isNewPayment ? formData.payment_method : null
                });

                // 重新获取选项列表
                await fetchOptions();
            }

            // 提交记录
            const submitData = {
                ...formData,
                created_by: username,
                amount: parseFloat(formData.amount),
                transaction_date: formData.transaction_date
            };

            const response = await axios.post(
                '/api/AccountingApp/lifebookkeepingaddRecord',
                submitData,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.success) {
                notificationRef.current.addNotification('记录添加成功', 'success');
                setFormData({
                    transaction_date: new Date().toISOString().slice(0, 10),
                    amount: '',
                    transaction_type: '',
                    category: '',
                    payment_method: '',
                    description: ''
                });
            } else {
                notificationRef.current.addNotification(
                    response.data.message || '添加失败',
                    'error'
                );
            }
        } catch (error) {
            notificationRef.current.addNotification(
                `添加失败: ${error.response?.data?.message || error.message}`,
                'error'
            );
        } finally {
            setShowLoader(false);
        }
    };

    return (
        <div className="accountingadd-tab-content">
            <NotificationManager ref={notificationRef} />
            {showLoader && <WordReportGeneratorLoader />}

            <form className="accountingadd-add-form" onSubmit={handleSubmit}>
                <TextBox
                    label="日&nbsp;&nbsp;&nbsp;期:"
                    Type="DatePicker"
                    leftIcon="#icon-edit"
                    dateFormat="YYYY/MM/DD"
                    value={formData.transaction_date}
                    onChange={(date) => setFormData(prev => ({ ...prev, transaction_date: date }))}
                    required
                    labelWidth="40px" 
                />
                
                <TextBox
                    label="金&nbsp;&nbsp;&nbsp;额:"
                    Type="NumberInput"
                    leftIcon="#icon-edit"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                    required
                    labelWidth="40px" 
                />
                
                <TextBox
                    label="类&nbsp;&nbsp;&nbsp;型:"
                    Type="SearchBox"
                    placeholder="请选择交易类型"
                    searchList={transactionTypes}
                    value={formData.transaction_type}
                    onChange={(value) => {
                        setFormData(prev => ({
                            ...prev,
                            transaction_type: value,
                            category: ''
                        }));
                    }}
                    required
                    labelWidth="40px" 
                />
            
                <TextBox
                    label="类&nbsp;&nbsp;&nbsp;别:"
                    Type="SearchBox"
                    placeholder="请选择类别"
                    searchList={categoryNames}
                    value={formData.category}
                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    required
                    labelWidth="40px" 
                />
                
                <TextBox
                    label="方&nbsp;&nbsp;&nbsp;式:"
                    Type="SearchBox"
                    placeholder="请选择支付方式"
                    searchList={paymentMethods}
                    value={formData.payment_method}
                    onChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                    required
                    labelWidth="40px" 
                />
                
                <TextBox
                    label="描述:"
                    Type="SearchBox"
                    leftIcon="#icon-edit"
                    rightIcon="#icon-a-duicuocuo"
                    placeholder="简要描述交易内容"
                    tooltipPosition="bottom"
                    tooltipDelay={500}
                    tooltip="请输入简要描述交易内容"
                    value={formData.description}
                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    required
                    labelWidth="40px" 
                />
                
                <button type="submit" className="accountingadd-form-submit">
                    提交
                </button>
            </form>
        </div>
    );
};

export default AccountingAdd;