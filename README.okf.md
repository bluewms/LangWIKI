---
type: Project
title: LangWIKI
description: 知识编译服务，扫描业务目录文件提取事件并生成结构化 Wiki
tags: [knowledge-management, wiki-generation, llm, anythingllm, api]
timestamp: 2026-06-21T18:14:00Z
resource: ./README.md
---

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

### 后端启动

```bash
npm install
npm start
```

服务默认启动在 `http://localhost:3100`。

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端默认地址：`http://localhost:5173`（开发期通过 Vite 代理转发 `/api` 到 3100）。

## 健康检查

- `GET /health`
- `GET /api/langwiki/health`

## 主要 API

### Ingest API

目录扫描与知识提取：

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/langwiki/ingest/trigger` | `POST` | 触发增量扫描 |
| `/api/langwiki/ingest/initial` | `POST` | 触发全量初始扫描 |
| `/api/langwiki/ingest/status` | `GET` | 获取扫描状态 |
| `/api/langwiki/ingest/pause` | `POST` | 暂停扫描队列 |
| `/api/langwiki/ingest/resume` | `POST` | 恢复扫描队列 |

### Knowledge API

知识查询与检索：

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/langwiki/entities` | `GET` | 获取所有实体列表 |
| `/api/langwiki/entities/:name/wiki` | `GET` | 获取指定实体的 Wiki 知识 |
| `/api/langwiki/entities/:name/wiki` | `PUT` | 更新指定实体的 Wiki 知识 |
| `/api/langwiki/query?q=关键词` | `GET` | 无向量关键词检索 |
| `/api/langwiki/ask` | `POST` | 问答接口（LLM 生成回答） |

### Schema API

Schema 管理与自动更新建议：

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/langwiki/schema` | `GET` | 获取当前 Schema |
| `/api/langwiki/schema` | `PUT` | 更新 Schema |
| `/api/langwiki/schema/suggestions` | `GET` | 获取 Schema 更新建议 |
| `/api/langwiki/schema/suggestions/:id/adopt` | `POST` | 采纳指定建议 |
| `/api/langwiki/schema/suggestions/:id/ignore` | `POST` | 忽略指定建议 |

### User API

用户档案提取与上下文注入：

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/langwiki/users/:username/wiki` | `GET` | 获取用户 Wiki 档案 |
| `/api/langwiki/users/:username/profile` | `PUT` | 更新用户档案 |
| `/api/langwiki/users/:username/context` | `GET` | 获取用户上下文（用于注入 LLM） |
| `/api/langwiki/users/:username/extract` | `POST` | 触发用户档案提取 |

### Workspace API

工作空间管理：

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/langwiki/workspaces` | `GET` | 获取所有工作空间 |
| `/api/langwiki/workspaces` | `POST` | 创建新工作空间 |

## Docker 部署

### 组合模式（LangWIKI + AnythingLLM）

同时启动 LangWIKI 和 AnythingLLM，通过共享卷共享业务目录与 `.LangWIKI` 产物。

```bash
docker compose up -d --build
```

启动的服务：
- `langwiki`（端口 3100）
- `anythingllm`（端口 3001）

共享卷：`business-data`

### 独立模式（仅 LangWIKI，无向量）

仅启动 LangWIKI，适用于不需要向量检索的场景。

```bash
docker compose -f docker-compose.standalone.yml up -d --build
```

启动的服务：
- `langwiki-standalone`（端口 3100）

## 相关文档

- [Getting Started Guide](./docs/getting-started.md)
- [Configuration Guide](./docs/configuration.md)
- [OKF Knowledge Bundle](./.okf/index.md) - 结构化知识捆绑包

# Citations

[1] [Original README.md](./README.md) - 本文档的源文档
[2] [OKF Specification v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) - Open Knowledge Format 规范
