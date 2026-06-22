const defaultSchema = `
## 业务关注点
- 收款记录：金额、日期、是否到账
- 合同信息：金额、有效期、关键条款
- 风险信号：逾期、纠纷、信用下降

## 提取规则
1. 金额必须包含币种和数值
2. 日期统一为 YYYY-MM-DD 格式
3. 同一事件不重复提取
4. 无法确定的信息标注 [待确认]

## 输出格式
JSON 数组
`.trim();

function buildExtractionPrompt(fileText, fileName, entityName, schemaContent) {
  return `你是一个业务事件提取助手。请从以下文件内容中提取所有业务相关事件。

## 实体名称
${entityName}

## 文件名称
${fileName}

## 文件内容
${fileText}

## 提取规则和关注点（来自 schema.md，优先遵循）
${schemaContent || defaultSchema}

## 输出格式
请以 JSON 数组格式输出：
[{"event_type":"...","party":"...","amount":0,"currency":"CNY","voucher_no":"...","event_date":"YYYY-MM-DD","description":"..."}]`;
}

function buildSummaryPrompt(entityName, events, existingWiki, schemaContent) {
  return `你是一个 Wiki 摘要生成助手。请根据事件列表为实体生成 AUTO 区块。

## 实体名称
${entityName}

## schema 规则
${schemaContent || defaultSchema}

## 事件数据
${JSON.stringify(events, null, 2)}

## 现有 Wiki
${existingWiki || '（首次生成）'}

## 输出要求
仅输出需要更新的区块，格式如下：
<!-- AUTO:SUMMARY -->\n...\n<!-- /AUTO:SUMMARY -->
<!-- AUTO:TIMELINE -->\n...\n<!-- /AUTO:TIMELINE -->
<!-- AUTO:PAYMENTS -->\n...\n<!-- /AUTO:PAYMENTS -->
<!-- AUTO:RISKS -->\n...\n<!-- /AUTO:RISKS -->`;
}

module.exports = {
  defaultSchema,
  buildExtractionPrompt,
  buildSummaryPrompt
};