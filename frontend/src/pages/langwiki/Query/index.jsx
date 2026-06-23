import React, { useState } from 'react';
import { Search, MessageCircle, FileText, Sparkles, Loader2 } from 'lucide-react';
import useLangwikiQuery from '../../../hooks/useLangwikiQuery';
import useWorkspaceScope from '../../../hooks/useWorkspaceScope';
import { PageHeader, Card, Button, Badge, Skeleton, EmptyState } from '../../../components/ui';

export default function QueryPage() {
  const activeWorkspace = useWorkspaceScope();
  const [input, setInput] = useState('');
  const { loading, results, answer, search, ask } = useLangwikiQuery(activeWorkspace?.rootDir);

  return (
    <div className="space-y-6">
      <PageHeader
        title="查询与问答"
        subtitle="基于关键词检索或证据问答（无向量）"
        actions={
          activeWorkspace ? (
            <Badge variant="brand">{activeWorkspace.name || '默认目录'}</Badge>
          ) : null
        }
      />

      {/* 输入区 */}
      <Card>
        <textarea
          className="input"
          value={input}
          placeholder="输入关键词或问题，例如：富士康合同金额是多少？"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading && input.trim()) {
              ask(input);
            }
          }}
        />
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="text-xs text-slate-400">⌘/Ctrl + Enter 快速问答</div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => search(input)}
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              关键词检索
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => ask(input)}
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
              证据问答
            </Button>
          </div>
        </div>
      </Card>

      {/* 回答区 */}
      {loading && !answer ? (
        <Card>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
      ) : answer ? (
        <Card className="border-brand-200 bg-brand-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-brand-600" />
            <span className="text-sm font-medium text-brand-800">回答</span>
          </div>
          <div className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{answer}</div>
        </Card>
      ) : null}

      {/* 证据列表 */}
      {loading && results.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : results.length > 0 ? (
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">
            证据（{results.length}）
          </div>
          <div className="space-y-2">
            {results.map((item, idx) => (
              <Card key={`${item.file}-${idx}`} interactive compact>
                <div className="flex items-start gap-2">
                  <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 mb-1 break-all font-mono">{item.file}</div>
                    <div className="text-sm text-slate-700 leading-6">{item.snippet}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : !loading && !answer ? (
        <EmptyState
          icon={<Search size={32} />}
          title="暂无结果"
          description="输入关键词或问题后，点击检索或问答按钮查看结果"
        />
      ) : null}
    </div>
  );
}
