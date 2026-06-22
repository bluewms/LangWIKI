import React, { useMemo } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';
import WorkspacePage from '../Workspace';
import IngestPage from '../Ingest';
import SchemaPage from '../Schema';

const tabs = [
  { key: 'manage', label: '工作区管理' },
  { key: 'ingest', label: 'Ingest 控制台' },
  { key: 'schema', label: 'Schema 管理' }
];

export default function WorkspaceSettingsPage() {
  const { id, tab = 'manage' } = useParams();
  const workspace = useWorkspaceScope();
  const activeTab = useMemo(() => (tabs.some((item) => item.key === tab) ? tab : 'manage'), [tab]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">工作区设置</h1>
        <div className="text-sm text-slate-600 mt-1">
          当前工作区：{workspace?.name || id || '未知'}
        </div>
      </div>

      <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm flex gap-2">
        {tabs.map((item) => (
          <NavLink
            key={item.key}
            to={`/langwiki/workspace/${encodeURIComponent(id || workspace?.id || '')}/settings/${item.key}`}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm ${isActive ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {activeTab === 'manage' ? <WorkspacePage compact /> : null}
      {activeTab === 'ingest' ? <IngestPage compact /> : null}
      {activeTab === 'schema' ? <SchemaPage compact /> : null}
    </div>
  );
}
