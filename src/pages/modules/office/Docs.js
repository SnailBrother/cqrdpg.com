import React, { useState } from 'react';
import { TextArea } from '../../../components/UI';

const OfficeDocs = () => {
  const [doc, setDoc] = useState('');
  return (
    <div>
      <h2>办公 - 文档</h2>
      <TextArea value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="输入文档内容测试缓存" rows={6} />
    </div>
  );
};

export default OfficeDocs;


