import React, { useEffect, useState } from 'react';
import {
  adoptSchemaSuggestion,
  getSchema,
  getSchemaSuggestions,
  ignoreSchemaSuggestion,
  saveSchema
} from '../../../models/langwiki';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';

export default function SchemaPage({ compact = false }) {
  const activeWorkspace = useWorkspaceScope();
  const rootDir = activeWorkspace?.rootDir;
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function refresh() {
    const [schemaData, suggestionData] = await Promise.all([
      getSchema(rootDir),
      getSchemaSuggestions(rootDir)
    ]);
    setContent(schemaData.schema || '');
    setSuggestions(suggestionData.suggestions || []);
  }

  useEffect(() => {
    refresh().catch(() => {
      setContent('');
      setSuggestions([]);
    });
  }, [rootDir]);

  async function onSave() {
    setBusy(true);
    setMessage('');
    try {
      await saveSchema(content, rootDir);
      setMessage('Schema 已保存');
    } catch (error) {
      setMessage(error.message || '保存失败');
    } finally {
      setBusy(false);
    }
  }

  async function onHandleSuggestion(action, id) {
    setBusy(true);
    setMessage('');
    try {
      if (action === 'adopt') {
        await adoptSchemaSuggestion(id, rootDir);
      } else {
        await ignoreSchemaSuggestion(id, rootDir);
      }
      await refresh();
      setMessage('建议已处理');
    } catch (error) {
      setMessage(error.message || '处理建议失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {!compact ? <h1 className="text-2xl font-semibold">Schema 管理</h1> : null}
      <div className="text-sm text-slate-600">
        生效目录：{rootDir || '服务默认目录'}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="font-medium">当前 Schema</div>
        <textarea
          className="w-full border border-slate-300 rounded-lg p-3 min-h-64 font-mono text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
          disabled={busy}
          onClick={onSave}
        >
          保存 Schema
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-2">
        <div className="font-medium">待处理建议</div>
        {suggestions.length === 0 ? (
          <div className="text-sm text-slate-500">暂无建议</div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="text-xs text-slate-500">#{item.id}</div>
                <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm disabled:opacity-50"
                    disabled={busy}
                    onClick={() => onHandleSuggestion('adopt', item.id)}
                  >
                    采纳
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm disabled:opacity-50"
                    disabled={busy}
                    onClick={() => onHandleSuggestion('ignore', item.id)}
                  >
                    忽略
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {message ? <div className="text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}
