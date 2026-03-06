  // 初始化加载默认文档 loadDocument('/backend/public/downloads/Templates/房地产/司法/结果报告-单套住宅.docx');
import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import './TemplateManagementDocxEditor.css';

const TemplateManagementDocxEditor = ({ fileUrl, fileName, templateData }) => {
  const viewerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [fileData, setFileData] = useState(null);

  useEffect(() => {
    if (templateData) {
      // 使用从父组件传递的templateData动态构造路径
      const dynamicPath = `/backend/public/downloads/Templates/${templateData.AssetType}/${templateData.ValuationPurpose}/${templateData.DocumentName}`;
      loadDocument(dynamicPath);
      setCurrentFileName(templateData.DocumentName);
    }
  }, [templateData]);

  // 加载文档
  const loadDocument = async (filePathOrBlob) => {
    try {
      let arrayBuffer;

      if (typeof filePathOrBlob === 'string') {
        // 从URL加载
        const response = await fetch(filePathOrBlob);
        if (!response.ok) throw new Error('文件加载失败');
        arrayBuffer = await response.arrayBuffer();
      } else {
        // 从文件对象加载
        arrayBuffer = await filePathOrBlob.arrayBuffer();
        setCurrentFileName(filePathOrBlob.name);
      }

      setFileData(arrayBuffer);
      if (viewerRef.current) viewerRef.current.innerHTML = '';
      await renderDocx(arrayBuffer);

    } catch (error) {
      console.error('文档加载失败:', error);
      alert(`文档加载失败: ${error.message}`);
    }
  };

  // 渲染DOCX
  const renderDocx = async (arrayBuffer) => {
    try {
      await renderAsync(
        arrayBuffer,
        viewerRef.current,
        null,
        {
          className: "custom-docx-viewer",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: true
        }
      );
    } catch (error) {
      console.error('文档渲染失败:', error);
      alert('文档渲染失败: ' + error.message);
    }
  };

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) loadDocument(file);
  };

  // 触发文件选择
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // 下载文档
  const downloadDocument = () => {
    if (!fileData) return;

    const blob = new Blob([fileData], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || 'document.docx';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="docx-editor-container">
      <div className="docx-editor-header">
        <h2>{currentFileName || '未命名文档'}</h2>
        
        <div className="docx-editor-actions">
          <button
            onClick={triggerFileInput}
            className="docx-editor-button replace-button"
          >
            更换文档
          </button>

          <button
            onClick={downloadDocument}
            className="docx-editor-button download-button"
            disabled={!fileData}
          >
            下载文档
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".docx"
          style={{ display: 'none' }}
        />
      </div>

      <div
        ref={viewerRef}
        className="docx-viewer-content"
      />
    </div>
  );
};

export default TemplateManagementDocxEditor;