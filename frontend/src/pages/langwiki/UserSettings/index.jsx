import React, { useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import ProfilePage from '../Profile';
import { getUserProfile, setUserProfile } from '../../../models/workspaceState';

const tabs = [
  { key: 'basic', label: '基本设置' },
  { key: 'profile', label: '用户画像' }
];

function BasicSettingsPanel() {
  const initial = useMemo(() => getUserProfile(), []);
  const [username, setUsername] = useState(initial.username);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [message, setMessage] = useState('');

  function onSave() {
    setUserProfile({ username: username.trim() || 'default', displayName: displayName.trim() || 'LangWIKI 用户' });
    setMessage('已保存');
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
      <div className="font-medium">基本设置</div>
      <input
        className="border border-slate-300 rounded-lg p-2 text-sm w-full md:w-96"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="显示名称"
      />
      <input
        className="border border-slate-300 rounded-lg p-2 text-sm w-full md:w-96"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="登录用户名"
      />
      <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm" onClick={onSave}>保存设置</button>
      {message ? <div className="text-sm text-slate-600">{message}</div> : null}
    </div>
  );
}

export default function UserSettingsPage() {
  const { tab = 'basic' } = useParams();
  const activeTab = tabs.some((item) => item.key === tab) ? tab : 'basic';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">用户设置</h1>

      <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm flex gap-2">
        {tabs.map((item) => (
          <NavLink
            key={item.key}
            to={`/langwiki/me/${item.key}`}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm ${isActive ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {activeTab === 'basic' ? <BasicSettingsPanel /> : null}
      {activeTab === 'profile' ? <ProfilePage compact /> : null}
    </div>
  );
}
