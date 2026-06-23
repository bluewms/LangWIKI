# LangWIKI 前端设计上下文

> 本文档是前端美化的统一纲领，所有视觉变更应以本文档为准。
> 创建于 2026-06-23，对应 `frontend/` v0.1.0。

---

## 一、现状审计

### 技术栈
| 项 | 版本/方案 |
|---|---|
| 框架 | React 18.3 |
| 构建 | Vite 5.4 |
| 样式 | Tailwind CSS 3.4（原子类，无 UI 库） |
| 路由 | react-router-dom 6.26 |
| 状态 | localStorage + useState（无全局状态库） |
| 图标 | 无（用 `⌄ › ⚙ +` 等文本符号代替） |
| 字体 | Inter / 系统字体栈 |

### 页面清单（11 模块）
`Dashboard` `Query` `Entity` `Ingest` `Workspace` `WorkspaceSettings` `WorkspaceDoc` `Schema` `Profile` `UserSettings` `LlmSettings`

### 当前视觉风格
- **布局**：固定 320px 深色侧边栏 + 浅色主工作区（`bg-slate-100`）
- **卡片**：白底 + `rounded-xl` + `shadow-sm` + `border-slate-200`，层次单一
- **品牌色**：仅 `brand` 4 个色阶（50/100/500/700），不够用
- **按钮**：黑底/品牌蓝底/描边三种，无统一变体系统
- **输入框**：`border-slate-300` 描边，无 focus 态强化
- **动效**：几乎无过渡，交互反馈弱

### 待解决问题（美化重点）
1. ❌ 无设计令牌体系，颜色/间距/圆角散落各处
2. ❌ 无组件层（按钮、卡片、输入框样式重复且不一致）
3. ❌ 无图标系统，用文本符号凑数
4. ❌ 无加载骨架 / 空状态 / 错误边界
5. ❌ 侧边栏暗色与主区浅色割裂，无统一明暗节奏
6. ❌ 无数据可视化（Dashboard 仅纯文本数字）
7. ❌ 无响应式适配（固定 w-80 侧边栏）
8. ❌ 无过渡动效，操作反馈弱

---

## 二、设计目标与原则

### 目标
打造 **"知识工程师工作台"** 质感：专业、冷静、信息密度高但不压抑，强调可读性与操作效率。

### 设计原则
1. **内容优先**：装饰服务于信息层级，不为美观牺牲可读性
2. **克制色彩**：以中性灰为骨架，品牌蓝作焦点，状态色仅用于语义
3. **一致节奏**：间距走 4px 基线，圆角分三档，阴影分两档
4. **即时反馈**：所有可交互元素有 hover/active/focus/disabled 四态
5. **渐进披露**：复杂表单分组折叠，主操作突出

---

## 三、设计令牌（Design Tokens）

### 3.1 颜色体系

#### 中性色（slate 为基，扩展）
| Token | 值 | 用途 |
|---|---|---|
| `surface-base` | `#f8fafc` (slate-50) | 主工作区背景 |
| `surface-card` | `#ffffff` | 卡片背景 |
| `surface-raised` | `#ffffff` | 浮层/弹窗 |
| `surface-sidebar` | `#0f172a` (slate-900) | 侧边栏背景 |
| `surface-sidebar-hover` | `#1e293b` (slate-800) | 侧边栏 hover |
| `border-default` | `#e2e8f0` (slate-200) | 默认描边 |
| `border-strong` | `#cbd5e1` (slate-300) | 输入框描边 |
| `text-primary` | `#0f172a` (slate-900) | 主文字 |
| `text-secondary` | `#475569` (slate-600) | 次要文字 |
| `text-tertiary` | `#94a3b8` (slate-400) | 辅助/占位 |
| `text-on-dark` | `#e2e8f0` (slate-200) | 深色底文字 |

#### 品牌色（brand，补全 9 阶）
| Token | 值 | 用途 |
|---|---|---|
| `brand-50` | `#eff6ff` | 背景淡蓝 |
| `brand-100` | `#dbeafe` | 标签底 |
| `brand-200` | `#bfdbfe` | 边框淡蓝 |
| `brand-300` | `#93c5fd` | hover 态 |
| `brand-400` | `#60a5fa` | 次按钮 |
| `brand-500` | `#3b82f6` | 主品牌色（焦点） |
| `brand-600` | `#2563eb` | 主按钮 |
| `brand-700` | `#1d4ed8` | 主按钮 hover |
| `brand-800` | `#1e40af` | active |
| `brand-900` | `#1e3a8a` | 深色强调 |

