---
name: super-dev-pipeline
description: "双代理开发 Pipeline：Claude Code 负责需求/设计/实现/验证，Codex 负责独立 code review 与发布上线。根据任务规模自动选择入口，自动启用 sidecar skills，并在需要时加载 TDD / DEBUG / RELEASE / STATE references。"
---

# Dev Pipeline

**每次开发任务自动执行，不需要用户手动触发。**

```
P1 产品设计（Claude） → P2 UI/UX 设计（Claude） → P3 实现计划（Claude） → P4a 编码实现（Claude）
                                                                                 ↓
                                                                      P4b Code Review（Codex）
                                                                                 ↓
                                                                       P5 验证检查（Claude）
                                                                                 ↓
                                                                       P6 发布上线（默认 Codex）
                                                                                 ↓
                                                                       P7 上线验证（默认 Codex）
                                                                                 ↓
                                                                       P8 自我进化
```

## 与 CLAUDE.md 的分工

- `CLAUDE.md` 放 always-loaded 全局护栏：证据、功能验证、用户纠正后先 evolve、跨页面旅程检查等
- 本 skill 只放本次任务的流程路由、阶段门禁、Claude/Codex 分工
- 长模板与细节说明放 `references/`，按阶段需要时再读

## 执行分工

- **Claude Code 负责 P1、P2、P3、P4a、P5**
- **Codex 负责 P4b、P6、P7**
- Codex 在 review / release 中发现产品代码问题，只能打回 Claude，不吸收 feature scope
- 默认先按双代理流程走；只有在本 skill 明确允许时才走降级路径

## 按阶段加载的参考文件

只在需要时读取对应文件，不要一次全读：

| 阶段 | 何时读 | 文件 |
|------|--------|------|
| P4a 路径 A | 新功能 / 中大改动 / 需要测试先行 | `references/TDD.md` |
| P4a 路径 B | bug 修复 / 根因不明 / 线上问题 | `references/DEBUG.md` |
| P5-P7 | 做发布前验证、handoff、release、prod verify | `references/RELEASE.md` |
| 恢复 / 批量任务 / hooks | 需要断点恢复、auto-loop、状态文件 | `references/STATE.md` |

## Auto Sidecars

sidecar 是 pipeline 自动调用的具体 skill，不需要用户记命令。

| 能力 | 优先 skill | 自动启用条件 | fallback |
|------|------------|--------------|----------|
| 六问需求拷问 | `/office-hours` | 新项目 / 新产品 / 需求高度模糊 | 在 P1 直接执行六问框架 |
| Scope Lock | `/freeze` | bug 修复且改动应局限在 1-2 个模块 | 用计划文件或首个故障模块做软边界 |
| Safety Mode | `/careful` | 破坏性命令、生产操作、回滚、推主分支前 | 执行前人工安全复核 |
| Structured Debug | `/investigate` | 根因不明、线上独有、auth/payment/data 问题、两次假设失败后 | 走 `references/DEBUG.md` 的结构化流程 |
| Codex Review | `/codex review` | 中/大改动进入 P4b | 中风险可降级 `code-reviewer`；高风险/shared repo 默认阻塞 |
| Codex Release | `/codex release` | 进入 P6/P7 且 repo 需要独立发布 gate | 低风险个人 repo 可降级；共享仓库/生产项目默认阻塞 |

规则：
- `/codex review` 默认只用于中/大改动；小改动不强制进 P4b
- `/codex release` 默认用于共享仓库、生产项目、需要独立发布 gate 的 repo
- Codex 不可用时，只允许在本 skill 明确允许的低风险路径里降级

## 入口选择

| 任务类型 | 规模 | 入口阶段 |
|----------|------|----------|
| 新项目 / 新功能 | 大 | `P1` |
| UI 改动 | 大 | `P2` |
| 架构变更 / 数据模型变更 | 大 | `P3` |
| bug 修复 / 单模块逻辑改动 | 中 | `P4` |
| 文案 / 颜色 / 间距 / typo | 小 | `P4` 轻量模式 |
| 纯性能优化 | 中 | `P5` |

从入口开始，自动走完后续所有**适用**阶段。被 repo policy 明确标记为 `skipped by policy` 的阶段不算违规。

## 改动规模与测试深度

| 规模 | 定义 | P4 | P5 | P6/P7 |
|------|------|----|----|-------|
| 小 | 文案/颜色/间距/配置/typo，不碰逻辑/API/数据流 | 无 | build | 最小上线验证 |
| 中 | 单模块逻辑改动或 bug 修复 | 相关模块测试 | 全量单测 | e2e（如有） |
| 大 | 跨模块、API、数据模型、新功能 | 相关模块测试 | 全量单测 | review + release + prod verify |

判断依据：
1. 碰 API / 认证 / 支付 / 数据模型 → 至少中
2. 碰多个组件或跨模块依赖 → 大
3. 只碰单文件非逻辑部分 → 小

**小改动快车道：**
`直接改 → build → 查密钥 → 必要时 /codex review → 按 repo 标准流程发布`

## 六道铁律

1. **设计先行**：新功能 / 新页面 / 新流程 / 方向选择，设计未经用户确认前禁止实现。
2. **测试先行**：中大改动先写失败测试再写代码；小改动豁免。
3. **根因先行**：bug 修复先找根因，禁止“试试改这个看看”。
4. **验证先行**：没有新鲜验证证据就不能宣称完成。
5. **安全先行**：提交前必须查密钥泄露与高风险操作。
6. **现实先行**：memory、旧文档、旧假设都要服从当前代码和仓库状态。

## 阶段间校验

同一个 agent 只做 checklist 自检；跨 agent 才算真正 gate。

