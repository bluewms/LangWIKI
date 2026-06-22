# LangWIKI Frontend（AnythingLLM 风格裁剪版）

该前端沿用 AnythingLLM 常见信息架构思路（侧边导航 + 主工作区），但当前仅保留与 LangWIKI 直接相关的模块。

## 已落地页面（第一阶段）

- `/langwiki/dashboard`：总览（队列状态）
- `/langwiki/query`：查询与问答（无向量）
- `/langwiki/workspaces`：工作区创建/切换
- `/langwiki/workspace/:id`：工作区详情入口（复用工作区管理页）
- `/langwiki/ingest`：Ingest 控制（初扫、实体触发、暂停/恢复）
- `/langwiki/schema`：Schema 编辑 + 建议处理
- `/langwiki/profile`：用户画像（context/wiki 查看 + profile 更新）
- `/langwiki/entity/:name`：实体 Wiki 查看

## 已保留控件映射

- **工作区管理** -> `/api/langwiki/workspaces`
- **查询问答** -> `/api/langwiki/query`、`/api/langwiki/ask`
- **实体 Wiki** -> `/api/langwiki/entities/:name/wiki`
- **Ingest 控制** -> `/api/langwiki/ingest/*`
- **Schema 管理** -> `/api/langwiki/schema*`
- **用户画像** -> `/api/langwiki/users/:username/*`

## 暂不启用控件（后续可选）

- Embedding / VectorDB 配置
- Agent / MCP 管理
- Members / RBAC 管理台
- Community / Mobile / Browser Extension

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```
