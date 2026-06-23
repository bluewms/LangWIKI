import React from 'react';

/**
 * 骨架屏
 * @param {string} className - 控制宽高
 */
export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} />;
}
