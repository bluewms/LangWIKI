import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderOpen, ChevronUp, Folder, GitBranch, Save, Trash2, Loader2, Settings } from 'lucide-react';
import { deleteWorkspace, listFilesystemDirs, listWorkspaces, updateWorkspace } from '../../../models/langwiki';
import { getActiveWorkspace, notifyWorkspacesChanged, setActiveWorkspace } from '../../../models/workspaceState';
import { PageHeader, Card, Button, Badge, EmptyState, useToast } from '../../../components/ui';

export default function WorkspacePage({ compact = false }) {
  const toast = useToast();
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
      toast.error(error.message || '目录读取失败');
    } finally {
      setDirLoading(false);
    }
  }

  async function onSave(e) {
    e.preventDefault();
    if (!activeWorkspace?.id) return;

    setLoading(true);
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
      if (data.workspace) setActiveWorkspace(data.workspace);
      await refresh();
      notifyWorkspacesChanged();
      toast.success('工作区设置已保存');
      if (!routeId && data.workspace?.id) {
        navigate(`/langwiki/workspace/${encodeURIComponent(data.workspace.id)}/settings/manage`);
      }
    } catch (error) {
      toast.error(error.message || '保存失败');
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
      toast.success('工作区已删除，相关知识库文件已清理');
    } catch (error) {
      toast.error(error.message || '删除工作区失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {!compact ? (
        <PageHeader
          title="工作区管理"
          subtitle="配置工作区名称、扫描目录与 Git 同步"
          actions={activeWorkspace ? <Badge variant="brand">{activeWorkspace.id}</Badge> : null}
        />
      ) : null}

      {!activeWorkspace ? (
        <Card>
          <EmptyState
            icon={<Settings size={32} />}
            title="暂无工作区"
            description="请先在左侧侧边栏点击 + 新建工作区"
          />
        </Card>
      ) : (
        <>
          <Card compact>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">工作区 ID：</span>
                <span className="font-medium text-slate-900 break-all">{activeWorkspace.id}</span>
              </div>
              <div>
                <span className="text-slate-500">LLM 输出目录：</span>
                <span className="font-medium text-slate-900 break-all">{activeWorkspace.rootDir}</span>
              </div>
            </div>
          </Card>

          <form onSubmit={onSave} className="space-y-4">
            <Card>
              <div className="text-sm font-medium text-slate-900 mb-4">基础设置</div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1.5 block">
                  <span className="text-xs text-slate-600">显示名称（左侧展示）</span>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-xs text-slate-600">扫描源目录（用于 ingest）</span>
                  <input
                    className="input"
                    placeholder="例如 /Users/xxx/业务资料"
                    value={form.sourceDir}
                    onChange={(e) => setForm((prev) => ({ ...prev, sourceDir: e.target.value }))}
                  />
                </label>
              </div>

              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openDir(form.sourceDir)} disabled={dirLoading}>
                    {dirLoading ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={14} />}
                    浏览目录
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => openDir('')} disabled={dirLoading}>
                    从主目录开始
                  </Button>
                </div>

                {dirBrowser ? (
                  <div className="mt-3 border border-slate-200 rounded-md overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                      <span className="text-xs text-slate-500 break-all font-mono">{dirBrowser.current}</span>
                      {dirBrowser.parent ? (
                        <button
                          type="button"
                          className="shrink-0 ml-2 inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                          onClick={() => openDir(dirBrowser.parent)}
                        >
                          <ChevronUp size={12} /> 上一级
                        </button>
                      ) : null}
                    </div>
                    <div className="max-h-44 overflow-auto p-1">
                      {dirBrowser.children?.length === 0 ? (
                        <div className="text-xs text-slate-400 px-2 py-3 text-center">无子目录</div>
                      ) : (
                        dirBrowser.children?.map((child) => (
                          <div key={child.path} className="flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-slate-50 group">
                            <button
                              type="button"
                              className="flex items-center gap-1.5 text-left text-xs text-slate-700 hover:text-slate-900 min-w-0"
                              onClick={() => openDir(child.path)}
                            >
                              <Folder size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{child.name}</span>
                            </button>
                            <button
                              type="button"
                              className="shrink-0 px-2 py-0.5 text-xs rounded border border-slate-200 hover:border-brand-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition duration-fast"
                              onClick={() => setForm((prev) => ({ ...prev, sourceDir: child.path }))}
                            >
                              选中
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <GitBranch size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-900">Git 同步</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                  checked={form.gitEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, gitEnabled: e.target.checked }))}
                />
                启用该工作区 Markdown 目录的 Git 同步
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1.5 block">
                  <span className="text-xs text-slate-600">远程仓库地址（HTTPS/SSH）</span>
                  <input
                    className="input"
                    placeholder="https://gitee.com/xxx/wiki.git"
                    value={form.gitRemoteUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, gitRemoteUrl: e.target.value }))}
                    disabled={!form.gitEnabled}
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-xs text-slate-600">分支</span>
                  <input
                    className="input"
                    placeholder="main"
                    value={form.gitBranch}
                    onChange={(e) => setForm((prev) => ({ ...prev, gitBranch: e.target.value }))}
                    disabled={!form.gitEnabled}
                  />
                </label>
              </div>
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                保存设置
              </Button>
              <Button type="button" variant="danger" disabled={loading} onClick={onDeleteWorkspace}>
                <Trash2 size={14} />
                删除工作区
              </Button>
              <span className="text-xs text-red-500">
                删除后将同时删除该工作区相关知识库文件（不可恢复）
              </span>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
