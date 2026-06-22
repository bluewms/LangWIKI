# LangWIKI

LangWIKI 是知识编译服务：扫描业务目录文件，提取事件并生成结构化 Wiki。它既可独立运行（无向量模式），也可与 AnythingLLM 组合使用（由 AnythingLLM 消费 Wiki 做嵌入/对话）。

## 核心能力

- 目录扫描与状态管理（`.LangWIKI/entities/*`）
- 多格式文件解析（txt/pdf/image/xlsx/csv/eml）
- LLM 事件提取与 AUTO 区块渲染
- 队列调度与速率控制（暂停/恢复/优先级）
- Schema 自更新建议机制
- 用户档案提取与上下文注入接口
- API 聚合路由 `/api/langwiki/*`
- 无向量检索与问答（`/api/langwiki/query`、`/api/langwiki/ask`）
- Anything 风格前端骨架（`frontend/src/components/hooks/models/pages`）

## 快速开始

```bash
npm install
npm start
```

服务默认启动在 `http://localhost:3100`。

前端独立启动（Anything 风格目录骨架）：

```bash
cd frontend
npm install
npm run dev
```

前端默认地址：`http://localhost:5173`（开发期通过 Vite 代理转发 `/api` 到 3100）。

### 健康检查

- `GET /health`
- `GET /api/langwiki/health`

## 主要 API

- Ingest：
  - `POST /api/langwiki/ingest/trigger`
  - `POST /api/langwiki/ingest/initial`
  - `GET /api/langwiki/ingest/status`
  - `POST /api/langwiki/ingest/pause`
  - `POST /api/langwiki/ingest/resume`
- Knowledge：
  - `GET /api/langwiki/entities`
  - `GET /api/langwiki/entities/:name/wiki`
  - `PUT /api/langwiki/entities/:name/wiki`
  - `GET /api/langwiki/query?q=关键词`
  - `POST /api/langwiki/ask`
- Schema：
  - `GET /api/langwiki/schema`
  - `PUT /api/langwiki/schema`
  - `GET /api/langwiki/schema/suggestions`
  - `POST /api/langwiki/schema/suggestions/:id/adopt`
  - `POST /api/langwiki/schema/suggestions/:id/ignore`
- User：
  - `GET /api/langwiki/users/:username/wiki`
  - `PUT /api/langwiki/users/:username/profile`
  - `GET /api/langwiki/users/:username/context`
  - `POST /api/langwiki/users/:username/extract`
- Workspace：
  - `GET /api/langwiki/workspaces`
  - `POST /api/langwiki/workspaces`

## Docker 部署

### 组合模式（LangWIKI + AnythingLLM）

```bash
docker compose up -d --build
```

默认会启动：
- `langwiki`（3100）
- `anythingllm`（3001）

并通过共享卷 `business-data` 共享业务目录与 `.LangWIKI` 产物。

### 独立模式（仅 LangWIKI，无向量）

```bash
docker compose -f docker-compose.standalone.yml up -d --build
```

默认只启动：
- `langwiki-standalone`（3100）

更多说明见：
- `docs/getting-started.md`
- `docs/configuration.md`
