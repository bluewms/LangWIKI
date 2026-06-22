# LangWIKI Workspace & Ingest 改造实施计划（已执行回写）

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成工作区自动化管理、Ingest 扫描目录可选、Git 同步配置以及工作区删除与知识库文件清理能力，并确保前后端与容器环境一致可用。

**Architecture:** 后端以 `workspaces.json` 为工作区注册中心，统一管理 `id/name/rootDir/sourceDir/git`；Ingest 路由支持“输入目录（sourceDir）与输出目录（workspace rootDir）解耦”。前端以工作区设置页为主入口，侧栏展示工作区并通过事件机制在新增/更新/删除后实时刷新。

**Tech Stack:** Node.js + Express（后端路由与编排器）、React + Vite（前端页面与状态）、Docker Compose（容器化验收）

---

## 变更摘要

- 工作区创建支持自动生成 `ws-xxx` 与系统目录，无需强制手填 `id/rootDir`。
- 工作区支持配置 `name`（左侧展示名）、`sourceDir`（扫描源目录）和 `git`（enabled/remoteUrl/branch）。
- Ingest 支持输入目录与输出目录分离：扫描来自 `sourceDir`，Markdown 输出到工作区 `rootDir`。
- 工作区设置页增加“删除工作区”按钮和不可恢复警告；删除时可清理工作区相关知识库文件。
- 修复删除后的侧栏刷新问题：新增工作区变更事件通知与监听，确保左侧列表即时同步。

---

### Task 1: 工作区自动 ID/目录与设置模型升级

**Status:** ✅ 已完成

**Files:**
- Modify: `src/routes/workspace.js`
- Modify: `frontend/src/models/langwiki.js`
- Modify: `frontend/src/pages/langwiki/Workspace/index.jsx`
- Modify: `frontend/src/components/Layout/Sidebar.jsx`
- Test: `tests/routes/langwiki.test.js`

**Step 1:** 后端 `POST /workspaces` 支持自动生成 `id/rootDir` 与默认 `name`。
**Step 2:** 后端 `PATCH /workspaces/:id` 支持更新 `name/sourceDir/git`。
**Step 3:** 前端工作区设置页改为可编辑 `name/sourceDir/git`。
**Step 4:** 左侧工作区展示名称改为 `name` 优先。
**Step 5:** 测试覆盖自动创建与设置更新场景。

### Task 2: Ingest 输入输出目录解耦

**Status:** ✅ 已完成

**Files:**
- Modify: `src/routes/orchestrate.js`
- Modify: `src/orchestrator/index.js`
- Modify: `frontend/src/pages/langwiki/Ingest/index.jsx`
- Modify: `frontend/src/models/langwiki.js`
- Test: `tests/routes/langwiki.test.js`

**Step 1:** 扩展 ingest 接口接收 `rootDir`（输入）与 `outputRootDir`（输出）。
**Step 2:** 编排器将扫描路径与写入路径分离处理。
**Step 3:** 前端 Ingest 页支持目录浏览选择并绑定 `sourceDir`。
**Step 4:** 测试覆盖 `scheduleManualIngest(rootDir, entityName, { outputRootDir })`。

### Task 3: 工作区删除与知识库文件清理

**Status:** ✅ 已完成

**Files:**
- Modify: `src/routes/workspace.js`
- Modify: `frontend/src/models/langwiki.js`
- Modify: `frontend/src/pages/langwiki/Workspace/index.jsx`
- Test: `tests/routes/langwiki.test.js`

**Step 1:** 新增 `DELETE /api/langwiki/workspaces/:id?deleteFiles=true`。
**Step 2:** 删除工作区注册信息，同时清理 `.LangWIKI`；若为系统托管目录则删除工作区目录。
**Step 3:** 前端增加删除按钮、二次确认与风险警告文案。
**Step 4:** 回归测试验证删除后注册表与文件清理结果。

### Task 4: 删除后侧栏同步刷新修复

**Status:** ✅ 已完成

**Files:**
- Modify: `frontend/src/models/workspaceState.js`
- Modify: `frontend/src/components/Layout/Sidebar.jsx`
- Modify: `frontend/src/pages/langwiki/Workspace/index.jsx`

**Step 1:** 增加 `notifyWorkspacesChanged` 与 `onWorkspacesChanged` 事件机制。
**Step 2:** 在工作区新增/保存/删除后广播事件。
**Step 3:** `Sidebar` 监听事件并重新拉取工作区列表。

---

## 验证记录（本轮）

- 后端测试：`npm test -- tests/routes/langwiki.test.js tests/routes/query.test.js` ✅
- 前端构建：`cd frontend && npm run build` ✅
- 容器验收：`docker compose -f docker-compose.standalone.yml up -d --build` ✅
- 接口抽样：创建工作区 → 删除工作区 → 列表不再包含该 ID（`LIST_HAS_ID:0`）✅

---

## 后续可选增强（未执行）

1. 删除确认弹窗展示“将被删除的目录路径”以降低误删风险。
2. Git 同步增加“测试连接/手动同步”按钮与状态反馈。
3. Ingest 增加最近扫描目录历史与快速回填。
