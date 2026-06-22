import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEntityWiki } from '../../../models/langwiki';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';

export default function EntityPage() {
  const { name } = useParams();
  const activeWorkspace = useWorkspaceScope();
  const [wiki, setWiki] = useState('');

  useEffect(() => {
    if (!name) return;
    getEntityWiki(name, activeWorkspace?.rootDir)
      .then((data) => setWiki(data.wiki || ''))
      .catch(() => setWiki('未找到该实体 Wiki'));
  }, [name, activeWorkspace?.rootDir]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">实体详情：{name}</h1>
      <div className="text-sm text-slate-600">
        当前工作区：{activeWorkspace?.name || '默认目录'}
      </div>
      <pre className="bg-white rounded-xl p-4 border border-slate-200 text-sm whitespace-pre-wrap leading-6">
        {wiki}
      </pre>
    </div>
  );
}
