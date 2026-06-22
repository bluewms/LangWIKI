# LangWIKI

LangWIKI 是知识编译服务：扫描业务目录文件，提取事件并生成结构化 Wiki。内置多 LLM 路由和多种文档格式解析，无需外部依赖即可独立运行。

## 核心能力

- 目录扫描与状态管理（`.LangWIKI/entities/*`）
- 多格式文件解析：txt/md/pdf/image-OCR/xlsx/csv/eml/**docx/pptx**/代码文件
- **多 LLM 路由**（6 类 provider，对标 knowledge-catalog 扩展能力）：
  - DeepSeek（国内可用，推荐默认）
  - OpenAI GPT 系列
  - 通义千问（OpenAI 兼容）
  - Anthropic Claude
  - Google Gemini
  - Ollama 本地模型（完全离线）
- LLM 事件提取与 AUTO 区块渲染
- 队列调度与速率控制（暂停/恢复/优先级）
- 原生定时调度器（node-cron，无需外部服务）
- Schema 自更新建议机制
- 用户档案提取与上下文注入接口
- API 聚合路由 `/api/langwiki/*`
- 无向量检索与问答（`/api/langwiki/query`、`/api/langwiki/ask`）
- 前端骨架（`frontend/src/components/hooks/models/pages`）

## 快速开始

```bash
npm install

# 配置 LLM（以 DeepSeek 为例）
export DEEPSEEK_API_KEY=sk-your-key
export LLM_MODEL=deepseek/deepseek-chat

npm start
```

服务默认启动在 `http://localhost:3100`。

前端独立启动：

```bash
cd frontend
npm install
npm run dev
```

前端默认地址：`http://localhost:5173`（开发期通过 Vite 代理转发 `/api` 到 3100）。

### 健康检查

- `GET /health`
- `GET /api/langwiki/health`

## LLM 配置

LangWIKI 通过 `LLM_MODEL` 环境变量选择模型，通过对应 API Key 环境变量认证：

| 模型 | 环境变量 | 说明 |
|---|---|---|
| `deepseek/deepseek-chat` | `DEEPSEEK_API_KEY` | DeepSeek Chat（国内可用，推荐） |
| `deepseek/deepseek-reasoner` | `DEEPSEEK_API_KEY` | DeepSeek R1 推理模型 |
| `openai/gpt-4o` | `OPENAI_API_KEY` | OpenAI GPT-4o |
| `openai/gpt-4o-mini` | `OPENAI_API_KEY` | OpenAI GPT-4o-mini |
| `qwen/qwen-plus` | `DASHSCOPE_API_KEY` | 通义千问 |
| `claude-sonnet-4` | `ANTHROPIC_API_KEY` | Claude Sonnet 4 |
| `claude-3.5-haiku` | `ANTHROPIC_API_KEY` | Claude 3.5 Haiku |
| `gemini-flash-latest` | `GEMINI_API_KEY` | Google Gemini |
| `ollama/qwen2.5:7b` | 无需（本地） | Ollama 离线模型 |
| `ollama/llama3.2` | 无需（本地） | Ollama 离线模型 |

也支持自定义格式 `provider/model-name`，例如 `openai/my-fine-tuned-model`。

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

```bash
# 设置 API Key（按所选模型配置）
export DEEPSEEK_API_KEY=sk-your-key

docker compose up -d --build
```

启动 `langwiki` 服务（3100 端口），通过卷挂载管理业务数据和系统数据。

## 技术架构

```
src/
├── llm/                    # 多 LLM 路由层
│   ├── router.js           # 模型预设 + 路由（对标 llm_support.py）
│   ├── client.js           # LlmClient 统一入口
│   ├── direct.js           # 向后兼容导出
│   └── providers/          # Provider 实现
│       ├── openai_compat.js  # OpenAI/DeepSeek/通义千问/Ollama
│       ├── anthropic.js      # Claude
│       └── gemini.js         # Gemini
├── parser/                # 文档解析层
│   ├── index.js           # 格式路由（16+ 种格式）
│   ├── pdf.js             # PDF 解析
│   ├── image.js           # 图片 OCR
│   ├── spreadsheet.js     # Excel/CSV
│   ├── email.js           # 邮件
│   ├── word.js            # Word (.docx)
│   └── pptx.js            # PowerPoint (.pptx)
├── orchestrator/          # 编排器
├── extractor/             # 事件提取 + Wiki 生成
├── scheduler/             # 原生定时调度（node-cron）
├── wiki/                  # Wiki 产物管理
├── workspace/             # 工作区扫描与状态
├── routes/                # API 路由
└── config.js              # 配置
```

更多说明见 `docs/`。
