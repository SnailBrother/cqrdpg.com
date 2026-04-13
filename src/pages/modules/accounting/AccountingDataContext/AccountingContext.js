import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const AccountingContext = createContext();

export const AccountingProvider = ({ children }) => {
    const [records, setRecords] = useState([]);
    const [categoryIcons, setCategoryIcons] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);

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

    // 初始化 WebSocket 连接
    useEffect(() => {
        const newSocket = io('https://www.cqrdpg.com:5202');
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
                axios.get('/api/lifebookkeepinggetRecords'),
                axios.get('/api/getCategoryIcons')
            ]);

            setRecords(recordsResponse.data);

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

    return (
        <AccountingContext.Provider value={{
            records,
            categoryIcons,
            loading,
            error,
            startDate,
            endDate,
            setStartDate,
            setEndDate,
            fetchData,
            addRecord,
            updateRecord,
            deleteRecord,
            socket // 暴露 socket 给子组件
        }}>
            {children}
        </AccountingContext.Provider>
    );
};

export const useAccounting = () => {
    return useContext(AccountingContext);
};