import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, AlertCircle } from 'lucide-react';
import { getWorkspaceDocument } from '../../../models/langwiki';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';
import { PageHeader, Card, Button, Skeleton, EmptyState } from '../../../components/ui';

export default function WorkspaceDocPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
    <div className="space-y-6">
      <PageHeader
        title="文档预览"
        subtitle={`工作区：${workspace?.name || id || ''}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
            返回
          </Button>
        }
      />

      {filePath ? (
        <div className="flex items-center gap-2 text-xs">
          <FileText size={14} className="text-slate-400" />
          <span className="text-slate-500 break-all font-mono">{filePath}</span>
        </div>
      ) : null}

      <Card className="min-h-[60vh]">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12">
            <AlertCircle size={32} className="text-red-400 mb-3" />
            <div className="text-sm font-medium text-red-600">{error}</div>
          </div>
        ) : content ? (
          <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-700 font-sans">{content}</pre>
        ) : (
          <EmptyState
            icon={<FileText size={32} />}
            title="文档为空"
            description="该文档暂无内容"
          />
        )}
      </Card>
    </div>
  );
}
