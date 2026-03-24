# Release Reference

在 `P5 / P6 / P7` 读取本文件。

## P5 验证目标

- 用当前证据证明改动真的成立
- 生成完整 `Release Handoff`
- 明确发布路径、smoke checks、rollback

## P5 验证清单

按改动范围选择：
- 测试
- build
- lint
- 安全检查
- 设计审查
- 无障碍审计
- 性能检查
- metadata 检查

只允许引用**刚跑完**的命令与结果，不允许写“应该通过”。

## Release Handoff 模板

```markdown
### Release Handoff
- Task:
- Base branch:
- Current branch:
- HEAD SHA:
- Working tree status:
- Change summary:
- Validation evidence:
  - test:
  - build:
  - lint:
  - other:
- Release path:
- Release constraints:
- Production smoke checks:
  1. <check>
  2. <check>
- Rollback:
- Known risks / open concerns:
```

规则：
- 不允许留空
- 不适用时写 `N/A: <reason>`
- smoke checks 必须可直接执行或可直接照做
- rollback 必须明确到命令或回滚点

## P6 Release 对接

默认：
- 调 `/codex release`
- 先读 handoff，再走 repo 的真实发布路径

Codex 必须先检查：
- handoff 字段完整
- repo 当前状态和 handoff 一致
- 发布路径与 branch protection/CI/deploy 规则匹配

### degraded-release 条件

只有以下条件全部成立时允许：
1. 低风险个人 repo，或 repo policy 明确允许
2. handoff 完整
3. Claude 能自己完成标准发布流程

执行时必须在结果里明确标记 `degraded-release`。

## P7 Production Verify

至少验证：
- deploy 已完成
- production URL 可访问
- 核心 smoke test 通过
- bug 修复时重走用户原始失败路径
- 如有 success criteria，逐条对照

如果使用 E2E 或浏览器级功能验证：
- 必须覆盖“操作 → 结果变化”
- 不能只检查元素存在、页面打开、或接口 200
- 按钮必须点击，交互必须验证点击后的状态变化

## 证据规则

以下都不算证据：
- 旧输出
- 外部 agent 的口头报告
- “看起来可以”
- build 通过但未覆盖实际改动点
