import React, { useEffect, useState } from 'react';
import { User, FileText, Edit3, Loader2, Save } from 'lucide-react';
import { getUserContext, getUserWiki, updateUserProfile } from '../../../models/langwiki';
import { getUserProfile } from '../../../models/workspaceState';
import { PageHeader, Card, Button, Badge, Skeleton, EmptyState, useToast } from '../../../components/ui';

export default function ProfilePage({ compact = false }) {
  const toast = useToast();
  const initialUser = getUserProfile();
  const [username, setUsername] = useState(initialUser.username || 'default');
  const [wiki, setWiki] = useState('');
  const [context, setContext] = useState({});
  const [autoBlocksText, setAutoBlocksText] = useState('{}');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData(name) {
    setLoading(true);
    try {
      const [wikiData, contextData] = await Promise.all([getUserWiki(name), getUserContext(name)]);
      setWiki(wikiData.wiki || '');
      setContext(contextData.context || {});
    } catch (_e) {
      setWiki('');
      setContext({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(username);
  }, [username]);

  async function onSaveBlocks() {
    setBusy(true);
    try {
      const parsed = JSON.parse(autoBlocksText || '{}');
      await updateUserProfile(username, parsed);
      await loadData(username);
      toast.success('用户画像已更新');
    } catch (error) {
      toast.error(error.message || '保存失败，请检查 JSON 格式');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!compact ? (
        <PageHeader
          title="用户画像"
          subtitle="查看用户上下文与 Wiki，更新 AutoBlocks"
        />
      ) : null}

      {/* 用户标识 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-900">用户标识</span>
        </div>
        <label className="space-y-1.5 block max-w-md">
          <span className="text-xs text-slate-600">用户名</span>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value || 'default')}
            placeholder="default"
          />
        </label>
      </Card>

      {/* 上下文与 Wiki 双栏 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-900">用户上下文</span>
            <Badge variant="neutral" className="ml-auto">只读</Badge>
          </div>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : Object.keys(context).length > 0 ? (
            <pre className="text-xs whitespace-pre-wrap font-mono text-slate-600 bg-slate-50 rounded-md p-3 overflow-x-auto">{JSON.stringify(context, null, 2)}</pre>
          ) : (
            <EmptyState icon={<FileText size={28} />} title="暂无上下文" />
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-900">用户 Wiki</span>
            <Badge variant="neutral" className="ml-auto">只读</Badge>
          </div>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : wiki ? (
            <pre className="text-xs whitespace-pre-wrap font-sans text-slate-600 leading-6 max-h-64 overflow-auto">{wiki}</pre>
          ) : (
            <EmptyState icon={<FileText size={28} />} title="暂无 Wiki" />
          )}
        </Card>
      </div>

      {/* AutoBlocks 编辑 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Edit3 size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-900">更新 AutoBlocks</span>
          <Badge variant="brand" className="ml-auto">JSON</Badge>
        </div>
        <textarea
          className="input font-mono min-h-48 leading-6"
          value={autoBlocksText}
          onChange={(e) => setAutoBlocksText(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <Button variant="primary" size="sm" disabled={busy} onClick={onSaveBlocks}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            写入画像
          </Button>
        </div>
      </Card>
    </div>
  );
}
