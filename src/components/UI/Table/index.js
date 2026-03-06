import React from 'react';
import styles from './Table.module.css';

const Table = ({
  columns,
  data,
  loading = false,
  emptyText = '暂无数据',
  variant = 'default',
  className = '',
  ...props
}) => {
  if (loading) {
    return (
      <div className={`${styles.tableContainer} ${styles.loading} ${className}`}>
        <table className={`${styles.table} ${styles[variant]}`} {...props}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={column.key || index} style={column.style}>
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                加载中...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={`${styles.table} ${styles[variant]}`} {...props}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={column.key || index} style={column.style}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={column.key || colIndex} style={column.style}>
                    {column.render ? column.render(row[column.dataIndex], row, rowIndex) : row[column.dataIndex]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;