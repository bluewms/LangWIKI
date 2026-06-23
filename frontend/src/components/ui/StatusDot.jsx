import React from 'react';

/**
 * 状态点（用于队列/任务状态）
 * @param {'running'|'pending'|'completed'|'error'} status
 */
export default function StatusDot({ status = 'completed', className = '' }) {
  const statusClass = {
    running: 'status-dot-running',
    pending: 'status-dot-pending',
    completed: 'status-dot-completed',
    error: 'status-dot-error'
  }[status];

  return <span className={`status-dot ${statusClass} ${className}`} />;
}
