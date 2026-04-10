// src/components/code/ReportQrCodePage.js
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import axios from 'axios';
import './ReportQrCodePage.css';
import { useLocation } from 'react-router-dom';

import WordReportGeneratorLoader from '../../accounting/Notification/WordReportGeneratorLoader';

const ReportQrCodePage = () => {
  const qrCodeRef = useRef(null);
  const location = useLocation();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReportValid, setIsReportValid] = useState(false);
  // 修改页面标题
  useEffect(() => {
    document.title = '重庆评估报告在线验证';
  }, []);
  // 格式化报告日期函数
  // 修复后的格式化报告日期函数
  const formatReportDate = (dateString) => {
    try {
      if (!dateString) return '******';

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '******';

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // 转换为中文年份：二○二五年
      const chineseYear = year.toString().split('').map(char =>
        '○一二三四五六七八九'[parseInt(char)]
      ).join('');

      // 修复月份转换逻辑
      const formatMonth = (month) => {
        if (month === 1) return '一';
        if (month === 2) return '二';
        if (month === 3) return '三';
        if (month === 4) return '四';
        if (month === 5) return '五';
        if (month === 6) return '六';
        if (month === 7) return '七';
        if (month === 8) return '八';
        if (month === 9) return '九';
        if (month === 10) return '十';
        if (month === 11) return '十一';
        if (month === 12) return '十二';
        return '';
      };

      // 修复日期转换逻辑
      const formatDay = (day) => {
        if (day === 1) return '一';
        if (day === 2) return '二';
        if (day === 3) return '三';
        if (day === 4) return '四';
        if (day === 5) return '五';
        if (day === 6) return '六';
        if (day === 7) return '七';
        if (day === 8) return '八';
        if (day === 9) return '九';
        if (day === 10) return '十';
        if (day === 11) return '十一';
        if (day === 12) return '十二';
        if (day === 13) return '十三';
        if (day === 14) return '十四';
        if (day === 15) return '十五';
        if (day === 16) return '十六';
        if (day === 17) return '十七';
        if (day === 18) return '十八';
        if (day === 19) return '十九';
        if (day === 20) return '二十';
        if (day === 21) return '二十一';
        if (day === 22) return '二十二';
        if (day === 23) return '二十三';
        if (day === 24) return '二十四';
        if (day === 25) return '二十五';
        if (day === 26) return '二十六';
        if (day === 27) return '二十七';
        if (day === 28) return '二十八';
        if (day === 29) return '二十九';
        if (day === 30) return '三十';
        if (day === 31) return '三十一';
        return '';
      };

      return `二${chineseYear}年${formatMonth(month)}月${formatDay(day)}日`;
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '******';
    }
  };



  // 检查报告数据是否完整有效
  const checkReportValidity = (data) => {
    if (!data) return false;

    // 检查关键字段是否都有有效值
    const requiredFields = [
      'reportID',
      'location',
      'entrustingParty',
      'appraiserA',
      'appraiserB',
      'appraiserRegNoA',
      'appraiserRegNoB',
      'reportDate'
    ];

    return requiredFields.every(field => {
      const value = data[field];
      return value && value !== '******' && value !== '******';
    });
  };

  // 获取默认数据的函数
  const getDefaultData = (reportsID, locationInfo) => {
    return {
      reportsID: reportsID,
      reportID: '******',
      location: locationInfo || '******',
      buildingArea: '******',
      entrustingParty: '******',
      appraiserA: '******',
      appraiserB: '******',
      appraiserRegNoA: '******',
      appraiserRegNoB: '******',
      reportDate: '******',
      projectID: '******',
      documentNo: '******',
      communityName: '******',
    };
  };

  // 格式化API返回的数据
  const formatReportData = (apiData, reportsID, locationInfo) => {
    if (!apiData) {
      return getDefaultData(reportsID, locationInfo);
    }

    return {
      reportsID: reportsID,

      // 基础信息
      reportID: apiData.reportID || '******',
      location: apiData.location || locationInfo || '******',
      buildingArea: apiData.buildingArea ? `${apiData.buildingArea}` : '******',

      // 估价委托人
      entrustingParty: apiData.entrustingParty || '******',

      // 注册房地产估价师
      appraiserA: apiData.appraiserNameA || '******',
      appraiserB: apiData.appraiserNameB || '******',
      appraiserRegNoA: apiData.appraiserRegNoA || '******',
      appraiserRegNoB: apiData.appraiserRegNoB || '******',

      // 估价报告出具日期
      reportDate: formatReportDate(apiData.reportDate),

      // 其他字段
      projectID: apiData.projectID || '******',
      documentNo: apiData.documentNo || '******',
      communityName: apiData.communityName || '******',
    };
  };

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 步骤1: 从URL参数中解析reportsID
        const queryParams = new URLSearchParams(location.search);
        const reportsID = queryParams.get('reportsID');
        const locationInfo = queryParams.get('location');

        if (!reportsID) {
          throw new Error('报告ID不能为空');
        }

        // 步骤2: 调用API查询数据库中的数据
        //const response = await axios.get(`https://cqrdpg.com:5202/api/searchWordReportsReportQrCode/${reportsID}`);
        const response = await axios.get(`/api/searchWordReportsReportQrCode/${reportsID}`);
        if (!response.data) {
          throw new Error('API返回数据为空');
        }

        if (response.data.success && response.data.data) {
          // 步骤3: 格式化数据并设置到状态中
          const formattedData = formatReportData(response.data.data, reportsID, locationInfo);
          setReportData(formattedData);

          // 检查报告有效性
          const isValid = checkReportValidity(formattedData);
          setIsReportValid(isValid);
        } else {
          throw new Error(response.data.message || '未找到报告数据');
        }
      } catch (err) {
        console.error('获取报告数据失败:', err);
        setError(err.message || '获取报告数据失败');

        // 错误时使用默认数据
        const queryParams = new URLSearchParams(location.search);
        const reportsID = queryParams.get('reportsID');
        const locationInfo = queryParams.get('location');
        const defaultData = getDefaultData(reportsID, locationInfo);
        setReportData(defaultData);
        setIsReportValid(false);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [location]);

  // 步骤4: 生成二维码（仅在报告有效时生成）
  useEffect(() => {
    if (!isReportValid || !reportData || !reportData.reportsID) return;

    const generateQRCode = async () => {
      try {
       // const publicReportUrl = `http://www.cyywork.top/#/reportqrcodepage?reportsID=${reportData.reportsID}`;
        // const publicReportUrl = `/#/reportqrcodepage?reportsID=${reportData.reportsID}`;
        // 动态获取当前域名，避免硬编码 app/office/reportqrcodepage
        const currentOrigin = window.location.origin;
        const publicReportUrl = `${currentOrigin}/app/office/reportqrcodepage?reportsID=${reportData.reportsID}`;
        
        const qrCodeDataUrl = await QRCode.toDataURL(publicReportUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1a5fb4',
            light: '#ffffff'
          }
        });

        if (qrCodeRef.current) {
          qrCodeRef.current.src = qrCodeDataUrl;
        }
      } catch (err) {
        console.error('生成二维码失败:', err);
      }
    };

    generateQRCode();
  }, [reportData, isReportValid]);

  if (loading) {
    return (
      <div className="code-container">
        <WordReportGeneratorLoader />
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className="code-container">
        <div className="error">错误: {error}</div>
      </div>
    );
  }

  return (
    <div className="code-container">

      <div className="code-scrollable">
        <header className="code-header">
          <h1 className="code-title">评估工作室</h1>
          <h2 className="code-subtitle">评估报告验证</h2>

          {/* 报告有效性提示 */}
          <div className={`code-validity-badge ${isReportValid ? 'valid' : 'invalid'}`}>
            {isReportValid ? '✓ 有效报告' : '⚠ 报告验证失败'}
          </div>
        </header>

        <div className="code-content">

          {/* 二维码区域 - 仅在报告有效时显示 */}
          {isReportValid ? (
            <div className="code-qr-section">
              {/* <div className="code-qr-title">扫描二维码查看报告</div> */}
              <div className="code-qr-container">
                <img ref={qrCodeRef} alt="报告二维码" className="code-qr-image" />
              </div>
              {/* <div className="code-qr-desc">使用手机扫描二维码可在移动设备上查看此报告</div> */}
            </div>
          ) : (
            <div className="code-invalid-section">
              <div className="code-invalid-icon">⚠</div>
              <div className="code-invalid-title">报告验证失败</div>
              <div className="code-invalid-desc">
                该报告可能是无效或伪造的报告。
                <br />请联系相关机构进行核实。
                <br />联系电话: 023-XXXXXXX.
              </div>
            </div>
          )}

          <div className="code-section">
            <div className="code-label">估价报告编号：</div>
            <div className="code-value code-long-text">{reportData.reportID}</div>
          </div>


          <div className="code-section">
            <div className="code-label">估价项目名称：</div>
            <div className="code-value code-long-text">
              {reportData.location && reportData.location !== '******'
                ? `位于${reportData.location}的房地产市场价值评估项目`
                : '******'
              }
            </div>
          </div>

          <div className="code-section">
            <div className="code-label">估价委托人：</div>
            <div className="code-value">{reportData.entrustingParty}</div>
          </div>

          <div className="code-section">
            <div className="code-label">注册房地产估价师：</div>
            <div className="code-value">
              <div className="code-appraiser-container">
                <div className="code-appraiser-row">
                  <span className="code-appraiser-name">{reportData.appraiserA}</span>
                  <span className="code-appraiser-number">{reportData.appraiserRegNoA}</span>
                </div>
                <div className="code-appraiser-row">
                  <span className="code-appraiser-name">{reportData.appraiserB}</span>
                  <span className="code-appraiser-number">{reportData.appraiserRegNoB}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="code-section code-last-section">
            <div className="code-label">估价报告出具日期：</div>
            <div className="code-value">{reportData.reportDate}</div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default ReportQrCodePage;