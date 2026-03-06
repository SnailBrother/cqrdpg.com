import React, { useState } from 'react';
import { Input } from '../../../components/UI';

const AccountingOverview = () => {
  const [note, setNote] = useState('');
  return (
    <div>
      <h2>记账 - 总览</h2>
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="输入备注测试缓存" />
    </div>
  );
};

export default AccountingOverview;


