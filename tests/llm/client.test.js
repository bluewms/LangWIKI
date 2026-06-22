const { LlmClient } = require('../../src/llm/client');

describe('llm/client', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.OPENAI_API_KEY;
  });

  test('proxy mode should call AnythingLLM endpoint', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ textResponse: 'ok' })
    }));

    const client = new LlmClient({
      anythingllmUrl: 'http://localhost:3001',
      apiKey: 'key_123',
      directMode: false
    });

    const response = await client.chat('hello', { temperature: 0.2 });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/system/openai/chat',
      expect.objectContaining({ method: 'POST' })
    );
    expect(response).toEqual({ textResponse: 'ok' });
  });

  test('direct mode should use direct chat provider', async () => {
    const client = new LlmClient({
      directMode: true,
      directConfig: {
        chat: jest.fn(async () => ({ content: 'direct' }))
      }
    });

    const response = await client.chat('hello direct');
    expect(response).toEqual({ content: 'direct' });
  });
});
