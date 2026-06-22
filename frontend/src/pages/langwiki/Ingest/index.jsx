import React, { useEffect, useState } from 'react';
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

export default function IngestPage({ compact = false }) {
  const activeWorkspace = useWorkspaceScope();
  const [status, setStatus] = useState(null);
  const [entityName, setEntityName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [sourceDir, setSourceDir] = useState('');
  const [dirBrowser, setDirBrowser] = useState(null);
  const [dirLoading, setDirLoading] = useState(false);

  useEffect(() => {
    setSourceDir(activeWorkspace?.sourceDir || '');
  }, [activeWorkspace?.id, activeWorkspace?.sourceDir]);

  async function refreshStatus() {
    const data = await getIngestStatus();
    setStatus(data.status || null);
  }

  useEffect(() => {
    refreshStatus().catch(() => setStatus(null));
  }, []);

  async function runAction(action) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      await refreshStatus();
      setMessage('操作成功');
    } catch (error) {
      setMessage(error.message || '操作失败');
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
      setMessage(error.message || '目录读取失败');
    } finally {
      setDirLoading(false);
    }
  }

  async function saveSourceDir() {
    if (!activeWorkspace?.id) return;

    setBusy(true);
    setMessage('');
    try {
      const data = await updateWorkspace(activeWorkspace.id, { sourceDir: sourceDir.trim() });
      if (data.workspace) {
        setActiveWorkspace(data.workspace);
      }
      setMessage('扫描目录已保存');
    } catch (error) {
      setMessage(error.message || '保存扫描目录失败');
    } finally {
      setBusy(false);
    }
  }

  const ingestSourceDir = sourceDir.trim() || activeWorkspace?.sourceDir || activeWorkspace?.rootDir;
  const outputRootDir = activeWorkspace?.rootDir;

  return (
    <div className="space-y-4">
      {!compact ? <h1 className="text-2xl font-semibold">Ingest 控制台</h1> : null}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-2 text-sm">
        <div>
          扫描目录：
          <span className="font-medium break-all">{ingestSourceDir || '未设置'}</span>
        </div>
        <div>
          生成目录：
          <span className="font-medium break-all">{outputRootDir || '服务默认目录'}</span>
        </div>
        {status ? (
          <div className="grid md:grid-cols-4 gap-2 text-slate-700">
            <div>状态：{status.state}</div>
            <div>待处理：{status.pending}</div>
            <div>运行中：{status.running}</div>
            <div>已完成：{status.completed}</div>
          </div>
        ) : (
          <div className="text-slate-500">暂未获取到队列状态</div>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="font-medium">选择 ingest 扫描目录</div>
        <input
          className="w-full border border-slate-300 rounded-lg p-2 text-sm"
          placeholder="输入绝对路径，或用下方目录浏览选择"
          value={sourceDir}
          onChange={(e) => setSourceDir(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm disabled:opacity-50"
            onClick={() => openDir(sourceDir)}
            disabled={dirLoading}
          >
            {dirLoading ? '读取中...' : '浏览目录'}
          </button>
          <button
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm disabled:opacity-50"
            onClick={() => openDir('')}
            disabled={dirLoading}
          >
            从主目录开始
          </button>
          <button
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
            onClick={saveSourceDir}
            disabled={busy || !activeWorkspace?.id}
          >
            保存扫描目录
          </button>
        </div>

        {dirBrowser ? (
          <div className="space-y-2 text-sm">
            <div className="text-slate-500 break-all">当前：{dirBrowser.current}</div>
            {dirBrowser.parent ? (
              <button
                className="px-2 py-1 rounded border border-slate-300 text-xs"
                onClick={() => openDir(dirBrowser.parent)}
              >
                上一级
              </button>
            ) : null}
            <div className="max-h-44 overflow-auto border border-slate-200 rounded-lg p-2 space-y-1">
              {dirBrowser.children?.map((child) => (
                <div key={child.path} className="flex items-center justify-between gap-2">
                  <button
                    className="text-left text-xs text-slate-700 hover:text-slate-900 break-all"
                    onClick={() => openDir(child.path)}
                  >
                    {child.name}
                  </button>
                  <button
                    className="px-2 py-0.5 text-xs rounded border border-slate-300"
                    onClick={() => setSourceDir(child.path)}
                  >
                    选中
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="font-medium">批量扫描</div>
        <button
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
          disabled={busy || !ingestSourceDir}
          onClick={() => runAction(() => triggerInitialIngest(ingestSourceDir, outputRootDir))}
        >
          执行首次扫描
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="font-medium">按实体触发</div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-slate-300 rounded-lg p-2 text-sm"
            placeholder="输入实体名，例如 富士康"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm disabled:opacity-50"
            disabled={busy || !entityName.trim() || !ingestSourceDir}
            onClick={() => runAction(() => triggerEntityIngest(entityName.trim(), ingestSourceDir, outputRootDir))}
          >
            高优先级触发
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="font-medium">队列控制</div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-50"
            disabled={busy}
            onClick={() => runAction(() => pauseIngest())}
          >
            暂停队列
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-50"
            disabled={busy}
            onClick={() => runAction(() => resumeIngest())}
          >
            恢复队列
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-50"
            disabled={busy}
            onClick={() => runAction(() => refreshStatus())}
          >
            刷新状态
          </button>
        </div>
      </div>

      {message ? <div className="text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}
