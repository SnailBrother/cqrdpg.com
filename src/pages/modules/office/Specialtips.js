import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './Specialtips.css';
import { Loading } from '../../../components/UI';
const socket = io('https://cqrdpg.com:5202'); // 请根据实际情况修改服务器地址

export default function Specialtips() {
    const [tips, setTips] = useState([]);
    const [allTips, setAllTips] = useState([]); // 新增：存储所有原始数据
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState(''); // 新增：用于输入框的临时值

    useEffect(() => {
        const fetchTipsData = async () => {
            try {
                const response = await axios.get('/api/getSpecial_TipsData');
                const tipsData = response.data.Special_Tips;
                setTips(tipsData);
                setAllTips(tipsData); // 保存所有原始数据
                setLoading(false);
            } catch (error) {
                console.error('Error fetching tips data:', error);
                setLoading(false);
            }
        };

        fetchTipsData();

        // 监听 socket.io 的事件
        socket.on('tips-update', (newTips) => {
            setTips(newTips);
            setAllTips(newTips); // 同时更新所有数据
        });

        return () => {
            socket.off('tips-update');
        };
    }, []);

    // 处理搜索提交
    const handleSearchSubmit = () => {
        const trimmedInput = searchInput.trim();
        setSearchTerm(trimmedInput); // 更新搜索词状态
        
        if (trimmedInput === '') {
            // 如果搜索为空，显示所有数据
            setTips(allTips);
        } else {
            // 执行搜索过滤
            const filtered = allTips.filter(tip =>
                tip.tip_content.toLowerCase().includes(trimmedInput.toLowerCase())
            );
            setTips(filtered);
        }
    };

    // 处理输入框按键事件
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    // 清除搜索
    // const handleClearSearch = () => {
    //     setSearchInput('');
    //     setSearchTerm('');
    //     setTips(allTips);
    // };

    if (loading) {
        return <div className="specialtips-loading"> <Loading message="特别提示加载中" /></div>;
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
                    {/* {searchInput && (
                        <button 
                            className="specialtips-clear-button"
                            onClick={handleClearSearch}
                            title="清除搜索"
                        >
                            ✕
                        </button>
                    )} */}
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
                                <div className="specialtips-card-body">
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
        </div>
    );
}