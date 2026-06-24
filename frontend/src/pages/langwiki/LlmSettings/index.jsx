import React, { useEffect, useState } from 'react';
import { Cpu, Thermometer, KeyRound, Loader2, Save, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { getLlmModels, getLlmConfig, updateLlmConfig, testLlmConnection } from '../../../models/langwiki';
import { PageHeader, Card, Button, Badge, Skeleton, useToast } from '../../../components/ui';

const PROVIDER_LABELS = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  qwen: '通义千问',
  anthropic: 'Anthropic Claude',
  google: 'Google Gemini',
  ollama: 'Ollama (本地)',
  langai: 'LangAI (vLLM 自部署)'
};

const ENV_KEY_LABELS = {
  DEEPSEEK_API_KEY: 'DeepSeek API Key',
  OPENAI_API_KEY: 'OpenAI API Key',
  DASHSCOPE_API_KEY: '通义千问 API Key',
  ANTHROPIC_API_KEY: 'Anthropic API Key',
  GEMINI_API_KEY: 'Gemini API Key',
  LANGAI_API_KEY: 'LangAI API Key (vLLM)'
};

export default function LlmSettingsPage({ compact = false }) {
  const toast = useToast();
  const [models, setModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [temperature, setTemperature] = useState(0.3);
  const [apiKeys, setApiKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const [modelsRes, configRes] = await Promise.all([getLlmModels(), getLlmConfig()]);
      setModels(modelsRes.models || []);
      setProviders(modelsRes.providers || []);
      setSelectedModel(configRes.config.model);
      setTemperature(configRes.config.temperature ?? 0.3);

      const keys = {};
      for (const [key, info] of Object.entries(configRes.config.apiKeys || {})) {
        keys[key] = { ...info, newValue: '' };
      }
      setApiKeys(keys);
    } catch (err) {
      toast.error(err.message || '加载配置失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const currentModelPreset = models.find((m) => m.name === selectedModel);
  const requiredEnvKeys = currentModelPreset?.envVars || [];

  async function onSave() {
    setBusy(true);
    setTestResult(null);
    try {
      const payload = { model: selectedModel, temperature };
      const keysToUpdate = {};
      for (const [key, info] of Object.entries(apiKeys)) {
        if (info.newValue !== undefined && info.newValue !== '') {
          keysToUpdate[key] = info.newValue;
        }
      }
      if (Object.keys(keysToUpdate).length > 0) payload.apiKeys = keysToUpdate;
      const data = await updateLlmConfig(payload);
      toast.success(data.message || '保存成功');
      await refresh();
    } catch (err) {
      toast.error(err.message || '保存失败');
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const payload = { model: selectedModel };
      const keysToUpdate = {};
      for (const [key, info] of Object.entries(apiKeys)) {
        if (info.newValue) keysToUpdate[key] = info.newValue;
      }
      if (Object.keys(keysToUpdate).length > 0) payload.apiKeys = keysToUpdate;
      const result = await testLlmConnection(payload);
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, error: err.message || '测试失败' });
    } finally {
      setTesting(false);
    }
  }

  function updateApiKey(key, value) {
    setApiKeys((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), newValue: value } }));
  }

  const modelsByProvider = providers.map((provider) => ({
    provider,
    label: PROVIDER_LABELS[provider] || provider,
    models: models.filter((m) => m.provider === provider)
  }));

  return (
    <div className="space-y-6">
      {!compact ? (
        <PageHeader title="大模型设置" subtitle="配置模型、温度与 API Key" />
      ) : null}

      {/* 模型选择 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-900">选择大模型</span>
        </div>
        {loading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <>
            <select
              className="input cursor-pointer"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {modelsByProvider.map((group) => (
                <optgroup key={group.provider} label={group.label}>
                  {group.models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name} — {model.note}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {currentModelPreset ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="neutral">{PROVIDER_LABELS[currentModelPreset.provider] || currentModelPreset.provider}</Badge>
                {requiredEnvKeys.length > 0 ? (
                  <span className="text-slate-500">需要 {requiredEnvKeys.map((k) => ENV_KEY_LABELS[k] || k).join(', ')}</span>
                ) : (
                  <Badge variant="success">无需 API Key</Badge>
                )}
              </div>
            ) : null}
          </>
        )}
      </Card>

      {/* 温度设置 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Thermometer size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-900">生成温度</span>
          <span className="ml-auto text-sm font-mono font-semibold text-brand-600">{temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0 确定性</span>
          <span>1 创造性</span>
          <span>2 随机</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">推荐 0.3，适用于知识提取场景。</p>
      </Card>

      {/* API Key 管理 */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <KeyRound size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-900">API Key 管理</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">填入新值后保存。已配置的 Key 不会显示完整内容，留空表示不修改。</p>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(ENV_KEY_LABELS).map(([key, label]) => {
              const info = apiKeys[key] || { configured: false, masked: '' };
              return (
                <label key={key} className="block space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700">{label}</span>
                    {info.configured ? (
                      <Badge variant="success">已配置 {info.masked}</Badge>
                    ) : (
                      <Badge variant="neutral">未配置</Badge>
                    )}
                  </div>
                  <input
                    type="password"
                    className="input"
                    placeholder={info.configured ? '输入新值替换（留空不修改）' : '输入 API Key'}
                    value={info.newValue || ''}
                    onChange={(e) => updateApiKey(key, e.target.value)}
                  />
                </label>
              );
            })}
          </div>
        )}
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={busy || loading} onClick={onSave}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          保存配置
        </Button>
        <Button variant="outline" disabled={testing || loading} onClick={onTest}>
          {testing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          测试连接
        </Button>
      </div>

      {/* 测试结果 */}
      {testResult ? (
        <Card className={testResult.ok ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
          {testResult.ok ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                <CheckCircle2 size={16} />
                {testResult.message}
              </div>
              <div className="text-xs text-green-700">模型：{testResult.model}</div>
              <div className="text-xs text-green-700 break-all">回复：{testResult.response}</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                <XCircle size={16} />
                连接测试失败
              </div>
              <div className="text-xs text-red-700 break-all">{testResult.error}</div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
