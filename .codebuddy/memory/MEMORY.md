# LangWIKI 项目长期记忆

## 项目概况
LangWIKI 是知识编译服务：扫描业务目录文件，提取事件并生成结构化 Wiki。
- 后端：Node.js + Express，端口 3100，多 LLM 路由（DeepSeek/OpenAI/通义/Claude/Gemini/Ollama）
- 前端：React 18 + Vite 5 + Tailwind 3，端口 5173，11 个业务页面
- 部署：Docker Compose

## 前端设计规范（2026-06-23 建立）
- 设计文档：`frontend/DESIGN_CONTEXT.md`（美化纲领，所有视觉变更以此为准）
- 设计令牌：tailwind.config.js（brand 9 阶、surface 色板、自定义阴影/圆角/动效）
- 组件层：`src/components/ui/`（Button/Card/Input/Badge/StatusDot/PageHeader/Skeleton/EmptyState）
- 全局样式：`src/index.css`（@layer components 定义 .btn/.card/.input/.badge 等组件类）
- 图标库：lucide-react
- 原则：业务页面只用 ui 组件，不堆砌原子类；设计变更必须同步更新文档 + 配置
- 美化路线：Phase 1 地基(已完成) → Phase 2 骨架 → Phase 3 页面重做 → Phase 4 体验打磨

## 前端架构
- 路由：`/langwiki/*` 前缀，ShellLayout(侧边栏+主区) 包裹
- 状态：localStorage 持久化 activeWorkspace/userProfile，无全局状态库
- API 层：`src/models/langwiki.js` 统一封装 fetch
- 工作区模型：`src/models/workspaceState.js` 管理 active workspace + 事件通知
