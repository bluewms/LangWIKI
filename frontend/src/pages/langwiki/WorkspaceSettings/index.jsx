import React, { useMemo } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Settings, ScanLine, Code2, Cpu } from 'lucide-react';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';
import WorkspacePage from '../Workspace';
import IngestPage from '../Ingest';
import SchemaPage from '../Schema';
import LlmSettingsPage from '../LlmSettings';
import { PageHeader, Badge } from '../../../components/ui';

const tabs = [
  { key: 'manage', label: '工作区管理', icon: Settings },
  { key: 'ingest', label: 'Ingest 控制台', icon: ScanLine },
  { key: 'schema', label: 'Schema 管理', icon: Code2 },
  { key: 'llm', label: '大模型设置', icon: Cpu }
];

export default function WorkspaceSettingsPage() {
  const { id, tab = 'manage' } = useParams();
  const workspace = useWorkspaceScope();
  const activeTab = useMemo(() => (tabs.some((item) => item.key === tab) ? tab : 'manage'), [tab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作区设置"
        subtitle={`当前工作区：${workspace?.name || id || '未知'}`}
        actions={workspace ? <Badge variant="brand">{workspace.id}</Badge> : null}
      />

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={`/langwiki/workspace/${encodeURIComponent(id || workspace?.id || '')}/settings/${item.key}`}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition duration-fast whitespace-nowrap ${
                  isActive
                    ? 'border-brand-600 text-brand-700 font-medium'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <Icon size={14} />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {activeTab === 'manage' ? <WorkspacePage compact /> : null}
      {activeTab === 'ingest' ? <IngestPage compact /> : null}
      {activeTab === 'schema' ? <SchemaPage compact /> : null}
      {activeTab === 'llm' ? <LlmSettingsPage compact /> : null}
    </div>
  );
}
