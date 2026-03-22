# Super Dev Pipeline

An 8-phase automated development pipeline skill for [Claude Code](https://claude.ai/code). Born from real-world vibe coding mistakes — every rule exists because something broke in production.

**[中文说明见下方](#中文说明)**

## What It Does

Turns Claude Code into a disciplined engineering partner with hard gates, forced output templates, and layered testing — so you stop shipping bugs to production.

```
P1 Product Design → P2 UI/UX → P3 Implementation Plan → P4 Coding
    → P5 Verification → P6 Release → P7 Production Validation → P8 Self-Evolution
```

## Key Features

### Change Size Classification
Every change is classified as **small / medium / large** — the size determines which phases run and how deep testing goes:

| Size | Definition | P4 Tests | P5 Tests | P6 Tests |
|------|-----------|----------|----------|----------|
| **Small** | Copy/color/spacing only, no logic | None | Build | None |
| **Medium** | Single-module logic or bug fix | Related tests | **Full regression** | **E2E** (if available) |
| **Large** | Cross-module, API, data model, new feature | Related tests | **Full regression** | **Full release-flow** |

No self-downgrading allowed — touching an API endpoint is at least **medium**, period.

### Bug Fix Template (Forced Output)
Every bug fix must produce this exact structure before it can progress to P5:

```markdown
### User Report
<exact user description>

### Reproduce
<command + output showing the same error>

### Root Cause
<one sentence>

### Fix
<code changes>

### Verify
<same command + output showing error is gone>
```

Missing any section = not done. Testing a GET when the user reported a POST = not done.

### TDD Template (Forced Output)
Every Red-Green cycle must show evidence:

```markdown
### RED
Test: <name and expected behavior>
Run: <command>
Result: FAIL — <reason (must be missing feature, not syntax error)>

### GREEN
Change: <what was written>
Run: <command>
Result: PASS — <all tests passing count>
```

### Logs-First Debugging
Bug fix flow now starts with **checking production logs** before guessing locally:

1. **Sentry** — error + stack trace
2. **Vercel Function Logs** — API errors
3. **Browser Console** — client-side JS errors
4. **Supabase Logs** — 4xx/5xx responses

Only after logs are checked → fall back to code-level investigation.

### 6 Iron Rules (Hard Gates)

| # | Rule | Meaning |
|---|------|---------|
| 1 | Design First | No code before user-approved design |
| 2 | Tests First | Medium/large changes need failing test before code (small exempt) |
| 3 | Root Cause First | No fix proposals before finding root cause |
| 3b | Anchor to User Scenario | Reproduce and verify must match what user reported |
| 4 | Verify First | No "done" claims without command output evidence |
| 5 | Security First | Check for leaked secrets before every commit |

### Production Validation (P7)
Bug fix deployments must **re-walk the user's exact failing operation** on production — not a health check, not curl 200, the actual operation that broke.

### Simplified for Solo Devs
- **2 UI skills** instead of 6 (constraint + creative, rest on-demand)
- **1-pass code review** instead of 3-stage
- **Layered testing** — fast in P4, full regression in P5, E2E in P6
- Small changes get a fast lane (build + push, skip everything else)

## Installation

```bash
# Clone to your Claude Code skills directory
git clone https://github.com/evanchai/super-dev-pipeline.git ~/.claude/skills/super-dev-pipeline
```

Or copy `SKILL.md` manually to `~/.claude/skills/super-dev-pipeline/SKILL.md`.

## Usage

The skill activates automatically when Claude Code detects development tasks. You can also reference it explicitly:

```
Use the super-dev-pipeline skill for this task.
```

Or in your `CLAUDE.md`:

```markdown
## Workflow
All development tasks use `super-dev-pipeline` skill for orchestration.
```

## Origin Story

This pipeline was built iteratively through real production incidents:

- **Vercel env `\n` bug** (3 incidents) → added env var `.trim()` rule and verification step
- **Gemini model deprecation** (broke 5 API endpoints) → added dependency health checks
- **Share link "fix" tested with GET instead of POST** → added Iron Rule 3b (anchor to user scenario)
- **Claimed "done" without testing** (multiple times) → added forced output templates with evidence
- **Skipped release-flow because "tests are slow"** → added change size classification with layered testing

Every rule has a scar behind it.

## License

MIT

---

# 中文说明

## Super Dev Pipeline — Claude Code 全流程开发技能

一个 8 阶段自动化开发 Pipeline 技能，为 [Claude Code](https://claude.ai/code) 设计。每条规则都源于真实的生产事故 — 有伤疤才有规则。

## 核心功能

### 改动规模分级
每次改动自动分为**小/中/大**，规模决定测试深度：

| 规模 | 定义 | P4 测试 | P5 测试 | P6 测试 |
|------|------|---------|---------|---------|
| **小** | 文案/颜色/间距，不碰逻辑 | 无 | 构建 | 无 |
| **中** | 单模块逻辑或 bug 修复 | 相关模块 | **全量回归** | **E2E** |
| **大** | 跨模块、改 API、新功能 | 相关模块 | **全量回归** | **完整 release-flow** |

不允许自己把中/大改动降级为小改动来跳过测试。

### Bug 修复强制模板
修 bug 必须输出以下结构，缺一段不能进入下一阶段：

```markdown
### 用户报告
<原文复述>

### 复现
<用匹配用户操作的命令复现，贴出错误>

### 根因
<一句话>

### 修复
<代码改动>

### 验证
<同样操作再跑一次，贴出错误消失>
```

### 日志优先调试
bug 修复先查线上日志，再猜本地原因：

1. **Sentry** — 错误 + 堆栈
2. **Vercel 函数日志** — API 错误
3. **浏览器 Console** — 前端 JS 错误
4. **Supabase 日志** — 4xx/5xx

### 6 条铁律

| # | 铁律 | 含义 |
|---|------|------|
| 1 | 设计先行 | 用户确认前不写代码 |
| 2 | 测试先行 | 中/大改动必须先写失败测试（小改动豁免） |
| 3 | 根因先行 | 找到根因前禁止提修复方案 |
| 3b | 锚定用户场景 | 复现和验证必须匹配用户报告的操作 |
| 4 | 验证先行 | 没有命令输出证据不能说"完成了" |
| 5 | 安全先行 | commit 前必查密钥泄露 |

### 上线验证 (P7)
bug 修复部署后，必须在生产环境**重走用户当时失败的那个操作** — 不是 health check，不是 curl 200，是用户实际的操作路径。

### 为 Solo 开发者简化
- UI skill 从 6 个减到 **2 个**（约束 + 创意）
- Code review 从 3 阶段减到 **1 次**
- 分层测试 — P4 快速、P5 全量回归、P6 端到端
- 小改动走快车道（build + push，跳过其余）

## 安装

```bash
git clone https://github.com/evanchai/super-dev-pipeline.git ~/.claude/skills/super-dev-pipeline
```

或手动复制 `SKILL.md` 到 `~/.claude/skills/super-dev-pipeline/SKILL.md`。

## 起源

这个 pipeline 是从真实生产事故中迭代出来的：

- **Vercel 环境变量 `\n` 事故**（3 次）→ 加了 `.trim()` 规则和验证步骤
- **Gemini 模型过期**（5 个 API 全挂）→ 加了依赖健康检查
- **分享链接"修复"只测了 GET 没测 POST** → 加了铁律 3b（锚定用户场景）
- **没测试就说"完成了"**（多次）→ 加了强制输出模板
- **因为"测试太慢"跳过 release-flow** → 加了改动规模分级 + 分层测试

每条规则背后都有一个伤疤。

## 许可

MIT
