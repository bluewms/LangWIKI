import React from 'react';

/**
 * 页面标题区
 * @param {ReactNode} title - 标题
 * @param {ReactNode} subtitle - 副标题
 * @param {ReactNode} actions - 右侧操作区（按钮等）
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="min-w-0">
        <h1 className="page-title truncate">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </div>
  );
}
