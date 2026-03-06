import React, { useState } from 'react';
import { Input } from '../../../components/UI';

const AccountingTransactions = () => {
  const [amount, setAmount] = useState('');
  return (
    <div>
      <h2>记账 - 账目</h2>
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额输入测试缓存" />
    </div>
  );
};

export default AccountingTransactions;


