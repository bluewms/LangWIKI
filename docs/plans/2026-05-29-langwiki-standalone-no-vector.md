# LangWIKI Standalone No-Vector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不依赖向量数据库的前提下，让 LangWIKI 可独立提供 Wiki 检索与问答，并保持 AnythingLLM 风格前端架构。

**Architecture:** 后端新增基于 `.LangWIKI` 文件层的关键词检索与证据片段聚合接口；问答接口只基于命中文档片段拼接上下文给 LLM。前端在 `frontend/` 内按 AnythingLLM 常见分层（`components/hooks/models/pages/utils`）建立路由与页面骨架并接入新 API。

**Tech Stack:** Node.js + Express（后端）；React + Vite + Tailwind（前端骨架，Anything 风格目录）

---

### Task 1: 无向量检索服务

**Files:**
- Create: `src/search/index.js`
- Modify: `src/routes/knowledge.js`
- Test: `tests/routes/query.test.js`

**Step 1:** 写失败测试，覆盖关键词查询、实体过滤、证据返回。
**Step 2:** 运行测试确认失败。
**Step 3:** 实现 `searchWiki`（扫描 `.LangWIKI/entities/*-wiki.md`、`index.md`、`log.md`）。
**Step 4:** 增加 `GET /api/langwiki/query` 路由。
**Step 5:** 跑测试确认通过。

### Task 2: 无向量问答接口

**Files:**
- Modify: `src/routes/knowledge.js`
- Test: `tests/routes/query.test.js`

**Step 1:** 写失败测试，覆盖 `POST /api/langwiki/ask` 输入 question 并返回 answer + evidence。
**Step 2:** 运行测试确认失败。
**Step 3:** 用 `searchWiki` 命中片段拼 prompt，调用 `llmClient.chat`。
**Step 4:** 跑测试确认通过。

### Task 3: Anything 风格前端骨架升级

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/components/Layout/*`
- Create: `frontend/src/models/langwiki.js`
- Create: `frontend/src/hooks/useLangwikiQuery.js`
- Create: `frontend/src/pages/langwiki/*`

**Step 1:** 建立基础工程与目录结构（贴近 Anything 风格）。
**Step 2:** 建立 `/langwiki/dashboard`、`/langwiki/query`、`/langwiki/entity/:name` 页面。
**Step 3:** 将查询页面接到 `GET /api/langwiki/query` 与 `POST /api/langwiki/ask`。
**Step 4:** 手工检查页面可启动（不要求完整视觉一致）。

### Task 4: 文档更新

**Files:**
- Modify: `README.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/configuration.md`

**Step 1:** 增加“无向量独立模式”说明。
**Step 2:** 补充查询/问答 API 示例。
**Step 3:** 补充前端运行说明（`frontend` 独立启动）。
