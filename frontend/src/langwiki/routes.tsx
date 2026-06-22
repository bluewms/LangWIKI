import React from 'react';

export const langwikiRoutes = [
  { path: '/langwiki/dashboard', component: 'LangwikiDashboardPage' },
  { path: '/langwiki/workspace/:id', component: 'LangwikiWorkspacePage' },
  { path: '/langwiki/entity/:name', component: 'LangwikiEntityPage' },
  { path: '/langwiki/schema', component: 'LangwikiSchemaPage' },
  { path: '/langwiki/profile', component: 'LangwikiProfilePage' },
  { path: '/langwiki/settings', component: 'LangwikiSettingsPage' }
];

export function LangwikiRoutePlaceholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>{title}</h1>
      <p>LangWIKI 页面骨架已创建，后续将在 AnythingLLM 前端中接入真实数据与交互。</p>
    </div>
  );
}
