import React from 'react';
import { useAuth } from '../../../context/AuthContext';


const OutfitCombos = () => {
   const { user, isAuthenticated } = useAuth(); //获取用户名和邮箱
  return (
    <div>
      <p><strong>用户名:</strong> {user.username}</p>
      <p><strong>邮箱:</strong> {user.email}</p>
      <p><strong>用户ID:</strong> {user.id}</p>
      <h2>穿搭 - 搭配</h2>
      <p>这里创建和查看搭配。</p>
    </div>
  );
};

export default OutfitCombos;


