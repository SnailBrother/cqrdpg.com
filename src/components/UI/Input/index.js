import React from 'react';
import styles from './Input.module.css';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  size = 'medium',
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const inputClass = `${styles.input} ${styles[size]} ${
    error ? styles.inputError : ''
  } ${disabled ? styles.disabled : ''} ${className}`;

  return (
    <div className={styles.inputContainer}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default Input;