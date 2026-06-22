import React, { useState } from 'react';
import useLangwikiQuery from '../../../hooks/useLangwikiQuery';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';

export default function QueryPage() {
  const activeWorkspace = useWorkspaceScope();
  const [input, setInput] = useState('');
  const { loading, results, answer, search, ask } = useLangwikiQuery(activeWorkspace?.rootDir);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">查询与问答（无向量）</h1>
      <div className="text-sm text-slate-600">
        当前工作区：{activeWorkspace?.name || '默认目录'}
        {activeWorkspace?.rootDir ? `（${activeWorkspace.rootDir}）` : ''}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <textarea
          className="w-full border border-slate-300 rounded-lg p-3 min-h-24"
          value={input}
          placeholder="输入关键词或问题，例如：富士康合同金额是多少？"
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm disabled:opacity-50"
            onClick={() => search(input)}
            disabled={loading || !input.trim()}
          >
            关键词检索
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm disabled:opacity-50"
            onClick={() => ask(input)}
            disabled={loading || !input.trim()}
          >
            基于证据问答
          </button>
        </div>
      </div>

      {answer ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm leading-6">
          <div className="font-medium mb-1">回答</div>
          <div>{answer}</div>
        </div>
      ) : null}

      <div className="space-y-2">
        {results.map((item, idx) => (
          <div key={`${item.file}-${idx}`} className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500 mb-1">{item.file}</div>
            <div className="text-sm">{item.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
