import React from 'react';

/**
 * 卡片容器
 * @param {boolean} interactive - 是否可交互（hover 阴影）
 * @param {boolean} compact - 紧凑内边距
 */
export default function Card({ interactive = false, compact = false, className = '', children, ...rest }) {
  const baseClass = interactive ? 'card-interactive' : 'card';
  const bodyClass = compact ? 'card-body-compact' : 'card-body';
  return (
    <div className={`${baseClass} ${className}`} {...rest}>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}
