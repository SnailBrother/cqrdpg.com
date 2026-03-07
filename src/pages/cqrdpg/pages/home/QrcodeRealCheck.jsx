import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './QrcodeRealCheck.module.css';

const QrcodeRealCheck = () => {
  const [safeCode, setSafeCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 处理输入变化（自动转大写，提升体验）
  const handleInputChange = (e) => {
    // 注意：如果你的混淆码包含小写字母，这里不要强制 toUpperCase()
    // 根据你之前的 generateSafeCodeFromId 逻辑，DecodedText 可能是大小写敏感的
    // 为了安全，我们保留用户输入的原始大小写，或者只去除首尾空格
    setSafeCode(e.target.value.trim());
    setError(''); 
  };

  // 提交验证
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!safeCode) {
      setError('请输入校验码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 【关键修改】调用你后端已有的 VerifyAndFetch 接口
      // 这个接口内部会自动执行：混淆码 -> 解析出 ID -> 查库
      const response = await fetch(`/api/CodeDatabase/VerifyAndFetch?code=${encodeURIComponent(safeCode)}`);
      
      const result = await response.json();

      if (!response.ok) {
        // 后端返回 404 或 400 时，抛出错误
        throw new Error(result.error || '校验码无效');
      }

      if (result.success) {
        // 验证成功！
        // result.data 中包含了完整的报告信息
        // result.data.safeCode 是重新生成的标准混淆码
        
        const finalCode = result.data.safeCode || safeCode;
        
        console.log('验证成功，跳转至:', `/codecheck/${finalCode}`);
        
        // 跳转到详情页
        navigate(`/codecheck/${encodeURIComponent(finalCode)}`);
      } else {
        throw new Error(result.error || '验证失败');
      }

    } catch (err) {
      console.error('Verification failed:', err);
      // 区分错误类型给用户友好提示
      let msg = err.message;
      if (msg.includes('无效的校验码') || msg.includes('数据不存在')) {
        msg = '❌ 未找到该报告，请检查校验码是否输入正确。';
      } else if (msg.includes('映射表缺少')) {
        msg = '⚠️ 系统配置错误，请联系管理员。';
      } else {
        msg = '⚠️ 网络异常，请稍后重试。';
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>🛡️</div>
          <h1 className={styles.title}>报告真伪查验</h1>
          <p className={styles.subtitle}>请输入报告上的防伪校验码 (如：Q8S5...)</p>
        </div>

        <form onSubmit={handleVerify} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="safeCode" className={styles.label}>防伪校验码</label>
            <input
              id="safeCode"
              type="text"
              value={safeCode}
              onChange={handleInputChange}
              placeholder="请输入完整的混淆码"
              className={styles.input}
              disabled={loading}
              autoComplete="off"
              // 移除 text-transform: uppercase，防止大小写敏感问题
              style={{ textTransform: 'none' }} 
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={loading || !safeCode}
          >
            {loading ? '正在解析校验码...' : '立即查验'}
          </button>
        </form>

        <div className={styles.footerNote}>
          <p>提示：校验码由字母和符号组成，区分大小写，请仔细核对。</p>
        </div>
      </div>
    </div>
  );
};

export default QrcodeRealCheck;