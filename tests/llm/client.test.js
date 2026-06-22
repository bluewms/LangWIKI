const { LlmClient, listSupportedModels } = require('../../src/llm/client');
const { resolveModel, MODEL_PRESETS } = require('../../src/llm/router');

describe('llm/client', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
  });

  test('router should resolve preset model correctly', () => {
    process.env.DEEPSEEK_API_KEY = 'sk-test';
    const config = resolveModel('deepseek/deepseek-chat');

    expect(config.provider).toBe('deepseek');
    expect(config.model).toBe('deepseek-chat');
    expect(config.baseUrl).toBe('https://api.deepseek.com/v1');
    expect(config.apiKey).toBe('sk-test');
  });

  test('router should resolve custom model format', () => {
    process.env.OPENAI_API_KEY = 'sk-openai';
    const config = resolveModel('openai/my-custom-model');

    expect(config.provider).toBe('openai');
    expect(config.model).toBe('my-custom-model');
    expect(config.apiKey).toBe('sk-openai');
  });

  test('router should handle ollama without API key', () => {
    const config = resolveModel('ollama/qwen2.5:7b');

    expect(config.provider).toBe('ollama');
    expect(config.apiKey).toBe('ollama');
    expect(config.baseUrl).toBe('http://localhost:11434/v1');
  });

  test('LlmClient should chat via router (OpenAI-compatible)', async () => {
    process.env.DEEPSEEK_API_KEY = 'sk-test';
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '你好！' } }]
      })
    }));

    const client = new LlmClient({ modelName: 'deepseek/deepseek-chat' });
    const response = await client.chat('hello', { temperature: 0.2 });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    );
    expect(response.textResponse).toBe('你好！');
  });

  test('LlmClient should throw when API key missing', async () => {
    delete process.env.DEEPSEEK_API_KEY;
    const client = new LlmClient({ modelName: 'deepseek/deepseek-chat' });

    await expect(client.chat('hello')).rejects.toThrow(/API Key/);
  });

  test('listSupportedModels should include all providers', () => {
    const output = listSupportedModels();
    expect(output).toContain('[deepseek]');
    expect(output).toContain('[openai]');
    expect(output).toContain('[anthropic]');
    expect(output).toContain('[google]');
    expect(output).toContain('[ollama]');
  });

  test('MODEL_PRESETS should have expected models', () => {
    expect(MODEL_PRESETS['deepseek/deepseek-chat']).toBeDefined();
    expect(MODEL_PRESETS['openai/gpt-4o']).toBeDefined();
    expect(MODEL_PRESETS['claude-sonnet-4']).toBeDefined();
    expect(MODEL_PRESETS['gemini-flash-latest']).toBeDefined();
    expect(MODEL_PRESETS['ollama/qwen2.5:7b']).toBeDefined();
  });
});
