import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createWorkspace, getWorkspaceTree, listWorkspaces } from '../../models/langwiki';
import { getActiveWorkspace, getUserProfile, notifyWorkspacesChanged, onWorkspacesChanged, setActiveWorkspace } from '../../models/workspaceState';
function TreeNode({ node, workspaceId, onOpenDoc }) {
  const [open, setOpen] = useState(false);

  if (node.type === 'file') {
    return (
      <button
        className="w-full text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded px-2 py-1"
        onClick={() => onOpenDoc(workspaceId, node.path)}
      >
        {node.name}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <button
        className="w-full text-left text-xs text-slate-400 hover:text-slate-100 rounded px-2 py-1"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? '⌄' : '›'} {node.name}
      </button>
      {open ? (
        <div className="ml-3 border-l border-slate-700 pl-2 space-y-1">
          {node.children?.map((child) => (
            <TreeNode key={`${child.type}-${child.path}`} node={child} workspaceId={workspaceId} onOpenDoc={onOpenDoc} />
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
      navigate(`/langwiki/workspace/${encodeURIComponent(workspace.id)}/query`);    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="w-80 bg-slate-950 text-slate-100 min-h-screen p-4 flex flex-col border-r border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <button
          className="text-lg font-semibold tracking-wide hover:text-white"
          onClick={() => navigate('/langwiki/dashboard')}
        >
          LangWIKI
        </button>
        <button
          className="w-8 h-8 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          onClick={onCreateWorkspace}
          disabled={creating}
          title="新建工作区"
        >
          +
        </button>
      </div>

      <nav className="space-y-2 flex-1 overflow-auto pr-1">
        {workspaces.map((workspace) => {
          const isActive = activeId === workspace.id || location.pathname.includes(`/workspace/${encodeURIComponent(workspace.id)}`);
          const isOpen = Boolean(expanded[workspace.id]);

          return (
            <div key={workspace.id} className="rounded-xl border border-slate-800 bg-slate-900/70">
              <div className="flex items-center gap-1 px-2 py-1.5 group">
                <button
                  className="w-6 h-6 text-slate-400 hover:text-white"
                  onClick={() => toggleExpand(workspace.id)}
                  title="展开目录"
                >
                  {isOpen ? '⌄' : '›'}
                </button>

                <button
                  className={`flex-1 text-left rounded-lg px-2 py-1.5 text-sm transition ${
                    isActive ? 'bg-brand-500 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                  onClick={() => openWorkspace(workspace)}
                >
                  {workspace.name || workspace.id}
                </button>

                <button
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => openWorkspaceSettings(workspace)}
                  title="工作区设置"
                >
                  ⚙
                </button>
              </div>

              {isOpen ? (
                <div className="px-3 pb-2 space-y-1">
                  {(trees[workspace.id] || []).length === 0 ? (
                    <div className="text-xs text-slate-500 px-2 py-1">暂无目录或 Markdown 文档</div>
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

      <div className="mt-3 pt-3 border-t border-slate-800">
        <button
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-800"
          onClick={() => navigate('/langwiki/me/basic')}
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 text-white grid place-items-center text-sm font-semibold">
            {(user.displayName || 'U').slice(0, 1)}
          </div>
          <div className="text-left">
            <div className="text-sm text-slate-100">{user.displayName}</div>
            <div className="text-xs text-slate-400">@{user.username}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
