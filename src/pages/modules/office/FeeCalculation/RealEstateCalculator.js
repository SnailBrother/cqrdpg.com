//房地产收费标准表
import React, { useState } from 'react';

import "./RealEstateCalculator.css";
import { useTheme } from '../../../../context/ThemeContext'; // 导入useTheme钩子
const RealEstateCalculator = () => {
  const [price, setPrice] = useState(0);  // 用户输入的价格总额
  const [fee, setFee] = useState(0);      // 计算后的收费金额
const { background, fontColor, borderBrush, hoverBackground, hoverFontColor, fontFamily, watermarkForeground, loading } = useTheme(); // 直接使用主题

  // 收费档次和对应的计费规则
  const tiers = [
    { min: 0, max: 100, rate: 5 },      // 阶段 1: ≤ 100 5 ‰
    { min: 100, max: 1000, rate: 2.5 }, // 阶段 2: 100 < X ≤ 1000 2.5 ‰
    { min: 1000, max: 2000, rate: 1.5 }, // 阶段 3: 1000 < X ≤ 2000 1.5 ‰
    { min: 2000, max: 5000, rate: 0.8 }, // 阶段 4: 2000 < X ≤ 5000 0.8 ‰
    { min: 5000, max: 8000, rate: 0.4 }, // 阶段 5: 5000 < X ≤ 8000 0.4 ‰
    { min: 8000, max: 10000, rate: 0.2 }, // 阶段 6: 8000 < X ≤ 10000 0.2 ‰
    { min: 10000, max: Infinity, rate: 0.1 }, // 阶段 7: X > 10000 0.1 ‰
  ];

  // 计算收费金额的函数
  const calculateFee = (price) => {
    let totalFee = 0; // 总费用

    // 计算每一档的费用
    for (let i = 0; i < tiers.length; i++) {
      const { min, max, rate } = tiers[i];

      // 如果价格在当前档次范围内
      if (price > min) {
        const amountInTier = Math.min(price, max) - min; // 计算当前档次的金额
        if (amountInTier > 0) {
          totalFee += (amountInTier * rate) / 1000; // 累计费用
        }
      }
    }

    return totalFee;
  };

  // 处理输入变化
  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value);
    setPrice(newPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const calculatedFee = calculateFee(newPrice);
      setFee(calculatedFee.toFixed(2));  // 保留两位小数
    } else {
      setFee(0);
    }
  };

  return (
    <div className="fee-calculator-container" style={{
        '--my-bg-color': background,
        '--watermarkForeground': watermarkForeground,
        '--fontFamily': fontFamily,
        '--fontColor': fontColor,
        '--hoverFontColor': hoverFontColor,
        '--hoverBackground': hoverBackground,
      }}>

      <div className="input-container">
        <label>
          房地产价格总额（万元）:
          <input
            type="number"
            value={price}
            onChange={handlePriceChange}
            placeholder="请输入金额"
            className="input-field"
          />
        </label>
      </div>
      <div className="result-container">
        <h2>计算结果</h2>
        <p>收费金额：<strong>{fee} 万元</strong></p>
      </div>

      <div class="fee-calculator-title-container">
        <h3>
          《国家计委建设部关于房地产中介服务收费的通知》<br />
          （计价格[1995]971号）
        </h3>
      </div>
      <table className="fee-table">
        <thead>
          <tr className="table-header">
            <th>阶段</th>
            <th>房地产价格总额（万元）</th>
            <th>累进计费率（‰）</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier, index) => (
            <tr key={index} className="table-row">
              <td>{index + 1}</td>
              <td>{tier.min === 0 ? `≤ ${tier.max}` : `${tier.min} < X ≤ ${tier.max}`}</td>
              <td>{tier.rate} ‰</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RealEstateCalculator;

