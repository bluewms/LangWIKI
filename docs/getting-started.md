# LangWIKI 快速开始

## 1. 环境准备

- Node.js >= 18
- npm >= 9
- （可选）Docker / Docker Compose

## 2. 本地启动

```bash
cp .env.example .env
npm install
npm start
```

默认端口：`3100`

## 3. 创建工作区并触发扫描

```bash
curl -X POST http://localhost:3100/api/langwiki/workspaces \
  -H 'Content-Type: application/json' \
  -d '{"id":"客户资料","name":"客户资料","rootDir":"/data/business"}'

curl -X POST http://localhost:3100/api/langwiki/ingest/initial \
  -H 'Content-Type: application/json' \
  -d '{"rootDir":"/data/business"}'
```

## 4. 查看任务状态

```bash
curl http://localhost:3100/api/langwiki/ingest/status
```

## 5. 目录产物说明

执行后会在工作区根目录生成：

- `.LangWIKI/index.md`
- `.LangWIKI/log.md`
- `.LangWIKI/schema.md`
- `.LangWIKI/entities/<实体名>/<实体名>-wiki.md`
- `.LangWIKI/entities/<实体名>/state.json`
- `.LangWIKI/entities/<实体名>/events.jsonl`

## 6. 无向量检索与问答

```bash
curl "http://localhost:3100/api/langwiki/query?q=合同金额"

curl -X POST http://localhost:3100/api/langwiki/ask \
  -H 'Content-Type: application/json' \
  -d '{"question":"富士康合同金额是多少？"}'
```

## 7. 启动前端（Anything 风格架构）

```bash
cd frontend
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 8. 使用 Docker（独立模式）

```bash
docker compose -f docker-compose.standalone.yml up -d --build
```

停止：

```bash
docker compose -f docker-compose.standalone.yml down
```

## 9. 运行测试

```bash
npm test
```
