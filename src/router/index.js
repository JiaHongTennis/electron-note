import React from 'react';
import Main from '@/view/Main'
import AutoUpdate from '@/view/AutoUpdate'

// 无需权限路由
const constantRouterMap = [
  {
    path: '/main',
    element: <Main />
  },
  {
    path: '/autoUpdate',
    element: <AutoUpdate />
  }
];

export default constantRouterMap;
