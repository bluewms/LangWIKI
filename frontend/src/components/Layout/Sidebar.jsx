import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, ChevronDown, Settings, Folder, FileText, Layers } from 'lucide-react';
import { createWorkspace, getWorkspaceTree, listWorkspaces } from '../../models/langwiki';
import { getActiveWorkspace, getUserProfile, notifyWorkspacesChanged, onWorkspacesChanged, setActiveWorkspace } from '../../models/workspaceState';

function TreeNode({ node, workspaceId, onOpenDoc, depth = 0 }) {
  const [open, setOpen] = useState(false);
  const padLeft = 8 + depth * 12;

  if (node.type === 'file') {
    return (
      <button
        className="w-full flex items-center gap-1.5 text-left text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition duration-fast py-1 pr-2"
        style={{ paddingLeft: padLeft }}
        onClick={() => onOpenDoc(workspaceId, node.path)}
      >
        <FileText size={12} className="shrink-0 text-slate-500" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        className="w-full flex items-center gap-1.5 text-left text-xs text-slate-400 hover:text-slate-100 rounded-md transition duration-fast py-1 pr-2"
        style={{ paddingLeft: padLeft }}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
        <Folder size={12} className="shrink-0 text-slate-500" />
        <span className="truncate">{node.name}</span>
      </button>
      {open ? (
        <div>
          {node.children?.map((child) => (
            <TreeNode
              key={`${child.type}-${child.path}`}
              node={child}
              workspaceId={workspaceId}
              onOpenDoc={onOpenDoc}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [trees, setTrees] = useState({});
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState(() => getActiveWorkspace()?.id || '');
  const user = useMemo(() => getUserProfile(), []);

  async function refreshWorkspaces() {
    const data = await listWorkspaces();
    const list = data.workspaces || [];
    setWorkspaces(list);

    const current = getActiveWorkspace();
    if (current?.id) {
      setActiveId(current.id);
      return;
    }

    const first = list[0];
    if (first) {
      setActiveWorkspace(first);
      setActiveId(first.id);
    }
  }

  useEffect(() => {
    refreshWorkspaces().catch(() => setWorkspaces([]));
  }, []);

  useEffect(() => {
    return onWorkspacesChanged(() => {
      refreshWorkspaces().catch(() => setWorkspaces([]));
    });
  }, []);

  async function ensureTree(workspaceId) {
    if (trees[workspaceId]) return;
    try {
      const data = await getWorkspaceTree(workspaceId);
      setTrees((prev) => ({ ...prev, [workspaceId]: data.tree || [] }));
    } catch (_error) {
      setTrees((prev) => ({ ...prev, [workspaceId]: [] }));
    }
  }

  function toggleExpand(workspaceId) {
    setExpanded((prev) => {
      const next = !prev[workspaceId];
      if (next) ensureTree(workspaceId);
      return { ...prev, [workspaceId]: next };
    });
  }

  function openWorkspace(workspace) {
    setActiveWorkspace(workspace);
    setActiveId(workspace.id);
    navigate(`/langwiki/workspace/${encodeURIComponent(workspace.id)}/query`);
  }

  function openWorkspaceSettings(workspace) {
    setActiveWorkspace(workspace);
    setActiveId(workspace.id);
    navigate(`/langwiki/workspace/${encodeURIComponent(workspace.id)}/settings/manage`);
  }

  function openDoc(workspaceId, filePath) {
    navigate(`/langwiki/workspace/${encodeURIComponent(workspaceId)}/doc?path=${encodeURIComponent(filePath)}`);
  }

  async function onCreateWorkspace() {
    if (creating) return;

    setCreating(true);
    try {
      const data = await createWorkspace({});
      const workspace = data.workspace;
      if (!workspace) return;
      setActiveWorkspace(workspace);
      setActiveId(workspace.id);
      await refreshWorkspaces();
      notifyWorkspacesChanged();
      navigate(`/langwiki/workspace/${encodeURIComponent(workspace.id)}/query`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="w-72 h-screen bg-surface-sidebar text-slate-100 flex flex-col border-r border-slate-800 shrink-0">
      {/* Logo 区 */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800">
        <button
          className="flex items-center gap-2 text-base font-semibold tracking-wide hover:text-white transition duration-fast"
          onClick={() => navigate('/langwiki/dashboard')}
        >
          <Layers size={18} className="text-brand-400" />
          <span>LangWIKI</span>
        </button>
        <button
          className="btn btn-ghost btn-icon !text-slate-300 hover:!bg-slate-800"
          onClick={onCreateWorkspace}
          disabled={creating}
          title="新建工作区"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* 导航区 */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {workspaces.length === 0 ? (
          <div className="text-xs text-slate-500 px-3 py-8 text-center">
            暂无工作区
            <br />
           点击右上角 + 新建
          </div>
        ) : null}

        {workspaces.map((workspace) => {
          const isActive = activeId === workspace.id || location.pathname.includes(`/workspace/${encodeURIComponent(workspace.id)}`);
          const isOpen = Boolean(expanded[workspace.id]);

          return (
            <div key={workspace.id} className="rounded-md overflow-hidden">
              <div className="flex items-center gap-0.5 group">
                <button
                  className="w-7 h-7 shrink-0 grid place-items-center text-slate-500 hover:text-slate-200 rounded transition duration-fast"
                  onClick={() => toggleExpand(workspace.id)}
                  title="展开目录"
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <button
                  className={`flex-1 text-left rounded-md px-2 py-1.5 text-sm transition duration-fast truncate ${
                    isActive
                      ? 'bg-brand-600 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  onClick={() => openWorkspace(workspace)}
                  title={workspace.name || workspace.id}
                >
                  {workspace.name || workspace.id}
                </button>

                <button
                  className="w-7 h-7 shrink-0 grid place-items-center rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition duration-fast opacity-0 group-hover:opacity-100"
                  onClick={() => openWorkspaceSettings(workspace)}
                  title="工作区设置"
                >
                  <Settings size={14} />
                </button>
              </div>

              {isOpen ? (
                <div className="mt-0.5 mb-1 space-y-0.5">
                  {(trees[workspace.id] || []).length === 0 ? (
                    <div className="text-xs text-slate-600 px-3 py-1.5">暂无目录或 Markdown 文档</div>
                  ) : (
                    (trees[workspace.id] || []).map((node) => (
                      <TreeNode
                        key={`${node.type}-${node.path}`}
                        node={node}
                        workspaceId={workspace.id}
                        onOpenDoc={openDoc}
                      />
                    ))
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {/* 用户区 */}
      <div className="border-t border-slate-800 p-2">
        <button
          className="w-full flex items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-800 transition duration-fast"
          onClick={() => navigate('/langwiki/me/basic')}
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center text-sm font-semibold shrink-0">
            {(user.displayName || 'U').slice(0, 1)}
          </div>
          <div className="text-left min-w-0">
            <div className="text-sm text-slate-100 truncate">{user.displayName}</div>
            <div className="text-xs text-slate-500 truncate">@{user.username}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
