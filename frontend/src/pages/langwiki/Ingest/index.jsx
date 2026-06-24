import React, { useEffect, useState } from 'react';
import { Play, Pause, RefreshCw, Loader2, ScanLine, FileText, Plus, X } from 'lucide-react';
import {
  getIngestStatus,
  getIngestFileTypes,
  pauseIngest,
  resumeIngest,
  triggerInitialIngest
} from '../../../models/langwiki';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';
import { setActiveWorkspace } from '../../../models/workspaceState';
import { PageHeader, Card, Button, Badge, StatusDot, useToast } from '../../../components/ui';

const STATUS_LABEL = { idle: '空闲', running: '运行中', paused: '已暂停', error: '异常' };

export default function IngestPage({ compact = false }) {
  const toast = useToast();
  const activeWorkspace = useWorkspaceScope();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fileTypes, setFileTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  async function refreshStatus() {
    try {
      const data = await getIngestStatus();
      setStatus(data.status || null);
    } catch (_e) {
      setStatus(null);
    }
  }

  async function refreshFileTypes() {
    try {
      const data = await getIngestFileTypes();
      setFileTypes(data.types || []);
    } catch (_e) {
      setFileTypes([]);
    }
  }

  useEffect(() => {
    refreshStatus();
    refreshFileTypes();
  }, []);

  async function runAction(action, successMsg = '操作成功') {
    setBusy(true);
    try {
      await action();
      await refreshStatus();
      toast.success(successMsg);
    } catch (error) {
      toast.error(error.message || '操作失败');
    } finally {
      setBusy(false);
    }
  }

  function toggleType(key) {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const ingestSourceDir = activeWorkspace?.sourceDir || activeWorkspace?.rootDir;
  const outputRootDir = activeWorkspace?.rootDir;

  return (
    <div className="space-y-6">
      {!compact ? (
        <PageHeader
          title="Ingest 控制台"
          subtitle="扫描业务目录并生成 Wiki 知识"
          actions={
            status?.state ? (
              <div className="flex items-center gap-2">
                <StatusDot status={status.state === 'running' ? 'running' : status.state === 'paused' ? 'pending' : 'completed'} />
                <Badge variant={status.state === 'running' ? 'success' : status.state === 'paused' ? 'warning' : 'neutral'}>
                  {STATUS_LABEL[status.state] || status.state}
                </Badge>
              </div>
            ) : null
          }
        />
      ) : null}

      {/* 概览卡 */}
      <Card compact>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">扫描目录：</span>
            <span className="font-medium text-slate-900 break-all">{ingestSourceDir || '未设置（请到工作区管理配置扫描源目录）'}</span>
          </div>
          <div>
            <span className="text-slate-500">生成目录：</span>
            <span className="font-medium text-slate-900 break-all">{outputRootDir || '服务默认目录'}</span>
          </div>
        </div>
        {status ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
            {[
              { label: '状态', value: STATUS_LABEL[status.state] || status.state },
              { label: '待处理', value: status.pending ?? 0 },
              { label: '运行中', value: status.running ?? 0 },
              { label: '已完成', value: status.completed ?? 0 }
            ].map((s) => (
              <div key={s.label}>
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className="text-lg font-semibold text-slate-900">{s.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400 mt-3 pt-3 border-t border-slate-100">暂未获取到队列状态</div>
        )}
      </Card>

      {/* 操作区 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 批量扫描 */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ScanLine size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-900">批量扫描</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">对扫描目录下所有子目录执行首次提取与 Wiki 生成。</p>
          <Button
            variant="secondary"
            disabled={busy || !ingestSourceDir}
            onClick={() => runAction(() => triggerInitialIngest(ingestSourceDir, outputRootDir, selectedTypes), '首次扫描已触发')}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            执行首次扫描
          </Button>
        </Card>

        {/* 文件类型筛选 */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-900">文件类型筛选</span>
            {selectedTypes.length > 0 ? (
              <button
                className="ml-auto text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
                onClick={() => setSelectedTypes([])}
              >
                <X size={12} /> 清空
              </button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 mb-3">
            选择要处理的文件类型，不选则处理全部。已选 {selectedTypes.length} / {fileTypes.length} 种。
          </p>
          <div className="flex flex-wrap gap-2">
            {fileTypes.length === 0 ? (
              <span className="text-xs text-slate-400">加载中…</span>
            ) : (
              fileTypes.map((t) => {
                const active = selectedTypes.includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => toggleType(t.key)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition duration-fast ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {active ? <X size={11} /> : <Plus size={11} />}
                    {t.label}
                  </button>
                );
              })
            )}
          </div>
          {selectedTypes.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {selectedTypes.map((key) => {
                const ft = fileTypes.find((f) => f.key === key);
                if (!ft) return null;
                return (
                  <Badge key={key} variant="brand">
                    {ft.label}
                  </Badge>
                );
              })}
            </div>
          ) : null}
        </Card>
      </div>

      {/* 队列控制 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-900">队列控制</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => runAction(() => pauseIngest(), '队列已暂停')}>
            <Pause size={14} />
            暂停队列
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => runAction(() => resumeIngest(), '队列已恢复')}>
            <Play size={14} />
            恢复队列
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => refreshStatus().then(() => toast.success('状态已刷新'))}>
            <RefreshCw size={14} />
            刷新状态
          </Button>
        </div>
      </Card>
    </div>
  );
}
