import React, { useEffect, useState } from 'react';
import { FolderOpen, Play, Pause, RefreshCw, Loader2, ChevronUp, Folder, Zap, ScanLine } from 'lucide-react';
import {
  getIngestStatus,
  listFilesystemDirs,
  pauseIngest,
  resumeIngest,
  triggerEntityIngest,
  triggerInitialIngest,
  updateWorkspace
} from '../../../models/langwiki';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';
import { setActiveWorkspace } from '../../../models/workspaceState';
import { PageHeader, Card, Button, Badge, StatusDot, useToast } from '../../../components/ui';

const STATUS_LABEL = { idle: '空闲', running: '运行中', paused: '已暂停', error: '异常' };

export default function IngestPage({ compact = false }) {
  const toast = useToast();
  const activeWorkspace = useWorkspaceScope();
  const [status, setStatus] = useState(null);
  const [entityName, setEntityName] = useState('');
  const [busy, setBusy] = useState(false);
  const [sourceDir, setSourceDir] = useState('');
  const [dirBrowser, setDirBrowser] = useState(null);
  const [dirLoading, setDirLoading] = useState(false);

  useEffect(() => {
    setSourceDir(activeWorkspace?.sourceDir || '');
  }, [activeWorkspace?.id, activeWorkspace?.sourceDir]);

  async function refreshStatus() {
    try {
      const data = await getIngestStatus();
      setStatus(data.status || null);
    } catch (_e) {
      setStatus(null);
    }
  }

  useEffect(() => {
    refreshStatus();
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

  async function openDir(pathValue = '') {
    setDirLoading(true);
    try {
      const data = await listFilesystemDirs(pathValue);
      setDirBrowser(data);
    } catch (error) {
      toast.error(error.message || '目录读取失败');
    } finally {
      setDirLoading(false);
    }
  }

  async function saveSourceDir() {
    if (!activeWorkspace?.id) return;
    setBusy(true);
    try {
      const data = await updateWorkspace(activeWorkspace.id, { sourceDir: sourceDir.trim() });
      if (data.workspace) setActiveWorkspace(data.workspace);
      toast.success('扫描目录已保存');
    } catch (error) {
      toast.error(error.message || '保存扫描目录失败');
    } finally {
      setBusy(false);
    }
  }

  const ingestSourceDir = sourceDir.trim() || activeWorkspace?.sourceDir || activeWorkspace?.rootDir;
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
            <span className="font-medium text-slate-900 break-all">{ingestSourceDir || '未设置'}</span>
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

      {/* 扫描目录选择 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-900">选择扫描目录</span>
        </div>
        <input
          className="input mb-3"
          placeholder="输入绝对路径，或用下方目录浏览选择"
          value={sourceDir}
          onChange={(e) => setSourceDir(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => openDir(sourceDir)} disabled={dirLoading}>
            {dirLoading ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={14} />}
            浏览目录
          </Button>
          <Button variant="outline" size="sm" onClick={() => openDir('')} disabled={dirLoading}>
            从主目录开始
          </Button>
          <Button variant="secondary" size="sm" onClick={saveSourceDir} disabled={busy || !activeWorkspace?.id}>
            保存扫描目录
          </Button>
        </div>

        {dirBrowser ? (
          <div className="mt-3 border border-slate-200 rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-xs text-slate-500 break-all font-mono">{dirBrowser.current}</span>
              {dirBrowser.parent ? (
                <button
                  className="shrink-0 ml-2 inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                  onClick={() => openDir(dirBrowser.parent)}
                >
                  <ChevronUp size={12} /> 上一级
                </button>
              ) : null}
            </div>
            <div className="max-h-48 overflow-auto p-1">
              {dirBrowser.children?.length === 0 ? (
                <div className="text-xs text-slate-400 px-2 py-3 text-center">无子目录</div>
              ) : (
                dirBrowser.children?.map((child) => (
                  <div key={child.path} className="flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-slate-50 group">
                    <button
                      className="flex items-center gap-1.5 text-left text-xs text-slate-700 hover:text-slate-900 min-w-0"
                      onClick={() => openDir(child.path)}
                    >
                      <Folder size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{child.name}</span>
                    </button>
                    <button
                      className="shrink-0 px-2 py-0.5 text-xs rounded border border-slate-200 hover:border-brand-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition duration-fast"
                      onClick={() => setSourceDir(child.path)}
                    >
                      选中
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </Card>

      {/* 操作区 */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ScanLine size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-900">批量扫描</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">对扫描目录下所有文件执行首次提取与 Wiki 生成。</p>
          <Button
            variant="secondary"
            disabled={busy || !ingestSourceDir}
            onClick={() => runAction(() => triggerInitialIngest(ingestSourceDir, outputRootDir), '首次扫描已触发')}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            执行首次扫描
          </Button>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-900">按实体触发</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">对指定实体高优先级触发提取。</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="实体名，例如 富士康"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
            />
            <Button
              variant="primary"
              disabled={busy || !entityName.trim() || !ingestSourceDir}
              onClick={() => runAction(() => triggerEntityIngest(entityName.trim(), ingestSourceDir, outputRootDir), '实体触发已提交')}
            >
              触发
            </Button>
          </div>
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
