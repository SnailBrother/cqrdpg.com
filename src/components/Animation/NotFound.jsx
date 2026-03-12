// src/components/Animation/404/index.jsx
import React from 'react';

import styles from './NotFound.module.css';

const Four = () => {




  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 404 数字动画 */}
        <div className={styles.animation}>
          <div className={styles.number}>4</div>
           <div className={styles.number}>0</div>
         
          <div className={styles.number}>4</div>
        </div>

        {/* 错误信息 */}
        <h1 className={styles.title}>页面未找到</h1>
        
        <p className={styles.message}>
          抱歉，您访问的页面可能已被移动、删除或不存在。<br />
        
        </p>

        {/* 装饰性元素 - 让页面看起来更像一个普通的错误页面 */}
        <div className={styles.footer}>
          <p className={styles.errorCode}>错误代码: 404 - Page Not Found</p>
         
        </div>
      </div>
    </div>
  );
};

export default Four;