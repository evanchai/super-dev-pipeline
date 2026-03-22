# Super Dev Pipeline

A battle-tested 8-phase development pipeline skill for [Claude Code](https://claude.ai/code). Every rule exists because something broke in production.

**[中文说明见下方](#中文说明)**

## Why This Exists

Vibe coding with AI is fast. Too fast. You ship features in minutes, but also ship bugs in minutes. This pipeline adds the discipline that AI coding agents lack by default:

- **You say "fix the share link"** → Claude fixes it, tests a GET, says "done" → share link still broken (tested the wrong thing)
- **You say "add a feature"** → Claude adds it, breaks 3 existing features → no regression tests caught it
- **You say "deploy"** → Claude pushes to main, skips E2E → users find the bugs for you

**Super Dev Pipeline** prevents all of this with forced output templates, layered testing gates, and self-policing mechanisms.

## What Makes It Different

| Feature | Most Pipeline Skills | Super Dev Pipeline |
|---------|---------------------|-------------------|
| Bug fix verification | "Tests pass" | Must reproduce user's exact scenario, fix, then re-verify with same operation |
| Test strategy | Run all tests every time | **Layered**: related tests in P4, full regression in P5, E2E in P6 |
| "Done" claims | Trust the agent | **Forced output template** with command output evidence |
| Change classification | One-size-fits-all | **Small/Medium/Large** with different test depth per size |
| Debugging | Read code → guess → fix | **Logs first** (Sentry → Vercel → Console → Supabase) → then code |
| Rule enforcement | Guidelines doc (ignored) | **Hard gates** in the flow — can't progress without evidence |
| Self-improvement | None | **P8 Evolve** — auto-reflects, updates rules, tracks patterns |

## The Pipeline

```
P1 Product Design ──→ P2 UI/UX ──→ P3 Implementation Plan
        ↑                  |               ↑
        └── not feasible ──┘               └── review blocker ──┐
                                                                 ↓
P8 Self-Evolution ←── P7 Production Verify ←── P6 Release ←── P5 Verify ←── P4 Coding
        ↓                    ↑                     ↑               ↑            |
   updates pipeline     re-walk user's         e2e fail →      full tests    related
   for next time        failing operation      back to P4      (regression)   tests only
```

### Phase Details

| Phase | Goal | Key Action | Gate |
|-------|------|-----------|------|
| **P1** Product Design | Define what to build | User interviews, success criteria, YAGNI check | User approval per section |
| **P2** UI/UX Design | Define how it looks | Style, layout, a11y. 2 skills: `baseline-ui` (constraints) + `frontend-design` (creative) | User approval |
| **P3** Implementation Plan | Define how to build it | Step-by-step with exact file paths, code, and verification commands | Self-review for overengineering |
| **P4** Coding | Build it | **Path A**: TDD (Red→Green→Refactor) / **Path B**: Bug fix (Reproduce→Logs→Root cause→Fix→Verify) | Forced output templates |
| **P5** Verification | Can it ship? | Full test suite, build, security scan, design review | All checks green with evidence |
| **P6** Release | Ship it | Push → Vercel deploy → E2E tests | E2E pass (auto-retry up to 3x) |
| **P7** Production Verify | Is it alive? | Deployment check, Sentry, **bug fix: re-walk user's operation on prod** | Production evidence |
| **P8** Self-Evolution | Learn from it | Reflect, update rules, scan for better skills | Auto-triggered |

### Smart Entry Points

Not every task needs all 8 phases:

| Task | Size | Enters At | Example |
|------|------|----------|---------|
| New project | Large | P1 | "Build a new web app" |
| New feature | Large | P1 | "Add sharing" |
| UI redesign | Large | P2 | "Redesign the homepage" |
| Bug fix | Medium | P4 | "Share link creation fails" |
| Copy/color change | Small | P4 (fast lane) | "Change button color" |

## The 6 Iron Rules

These are **hard gates** — not guidelines, not suggestions. The pipeline physically cannot progress if they're violated.

### Rule 1: Design First
No code before user-approved design. Even for "simple" features.

### Rule 2: Tests First (Medium/Large)
No production code without a failing test first. Small changes (copy/color/spacing) exempt.

### Rule 3: Root Cause First
No fix proposals before finding root cause. "Let me try changing X" is forbidden.

### Rule 3b: Anchor to User Scenario
Reproduce and verify must match what the user reported. Can't get auth token? **Figure it out** — don't swap in an easier test.

### Rule 4: Verify First
No "done" claims without command output evidence. "Should be fine" is forbidden.

### Rule 5: Security First
`git diff --cached` checked for secrets before every commit.

## Bug Fix Flow (The Hardest Part)

This is where most AI agents fail — they fix something, test something else, and call it done. Super Dev Pipeline forces a strict sequence:

```
User reports bug
    ↓
Stage 1: REPRODUCE — exact user operation, see the same error
    ↓ (can't reproduce? → ask user, don't guess)
Stage 2: CHECK LOGS — Sentry → Vercel → Console → Supabase
    ↓ (found error in logs? → jump to Stage 3)
Stage 2b: CODE INVESTIGATION — git diff, trace data flow
    ↓
Stage 3: HYPOTHESIZE — single hypothesis, minimal test
    ↓
Stage 4: FIX + VERIFY — same operation as Stage 1, paste evidence
```

**Forced output (must be filled before P5):**

```markdown
### User Report
"Share link creation fails on plat.ning.codes — click share → copy link → shows error"

### Reproduce
$ curl -X POST https://plat.ning.codes/api/share -H "Authorization: Bearer $TOKEN" -d '{"scanId":"xxx"}'
→ HTTP 500: {"error": "Something went wrong"}

### Root Cause
SUPABASE_SERVICE_ROLE_KEY has trailing \n from `echo` pipe to `vercel env add`

### Fix
Added .trim() to env var reads in api/_supabase.ts

### Verify
$ curl -X POST https://plat.ning.codes/api/share -H "Authorization: Bearer $TOKEN" -d '{"scanId":"xxx"}'
→ HTTP 200: {"shareId": "VeubJmUw"}
```

## Change Size Classification

The agent cannot self-downgrade to skip tests:

| Size | Definition | How to Identify |
|------|-----------|----------------|
| **Small** | Copy, color, spacing, config, typo. No logic touched. | Only non-logic parts of one file changed |
| **Medium** | Single-module logic change or bug fix | Touches `api/*.ts`, auth, payment, or data model |
| **Large** | Cross-module, new feature, API changes | Multiple components with shared dependencies |

**Test depth per size:**

```
Small:   P4[none] → P5[build] → P6[none]
Medium:  P4[related tests] → P5[FULL regression] → P6[E2E]
Large:   P4[related tests] → P5[FULL regression] → P6[full release-flow]
```

## Installation

```bash
git clone https://github.com/evanchai/super-dev-pipeline.git ~/.claude/skills/super-dev-pipeline
```

Then add to your project's `CLAUDE.md`:

```markdown
## Workflow
All development tasks use `super-dev-pipeline` skill for orchestration.
```

## Configuration

The pipeline auto-detects project capabilities:

```markdown
# In your project CLAUDE.md, just list your commands:
npm run test          # vitest
npm run test:e2e      # playwright
npm run lint          # eslint
npm run build         # vite build
```

The pipeline reads these and adjusts — no Playwright? Skip E2E. No lint? Skip lint check. No tests at all? Flag it as a coverage gap.

## Origin Story

This pipeline was built from 20+ production incidents across 8 Vercel-deployed projects over 3 weeks of vibe coding:

| Incident | What Broke | Rule Added |
|----------|-----------|------------|
| `vercel env add` via `echo` adds `\n` to values | 3 projects, all API calls failed | Env var `.trim()` + verify step |
| Gemini model deprecated overnight | 5 API endpoints returned 500 | Dependency health checks |
| "Fixed" share link, tested GET not POST | User still couldn't share | **Iron Rule 3b** — anchor to user scenario |
| Said "done" without testing | User found the bug | **Forced output templates** |
| Skipped E2E "because tests are slow" | Regression shipped to prod | **Change size classification** + layered testing |
| Supabase key leaked via `env || "hardcoded"` pattern | API key disabled by Google | 5-layer defense system |
| New feature broke existing payment flow | No regression tests for payment | Full regression required for medium/large |

**Every rule has a scar behind it.**

## License

MIT

---

# 中文说明

## Super Dev Pipeline — Claude Code 全流程开发引擎

一个经过实战检验的 8 阶段开发 Pipeline 技能。每条规则都源于真实生产事故 — 有伤疤才有规则。

## 为什么需要这个

AI Vibe Coding 很快，但也很容易翻车：
- 你说"修分享链接" → Claude 修了代码，测了 GET，说"搞定" → 链接还是不能用（测错了）
- 你说"加个功能" → Claude 加了，顺便搞坏了 3 个现有功能 → 没有回归测试
- 你说"部署" → Claude 直接 push main，跳过 E2E → 用户替你测试

**Super Dev Pipeline** 通过强制输出模板、分层测试门禁和自我监督机制防止这些问题。

## 核心特色

| 特性 | 普通 Pipeline | Super Dev Pipeline |
|------|-------------|-------------------|
| Bug 修复验证 | "测试通过" | 必须用**用户报告的操作**复现 → 修 → 同样操作验证 |
| 测试策略 | 每次全跑 | **分层**：P4 相关模块、P5 全量回归、P6 E2E |
| "完成"声明 | 信任 agent | **强制输出模板**，必须贴命令输出证据 |
| 改动分级 | 一刀切 | **小/中/大**，不同规模不同测试深度 |
| 调试流程 | 读代码 → 猜 → 改 | **先查日志**（Sentry → Vercel → Console → Supabase）→ 再看代码 |
| 规则执行 | 指南文档（被忽略） | **流程硬门禁** — 没证据就不能进入下一阶段 |
| 自我改进 | 无 | **P8 进化** — 自动反思，更新规则，追踪模式 |

## 完整流程

```
P1 产品设计 ──→ P2 UI/UX ──→ P3 实现计划
        ↑            |              ↑
        └─ 技术不可行 ─┘              └── review blocker ──┐
                                                           ↓
P8 自我进化 ←── P7 上线验证 ←── P6 发布 ←── P5 验证检查 ←── P4 编码
     ↓                ↑              ↑           ↑            |
 更新 pipeline    重走用户操作     e2e 失败 →   全量回归      相关测试
                                  回 P4

### 各阶段详情

| 阶段 | 目标 | 关键动作 | 门禁 |
|------|------|---------|------|
| **P1** 产品设计 | 定义做什么 | 用户访谈、成功标准、YAGNI | 用户逐段确认 |
| **P2** UI/UX | 定义长什么样 | 风格、布局、无障碍。2 个 skill：约束 + 创意 | 用户确认 |
| **P3** 实现计划 | 定义怎么做 | 精确到文件路径、代码、验证命令的步骤 | 自检过度设计 |
| **P4** 编码 | 做出来 | TDD（Red→Green）或 Bug fix（复现→日志→根因→修→验证） | 强制输出模板 |
| **P5** 验证 | 能发布吗？ | 全量测试、构建、安全扫描 | 全绿 + 证据 |
| **P6** 发布 | 发出去 | Push → Vercel 部署 → E2E | E2E 通过（最多重试 3 次） |
| **P7** 上线验证 | 活着吗？ | 部署确认、Sentry、**bug fix：在线上重走用户操作** | 生产环境证据 |
| **P8** 进化 | 学到什么 | 反思、更新规则、搜索更强 skill | 自动触发 |
```

### 智能入口

不是每个任务都走全部 8 个阶段：

| 任务 | 规模 | 入口 | 示例 |
|------|------|------|------|
| 新项目 | 大 | P1 | "做一个新 app" |
| 新功能 | 大 | P1 | "加分享功能" |
| Bug 修复 | 中 | P4 | "分享链接失败" |
| 改文案 | 小 | P4 快车道 | "改个按钮颜色" |

## 6 条铁律

| # | 铁律 | 含义 |
|---|------|------|
| 1 | 设计先行 | 用户确认前不写代码 |
| 2 | 测试先行 | 中/大改动必须先写失败测试（小改动豁免） |
| 3 | 根因先行 | 找到根因前禁止提修复方案 |
| 3b | 锚定用户场景 | 复现和验证必须匹配用户报告的操作 |
| 4 | 验证先行 | 没有命令输出证据不能说"完成了" |
| 5 | 安全先行 | commit 前必查密钥泄露 |

## Bug 修复流程

AI agent 最容易犯的错：修了一个东西，测了另一个东西，然后说"搞定了"。

```
用户报告 bug
    ↓
阶段 1：复现 — 用用户的操作，看到同样的错误
    ↓（复现不了？问用户，不要猜）
阶段 2：查日志 — Sentry → Vercel → Console → Supabase
    ↓（日志有错误？直接跳到阶段 3）
阶段 2b：代码排查 — git diff、追数据流
    ↓
阶段 3：假设 — 单一假设，最小测试
    ↓
阶段 4：修复 + 验证 — 用阶段 1 同样的操作，贴证据
```

## 改动规模分级

不允许自己降级来跳过测试：

```
小：  P4[无] → P5[build] → P6[无]
中：  P4[相关测试] → P5[全量回归] → P6[E2E]
大：  P4[相关测试] → P5[全量回归] → P6[完整 release-flow]
```

## 安装

```bash
git clone https://github.com/evanchai/super-dev-pipeline.git ~/.claude/skills/super-dev-pipeline
```

在项目的 `CLAUDE.md` 中添加：

```markdown
## Workflow
所有开发任务使用 `super-dev-pipeline` skill 自动编排。
```

## 起源

| 事故 | 坏了什么 | 加了什么规则 |
|------|---------|------------|
| `vercel env add` 用 `echo` 导致值末尾 `\n` | 3 个项目 API 全挂 | env var `.trim()` + 验证步骤 |
| Gemini 模型一夜过期 | 5 个 API 返回 500 | 依赖健康检查 |
| "修了"分享链接，测的是 GET 不是 POST | 用户还是不能分享 | **铁律 3b** — 锚定用户场景 |
| 没测试就说"完成了" | 用户踩坑 | **强制输出模板** |
| "测试太慢"跳过 E2E | 回归 bug 上线 | **改动分级** + 分层测试 |

**每条规则背后都有一个伤疤。**

## License

MIT