| 转换点 | 校验方式 | 不通过则 |
|--------|----------|----------|
| P1→P2 | Claude 自检 | 回 P1 |
| P2→P3 | Claude 自检 | 回 P2 或 P1 |
| P3→P4 | Claude 自检 | 回 P3 |
| P4→P5 | Codex review gate（小改动可 `review skipped by policy`） | 回 P4 |
| P5→P6 | Claude handoff 自检 | 回 P5 |
| P6→P7 | Codex release gate | 回 P4 或重做 P6 |

规则：
- 自动执行，不问用户“要不要 review”
- 只打回有明确问题的产出
- 同一问题最多回弹 3 次，超过则暂停并汇报

## P1 产品设计

**什么时候进 P1：** 新功能、新产品、方向模糊、范围未定。

执行要点：
- 先调研再提问
- 一次只问一个问题
- 给 2-3 个有实质差异的方案，并带推荐
- 明确问题定义、功能列表、non-goals、成功标准
- 跨页面 / 登录态 / 支付 / 外链 / 多步骤旅程，自动调用 `user-journey-walkthrough`
- 需求高度模糊时自动触发 `/office-hours`

产出：
- `docs/design/YYYY-MM-DD-<topic>.md`
- 用户确认过的方案

质量门禁：
- 问题定义清楚
- 功能优先级明确
- non-goals 已写明
- 成功标准可验证

## P2 UI/UX 设计

**什么时候进 P2：** 有新页面、新组件、交互变更时。

执行要点：
- 延续现有设计语言；不要自行发明新体系
- 自动使用 `baseline-ui` 做硬约束
- 需要创意实现时调用 `frontend-design`
- 设计不合理、旅程断裂、用户流程说不通时回 P1

产出：
- 文字方案、必要时 mockup、或直接可实现的 UI 方案

质量门禁：
- 交互能走通
- 视觉与现有系统一致
- 基础无障碍满足

## P3 实现计划

**什么时候进 P3：** 新项目、跨模块改动、数据模型变更、复杂实现前。

执行要点：
- 计划必须 bite-sized、可执行、可验证
- 写明文件边界、验证命令、风险点
- 复杂项目可拆成多个独立 task；只有用户明确要求 delegation 才并行
- 技术不可行时回 P2 / P1，不要带病进 P4

产出：
- `docs/design/YYYY-MM-DD-<topic>-plan.md`
- 或轻量模式下的简短 checklist

质量门禁：
- 步骤可执行
- 文件范围清晰
- 验证命令明确

## P4 编码实现

### Scope Guard

- 新需求标记为后续迭代，不当场扩 scope
- 前置依赖允许补入，但必须记录原因
- task 数量膨胀超过 50% 时暂停并汇报
- bug 修复时自动调 `/freeze`
- 生产和破坏性命令前自动调 `/careful`

### P4a 路径选择

- **新功能 / 中大改动 / 重构 / 有测试项目**：读取 `references/TDD.md`
- **bug 修复 / 根因不明 / 线上问题**：读取 `references/DEBUG.md`

### P4b Code Review

默认做法：
- 调 `/codex review`
- 把 diff、测试结果、风险点、设计文档/计划文档一并交给 Codex

降级规则：
- 小改动默认可跳过
- 低风险个人 repo：允许 `review skipped by policy`
- 中风险改动：Codex 不可用时允许 `degraded-review`，用 `code-reviewer`
- 高风险 / shared repo：Codex 不可用时默认阻塞

## P5 验证检查

进入 P5 时读取 `references/RELEASE.md`。

P5 只做两件事：
- 跑完与改动相匹配的验证
- 产出完整的 `Release Handoff`

按需自动启用：
- `senior-security`
- `design-audit`
- `accessibility-auditor`
- `performance-benchmarker`
- `fixing-accessibility`
- `fixing-metadata`
- `fixing-motion-performance`

质量门禁：
- 验证证据完整
- handoff 字段完整
- release path 和 rollback 可执行

## P6 发布上线

默认由 Codex 负责；进入 P6 时继续使用 `references/RELEASE.md`。

默认流程：
- Claude 整理好 `Release Handoff`
- 调 `/codex release`
- Codex 按 repo 实际发布路径执行 release

降级规则：
- 低风险个人 repo 且 repo policy 明确允许 fast path：可标记 `skipped by policy`
- Codex 不可用时，仅低风险个人 repo 允许 `degraded-release`
- shared repo / production 项目默认阻塞，不允许静默切回 Claude 继续发

## P7 上线验证

默认由 Codex 负责；如果走了 `degraded-release`，则 Claude 必须做同等验证。

必须检查：
- deploy 完成
- production URL 可访问
- 最小 smoke test
- bug 修复时，重走用户原始失败路径
- 如有成功标准，逐条对照验证

## P8 自我进化

P7 结束后立即自动触发 `evolve`：
- 记录用户纠正
- 沉淀成功做法
- 如有重复性问题，更新本 skill 或全局 `CLAUDE.md`

## 状态恢复、批量任务、hooks

这些不再塞在主文件里。需要时读取 `references/STATE.md`：
- `PIPELINE_STATE.json`
- `TASK_QUEUE.json`
- auto-loop
- git hooks 自检

## 全局操作规则

1. 所有开发任务默认走本 pipeline。
2. 遵循全局 `CLAUDE.md` 的强制规则，不在这里重复抄写。
3. 智能跳过不适用阶段，但不能跳过适用 gate。
4. 任何 `"完成"`、`"通过"`、`"已修复"` 都必须有当前证据。
5. 任何高风险 fallback 或降级路径，都要在最终结果里明确标记。
