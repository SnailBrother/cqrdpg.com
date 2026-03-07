// src/pages/QrcodeManagementSettings.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './QrcodeManagementSettings.module.css';


function QrcodeManagementSettings({ onLogout }) {
  const navigate = useNavigate();
  const modalListRef = useRef(null);


  // --- 主表单状态 ---
  const [formData, setFormData] = useState({
    Id: null, 
    SafeCode: null, // 新增：存储当前编辑项的混淆码
    ProjectName: '',
    EvaluationAmount: '',
    ReportTime: new Date().toISOString().split('T')[0],
    ReportNumber: '',
    SignerA_Name: '',
    SignerA_Number: '',
    SignerB_Name: '',
    SignerB_Number: '',
  });


  // --- 搜索模态框状态 ---
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isInfiniteLoading, setIsInfiniteLoading] = useState(false);


  const handleLogout = () => {
    // onLogout();
    navigate('/');
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const openSearchModal = () => {
    setIsSearchModalOpen(true);
    setSearchPage(1);
    setSearchResults([]);
    setHasMore(true);
    setSearchKeyword('');
    loadSearchResults(1, '', true);
  };


  const loadSearchResults = async (page, keyword, reset = false) => {
    if (isSearching || (isInfiniteLoading && !reset)) return;
    
    if (reset) setIsSearching(true);
    else setIsInfiniteLoading(true);


    try {
      const response = await fetch(`/api/CodeDatabase/List?page=${page}&pageSize=20&keyword=${encodeURIComponent(keyword)}`);
      if (!response.ok) throw new Error('Network error');
      const result = await response.json();


      if (reset) {
        setSearchResults(result.data);
        setIsSearching(false);
      } else {
        setSearchResults(prev => [...prev, ...result.data]);
        setIsInfiniteLoading(false);
      }


      const totalFetched = reset ? result.data.length : searchResults.length + result.data.length;
      setHasMore(totalFetched < result.total);
      
      if (!reset) setSearchPage(page); 


    } catch (error) {
      console.error(error);
      alert('加载数据失败');
      if (reset) setIsSearching(false);
      else setIsInfiniteLoading(false);
    }
  };


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchPage(1);
    loadSearchResults(1, searchKeyword, true);
  };


  useEffect(() => {
    if (!isSearchModalOpen || !hasMore || isSearching || isInfiniteLoading) return;


    const handleScroll = () => {
      const container = modalListRef.current;
      if (!container) return;
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 50) {
        const nextPage = searchPage + 1;
        setSearchPage(nextPage);
        loadSearchResults(nextPage, searchKeyword, false);
      }
    };


    const container = modalListRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [isSearchModalOpen, hasMore, searchPage, searchKeyword, isSearching, isInfiniteLoading, searchResults.length]);


  // --- 选择数据回填 ---
  const handleSelectRecord = (record) => {
    let dateStr = '';
    if (record.ReportTime) {
      dateStr = record.ReportTime.toString().substring(0, 10);
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }


    setFormData({
      Id: record.Id,
      SafeCode: record.safeCode, // 保存混淆码
      ProjectName: record.ProjectName || '',
      EvaluationAmount: record.EvaluationAmount || '',
      ReportTime: dateStr,
      ReportNumber: record.ReportNumber || '',
      SignerA_Name: record.SignerA_Name || '',
      SignerA_Number: record.SignerA_Number || '',
      SignerB_Name: record.SignerB_Name || '',
      SignerB_Number: record.SignerB_Number || ''
    });
    setIsSearchModalOpen(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = formData.Id !== null; 
    
    const url = isEdit 
      ? `/api/CodeDatabase/Update/${formData.Id}` 
      : '/api/CodeDatabase/Add';
    
    const method = isEdit ? 'PUT' : 'POST';


    const submitData = { ...formData };
    if (!isEdit) {
      delete submitData.Id;
      delete submitData.SafeCode;
    }


    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });


      const result = await response.json();


      if (response.ok) {
        const msg = isEdit ? '修改成功！' : '添加成功！';
        alert(msg);
        
        if (!isEdit) {
           // 如果是新增，后端返回了新的 safeCode，可以直接利用或者清空
           // 这里选择清空表单，让用户重新搜索或录入
           setFormData({
            Id: null,
            SafeCode: null,
            ProjectName: '',
            EvaluationAmount: '',
            ReportTime: new Date().toISOString().split('T')[0],
            ReportNumber: '',
            SignerA_Name: '',
            SignerA_Number: '',
            SignerB_Name: '',
            SignerB_Number: ''
          });
        } else {
            // 如果是修改，safeCode 不会变，保持即可
        }
      } else {
        alert(result.error || '操作失败');
      }
    } catch (error) {
      console.error(error);
      alert('网络错误');
    }
  };


  const handleClear = () => {
    setFormData({
      Id: null,
      SafeCode: null,
      ProjectName: '',
      EvaluationAmount: '',
      ReportTime: new Date().toISOString().split('T')[0],
      ReportNumber: '',
      SignerA_Name: '',
      SignerA_Number: '',
      SignerB_Name: '',
      SignerB_Number: ''
    });
  };


  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>二维码</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>退出登录</button>
      </header>


      <div className={styles.mainFormCard}>
        <div className={styles.formHeader}>
          <h2>数据录入 / 编辑</h2>
          <div className={styles.formActions}>
            <button type="button" onClick={openSearchModal} className={styles.searchBtn}>📋 选择报告</button>
            <button type="button" onClick={handleClear} className={styles.clearBtn}>清空</button>
            <button type="button" onClick={handleSubmit} className={styles.submitBtn}>保存</button>
          </div>
        </div>


        <form onSubmit={handleSubmit} className={styles.formContainer}>
          {/* 只有当当前编辑的数据有 ID 时，才显示查看按钮 */}
          {formData.Id && formData.SafeCode && (
            <div className={styles.viewQrContainer}>
              <button 
                type="button" 
                // 【关键修改】跳转时使用 safeCode
                onClick={() => navigate(`/codecheck/${encodeURIComponent(formData.SafeCode)}`)}
                className={styles.viewQrBtn}
              >
                🔍 查看二维码 (Code: {formData.SafeCode})
              </button>
            </div>
          )}
          
          <div className={styles.formItem}>
            <label className={styles.formLabel}>报告号：</label>
            <div className={styles.formField}>
              <input
                name="ReportNumber"
                value={formData.ReportNumber}
                onChange={handleInputChange}
                placeholder="请输入报告号"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formItem}>
            <label className={styles.formLabel}>项目名称：</label>
            <div className={styles.formField}>
              <input 
                name="ProjectName" 
                value={formData.ProjectName} 
                onChange={handleInputChange} 
                placeholder="请输入项目名称"
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.formItem}>
            <label className={styles.formLabel}>评估金额：</label>
            <div className={styles.formField}>
              <input 
                type="number" 
                step="0.01" 
                name="EvaluationAmount" 
                value={formData.EvaluationAmount} 
                onChange={handleInputChange} 
                placeholder="请输入评估金额"
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.formItem}>
            <label className={styles.formLabel}>报告时间：</label>
            <div className={styles.formField}>
              <input 
                type="date" 
                name="ReportTime" 
                value={formData.ReportTime} 
                onChange={handleInputChange} 
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.sectionTitle}>签字人员 A</div>
          
          <div className={styles.formItem}>
            <label className={styles.formLabel}>姓名：</label>
            <div className={styles.formField}>
              <input 
                name="SignerA_Name" 
                value={formData.SignerA_Name} 
                onChange={handleInputChange} 
                placeholder="请输入姓名"
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.formItem}>
            <label className={styles.formLabel}>编号：</label>
            <div className={styles.formField}>
              <input 
                name="SignerA_Number" 
                value={formData.SignerA_Number} 
                onChange={handleInputChange} 
                placeholder="请输入编号"
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.sectionTitle}>签字人员 B</div>
          
          <div className={styles.formItem}>
            <label className={styles.formLabel}>姓名：</label>
            <div className={styles.formField}>
              <input 
                name="SignerB_Name" 
                value={formData.SignerB_Name} 
                onChange={handleInputChange} 
                placeholder="请输入姓名"
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.formItem}>
            <label className={styles.formLabel}>编号：</label>
            <div className={styles.formField}>
              <input 
                name="SignerB_Number" 
                value={formData.SignerB_Number} 
                onChange={handleInputChange} 
                placeholder="请输入编号"
                className={styles.input} 
              />
            </div>
          </div>
        </form>
      </div>


      {/* 搜索模态框内容基本不变，只是表格点击回调会带回 safeCode */}
      {isSearchModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.searchModalContent}>
            <div className={styles.modalHeader}>
              <h3>选择报告数据</h3>
              <button onClick={() => setIsSearchModalOpen(false)} className={styles.closeBtn}>×</button>
            </div>
            
            <form onSubmit={handleSearchSubmit} className={styles.modalSearchBar}>
              <input 
                type="text" 
                placeholder="输入项目名称或报告号搜索..." 
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className={styles.input}
              />
              <button type="submit" className={styles.searchButton}>搜索</button>
            </form>


            <div className={styles.modalListContainer} ref={modalListRef}>
              {isSearching && <div className={styles.loadingState}>加载中...</div>}
              
              {searchResults.length === 0 && !isSearching && (
                <div className={styles.emptyState}>暂无数据，请尝试搜索</div>
              )}


              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th>报告号</th>
                    <th>项目名称</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(item => (
                    <tr 
                      key={item.Id} 
                      onClick={() => handleSelectRecord(item)}
                      className={styles.modalTableRow}
                    >
                      <td>{item.ReportNumber}</td>
                      <td>{item.ProjectName}</td>
                      <td>{item.ReportTime ? item.ReportTime.toString().substring(0, 10) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>


              {isInfiniteLoading && <div className={styles.loadingState}>加载更多...</div>}
              {!hasMore && searchResults.length > 0 && <div className={styles.noMoreState}>没有更多数据了</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QrcodeManagementSettings;