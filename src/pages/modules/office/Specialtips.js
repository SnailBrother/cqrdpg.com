import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import ReactDOM from 'react-dom'; // 新增导入
import './Specialtips.css';
import { Loading, Toast, useToast, ToastContainer } from '../../../components/UI';

const socket = io('https://www.cqrdpg.com:5209');

export default function Specialtips() {
    const [tips, setTips] = useState([]);
    const [allTips, setAllTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        const fetchTipsData = async () => {
            try {
                const response = await axios.get('/api/getSpecial_TipsData');
                const tipsData = response.data.Special_Tips;
                setTips(tipsData);
                setAllTips(tipsData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching tips data:', error);
                setLoading(false);
            }
        };

        fetchTipsData();

        socket.on('tips-update', (newTips) => {
            setTips(newTips);
            setAllTips(newTips);
        });

        return () => {
            socket.off('tips-update');
        };
    }, []);

    const handleCopy = async (value) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            success('复制成功！');
        } catch (err) {
            error('复制失败，请手动复制');
        }
    };

    const handleSearchSubmit = () => {
        const trimmedInput = searchInput.trim();
        setSearchTerm(trimmedInput);
        
        if (trimmedInput === '') {
            setTips(allTips);
        } else {
            const filtered = allTips.filter(tip =>
                tip.tip_content.toLowerCase().includes(trimmedInput.toLowerCase())
            );
            setTips(filtered);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    if (loading) {
        return <div className="specialtips-loading"><Loading message="特别提示加载中" /></div>;
    }

    return (
        <div className="specialtips-app">
            <div className="specialtips-header">
                <div className="specialtips-search-container">
                    <input
                        type="text"
                        placeholder="搜索提示..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="specialtips-search-input"
                    />
                </div>
            </div>

            <div className="specialtips-content">
                {tips.length > 0 ? (
                    <div className="specialtips-grid">
                        {tips.map((tip, index) => (
                            <div key={index} className="specialtips-card">
                                <div className="specialtips-card-header">
                                    <span className="specialtips-card-category">{tip.asset_type}</span>
                                </div>
                                <div 
                                    className="specialtips-card-body"
                                    onClick={() => handleCopy(tip.tip_content)}
                                    style={{ cursor: 'pointer' }}
                                    title="点击复制提示内容"
                                >
                                    <p className="specialtips-card-content">{tip.tip_content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="specialtips-empty">
                        {searchTerm ? `没有找到与 "${searchTerm}" 相关的提示` : '暂无提示'}
                    </div>
                )}
            </div>

            {/* 将 ToastContainer 移到最外层，避免被遮挡 */}
            {ReactDOM.createPortal(
                <ToastContainer toasts={toasts} removeToast={removeToast} />,
                document.body
            )}
        </div>
    );
}