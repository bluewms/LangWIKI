import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteWorkspace, listFilesystemDirs, listWorkspaces, updateWorkspace } from '../../../models/langwiki';
import { getActiveWorkspace, notifyWorkspacesChanged, setActiveWorkspace } from '../../../models/workspaceState';
export default function WorkspacePage({ compact = false }) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [workspaces, setWorkspaces] = useState([]);
  const [form, setForm] = useState({
    name: '',
    sourceDir: '',
    gitEnabled: false,
    gitRemoteUrl: '',
    gitBranch: 'main'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dirBrowser, setDirBrowser] = useState(null);
  const [dirLoading, setDirLoading] = useState(false);

  async function refresh() {
    const data = await listWorkspaces();
    setWorkspaces(data.workspaces || []);
  }

  useEffect(() => {
    refresh().catch(() => setWorkspaces([]));
  }, []);

  const activeWorkspace = useMemo(() => {
    const local = getActiveWorkspace();
    if (routeId) {
      return workspaces.find((item) => item.id === routeId) || local;
    }
    return local || workspaces[0] || null;
  }, [routeId, workspaces]);

  useEffect(() => {
    if (!activeWorkspace) return;
    setForm({
      name: activeWorkspace.name || activeWorkspace.id,
      sourceDir: activeWorkspace.sourceDir || '',
      gitEnabled: Boolean(activeWorkspace.git?.enabled),
      gitRemoteUrl: activeWorkspace.git?.remoteUrl || '',
      gitBranch: activeWorkspace.git?.branch || 'main'
    });
  }, [activeWorkspace?.id]);

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

  async function onSave(e) {
    e.preventDefault();
    if (!activeWorkspace?.id) return;

    setLoading(true);
    setMessage('');
    try {
      const payload = {
        name: form.name.trim() || activeWorkspace.id,
        sourceDir: form.sourceDir.trim(),
        git: {
          enabled: form.gitEnabled,
          remoteUrl: form.gitRemoteUrl.trim(),
          branch: form.gitBranch.trim() || 'main'
        }
      };

      const data = await updateWorkspace(activeWorkspace.id, payload);
      if (data.workspace) {
        setActiveWorkspace(data.workspace);
      }
      await refresh();
      notifyWorkspacesChanged();
      setMessage('工作区设置已保存');
      if (!routeId && data.workspace?.id) {
        navigate(`/langwiki/workspace/${encodeURIComponent(data.workspace.id)}/settings/manage`);
      }
    } catch (error) {
      setMessage(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteWorkspace() {
    if (!activeWorkspace?.id) return;

    const ok = window.confirm(
      `确认删除工作区「${activeWorkspace.name || activeWorkspace.id}」吗？\n\n删除后会同时删除该工作区相关知识库文件（.LangWIKI/Markdown），此操作不可恢复。`
    );
    if (!ok) return;

    setLoading(true);
    setMessage('');
    try {
      await deleteWorkspace(activeWorkspace.id, true);
      const data = await listWorkspaces();
      const nextWorkspace = (data.workspaces || [])[0] || null;
      if (nextWorkspace) {
        setActiveWorkspace(nextWorkspace);
        navigate(`/langwiki/workspace/${encodeURIComponent(nextWorkspace.id)}/settings/manage`);
      } else {
        localStorage.removeItem('langwiki.activeWorkspace');
        navigate('/langwiki/dashboard');
      }
      setWorkspaces(data.workspaces || []);
      notifyWorkspacesChanged();
      setMessage('工作区已删除，相关知识库文件已清理');    } catch (error) {
      setMessage(error.message || '删除工作区失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!compact ? <h1 className="text-2xl font-semibold">工作区管理</h1> : null}

      {!activeWorkspace ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-sm text-slate-500">
          请先在左侧点击 <span className="font-medium">+</span> 新建工作区。
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-2 text-sm">
            <div>
              <span className="text-slate-500">工作区 ID：</span>
              <span className="font-medium text-slate-900">{activeWorkspace.id}</span>
            </div>
            <div>
              <span className="text-slate-500">LLM 输出目录：</span>
              <span className="font-medium text-slate-900 break-all">{activeWorkspace.rootDir}</span>
            </div>
          </div>

          <form onSubmit={onSave} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-4">
            <div className="font-medium">工作区设置</div>

            <div className="grid md:grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <div className="text-slate-600">显示名称（左侧展示）</div>
                <input
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </label>

              <label className="space-y-1 text-sm">
                <div className="text-slate-600">扫描源目录（用于 ingest）</div>
                <input
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="例如 /Users/xxx/业务资料"
                  value={form.sourceDir}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourceDir: e.target.value }))}
                />
              </label>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                  onClick={() => openDir(form.sourceDir)}
                  disabled={dirLoading}
                >
                  {dirLoading ? '读取中...' : '浏览目录'}
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                  onClick={() => openDir('')}
                  disabled={dirLoading}
                >
                  从主目录开始
                </button>
              </div>

              {dirBrowser ? (
                <div className="space-y-2 text-sm">
                  <div className="text-slate-500 break-all">当前：{dirBrowser.current}</div>
                  {dirBrowser.parent ? (
                    <button
                      type="button"
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
                          type="button"
                          className="text-left text-xs text-slate-700 hover:text-slate-900 break-all"
                          onClick={() => openDir(child.path)}
                        >
                          {child.name}
                        </button>
                        <button
                          type="button"
                          className="px-2 py-0.5 text-xs rounded border border-slate-300"
                          onClick={() => setForm((prev) => ({ ...prev, sourceDir: child.path }))}
                        >
                          选中
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.gitEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, gitEnabled: e.target.checked }))}
                />
                启用该工作区 Markdown 目录的 Git 同步
              </label>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  className="border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="Git 远程仓库地址（HTTPS/SSH）"
                  value={form.gitRemoteUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, gitRemoteUrl: e.target.value }))}
                />
                <input
                  className="border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="分支，默认 main"
                  value={form.gitBranch}
                  onChange={(e) => setForm((prev) => ({ ...prev, gitBranch: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存设置'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onDeleteWorkspace}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50"
              >
                删除工作区
              </button>
              <span className="text-xs text-red-600">
                警告：删除后将同时删除该工作区相关知识库文件（不可恢复）
              </span>
            </div>
          </form>
        </>
      )}

      {message ? <div className="text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}
