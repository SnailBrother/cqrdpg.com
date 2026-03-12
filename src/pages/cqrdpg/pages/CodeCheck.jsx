// src/pages/CodeCheck.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
// 引入 Logo 图片 (假设放在 public 文件夹下)
// ✅ 1. 引入新库
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import styles from './CodeCheck.module.css';

function CodeCheck() {
  const { code } = useParams();
  const [qrImageSrc, setQrImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const logoImg = '/RuidaLogo.jpg';
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // 新增：下载 loading 状态
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = document.querySelector(`.${styles.paper}`);
      if (!element) {
        alert('未找到可打印的文档区域');
        return;
      }

      // 1. 使用 html2canvas 将 DOM 节点转换为 Canvas
      // scale: 2 可以提高清晰度 (Retina 屏优化)
      // useCORS: true 允许加载跨域图片 (如果 Logo 或公章是跨域的)
      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // 强制白色背景
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      // 2. 初始化 jsPDF
      // 'p' = portrait (纵向), 'mm' = 单位, 'a4' = 纸张格式
      const pdf = new jsPDF('p', 'mm', 'a4');

      // 3. 计算缩放比例以适应 A4 纸
      const imgWidth = 210; // A4 宽度 210mm
      const pageHeight = 295; // A4 高度 297mm (留一点边距)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 4. 将 Canvas 内容添加到 PDF
      // 参数：图片数据，格式，x, y, 宽，高
      pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, imgWidth, imgHeight);

      // 5. 保存文件
      // 文件名：报告编号_查验.pdf
      const fileName = data.ReportNumber ? `报告${data.ReportNumber}_查验.pdf` : '查验报告.pdf';
      pdf.save(fileName);

    } catch (err) {
      console.error('PDF 生成失败:', err);
      alert('生成 PDF 失败，请检查控制台错误或尝试使用浏览器打印功能保存为 PDF。');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      if (!code) {
        setError('缺少校验码参数');
        setLoading(false);
        return;
      }

      try {
        // 1. 获取数据
        const response = await fetch(`/api/CodeDatabase/VerifyAndFetch?code=${encodeURIComponent(code)}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);

          // 2. 构造完整 URL
          const currentOrigin = window.location.origin;
          const fullUrl = `${currentOrigin}/codecheck/${encodeURIComponent(code)}`;
          setQrUrl(fullUrl);

          console.log('正在生成带 Logo 的二维码，目标 URL:', fullUrl);

          // 3. 生成二维码图片
          try {
            // 关键修改：
            // 1. errorCorrectionLevel: 'H' (最高容错率，允许遮挡 30%)
            // 2. width: 增大尺寸 (例如 250)，以便中间留出空间后边缘依然清晰
            const dataUrl = await QRCode.toDataURL(fullUrl, {
              width: 260,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#ffffff'
              },
              errorCorrectionLevel: 'H' // 必须设为 H 以保证扫码成功率
            });

            if (dataUrl) {
              setQrImageSrc(dataUrl);
              console.log('二维码生成成功');
            } else {
              throw new Error('生成的二维码数据为空');
            }
          } catch (qrErr) {
            console.error('❌ 二维码生成库报错:', qrErr);
            setError('二维码生成失败，请尝试刷新页面');
          }

        } else {
          setError(result.error || '无效的二维码或数据不存在');
        }
      } catch (err) {
        console.error('❌ 数据获取失败:', err);
        setError('网络请求失败，请检查服务器连接或防火墙设置');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code]);

  if (loading) {
    return (
      <div className={styles.fullPageBg}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner}></div>
          <p>正在核验防伪信息...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.fullPageBg}>
        <div className={`${styles.paper} ${styles.errorPaper}`}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>验证失败</h2>
          <p className={styles.errorMsg}>{error}</p>
          <p className={styles.errorHint}>该防伪码可能已被篡改、过期或输入错误。</p>
          <Link to="/" className={styles.homeBtn}>返回首页</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() 返回 0-11
    const day = date.getDate();

    return `${year}年${month}月${day}日`;
  };

  return (
    <div className={styles.fullPageBg}>
      <div className={styles.paperContainer}>


        <div className={styles.paper}>

          {/* 二维码区域 - 修改为相对定位容器，以便绝对定位 Logo */}
          <div className={styles.qrSection}>
            {qrImageSrc ? (
              <div className={styles.qrWrapper}>
                <img src={qrImageSrc} alt="查验二维码" className={styles.qrImage} />
                {/* 覆盖在中间的 Logo */}
                <div className={styles.qrLogoOverlay}>
                  <img src={logoImg} alt="Logo" className={styles.logoImage} />
                </div>
              </div>
            ) : (
              <div className={styles.qrError}>
                <p>⚠️ 二维码生成中或失败</p>
                <small>请检查浏览器控制台日志</small>
              </div>
            )}
            <div className={styles.verifiedBadge}>
              校验码:{code}
            </div>
          </div>


          {/* 公章 */}
          <div className={styles.stamp}>
            <img
              src="/OfficialSeal.png"
              alt="官方公章"
              className={styles.stampImage}
              onError={(e) => {
                e.target.style.display = 'none';
                console.warn('公章图片加载失败');
              }}
            />
          </div>

          <div className={styles.paperHeader}>
            <h1 className={styles.reportTitle}>重庆资产评估工作室</h1>
          </div>

          <div className={styles.informationContainer}>

            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>报告编号：</span>
                <span className={styles.value}>{data.ReportNumber || '-'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>项目名称：</span>
                <span className={styles.value}>{data.ProjectName || '-'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>评估金额：</span>
                <span className={styles.value}>¥ {formatAmount(data.EvaluationAmount)}元</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>报告时间：</span>
                <span className={styles.value}>{formatDate(data.ReportTime)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>评估机构：</span>
                <span className={styles.value}>评估工作室</span>
              </div>
            </div>

            <div className={styles.signSection}>
              <div className={styles.signRow}>
                <span className={styles.label}>签字人员：</span>
                <span className={styles.value}>
                  {data.SignerA_Name || '未签字'}（编号：{data.SignerA_Number || '-'}）
                </span>
              </div>
              <div className={styles.signRow}>
                <span className={styles.label}></span>
                <span className={styles.value}>
                  {data.SignerB_Name || '未签字'}（编号：{data.SignerB_Number || '-'}）
                </span>
              </div>
            </div>

            <div className={styles.footer}>
              <p>本查验仅供核实报告真伪使用，谨防假冒网站。</p>
              <p style={{ wordBreak: 'break-all', fontSize: '10px', color: '#999' }}>
                官网查询地址：www.cqrdpg.com，
              </p>
              {/* <p style={{ wordBreak: 'break-all', fontSize: '10px', color: '#999' }}>
               这是当前网页地址 {qrUrl}
              </p> */}
              <p>查验时间：{new Date().toLocaleString('zh-CN')}</p>
            </div>

          </div>

       

        </div>
 <div className={styles.actionBar}>
          <button onClick={() => window.print()} className={styles.printBtn}>🖨️ 打印</button>
          <button 
            onClick={handleDownloadPdf} 
            className={styles.downloadBtn} // 需要新增一个样式类
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? '⏳ 生成中...' : '📄 下载 PDF'}
          </button>
           <Link to="/" className={styles.backBtn}>🏠 首页</Link>
        </div>

      </div>
    </div>
  );
}

export default CodeCheck;