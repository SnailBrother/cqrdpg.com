//事件解耦：将 socket.io 事件监听逻辑封装成自定义钩子，提高代码的可维护性
// src/hooks/useSocketEvents.js
import { useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('https://cqrdpg.com:5202');

const useSocketEvents = (callbacks) => {
  useEffect(() => {
    const { onNewRecord, onUpdateRecord, onDeleteRecord, onError } = callbacks;

    const handleNewRecord = (newRecord) => {
      try {
        onNewRecord?.(newRecord);
      } catch (error) {
        onError?.('处理新增记录时出错', error);
      }
    };

    const handleUpdateRecord = (updatedRecord) => {
      try {
        onUpdateRecord?.(updatedRecord);
      } catch (error) {
        onError?.('处理更新记录时出错', error);
      }
    };

    const handleDeleteRecord = (deletedId) => {
      try {
        onDeleteRecord?.(deletedId);
      } catch (error) {
        onError?.('处理删除记录时出错', error);
      }
    };

    socket.on('newRecordAdded', handleNewRecord);
    socket.on('recordUpdated', handleUpdateRecord);
    socket.on('recordDeleted', handleDeleteRecord);
    socket.on('connect_error', (error) => {
      onError?.('Socket连接错误', error);
    });

    return () => {
      socket.off('newRecordAdded', handleNewRecord);
      socket.off('recordUpdated', handleUpdateRecord);
      socket.off('recordDeleted', handleDeleteRecord);
      socket.off('connect_error');
    };
  }, [callbacks]);
};

export default useSocketEvents;