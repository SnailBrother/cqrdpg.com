import React, { useState, useEffect, useContext } from "react";
import axios from 'axios';
import styles from './AccountingDetailsChange.module.css';
import { useAuth } from '../../../context/AuthContext';

const AccountingDetailsChange = ({ record, onClose, onUpdateSuccess, onDeleteSuccess, allCategories }) => {
    const [formData, setFormData] = useState({
        transaction_date: '',
        amount: '',
        transaction_type: '支出',
        category: '',
        payment_method: '',
        description: '',
        note: '',
        created_by: '',
        updated_by: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const username = user?.username;

    const getFilteredCategories = () => {
        return allCategories.filter(category => category.icon_type === formData.transaction_type);
    };

    useEffect(() => {
        if (record) {
            setFormData({
                transaction_date: record.transaction_date ? record.transaction_date.slice(0, 10) : '',
                amount: record.amount || '',
                transaction_type: record.transaction_type || '支出',
                category: record.category || '',
                payment_method: record.payment_method || '',
                description: record.description || '',
                note: record.note || '',
                created_by: record.created_by || '',
                updated_by: record.updated_by || ''
            });
        }
    }, [record]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'transaction_type') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                category: ''
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
        setIsLoading(true);
        setError('');
        formData.updated_by = username;

        try {
            const response = await axios.put(
                `/api/AccountingApp/lifebookkeepingupdateRecord/${record.transaction_id}`,
                formData
            );
            onUpdateSuccess(response.data);
        } catch (err) {
            setError('更新记录失败: ' + (err.response?.data?.message || err.message));
            console.error('更新记录失败:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('确定要删除这条记录吗？')) return;
        setIsLoading(true);
        setError('');

        try {
            await axios.delete(
                `/api/lifebookkeepingdeleteRecord/${record.transaction_id}`
            );
            onDeleteSuccess();
        } catch (err) {
            setError('删除记录失败: ' + (err.response?.data?.message || err.message));
            console.error('删除记录失败:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2>编辑</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>类型</label>
                        <select
                            name="transaction_type"
                            value={formData.transaction_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="收入">收入</option>
                            <option value="支出">支出</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>时间</label>
                        <input
                            type="date"
                            name="transaction_date"
                            value={formData.transaction_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>金额</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>类别</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">请选择类别</option>
                            {getFilteredCategories().map(category => (
                                <option key={category.icon_name} value={category.icon_name}>
                                    {category.icon_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>方式</label>
                        <select
                            name="payment_method"
                            value={formData.payment_method}
                            onChange={handleChange}
                        >
                            <option value="">请选择支付方式</option>
                            <option value="现金">现金</option>
                            <option value="微信支付">微信支付</option>
                            <option value="支付宝">支付宝</option>
                            <option value="银行卡">银行卡</option>
                            <option value="信用卡">信用卡</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>描述</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>人员</label>
                        <select
                            name="created_by"
                            value={formData.created_by}
                            onChange={handleChange}
                            required
                        >
                            <option value="">请选择创建人</option>
                            <option value="陈彦羽">陈彦羽</option>
                            <option value="李中敬">李中敬</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>备注</label>
                        <textarea
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.modalFooter}>
                        <div className={styles.btnGroup}>
                            <button
                                type="submit"
                                className={styles.saveBtn}
                                disabled={isLoading}
                            >
                                {isLoading ? '保存中...' : '保存'}
                            </button>
                            <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={handleDelete}
                                disabled={isLoading}
                            >
                                {isLoading ? '处理中...' : '删除'}
                            </button>


                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                取消
                            </button>


                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountingDetailsChange;