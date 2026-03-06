import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './SiteLinks.css';
import { Loading } from '../../../components/UI';
const SiteLinks = () => {
  const [activeTab, setActiveTab] = useState('房地产');
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 1. 初始化Socket连接
    const newSocket = io('http://121.4.22.55:5202');
    setSocket(newSocket);

    // 2. 初始数据获取
    const fetchData = async () => {
      try {
        const response = await fetch('http://121.4.22.55:5202/api/getUsedWebsitesData');
        const data = await response.json();
        processLinksData(data);
      } catch (err) {
        console.error('初始数据获取失败:', err);
        setError(`加载失败: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();

    // 3. 设置Socket监听
    newSocket.on('websites-update', (data) => {
      console.log('收到实时更新:', data);
      processLinksData(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const processLinksData = (data) => {
    if (Array.isArray(data)) {
      const categorizedLinks = data.reduce((acc, item) => {
        const { type, name, url } = item;
        acc[type] = acc[type] || [];
        acc[type].push({ name, url });
        return acc;
      }, {});
      setLinks(categorizedLinks);
      setError('');
    }
    setLoading(false);
  };

  const renderLinks = () => {
    if (loading) return <div className="site-loading"><Loading message="模板加载中" /></div>;
    if (error) return <div className="site-error">{error}</div>;
    
    return links[activeTab] ? (
      <div className="site-links-grid">
        {links[activeTab].map((link, index) => (
          <div key={index} className="site-link-card">
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.name}
            </a>
          </div>
        ))}
      </div>
    ) : (
      <div className="site-empty">没有可用链接</div>
    );
  };

  return (
    <div className="site-app">
      <div className="site-header">
        <div className="site-tabs">
          {['房地产', '资产', '苗木', '土地', '娱乐'].map((tab) => (
            <div
              key={tab}
              className={`site-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div className="site-content">
        {renderLinks()}
        <div className="site-connection-status">
          {/* 实时连接状态: {socket?.connected ? '已连接' : '断开'} */}
        </div>
      </div>
    </div>
  );
};

export default SiteLinks;