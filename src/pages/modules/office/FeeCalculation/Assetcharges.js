import React, { useState } from 'react';
import "./Assetcharges.css"; // 你可以根据需要创建样式文件
import { useTheme } from '../../../../context/ThemeContext'; // 导入useTheme钩子
const AssetCharges = () => {
  const [assetValue, setAssetValue] = useState(0); // 用户输入的资产价值
  const [charge, setCharge] = useState(0); // 计算后的收费金额
  const { background, fontColor, borderBrush, hoverBackground, hoverFontColor, fontFamily, watermarkForeground, loading } = useTheme(); // 直接使用主题

  // 收费档次和对应的计费规则
  const tiers = [
    { min: 0, max: 100, rate: 10 },        // 阶段 1: ≤ 100 10 ‰
    { min: 100, max: 1000, rate: 4.5 },    // 阶段 2: 100 < X ≤ 1000 4.5 ‰
    { min: 1000, max: 5000, rate: 1.2 },    // 阶段 3: 1000 < X ≤ 5000 1.2 ‰
    { min: 5000, max: 10000, rate: 0.75 },  // 阶段 4: 5000 < X ≤ 10000 0.75 ‰
    { min: 10000, max: 100000, rate: 0.15 }, // 阶段 5: 10000 < X ≤ 100000 0.15 ‰
    { min: 100000, max: 300000, rate: 0.1 }, // 阶段 6: 100000 < X ≤ 300000 0.1 ‰
    { min: 300000, max: Infinity, rate: null } // 阶段 7: X > 300000 协商
  ];

  // 计算收费金额的函数
  const calculateCharge = (value) => {
    let totalCharge = 0; // 总收费

    // 计算每一档的费用
    for (let i = 0; i < tiers.length; i++) {
      const { min, max, rate } = tiers[i];

      // 如果资产价值在当前档次范围内
      if (value > min) {
        const amountInTier = Math.min(value, max) - min; // 计算当前档次的金额
        if (amountInTier > 0) {
          if (rate !== null) {
            totalCharge += (amountInTier * rate) / 1000; // 累计费用
          } else {
            // 超过300000万，费用可协商
            totalCharge += 0; // 这里可以根据需求处理
          }
        }
      }
    }

    return totalCharge;
  };

  // 处理输入变化
  const handleValueChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setAssetValue(newValue);
    if (!isNaN(newValue) && newValue >= 0) {
      const calculatedCharge = calculateCharge(newValue);
      setCharge(calculatedCharge.toFixed(2)); // 保留两位小数
    } else {
      setCharge(0);
    }
  };

  return (
    <div className="charge-calculator-container"
      style={{
        '--my-bg-color': background,
        '--watermarkForeground': watermarkForeground,
        '--fontFamily': fontFamily,
        '--fontColor': fontColor,
        '--hoverFontColor': hoverFontColor,
        '--hoverBackground': hoverBackground,
      }}>
      <div className="input-container">
        <label>
          资产价值（万元）:
          <input
            type="number"
            value={assetValue}
            onChange={handleValueChange}
            placeholder="请输入资产价值"
            className="input-field"
          />
        </label>
      </div>
      <div className="result-container">
        <h2>计算结果</h2>
        <p>收费金额：<strong>{charge} 万元</strong></p>
      </div>

      <div class="charge-calculator-title-container">
        <h3>
          《关于发布重庆市资产评估服务收费参考标准（2015年）的通知（渝评协〔2015〕5号）》<br />
          计时收费参考标准
        </h3>
      </div>


      <table className="charge-table">
        <thead>
          <tr className="table-header">
            <th>阶段</th>
            <th>资产价值（万元）</th>
            <th>差额计费率（‰）</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier, index) => (
            <tr key={index} className="table-row">
              <td>{index + 1}</td>
              <td>{tier.min === 0 ? `≤ ${tier.max}` : `${tier.min} < X ≤ ${tier.max}`}</td>
              <td>{tier.rate !== null ? `${tier.rate} ‰` : '协商'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetCharges;
