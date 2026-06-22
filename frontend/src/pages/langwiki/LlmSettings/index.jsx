import React, { useEffect, useState } from 'react';
import { getLlmModels, getLlmConfig, updateLlmConfig, testLlmConnection } from '../../../models/langwiki';

const PROVIDER_LABELS = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  qwen: '通义千问',
  anthropic: 'Anthropic Claude',
  google: 'Google Gemini',
  ollama: 'Ollama (本地)'
};

const ENV_KEY_LABELS = {
  DEEPSEEK_API_KEY: 'DeepSeek API Key',
  OPENAI_API_KEY: 'OpenAI API Key',
  DASHSCOPE_API_KEY: '通义千问 API Key',
  ANTHROPIC_API_KEY: 'Anthropic API Key',
  GEMINI_API_KEY: 'Gemini API Key'
};

export default function LlmSettingsPage({ compact = false }) {
  const [models, setModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const [config, setConfig] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [temperature, setTemperature] = useState(0.3);
  const [apiKeys, setApiKeys] = useState({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState(null);

  async function refresh() {
    try {
      const [modelsRes, configRes] = await Promise.all([getLlmModels(), getLlmConfig()]);
      setModels(modelsRes.models || []);
      setProviders(modelsRes.providers || []);
      setConfig(configRes.config);
      setSelectedModel(configRes.config.model);
      setTemperature(configRes.config.temperature ?? 0.3);

      const keys = {};
      for (const [key, info] of Object.entries(configRes.config.apiKeys || {})) {
        keys[key] = { ...info, newValue: '' };
      }
      setApiKeys(keys);
    } catch (err) {
      setMessage(err.message || '加载配置失败');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // 当前选中模型需要的 API Key
  const currentModelPreset = models.find((m) => m.name === selectedModel);
  const requiredEnvKeys = currentModelPreset?.envVars || [];

  async function onSave() {
    setLoading(true);
    setMessage('');
    setTestResult(null);
    try {
      const payload = {
        model: selectedModel,
        temperature
      };

      // 只提交有新值的 API Key
      const keysToUpdate = {};
      for (const [key, info] of Object.entries(apiKeys)) {
        if (info.newValue !== undefined && info.newValue !== '') {
          keysToUpdate[key] = info.newValue;
        }
      }
      if (Object.keys(keysToUpdate).length > 0) {
        payload.apiKeys = keysToUpdate;
      }

      const data = await updateLlmConfig(payload);
      setMessage(data.message || '保存成功');
      await refresh();
    } catch (err) {
      setMessage(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }

  async function onTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const payload = { model: selectedModel };

      // 提交当前输入的 API Key（包括未保存的）
      const keysToUpdate = {};
      for (const [key, info] of Object.entries(apiKeys)) {
        if (info.newValue) {
          keysToUpdate[key] = info.newValue;
        }
      }
      if (Object.keys(keysToUpdate).length > 0) {
        payload.apiKeys = keysToUpdate;
      }

      const result = await testLlmConnection(payload);
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, error: err.message || '测试失败' });
    } finally {
      setTesting(false);
    }
  }

  function updateApiKey(key, value) {
    setApiKeys((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), newValue: value }
    }));
  }

  // 按 provider 分组模型
  const modelsByProvider = providers.map((provider) => ({
    provider,
    label: PROVIDER_LABELS[provider] || provider,
    models: models.filter((m) => m.provider === provider)
  }));

  return (
    <div className="space-y-4">
      {!compact ? <h1 className="text-2xl font-semibold">大模型设置</h1> : null}

      {/* 模型选择 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="font-medium text-slate-900">选择大模型</div>
        <select
          className="w-full border border-slate-300 rounded-lg p-2 text-sm"
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
          <div className="text-xs text-slate-500 space-y-1">
            <div>Provider: {PROVIDER_LABELS[currentModelPreset.provider] || currentModelPreset.provider}</div>
            {requiredEnvKeys.length > 0 ? (
              <div>需要 API Key: {requiredEnvKeys.map((k) => ENV_KEY_LABELS[k] || k).join(', ')}</div>
            ) : (
              <div className="text-green-600">无需 API Key（本地模型）</div>
            )}
          </div>
        ) : null}
      </div>

      {/* 温度设置 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="font-medium text-slate-900">生成温度</div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-mono w-12 text-right">{temperature.toFixed(1)}</span>
        </div>
        <div className="text-xs text-slate-500">
          0 = 确定性输出，1 = 较有创造力，2 = 非常随机。推荐 0.3。
        </div>
      </div>

      {/* API Key 设置 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="font-medium text-slate-900">API Key 管理</div>
        <div className="text-xs text-slate-500">
          填入新的 API Key 后点击保存。已配置的 Key 不会显示完整内容。留空保存表示不修改。
        </div>

        {Object.entries(ENV_KEY_LABELS).map(([key, label]) => {
          const info = apiKeys[key] || { configured: false, masked: '' };
          return (
            <label key={key} className="block space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">{label}</span>
                {info.configured ? (
                  <span className="text-xs text-green-600">
                    已配置 ({info.masked})
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">未配置</span>
                )}
              </div>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                placeholder={info.configured ? '输入新值替换（留空不修改）' : '输入 API Key'}
                value={info.newValue || ''}
                onChange={(e) => updateApiKey(key, e.target.value)}
              />
            </label>
          );
        })}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={onSave}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存配置'}
        </button>
        <button
          type="button"
          disabled={testing}
          onClick={onTest}
          className="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {testing ? '测试中...' : '测试连接'}
        </button>
      </div>

      {/* 消息 */}
      {message ? (
        <div className="text-sm text-slate-700 bg-slate-100 rounded-lg p-3">{message}</div>
      ) : null}

      {/* 测试结果 */}
      {testResult ? (
        <div
          className={`text-sm rounded-lg p-3 border ${
            testResult.ok
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {testResult.ok ? (
            <div className="space-y-1">
              <div className="font-medium">✓ {testResult.message}</div>
              <div className="text-xs">模型: {testResult.model}</div>
              <div className="text-xs">回复: {testResult.response}</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-medium">✗ 连接测试失败</div>
              <div className="text-xs break-all">{testResult.error}</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
