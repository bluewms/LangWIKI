import React, { useEffect, useState } from 'react';
import { Code2, Lightbulb, Check, X, Loader2, Save } from 'lucide-react';
import {
  adoptSchemaSuggestion,
  getSchema,
  getSchemaSuggestions,
  ignoreSchemaSuggestion,
  saveSchema
} from '../../../models/langwiki';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';
import { PageHeader, Card, Button, Badge, Skeleton, EmptyState, useToast } from '../../../components/ui';

export default function SchemaPage({ compact = false }) {
  const toast = useToast();
  const activeWorkspace = useWorkspaceScope();
  const rootDir = activeWorkspace?.rootDir;
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [schemaData, suggestionData] = await Promise.all([
        getSchema(rootDir),
        getSchemaSuggestions(rootDir)
      ]);
      setContent(schemaData.schema || '');
      setSuggestions(suggestionData.suggestions || []);
    } catch (_e) {
      setContent('');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [rootDir]);

  async function onSave() {
    setBusy(true);
    try {
      await saveSchema(content, rootDir);
      toast.success('Schema 已保存');
    } catch (error) {
      toast.error(error.message || '保存失败');
    } finally {
      setBusy(false);
    }
  }

  async function onHandleSuggestion(action, id) {
    setBusy(true);
    try {
      if (action === 'adopt') {
        await adoptSchemaSuggestion(id, rootDir);
        toast.success('建议已采纳');
      } else {
        await ignoreSchemaSuggestion(id, rootDir);
        toast.success('建议已忽略');
      }
      await refresh();
    } catch (error) {
      toast.error(error.message || '处理建议失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!compact ? (
        <PageHeader
          title="Schema 管理"
          subtitle={`生效目录：${rootDir || '服务默认目录'}`}
        />
      ) : null}

      {/* Schema 编辑 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Code2 size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-900">当前 Schema</span>
        </div>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <textarea
              className="input font-mono min-h-64 leading-6"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <Button variant="primary" size="sm" disabled={busy} onClick={onSave}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                保存 Schema
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* 待处理建议 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-900">待处理建议</span>
          </div>
          {suggestions.length > 0 ? (
            <Badge variant="warning">{suggestions.length} 条</Badge>
          ) : null}
        </div>

        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon={<Lightbulb size={32} />}
            title="暂无建议"
            description="系统在提取过程中发现的 Schema 改进建议会出现在这里"
          />
        ) : (
          <div className="space-y-3">
            {suggestions.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-md p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="neutral">#{item.id}</Badge>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" disabled={busy} onClick={() => onHandleSuggestion('adopt', item.id)}>
                      <Check size={14} />
                      采纳
                    </Button>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => onHandleSuggestion('ignore', item.id)}>
                      <X size={14} />
                      忽略
                    </Button>
                  </div>
                </div>
                <pre className="text-xs whitespace-pre-wrap font-mono text-slate-600 overflow-x-auto">{JSON.stringify(item, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
