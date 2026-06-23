import React, { useEffect, useState } from 'react';
import { Activity, Clock, PlayCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getIngestStatus } from '../../../models/langwiki';
import { PageHeader, Card, StatusDot, Skeleton, Button, Badge } from '../../../components/ui';

const STATUS_LABEL = {
  idle: '空闲',
  running: '运行中',
  paused: '已暂停',
  error: '异常'
};
const STATUS_VARIANT = {
  idle: 'neutral',
  running: 'success',
  paused: 'warning',
  error: 'danger'
};
const STATUS_DOT = {
  idle: 'completed',
  running: 'running',
  paused: 'pending',
  error: 'error'
};

function StatCard({ icon, label, value, tone = 'slate' }) {
  const toneMap = {
    slate: 'bg-slate-50 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-brand-50 text-brand-600'
  };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-md grid place-items-center shrink-0 ${toneMap[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-2xl font-semibold text-slate-900 leading-tight">{value}</div>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getIngestStatus();
      setStatus(data.status || null);
    } catch (_e) {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const total = status ? (status.pending || 0) + (status.running || 0) + (status.completed || 0) : 0;
  const completedRate = total > 0 ? Math.round(((status?.completed || 0) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="LangWIKI 总览"
        subtitle="知识编译队列实时状态"
        actions={
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            刷新
          </Button>
        }
      />

      {/* 状态概览条 */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <>
                <StatusDot status={status ? STATUS_DOT[status.state] || 'completed' : 'completed'} />
                <span className="text-sm font-medium text-slate-900">
                  队列{status ? STATUS_LABEL[status.state] || status.state : '未知'}
                </span>
                {status?.state ? (
                  <Badge variant={STATUS_VARIANT[status.state] || 'neutral'}>{status.state}</Badge>
                ) : null}
              </>
            )}
          </div>
          {total > 0 ? (
            <div className="text-xs text-slate-500">总任务 {total} · 完成率 {completedRate}%</div>
          ) : null}
        </div>

        {/* 进度条 */}
        {total > 0 ? (
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="bg-green-500" style={{ width: `${(status.completed / total) * 100}%` }} />
            <div className="bg-amber-500" style={{ width: `${(status.pending / total) * 100}%` }} />
            <div className="bg-brand-500" style={{ width: `${(status.running / total) * 100}%` }} />
          </div>
        ) : null}
      </Card>

      {/* 数据卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : status ? (
          <>
            <StatCard icon={<Activity size={18} />} label="运行中" value={status.running ?? 0} tone="green" />
            <StatCard icon={<Clock size={18} />} label="待处理" value={status.pending ?? 0} tone="amber" />
            <StatCard icon={<CheckCircle2 size={18} />} label="已完成" value={status.completed ?? 0} tone="blue" />
            <StatCard icon={<PlayCircle size={18} />} label="队列状态" value={STATUS_LABEL[status.state] || status.state || '-'} tone="slate" />
          </>
        ) : (
          <Card className="col-span-full">
            <div className="text-sm text-slate-500 text-center py-4">暂未获取到状态</div>
          </Card>
        )}
      </div>
    </div>
  );
}