#### 语义色
| Token | 值 | 语义 |
|---|---|---|
| `success` | `#16a34a` (green-600) | 成功/运行中 |
| `warning` | `#d97706` (amber-600) | 警告/待处理 |
| `danger` | `#dc2626` (red-600) | 错误/删除 |
| `info` | `#0891b2` (cyan-600) | 提示 |

### 3.2 字体
```css
font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
```

| 级别 | class | 大小/行高 | 字重 | 用途 |
|---|---|---|---|---|
| Display | `text-3xl` | 30/36 | 700 | Dashboard 大标题 |
| H1 | `text-2xl` | 24/32 | 600 | 页面标题 |
| H2 | `text-xl` | 20/28 | 600 | 区块标题 |
| H3 | `text-base` | 16/24 | 600 | 卡片标题 |
| Body | `text-sm` | 14/20 | 400 | 正文 |
| Caption | `text-xs` | 12/16 | 400 | 辅助/路径 |

### 3.3 间距（4px 基线）
`1=4px 2=8px 3=12px 4=16px 5=20px 6=24px 8=32px 10=40px 12=48px`

### 3.4 圆角
| Token | 值 | 用途 |
|---|---|---|
| `radius-sm` | `6px` (rounded-md) | 按钮、输入框、小标签 |
| `radius-md` | `10px` (rounded-[10px]) | 卡片、下拉 |
| `radius-lg` | `14px` (rounded-[14px]) | 大卡片、侧边栏项 |
| `radius-full` | `9999px` | 头像、pill 标签 |

### 3.5 阴影
| Token | 值 | 用途 |
|---|---|---|
| `shadow-card` | `0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)` | 卡片默认 |
| `shadow-card-hover` | `0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.06)` | 卡片 hover |
| `shadow-popover` | `0 8px 24px rgba(15,23,42,0.12)` | 弹窗/下拉 |

### 3.6 动效
| Token | 时长 | 曲线 | 用途 |
|---|---|---|---|
| `duration-fast` | 120ms | `ease-out` | 颜色/透明度 |
| `duration-normal` | 200ms | `ease-out` | 位移/缩放 |
| `duration-slow` | 300ms | `cubic-bezier(0.4,0,0.2,1)` | 折叠/展开 |

---

## 四、组件规范

### 4.1 按钮（Button）
统一变体，替换现有散落的按钮 className。

| 变体 | 背景 | 文字 | 边框 | 用途 |
|---|---|---|---|---|
| `primary` | `brand-600` | white | 无 | 主操作（问答、保存） |
| `secondary` | `slate-900` | white | 无 | 次操作（检索、首次扫描） |
| `outline` | transparent | `slate-700` | `slate-300` | 辅助操作（浏览、刷新） |
| `ghost` | transparent | `slate-600` | 无 | 工具栏按钮 |
| `danger` | transparent | `red-600` | `red-300` | 删除 |

**尺寸**：`sm`(h-8 px-3 text-xs) / `md`(h-9 px-4 text-sm) / `icon`(w-9 h-9)

**四态**：
- hover：背景加深一阶
- active：背景再深一阶 + `scale-[0.98]`
- focus：`ring-2 ring-brand-400 ring-offset-2`
- disabled：`opacity-50 cursor-not-allowed`

### 4.2 卡片（Card）
```
bg-white rounded-[14px] border border-slate-200 shadow-card
```
- hover 态（可交互卡片）：`shadow-card-hover border-slate-300`
- 卡片内 padding 统一 `p-5`，紧凑模式 `p-4`

### 4.3 输入框（Input）
```
w-full h-9 px-3 text-sm rounded-md
border border-slate-300 bg-white
placeholder:text-slate-400
focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none
transition duration-fast
```
- disabled：`bg-slate-50 text-slate-400 cursor-not-allowed`
- error：`border-red-400 focus:ring-red-100`

### 4.4 标签 / 徽章（Badge）
| 变体 | 背景 | 文字 |
|---|---|---|
| `neutral` | `slate-100` | `slate-600` |
| `brand` | `brand-50` | `brand-700` |
| `success` | `green-50` | `green-700` |
| `warning` | `amber-50` | `amber-700` |
| `danger` | `red-50` | `red-700` |

样式：`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium`

### 4.5 表格（Table）
- 表头：`bg-slate-50 text-xs text-slate-500 uppercase tracking-wide`
- 行：`border-t border-slate-100 hover:bg-slate-50/50`
- 单元格：`px-4 py-3 text-sm`

