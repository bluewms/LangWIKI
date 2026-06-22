function buildUserPreferencePrompt(chatHistory, existingWiki, schemaContent) {
  const defaultUserSchema = `
## 关注点
- 沟通风格：简洁/详细、口语/书面
- 关注领域：经常查询哪类信息
- 常用操作：最频繁的操作模式
- 决策偏好：做决定时最看重的因素

## 提取规则
1. 只记录反复出现的行为模式
2. 推断的信息标注 [推断]
3. 不记录敏感个人信息
4. 偏好权重：反复出现 > 单次表达
`.trim();

  const schema = schemaContent || defaultUserSchema;

  return `你是一个用户偏好分析助手。请从以下聊天记录中提取用户的沟通偏好和使用习惯。

## 已有用户档案
${existingWiki || '（首次分析）'}

## 提取规则（来自 users/_schema.md）
${schema}

## 最近聊天记录
${chatHistory}

## 输出要求
为每个 AUTO 区块生成更新内容：
<!-- AUTO:PREFERENCES --> ... <!-- /AUTO:PREFERENCES -->
<!-- AUTO:CONTEXT --> ... <!-- /AUTO:CONTEXT -->
<!-- AUTO:EXPERTISE --> ... <!-- /AUTO:EXPERTISE -->

只输出需要更新的区块，不需要更新的区块不要输出。`;
}

module.exports = {
  buildUserPreferencePrompt
};