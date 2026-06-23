import React from 'react';

/**
 * 空状态
 * @param {ReactNode} icon - 图标
 * @param {string} title - 标题
 * @param {string} description - 说明
 * @param {ReactNode} action - 引导操作
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon ? <div className="text-slate-300 mb-3">{icon}</div> : null}
      {title ? <div className="text-sm font-medium text-slate-700">{title}</div> : null}
      {description ? <div className="text-xs text-slate-400 mt-1 max-w-xs">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