### 4.6 状态点（StatusDot）
圆点 + 文字，用于队列状态。
- running：`bg-green-500` + 脉冲动画
- pending：`bg-amber-500`
- completed：`bg-slate-400`
- error：`bg-red-500`

---

## 五、布局规范

### 5.1 整体框架
```
┌─────────────────────────────────────────┐
│  Sidebar (280px, slate-900)  │  Main    │
│                              │ (flex-1) │
│  - Logo                      │  p-8     │
│  - Workspace list            │          │
│  - File tree                 │  Page    │
│  - User card (bottom)        │  Content │
└─────────────────────────────────────────┘
```
- 侧边栏宽度从 320px 收窄至 **280px**，留更多主区空间
- 主区内边距 `p-8`（32px），最大内容宽 `max-w-6xl`

### 5.2 页面结构
```
PageHeader（标题 + 副标题 + 操作区）
  └─ Content（卡片堆叠 / 网格）
```

### 5.3 响应式断点
- `< 768px`：侧边栏改为抽屉，汉堡菜单触发
- `768-1024px`：侧边栏收窄至图标模式（64px）
- `> 1024px`：完整侧边栏

---

## 六、交互与体验规范

### 6.1 加载态
- 按钮：文字前加 spinner，文字改为"处理中..."
- 列表/卡片：**骨架屏**（`animate-pulse` + `bg-slate-100`）
- 全页：顶部 2px 进度条

### 6.2 空状态
插画位（暂用图标）+ 标题 + 说明 + 引导操作按钮。

### 6.3 反馈
| 场景 | 方案 |
|---|---|
| 操作成功 | 顶部 toast（绿色，3s 自动消失） |
| 操作失败 | 顶部 toast（红色，需手动关闭） |
| 危险操作 | `window.confirm` → 改为自定义 Modal |

### 6.4 过渡动效
- 路由切换：页面淡入（`fade-in 200ms`）
- 卡片 hover：阴影过渡（`duration-normal`）
- 折叠展开：高度 + 透明度（`duration-slow`）

---

## 七、图标方案

采用 **Lucide React**（轻量、tree-shaking 友好、风格统一）。
```bash
npm install lucide-react
```
替换现有文本符号：
- `⌄` → `ChevronDown`
- `›` → `ChevronRight`
- `⚙` → `Settings`
- `+` → `Plus`
- 队列状态 → `Activity` / `Pause` / `Play` / `RefreshCw`
- 查询 → `Search` / `MessageCircle`

---

## 八、美化路线图（分阶段）

### Phase 1：地基（设计令牌 + 基础组件）✅ 本次初始化
- [x] 扩展 `tailwind.config.js` 完整设计令牌
- [x] 更新 `index.css` 全局基础样式
- [x] 建立组件目录 `components/ui/`（Button/Card/Input/Badge）
- [ ] 安装 `lucide-react` 图标库

### Phase 2：骨架美化（布局 + 侧边栏 + Header）
- [ ] 侧边栏重构（280px、图标系统、工作区卡片化）
- [ ] 页面统一 PageHeader 组件
- [ ] ShellLayout 过渡动效

### Phase 3：核心页面重做
- [ ] Dashboard：数据卡片 + 状态点 + 进度条
- [ ] Query：双栏（输入 + 结果）、证据卡片
- [ ] Ingest：步骤式布局、目录浏览器优化
- [ ] Workspace/Settings：表单分组、Tab 切换

### Phase 4：体验打磨
- [ ] 骨架屏 + 空状态
- [ ] Toast 反馈系统
- [ ] 响应式适配
- [ ] 暗色模式（可选）

---

## 九、文件约定

```
frontend/src/
├── components/
│   ├── Layout/          # 布局（ShellLayout, Sidebar）
│   └── ui/              # 基础组件（Button, Card, Input, Badge...）
├── pages/langwiki/      # 业务页面
├── hooks/               # 业务 hook
├── models/              # API 层
└── index.css            # 全局样式 + 设计令牌
```

**规则**：
- 业务页面只使用 `components/ui/` 中的组件，不直接堆砌 Tailwind 原子类做按钮/卡片
- 设计令牌变更必须同步更新本文档 + `tailwind.config.js`
- 新增颜色/间距必须走令牌，禁止硬编码 hex

---

_本文档随项目演进持续更新，最后修改：2026-06-23_
