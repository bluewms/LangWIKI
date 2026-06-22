import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { getWorkspaceDocument } from '../../../models/langwiki';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';

export default function WorkspaceDocPage() {
  const { id } = useParams();
  const workspace = useWorkspaceScope();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filePath = searchParams.get('path') || '';

  useEffect(() => {
    if (!id || !filePath) return;

    setLoading(true);
    setError('');

    getWorkspaceDocument(id, filePath)
      .then((data) => setContent(data.content || ''))
      .catch((err) => {
        setContent('');
        setError(err.message || '文档读取失败');
      })
      .finally(() => setLoading(false));
  }, [id, filePath]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Markdown 文档预览</h1>
        <div className="text-sm text-slate-600 mt-1">工作区：{workspace?.name || id}</div>
        <div className="text-sm text-slate-500">路径：{filePath || '未指定文档'}</div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[60vh]">
        {loading ? <div className="text-sm text-slate-500">加载中...</div> : null}
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {!loading && !error ? (
          <pre className="whitespace-pre-wrap text-sm leading-6">{content || '文档为空'}</pre>
        ) : null}
      </div>
    </div>
  );
}
