import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import styles from './Project.module.css';

const Project = () => {
  const [fields, setFields] = useState([]); // 字段定义
  const [data, setData] = useState([]); // 项目数据
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 获取字段定义
  const fetchFields = async () => {
    try {
      const response = await axios.get('/api/getProjectFields');
      setFields(response.data);
      
      // 初始化表单数据
      const initialFormData = {};
      response.data.forEach(field => {
        if (field.IsVisible) {
          initialFormData[field.EnglishName] = '';
        }
      });
      setFormData(initialFormData);
    } catch (error) {
      console.error('获取字段失败:', error);
    }
  };

  // 获取项目数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/getProject');
      setData(response.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  // 处理表单变化
  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // 添加项目
  const handleAddProject = async () => {
    try {
      const response = await axios.post('/api/addProject', formData);
      if (response.data.success) {
        alert('添加成功');
        setIsAddModalOpen(false);
        fetchData();
        // 重置表单
        const resetForm = {};
        fields.forEach(field => {
          if (field.IsVisible) {
            resetForm[field.EnglishName] = '';
          }
        });
        setFormData(resetForm);
      }
    } catch (error) {
      alert('添加失败: ' + error.response?.data?.message || error.message);
    }
  };

  // 编辑项目
  const handleEditProject = async (id) => {
    try {
      const response = await axios.put('/api/updateProject', {
        id,
        ...formData
      });
      if (response.data.success) {
        alert('更新成功');
        setEditingId(null);
        fetchData();
      }
    } catch (error) {
      alert('更新失败: ' + error.response?.data?.message || error.message);
    }
  };

  // 删除项目
  const handleDeleteProject = async (id) => {
    if (window.confirm('确定要删除这个项目吗？')) {
      try {
        const response = await axios.delete('/api/deleteProject', {
          data: { id }
        });
        if (response.data.success) {
          alert('删除成功');
          fetchData();
        }
      } catch (error) {
        alert('删除失败: ' + error.response?.data?.message || error.message);
      }
    }
  };

  // 开始编辑
  const startEdit = (item) => {
    setEditingId(item.ProjectID);
    const editFormData = {};
    fields.forEach(field => {
      if (field.IsVisible) {
        editFormData[field.EnglishName] = item[field.EnglishName] || '';
      }
    });
    setFormData(editFormData);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    const resetForm = {};
    fields.forEach(field => {
      if (field.IsVisible) {
        resetForm[field.EnglishName] = '';
      }
    });
    setFormData(resetForm);
  };

  // 处理文件上传
  const handleFileUpload = (e) => {
    setUploadFile(e.target.files[0]);
  };

  // 批量上传
  const handleBatchUpload = async () => {
    if (!uploadFile) {
      alert('请选择文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        // 获取字段映射
        const fieldMapping = {};
        fields.forEach(field => {
          fieldMapping[field.ChineseName] = field.EnglishName;
        });

        // 转换数据格式
        const transformedData = jsonData.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const englishName = fieldMapping[key];
            if (englishName) {
              newRow[englishName] = row[key];
            }
          });
          return newRow;
        });

        const response = await axios.post('/api/batchUploadProject', transformedData);
        if (response.data.success) {
          alert(`成功上传 ${response.data.insertedCount} 条数据`);
          setUploadFile(null);
          document.getElementById('fileInput').value = '';
          fetchData();
        }
      } catch (error) {
        alert('上传失败: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(uploadFile);
  };

  // 渲染表单字段
  const renderFormField = (field) => {
    if (!field.IsVisible) return null;

    const value = formData[field.EnglishName] || '';

    switch (field.DataType.toLowerCase()) {
      case 'date':
        return (
          <div key={field.EnglishName} className={styles.formGroup}>
            <label>{field.ChineseName}:</label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleInputChange(field.EnglishName, e.target.value)}
              disabled={!field.IsEditable && editingId !== null}
            />
          </div>
        );
      
      case 'decimal':
      case 'int':
        return (
          <div key={field.EnglishName} className={styles.formGroup}>
            <label>{field.ChineseName}:</label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field.EnglishName, e.target.value)}
              disabled={!field.IsEditable && editingId !== null}
              step={field.DataType.toLowerCase() === 'decimal' ? '0.01' : '1'}
            />
          </div>
        );
      
      default:
        return (
          <div key={field.EnglishName} className={styles.formGroup}>
            <label>{field.ChineseName}:</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.EnglishName, e.target.value)}
              disabled={!field.IsEditable && editingId !== null}
            />
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>项目管理</h1>
        <div className={styles.headerActions}>
          <button 
            className={styles.addButton}
            onClick={() => setIsAddModalOpen(true)}
          >
            添加项目
          </button>
          
          <div className={styles.uploadSection}>
            <input
              type="file"
              id="fileInput"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className={styles.fileInput}
            />
            <button 
              className={styles.uploadButton}
              onClick={handleBatchUpload}
              disabled={!uploadFile}
            >
              批量上传
            </button>
          </div>
        </div>
      </div>

      {/* 添加/编辑模态框 */}
      {isAddModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? '编辑项目' : '添加项目'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setIsAddModalOpen(false);
                  cancelEdit();
                }}
              >
                ×
              </button>
            </div>
            
            <div className={styles.form}>
              {fields.map(renderFormField)}
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.submitButton}
                onClick={editingId ? () => handleEditProject(editingId) : handleAddProject}
              >
                {editingId ? '更新' : '添加'}
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setIsAddModalOpen(false);
                  cancelEdit();
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 数据表格 */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {fields
                  .filter(field => field.IsVisible)
                  .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
                  .map(field => (
                    <th key={field.EnglishName}>{field.ChineseName}</th>
                  ))}
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.ProjectID || index}>
                  {fields
                    .filter(field => field.IsVisible)
                    .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
                    .map(field => (
                      <td key={field.EnglishName}>
                        {item[field.EnglishName]}
                      </td>
                    ))}
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.editButton}
                        onClick={() => {
                          startEdit(item);
                          setIsAddModalOpen(true);
                        }}
                      >
                        编辑
                      </button>
                      <button 
                        className={styles.deleteButton}
                        onClick={() => handleDeleteProject(item.ProjectID)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Project;