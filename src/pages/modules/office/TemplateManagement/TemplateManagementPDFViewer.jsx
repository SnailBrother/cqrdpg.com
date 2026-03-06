import React from 'react';

const TemplateManagementPDFViewer = ({ templateData }) => {
  // 获取文件名（不含扩展名）
  const fileNameWithoutExtension = templateData.DocumentName.replace(/\.[^/.]+$/, "");
  // 强制使用 .pdf 扩展名
  const pdfFileName = `${fileNameWithoutExtension}.pdf`;
  
  // 动态构建 PDF 文件路径
  const pdfPath = `/backend/public/downloads/Templates/${templateData.AssetType}/${templateData.ValuationPurpose}/${pdfFileName}`;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe 
        src={pdfPath} 
        width="100%" 
        height="100%"
        title="PDF Viewer"
        style={{ border: 'none' }}
      >
        <p>您的浏览器不支持 PDF 显示，请<a href={pdfPath}>点击这里下载</a>。</p>
      </iframe>
    </div>
  );
};

export default TemplateManagementPDFViewer;