# LangWIKI 配置说明

## 环境变量

| 变量名 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3100` | 服务端口 |
| `NODE_ENV` | `development` | 运行环境 |
| `CORS_ORIGIN` | `*` | 跨域来源 |
| `LANGWIKI_DATA_DIR` | `./data` | LangWIKI 系统目录 |
| `LANGWIKI_USERS_DIR` | `./data/users` | 用户档案目录 |
| `LLM_MODEL` | `deepseek/deepseek-chat` | LLM 模型（见下表） |
| `LLM_TEMPERATURE` | `0.3` | LLM 生成温度 |

### LLM 模型配置

| 模型预设 | 所需环境变量 | 说明 |
|---|---|---|
| `deepseek/deepseek-chat` | `DEEPSEEK_API_KEY` | DeepSeek Chat（推荐默认） |
| `deepseek/deepseek-reasoner` | `DEEPSEEK_API_KEY` | DeepSeek R1 推理 |
| `openai/gpt-4o` | `OPENAI_API_KEY` | OpenAI GPT-4o |
| `openai/gpt-4o-mini` | `OPENAI_API_KEY` | OpenAI GPT-4o-mini |
| `qwen/qwen-plus` | `DASHSCOPE_API_KEY` | 通义千问 |
| `claude-sonnet-4` | `ANTHROPIC_API_KEY` | Claude Sonnet 4 |
| `claude-3.5-haiku` | `ANTHROPIC_API_KEY` | Claude 3.5 Haiku |
| `gemini-flash-latest` | `GEMINI_API_KEY` | Google Gemini |
| `ollama/qwen2.5:7b` | 无需（本地） | Ollama 离线 |
| `ollama/llama3.2` | 无需（本地） | Ollama 离线 |

也支持自定义格式 `provider/model-name`。

## 速率控制（TaskQueue / RateController）

可通过初始化 `Orchestrator` 时传入 `rateControl`：

```js
{
  maxConcurrent: 2,
  requestsPerMinute: 10,
  pauseBetweenMs: 3000,
  quietHours: ["09:00-12:00", "14:00-18:00"]
}
```

- `maxConcurrent`：并发调用上限
- `requestsPerMinute`：每分钟请求上限
- `pauseBetweenMs`：请求间最小间隔
- `quietHours`：静默时段（自动等待）

## 数据目录建议

- 工作区：`/data/business`
- Wiki 产物：`/data/business/.LangWIKI`
- 系统目录：`/app/data`（容器内）

## 无向量检索

- `GET /api/langwiki/query` 使用关键词检索 `.LangWIKI` 文件。
- `POST /api/langwiki/ask` 基于命中文件片段生成回答，不依赖向量库。

## Docker 部署

```bash
# 设置 API Key
export DEEPSEEK_API_KEY=sk-your-key

docker compose up -d --build
```

启动 `langwiki` 服务（3100 端口），通过卷挂载管理业务数据和系统数据。
