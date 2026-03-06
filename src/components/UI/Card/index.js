import React from 'react';
import styles from './Card.module.css';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  variant = 'default',
  size = 'medium',
  hoverable = false,
  className = '',
  ...props
}) => {
  const cardClass = `${styles.card} ${styles[variant]} ${styles[size]} ${
    hoverable ? styles.hoverable : ''
  } ${className}`;

  return (
    <div className={cardClass} {...props}>
      {(title || subtitle) && (
        <div className={styles.cardHeader}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  );
};

export default Card;