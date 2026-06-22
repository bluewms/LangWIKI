import React, { useEffect, useState } from 'react';
import { getUserContext, getUserWiki, updateUserProfile } from '../../../models/langwiki';
import { getUserProfile } from '../../../models/workspaceState';

export default function ProfilePage({ compact = false }) {
  const initialUser = getUserProfile();
  const [username, setUsername] = useState(initialUser.username || 'default');
  const [wiki, setWiki] = useState('');
  const [context, setContext] = useState({});
  const [autoBlocksText, setAutoBlocksText] = useState('{}');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData(name) {
    const [wikiData, contextData] = await Promise.all([getUserWiki(name), getUserContext(name)]);
    setWiki(wikiData.wiki || '');
    setContext(contextData.context || {});
  }

  useEffect(() => {
    loadData(username).catch(() => {
      setWiki('');
      setContext({});
    });
  }, [username]);

  async function onSaveBlocks() {
    setBusy(true);
    setMessage('');
    try {
      const parsed = JSON.parse(autoBlocksText || '{}');
      await updateUserProfile(username, parsed);
      await loadData(username);
      setMessage('用户画像已更新');
    } catch (error) {
      setMessage(error.message || '保存失败，请检查 JSON 格式');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {!compact ? <h1 className="text-2xl font-semibold">用户画像</h1> : null}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-2">
        <div className="font-medium">用户标识</div>
        <input
          className="border border-slate-300 rounded-lg p-2 text-sm w-full md:w-80"
          value={username}
          onChange={(e) => setUsername(e.target.value || 'default')}
          placeholder="default"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-2">
          <div className="font-medium">用户上下文（只读）</div>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(context, null, 2)}</pre>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-2">
          <div className="font-medium">用户 Wiki（只读）</div>
          <pre className="text-sm whitespace-pre-wrap">{wiki}</pre>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-2">
        <div className="font-medium">更新 AutoBlocks（JSON）</div>
        <textarea
          className="w-full border border-slate-300 rounded-lg p-3 min-h-48 font-mono text-sm"
          value={autoBlocksText}
          onChange={(e) => setAutoBlocksText(e.target.value)}
        />
        <button
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
          disabled={busy}
          onClick={onSaveBlocks}
        >
          写入画像
        </button>
      </div>

      {message ? <div className="text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}
