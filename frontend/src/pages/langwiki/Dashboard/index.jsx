import React, { useEffect, useState } from 'react';
import { getIngestStatus } from '../../../models/langwiki';

export default function DashboardPage() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getIngestStatus().then((data) => setStatus(data.status)).catch(() => setStatus(null));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">LangWIKI 总览</h1>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="text-sm text-slate-500 mb-2">任务队列状态</div>
        {status ? (
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>状态：{status.state}</div>
            <div>待处理：{status.pending}</div>
            <div>运行中：{status.running}</div>
            <div>已完成：{status.completed}</div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">暂未获取到状态</div>
        )}
      </div>
    </div>
  );
}
