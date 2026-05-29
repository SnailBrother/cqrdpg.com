import React, { useState, useEffect } from "react";
import axios from 'axios';
import styles from './AccountingDetailsChange.module.css';
import { useAuth } from '../../../context/AuthContext';
import { TextBox, ConfirmationDialog } from '../../../components/UI/';

const AccountingDetailsChange = ({ record, onClose, onUpdateSuccess, onDeleteSuccess, allCategories, onToast }) => {
    const [formData, setFormData] = useState({
        transaction_date: '',
        amount: '',
        transaction_type: '',
        category: '',
        payment_method: '',
        description: '',
        note: '',
        created_by: '',
        updated_by: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { user } = useAuth();
    const username = user?.username;

    const transactionTypes = allCategories?.transactionTypes || [];
    const categories = allCategories?.categories || [];
    const paymentMethods = allCategories?.paymentMethods || [];

    const categoryNames = categories.map(cat => cat.name);

    const personList = ["陈彦羽", "李中敬"];

    useEffect(() => {
        if (record) {
            setFormData({
                transaction_date: record.transaction_date ? record.transaction_date.slice(0, 10) : '',
                amount: record.amount ? String(record.amount) : '',
                transaction_type: record.transaction_type || '',
                category: record.category || '',
                payment_method: record.payment_method || '',
                description: record.description || '',
                note: record.note || '',
                created_by: record.created_by || '',
                updated_by: record.updated_by || ''
            });
        }
    }, [record]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const isNewType = formData.transaction_type && !transactionTypes.includes(formData.transaction_type);
            const isNewCategory = formData.category && !categoryNames.includes(formData.category);
            const isNewPayment = formData.payment_method && !paymentMethods.includes(formData.payment_method);

            if (isNewType || isNewCategory || isNewPayment) {
                await axios.post('/api/AccountingApp/addAccountingOptions', {
                    transaction_type: isNewType ? formData.transaction_type : null,
                    category: isNewCategory ? formData.category : null,
                    payment_method: isNewPayment ? formData.payment_method : null
                });
            }

            const submitData = {
                ...formData,
                updated_by: username,
                amount: parseFloat(formData.amount)
            };

            const response = await axios.put(
                `/api/AccountingApp/lifebookkeepingupdateRecord/${record.transaction_id}`,
                submitData
            );
            onToast && onToast('更新成功', 'success');
            onUpdateSuccess(response.data);
        } catch (err) {
            onToast && onToast('更新失败: ' + (err.response?.data?.message || err.message), 'error');
            setError('更新记录失败: ' + (err.response?.data?.message || err.message));
            console.error('更新记录失败:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setIsLoading(true);
        setError('');

        try {
            await axios.delete(
                `/api/lifebookkeepingdeleteRecord/${record.transaction_id}`
            );
            onToast && onToast('删除成功', 'success');
            onDeleteSuccess();
        } catch (err) {
            onToast && onToast('删除失败: ' + (err.response?.data?.message || err.message), 'error');
            setError('删除记录失败: ' + (err.response?.data?.message || err.message));
            console.error('删除记录失败:', err);
        } finally {
            setIsLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <form onSubmit={handleSubmit}>
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
                        label="描&nbsp;&nbsp;&nbsp;述:"
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

                    <TextBox
                        label="人&nbsp;&nbsp;&nbsp;员:"
                        Type="SearchBox"
                        placeholder="请选择创建人"
                        searchList={personList}
                        value={formData.created_by}
                        onChange={(value) => setFormData(prev => ({ ...prev, created_by: value }))}
                        required
                        labelWidth="40px"
                    />

                    <TextBox
                        label="备&nbsp;&nbsp;&nbsp;注:"
                        Type="SearchBox"
                        leftIcon="#icon-edit"
                        placeholder="备注信息"
                        value={formData.note}
                        onChange={(value) => setFormData(prev => ({ ...prev, note: value }))}
                        labelWidth="40px"
                    />

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
                                onClick={handleDeleteClick}
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

            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                title="确认删除"
                message="确定要删除这条记录吗？"
                confirmText="确定删除"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setIsDeleteDialogOpen(false)}
            />
        </div>
    );
};

export default AccountingDetailsChange;