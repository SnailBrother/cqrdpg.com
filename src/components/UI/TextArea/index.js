import React from 'react';
import styles from './TextArea.module.css';

const TextArea = ({
  label,
  value,
  onChange,
  placeholder = '',
  error = '',
  rows = 4,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const cls = `${styles.textarea} ${error ? styles.inputError : ''} ${disabled ? styles.disabled : ''} ${className}`;

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cls}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default TextArea;


