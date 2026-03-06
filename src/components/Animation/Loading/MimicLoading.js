import React from 'react';
import './MimicLoading.css';
//新拟态加载
const MimicLoading = () => {
  return (
    <div className="mimicloading-container">
      <div className="mimicloading-loader">
        {[...Array(6)].map((_, i) => (
          <span key={i} style={{ '--i': i }}></span>
        ))}
      </div>
    </div>
  );
};

export default MimicLoading;