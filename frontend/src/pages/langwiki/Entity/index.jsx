import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { getEntityWiki } from '../../../models/langwiki';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';
import { PageHeader, Card, Badge, Skeleton, Button, EmptyState } from '../../../components/ui';
import { useNavigate } from 'react-router-dom';

export default function EntityPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const activeWorkspace = useWorkspaceScope();
  const [wiki, setWiki] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    getEntityWiki(name, activeWorkspace?.rootDir)
      .then((data) => setWiki(data.wiki || ''))
      .catch(() => setWiki(''))
      .finally(() => setLoading(false));
  }, [name, activeWorkspace?.rootDir]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`实体：${name}`}
        subtitle={`工作区：${activeWorkspace?.name || '默认目录'}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
            返回
          </Button>
        }
      />

      {loading ? (
        <Card>
          <Skeleton className="h-4 w-1/3 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      ) : wiki ? (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-brand-600" />
            <span className="text-sm font-medium text-slate-900">Wiki 内容</span>
            <Badge variant="brand" className="ml-auto">实体</Badge>
          </div>
          <pre className="text-sm whitespace-pre-wrap leading-7 text-slate-700 font-sans">{wiki}</pre>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<FileText size={32} />}
            title="未找到该实体 Wiki"
            description="该实体尚未生成 Wiki 内容，请先在 Ingest 控制台触发提取"
          />
        </Card>
      )}
    </div>
  );
}
