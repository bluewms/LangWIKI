# LangWIKI 配置说明

## 环境变量

| 变量名 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3100` | 服务端口 |
| `NODE_ENV` | `development` | 运行环境 |
| `CORS_ORIGIN` | `*` | 跨域来源 |
| `ANYTHINGLLM_URL` | `http://localhost:3001` | AnythingLLM 地址（可选，独立模式可不配置） |
| `ANYTHINGLLM_API_KEY` | 空 | AnythingLLM API Key（可选） |
| `LANGWIKI_DATA_DIR` | `./data` | LangWIKI 系统目录 |
| `LANGWIKI_USERS_DIR` | `./data/users` | 用户档案目录 |

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

## 独立模式（无向量）

- 可仅启动 LangWIKI 后端与 `frontend` 前端，不需要 AnythingLLM。
- `GET /api/langwiki/query` 使用关键词检索 `.LangWIKI` 文件。
- `POST /api/langwiki/ask` 基于命中文件片段生成回答，不依赖向量库。

## Docker 关键点

- 组合模式：`langwiki` 与 `anythingllm` 共用 `business-data` 卷。
- 独立模式：只启动 `langwiki` 服务即可。
