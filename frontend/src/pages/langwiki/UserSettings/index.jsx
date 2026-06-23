import React, { useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { User, UserCircle } from 'lucide-react';
import ProfilePage from '../Profile';
import { getUserProfile, setUserProfile } from '../../../models/workspaceState';
import { PageHeader, Card, Button, Input, useToast } from '../../../components/ui';

const tabs = [
  { key: 'basic', label: '基本设置', icon: User },
  { key: 'profile', label: '用户画像', icon: UserCircle }
];

function BasicSettingsPanel() {
  const toast = useToast();
  const initial = useMemo(() => getUserProfile(), []);
  const [username, setUsername] = useState(initial.username);
  const [displayName, setDisplayName] = useState(initial.displayName);

  function onSave() {
    setUserProfile({ username: username.trim() || 'default', displayName: displayName.trim() || 'LangWIKI 用户' });
    toast.success('设置已保存');
  }

  return (
    <Card>
      <div className="text-sm font-medium text-slate-900 mb-4">基本设置</div>
      <div className="space-y-4 max-w-md">
        <label className="space-y-1.5 block">
          <span className="text-xs text-slate-600">显示名称</span>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="显示名称" />
        </label>
        <label className="space-y-1.5 block">
          <span className="text-xs text-slate-600">登录用户名</span>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="登录用户名" />
        </label>
        <Button variant="primary" size="sm" onClick={onSave}>保存设置</Button>
      </div>
    </Card>
  );
}

export default function UserSettingsPage() {
  const { tab = 'basic' } = useParams();
  const activeTab = tabs.some((item) => item.key === tab) ? tab : 'basic';

  return (
    <div className="space-y-6">
      <PageHeader title="用户设置" subtitle="管理个人信息与用户画像" />

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={`/langwiki/me/${item.key}`}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition duration-fast ${
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

      {activeTab === 'basic' ? <BasicSettingsPanel /> : null}
      {activeTab === 'profile' ? <ProfilePage compact /> : null}
    </div>
  );
}
