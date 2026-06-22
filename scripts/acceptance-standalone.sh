#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3100}"
WORKSPACE_ID="${WORKSPACE_ID:-验收工作区}"
ROOT_DIR="${ROOT_DIR:-/data/business}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

LAST_CODE=""
LAST_BODY=""

log() {
  echo "[LangWIKI Acceptance] $*"
}

request() {
  local method="$1"
  local endpoint="$2"
  local body="${3:-}"
  local out_file="$TMP_DIR/response.json"

  if [[ -n "$body" ]]; then
    LAST_CODE=$(curl -sS -o "$out_file" -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      --data "$body" \
      "$BASE_URL$endpoint")
  else
    LAST_CODE=$(curl -sS -o "$out_file" -w "%{http_code}" -X "$method" \
      "$BASE_URL$endpoint")
  fi

  LAST_BODY="$(cat "$out_file")"
}

expect_http_2xx() {
  local code="$1"
  local step="$2"
  case "$code" in
    2*) ;;
    *)
      log "❌ ${step} 失败，HTTP=$code"
      [[ -n "$LAST_BODY" ]] && echo "$LAST_BODY"
      exit 1
      ;;
  esac
}

wait_for_health() {
  local retries=40
  local delay=2
  local i

  i=1
  while [[ $i -le $retries ]]; do
    if curl -fsS "$BASE_URL/health" > /dev/null 2>&1; then
      log "✅ 服务已就绪"
      return 0
    fi
    sleep "$delay"
    i=$((i + 1))
  done

  log "❌ 服务未在预期时间内就绪：$BASE_URL/health"
  exit 1
}

log "准备测试数据目录"
mkdir -p "$PROJECT_DIR/data/business"
mkdir -p "$PROJECT_DIR/data/system"
cat > "$PROJECT_DIR/data/business/acceptance-demo.txt" <<'EOF'
客户：富士康
合同金额：120 万
签约日期：2026-05-29
备注：用于独立模式验收脚本
EOF

log "等待服务健康检查"
wait_for_health

log "检查 /api/langwiki/health"
request "GET" "/api/langwiki/health"
expect_http_2xx "$LAST_CODE" "API 健康检查"
echo "$LAST_BODY" | grep -q "ok" || {
  log "❌ API 健康检查返回缺少 ok 字段"
  echo "$LAST_BODY"
  exit 1
}
log "✅ API 健康检查通过"

log "注册工作区"
request "POST" "/api/langwiki/workspaces" "{\"id\":\"$WORKSPACE_ID\",\"name\":\"$WORKSPACE_ID\",\"rootDir\":\"$ROOT_DIR\"}"
expect_http_2xx "$LAST_CODE" "工作区注册"
log "✅ 工作区注册通过"

log "触发首次扫描"
request "POST" "/api/langwiki/ingest/initial" "{\"rootDir\":\"$ROOT_DIR\"}"
expect_http_2xx "$LAST_CODE" "首次扫描触发"
log "✅ 首次扫描已触发"

sleep 2

log "检查 ingest 状态"
request "GET" "/api/langwiki/ingest/status"
expect_http_2xx "$LAST_CODE" "读取 ingest 状态"
log "✅ ingest 状态可访问"

log "执行无向量 query"
request "GET" "/api/langwiki/query?q=acceptance"
expect_http_2xx "$LAST_CODE" "query 接口"
log "✅ query 接口可访问"

log "执行无向量 ask"
request "POST" "/api/langwiki/ask" "{\"question\":\"富士康合同金额是多少？\"}"
expect_http_2xx "$LAST_CODE" "ask 接口"
echo "$LAST_BODY" | grep -q "answer" || {
  log "❌ ask 返回中未发现 answer 字段"
  echo "$LAST_BODY"
  exit 1
}
log "✅ ask 接口可访问并返回 answer"

log "🎉 验收通过：独立模式核心接口工作正常"
