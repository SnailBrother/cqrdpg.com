import React, { useState } from 'react';

const OfficeTasks = () => {
  const [task, setTask] = useState('');
  return (
    <div>
      <h2>办公 - 任务</h2>
      <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="输入任务测试缓存" />
    </div>
  );
};

export default OfficeTasks;


