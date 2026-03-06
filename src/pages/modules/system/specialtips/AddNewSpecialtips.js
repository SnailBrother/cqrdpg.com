import React, { useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './AddNewSpecialtips.css';

const socket = io('http://121.4.22.55:5202');

const AddNewSpecialtips = () => {
    const [assetType, setAssetType] = useState('');
    const [tipContent, setTipContent] = useState('');
    const [remark, setRemark] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await axios.post('http://121.4.22.55:5202/api/addSpecialTip', {
                asset_type: assetType,
                tip_content: tipContent,
                remark: remark
            });

            if (response.status === 200) {
                setAssetType('');
                setTipContent('');
                setRemark('');
                socket.emit('tips-update');
            }
        } catch (error) {
            console.error('Error adding special tip:', error);
            setErrorMessage('添加特殊提示失败，请检查输入并重试。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="addnewspecialtips-container">
            <h2 className="addnewspecialtips-title">添加新的特殊提示</h2>
            {errorMessage && <p className="addnewspecialtips-error">{errorMessage}</p>}
            <form onSubmit={handleSubmit} className="addnewspecialtips-form">
                <div className="addnewspecialtips-form-group">
                    <label htmlFor="assetType" className="addnewspecialtips-label">资产类型</label>
                    <select
                        id="assetType"
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value)}
                        className="addnewspecialtips-input"
                        required
                    >
                        <option value="">请选择</option>
                        <option value="房地产">房地产</option>
                        <option value="资产">资产</option>
                        <option value="土地">土地</option>
                        <option value="其他">其他</option>
                    </select>
                </div>
                <div className="addnewspecialtips-form-group">
                    <label htmlFor="tipContent" className="addnewspecialtips-label">提示内容</label>
                    <textarea
                        id="tipContent"
                        value={tipContent}
                        onChange={(e) => setTipContent(e.target.value)}
                        className="addnewspecialtips-input addnewspecialtips-large-textarea"
                        required
                        rows={8}
                    />
                </div>
                <div className="addnewspecialtips-form-group">
                    <label htmlFor="remark" className="addnewspecialtips-label">备注</label>
                    <textarea
                        id="remark"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        className="addnewspecialtips-input addnewspecialtips-small-textarea"
                        rows={3}
                    />
                </div>
                <button type="submit" className="addnewspecialtips-button" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <span className="addnewspecialtips-spinner"></span>
                            正在提交...
                        </>
                    ) : '添加特殊提示'}
                </button>
            </form>
        </div>
    );
};

export default AddNewSpecialtips;