import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from 'react-router-dom';
import axios from "axios";
import "./UploadHousePricePicture.css";
import { Loading } from '../../../../components/UI';
import WordReportGeneratorLoader from '../../accounting/Notification/WordReportGeneratorLoader';

const UploadHousePricePicture = () => {
  // 修改页面标题
  useEffect(() => {
    document.title = '照片上传';
  }, []);
  
  // 使用useSearchParams获取查询参数
  const [searchParams] = useSearchParams();
  // 从查询参数中获取reportsID和location
  const reportsID = searchParams.get('reportsID') || "";
  const location = searchParams.get('location') || "";
  
  const [files, setFiles] = useState([]);
  const [compressedFiles, setCompressedFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [hoveredImage, setHoveredImage] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [scalePercentage, setScalePercentage] = useState(80);
  const [totalSize, setTotalSize] = useState(0);
  const [compressionMode, setCompressionMode] = useState(false);
  
  const fileInputRef = useRef(null);

  // 获取已存在的图片列表
  useEffect(() => {
    if (reportsID) {
      fetchExistingImages();
    }
  }, [reportsID]);

  // 计算总文件大小
  useEffect(() => {
    if (compressedFiles.length > 0) {
      const total = compressedFiles.reduce((sum, file) => sum + file.compressedSize, 0);
      setTotalSize(total);
    } else if (files.length > 0) {
      const total = files.reduce((sum, file) => sum + file.size, 0);
      setTotalSize(total);
    } else {
      setTotalSize(0);
    }
  }, [files, compressedFiles]);

  const fetchExistingImages = async () => {
    try {
      const response = await axios.get(`/api/GetHousePricePictures?reportsID=${reportsID}`);
      if (response.data.success) {
        setExistingImages(response.data.images || []);
      }
    } catch (error) {
      console.error('获取已存在图片失败:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // 检查文件数量
    if (selectedFiles.length + files.length > 30) {
      setMessage("一次最多只能上传30张图片");
      return;
    }
    
    // 检查文件格式和大小
    for (const file of selectedFiles) {
      if (!file.type.match(/image\/jpeg/) && !file.type.match(/image\/jpg/)) {
        setMessage("只支持 .jpg 或 .jpeg 格式的图片");
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB 限制
        setMessage(`图片 "${file.name}" 大小不能超过 10MB`);
        return;
      }
    }
    
    // 检查重复文件
    const newFiles = selectedFiles.filter(newFile => {
      // 检查是否与已选择的文件重复
      const isDuplicateInSelection = files.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      );
      
      // 检查是否与服务器上已存在的文件重复
      const isDuplicateInServer = existingImages.some(existingImage => 
        existingImage.pictureFileName === newFile.name
      );
      
      if (isDuplicateInSelection) {
        setMessage(`文件 "${newFile.name}" 已经在选择列表中`);
        return false;
      }
      
      if (isDuplicateInServer) {
        setMessage(`文件 "${newFile.name}" 已在服务器存在，请勿重复上传`);
        return false;
      }
      
      return true;
    });
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    e.target.value = ''; // 重置文件输入
    setCompressionMode(false);
    setCompressedFiles([]);
  };

  // 图片压缩函数
  const compressImage = (file, scalePercentage) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const scaleFactor = scalePercentage / 100;
        const targetWidth = Math.floor(img.width * scaleFactor);
        const targetHeight = Math.floor(img.height * scaleFactor);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // 白色背景（防止透明变黑）
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // 使用固定的质量参数，不调整JPEG质量
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("无法生成压缩图片"));
              return;
            }
            resolve({
              blob,
              width: targetWidth,
              height: targetHeight,
              compressedSize: blob.size,
              originalSize: file.size,
              name: file.name,
              url: URL.createObjectURL(blob)
            });
          },
          "image/jpeg",
          0.85 // 固定质量，不使用JPEG质量滑块
        );
      };

      img.onerror = (error) => {
        reject(error);
      };
    });
  };

  const handleCompress = async () => {
    if (files.length === 0) {
      setMessage("请先选择图片");
      return;
    }

    setIsCompressing(true);
    setMessage("正在压缩图片...");

    try {
      const compressionResults = [];
      for (const file of files) {
        if (file.type === "image/jpeg" || file.type === "image/jpg") {
          const compressedData = await compressImage(file, scalePercentage);
          compressionResults.push({
            ...compressedData,
            blob: compressedData.blob
          });
        }
      }

      setCompressedFiles(compressionResults);
      setCompressionMode(true);
      setMessage("压缩完成！");
    } catch (error) {
      setMessage("压缩失败：" + error.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveFile = (index) => {
    if (compressionMode) {
      const newCompressedFiles = [...compressedFiles];
      newCompressedFiles.splice(index, 1);
      setCompressedFiles(newCompressedFiles);
      
      // 如果所有压缩文件都被删除了，回到原始文件状态
      if (newCompressedFiles.length === 0) {
        setCompressionMode(false);
      }
    } else {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
    }
  };

  const handleUpload = async () => {
    if (!reportsID || !location) {
      setMessage("请确保报告ID和坐落信息完整");
      return;
    }

    const filesToUpload = compressionMode ? compressedFiles : files;
    
    if (filesToUpload.length === 0) {
      setMessage("请选择至少一张图片");
      return;
    }

    // 检查总文件大小是否超过1MB
    const totalSize = filesToUpload.reduce((sum, file) => {
      return sum + (compressionMode ? file.compressedSize : file.size);
    }, 0);
    
    if (totalSize > 1024 * 1024) {
      setMessage("总文件大小不能超过1MB");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("reportsID", reportsID);
    formData.append("location", location);
    
    for (const fileData of filesToUpload) {
      if (compressionMode) {
        formData.append("images", fileData.blob, fileData.name);
      } else {
        formData.append("images", fileData);
      }
    }

    try {
      const response = await axios.post("/api/UploadHousePricePicture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setMessage(response.data.message);
      
      // 上传成功后清空文件列表并刷新已存在图片列表
      if (response.data.success) {
        setFiles([]);
        setCompressedFiles([]);
        setCompressionMode(false);
        setScalePercentage(80);
        fetchExistingImages();
      }
      
    } catch (error) {
      setMessage("上传失败：" + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setCompressedFiles([]);
    setCompressionMode(false);
    setScalePercentage(80);
    setMessage("");
  };

  const showOverlay = (file, isCompressed = false) => {
    if (isCompressed) {
      setHoveredImage(file.url);
    } else {
      setHoveredImage(URL.createObjectURL(file));
    }
    setIsOverlayVisible(true);
  };

  const hideOverlay = () => {
    setIsOverlayVisible(false);
    setHoveredImage(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      Array.from(e.dataTransfer.files).forEach(file => {
        dataTransfer.items.add(file);
      });
      fileInputRef.current.files = dataTransfer.files;
      handleFileChange({ target: fileInputRef.current });
    }
  };

  const displayFiles = compressionMode ? compressedFiles : files;

  return (
    <div className="uphpPicture-container">
      {/* 加载动画 - 用于上传 */}
      {isLoading && <WordReportGeneratorLoader />}
      
      {/* 遮盖层 - 用于压缩处理 */}
      {isCompressing && <Loading message="图片压缩中..." />}
      
      <div className="uphpPicture-header">
        <h2>{reportsID} - {location}</h2>
        <p className="uphpPicture-instructions">
          {compressionMode ? 
            "压缩完成，请确认压缩后的图片效果" : 
            "请上传相关图片 (仅支持JPG格式，最大10MB)"
          }
        </p>
        
        {/* 显示已存在的图片数量 */}
        {existingImages.length > 0 && (
          <p className="uphpPicture-existing-info">
            当前报告已有 {existingImages.length} 张图片
          </p>
        )}
      </div>

      {/* 压缩控制面板 */}
      {files.length > 0 && !compressionMode && (
        <div className="uphpPicture-compression-controls">
          <div className="uphpPicture-compression-slider">
            <label>
              缩放比例: <span className="uphpPicture-scale-value">{scalePercentage}%</span>
              <input
                type="range"
                min="10"
                max="100"
                value={scalePercentage}
                onChange={(e) => setScalePercentage(parseInt(e.target.value))}
                className="uphpPicture-slider"
              />
            </label>
            <div className="uphpPicture-slider-info">
              <span>小</span>
              <span>原图大小</span>
            </div>
          </div>
          
          <div className="uphpPicture-compression-buttons">
            <button 
              className="uphpPicture-button uphpPicture-compress-btn"
              onClick={handleCompress}
              disabled={isCompressing}
            >
              {isCompressing ? '压缩中...' : '压缩图片'}
            </button>
            {/* <button 
              className="uphpPicture-button uphpPicture-skip-btn"
              onClick={() => setCompressionMode(true)}
            >
              跳过压缩直接上传
            </button> */}
          </div>
          
          <p className="uphpPicture-compression-hint">
            提示：压缩可以减小文件大小，建议缩放比例为80%以获得较好的质量和大小平衡
          </p>
        </div>
      )}

      {/* 文件大小显示 */}
      {(files.length > 0 || compressedFiles.length > 0) && (
        <div className="uphpPicture-size-info">
          <p>
            总文件大小: <span className="uphpPicture-total-size">{(totalSize / 1024).toFixed(2)} KB</span>
            {totalSize > 1024 * 1024 && (
              <span className="uphpPicture-size-warning"> (超过1MB限制，请压缩或减少图片)</span>
            )}
          </p>
          {compressionMode && compressedFiles.length > 0 && (
            <p className="uphpPicture-compression-summary">
              原始总大小: {(files.reduce((sum, file) => sum + file.size, 0) / 1024).toFixed(2)} KB → 
              压缩后: {(totalSize / 1024).toFixed(2)} KB (节省 {((1 - totalSize / files.reduce((sum, file) => sum + file.size, 0)) * 100).toFixed(1)}%)
            </p>
          )}
        </div>
      )}

      <div 
        className="uphpPicture-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {displayFiles.length === 0 ? (
          <label htmlFor="file-upload" className="uphpPicture-prompt">
            <div className="uphpPicture-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="#888" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
            </div>
            <p>点击或拖拽文件到此处上传</p>
            <p className="uphpPicture-hint">支持JPG格式，最大10MB，最多30张</p>
            {existingImages.length > 0 && (
              <p className="uphpPicture-warning-hint">
                注意：重复的图片名称将不会被上传
              </p>
            )}
          </label>
        ) : (
          <div className="uphpPicture-file-list-container">
            <label htmlFor="file-upload" className="uphpPicture-add-more-button">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#fff" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              添加更多图片
            </label>
            <div className="uphpPicture-preview-grid">
              {displayFiles.map((file, index) => (
                <div key={index} className="uphpPicture-preview-item">
                  <img
                    src={compressionMode ? file.url : URL.createObjectURL(file)}
                    alt={`preview-${index}`}
                    className="uphpPicture-preview-image"
                  />
                  <div className="uphpPicture-preview-actions">
                    <button 
                      className="uphpPicture-action-button uphpPicture-enlarge" 
                      onClick={() => showOverlay(file, compressionMode)}
                      title="放大"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="#fff" d="M15.5,14L20.5,19L19,20.5L14,15.5V14.71L13.73,14.43C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.43,13.73L14.71,14H15.5M9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14M12,10H10V12H9V10H7V9H9V7H10V9H12V10Z" />
                      </svg>
                    </button>
                    <button 
                      className="uphpPicture-action-button uphpPicture-delete" 
                      onClick={() => handleRemoveFile(index)}
                      title="删除"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="#fff" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="uphpPicture-file-info">
                    <span className="uphpPicture-file-name">{compressionMode ? file.name : file.name}</span>
                    <span className="uphpPicture-file-size">
                      {compressionMode ? 
                        `${(file.compressedSize / 1024).toFixed(1)}KB` : 
                        `${(file.size / 1024).toFixed(1)}KB`
                      }
                    </span>
                  </div>
                  {compressionMode && (
                    <div className="uphpPicture-compression-badge">
                      <svg viewBox="0 0 24 24" width="12" height="12">
                        <path fill="#10b981" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                      </svg>
                      已压缩
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {displayFiles.length > 0 && (
        <div className="uphpPicture-actions">
          <button 
            className="uphpPicture-button uphpPicture-upload-btn" 
            onClick={handleUpload}
            disabled={isLoading || totalSize > 1024 * 1024}
          >
            {isLoading ? '上传中...' : '上传图片'}
          </button>
          
          <button 
            className="uphpPicture-button uphpPicture-reset-btn"
            onClick={handleReset}
            disabled={isLoading}
          >
            重新选择
          </button>
          
          <span className="uphpPicture-selected-count">
            {compressionMode ? '压缩后' : '已选择'} {displayFiles.length} 张图片
          </span>
        </div>
      )}

      {message && (
        <div className={`uphpPicture-message ${message.includes('失败') || message.includes('错误') || message.includes('超过') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {isOverlayVisible && (
        <div className="uphpPicture-overlay" onClick={hideOverlay}>
          <div className="uphpPicture-overlay-content" onClick={e => e.stopPropagation()}>
            <img
              src={hoveredImage}
              alt="放大预览"
              className="uphpPicture-zoomed-image"
            />
            <button className="uphpPicture-close-button" onClick={hideOverlay}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadHousePricePicture;