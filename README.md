# Super Dev Pipeline

An end-to-end orchestration engine for [Claude Code](https://claude.ai/code) that turns one-shot prompts into production-grade software — with challenge loops, hard gates, and self-evolution.

**[中文说明见下方](#中文说明)**

## The Problem

Claude Code is incredibly capable at writing code. But shipping software is more than writing code — it's design → plan → build → verify → deploy → validate → learn. Without orchestration, the agent makes local decisions that look right but fail globally:

- Fixes a bug but verifies with the wrong test
- Builds a feature but breaks three existing ones
- Deploys but doesn't check if production actually works
- Makes the same mistake next session because it forgot

**Super Dev Pipeline** is the orchestration layer that connects all 8 phases into a single flow with feedback loops.

## How It's Different

### vs. [Superpowers](https://github.com/anthropics/superpowers)
Superpowers provides **individual skill behaviors** — brainstorming, TDD, code review — each standalone. Super Dev Pipeline is the **conductor** that calls these skills in sequence, decides which to skip, and sends work backward when quality gates fail.

### vs. [GStack](https://github.com/garrytandev/gstack)
GStack is **reactive** — it suggests the right skill at the right moment ("looks like you're debugging, try /investigate"). Super Dev Pipeline is **proactive** — it runs the full flow automatically without waiting for suggestions, and adapts the process weight to the task size.

### vs. Standard Agentic Workflows
Most workflows are linear: plan → code → test → deploy. Super Dev Pipeline has **challenge loops** — Phase 5 can reject Phase 4's work and send it back. Phase 7 can reject Phase 6's deployment. Phase 8 updates the pipeline itself. The system gets stronger over time.

```
                    ┌──── reject ────┐
                    ↓                |
P1 Design → P2 UI → P3 Plan → P4 Code → P5 Verify → P6 Ship → P7 Validate
    ↑          |        ↑          ↑         |            ↑          |
    └─ reject ─┘        └─ reject ─┘         └─ reject ──┘          ↓
                                                                P8 Evolve
                                                                    ↓
                                                            updates pipeline
                                                            for next session
```

## Core Concepts

### 1. Smart Entry — Skip What You Don't Need

80% of tasks don't need 8 phases. The pipeline auto-detects:

| You say | Size | Starts at | What runs |
|---------|------|-----------|-----------|
| "Build a new app" | Large | P1 | All 8 phases |
| "Add sharing feature" | Large | P1 | All 8 phases |
| "Fix the login bug" | Medium | P4 | P4→P5→P6→P7→P8 |
| "Change the button color" | Small | P4 fast lane | Build → push → verify |

### 2. Challenge Loops — Downstream Rejects Upstream

Every phase transition is a quality gate. If downstream finds a problem, work goes back to the right phase — not forward with a patch:

- P2 finds P1's requirements don't make sense → **back to P1**
- P4b code review finds a blocker → **back to P4a**
- P5 tests fail → **back to P4**
- P6 E2E fails → **back to P4** (auto-retry up to 3x)
- P7 production broken → **rollback + back to P4**

### 3. Forced Output Templates — No Shortcuts

The agent must produce specific structured output at key points. Can't progress without it. This prevents "I fixed it (trust me)" situations.

**Bug fix template (P4):**
```markdown
### User Report
<what the user said, verbatim>
### Reproduce
<command + output showing the same error>
### Root Cause
<one sentence>
### Fix
<code changes>
### Verify
<same command, error gone>
```

**TDD template (P4):**
```markdown
### RED
Test: <name>  |  Run: <command>  |  Result: FAIL (reason)
### GREEN
Change: <what>  |  Run: <command>  |  Result: PASS (count)
```

### 4. Layered Testing — Fast Where It Matters

Instead of running all tests at every step (slow) or no tests (dangerous):

```
P4 Coding:       only related module tests     (seconds)
P5 Verification: full test suite regression     (1-2 min)
P6 Release:      E2E / Playwright              (2-5 min, background)
```

Small changes skip testing entirely — just build and push.

### 5. Logs-First Debugging — Stop Guessing

When fixing bugs, check production evidence before reading code:

```
Sentry errors → Vercel function logs → Browser console → Supabase logs
    ↓ found the error? skip to hypothesis
    ↓ nothing? fall back to code investigation
```

### 6. Self-Evolution (P8) — Gets Stronger Over Time

After every significant task, the pipeline:
- Reflects on what went wrong
- Encodes new rules into memory
- Searches for better skills online
- Updates its own SKILL.md

Rules that get violated repeatedly get **promoted** from memory files to CLAUDE.md (auto-loaded every session).

## The 6 Iron Rules

Hard gates — the pipeline cannot progress if any is violated.

| # | Rule | What It Prevents |
|---|------|-----------------|
| 1 | **Design First** | Building the wrong thing |
| 2 | **Tests First** | Untested code shipping (medium/large only) |
| 3 | **Root Cause First** | Guess-and-patch debugging |
| 3b | **Anchor to User** | Testing the wrong scenario |
| 4 | **Evidence First** | "Trust me, it works" |
| 5 | **Security First** | Leaked secrets in git |

## Quick Start

```bash
# Install
git clone https://github.com/evanchai/super-dev-pipeline.git ~/.claude/skills/super-dev-pipeline

# Activate — add to your project's CLAUDE.md:
echo '## Workflow
All development tasks use `super-dev-pipeline` skill for orchestration.' >> CLAUDE.md
```

The pipeline auto-detects your project's capabilities from `package.json` and `CLAUDE.md`. No additional configuration needed.

## License

MIT

---

# 中文说明

## Super Dev Pipeline — Claude Code 全流程编排引擎

一个端到端的开发编排引擎 — 把一句话需求变成生产级软件，带挑战回路、硬门禁和自我进化。

## 解决什么问题

Claude Code 写代码很强。但交付软件不只是写代码 — 是设计→计划→构建→验证→部署→确认→学习。没有编排层，agent 每一步都做局部最优，但全局翻车。

**Super Dev Pipeline** 就是这个编排层 — 把 8 个阶段串成一条流水线，带反馈回路。

## 和其他工具的区别

| 工具 | 定位 | Super Dev Pipeline 的区别 |
|------|------|-------------------------|
| **Superpowers** | 独立 skill 集合（brainstorm、TDD、code review 各自独立） | **指挥家** — 按顺序调用 skill，决定跳过哪个，质量不合格就打回 |
| **GStack** | 被动建议（"看起来你在调试，试试 /investigate"） | **主动驱动** — 自动跑完整流程，根据任务规模调整流程权重 |
| **普通 workflow** | 线性：计划→写→测→部署 | **挑战回路** — P5 可以打回 P4，P7 可以回滚 P6，P8 更新 pipeline 自身 |

## 核心机制

### 1. 智能入口 — 跳过不需要的阶段

| 你说 | 规模 | 从哪开始 |
|------|------|---------|
| "做个新 app" | 大 | P1（全部 8 阶段） |
| "修登录 bug" | 中 | P4（P4→P5→P6→P7→P8） |
| "改个颜色" | 小 | P4 快车道（build→push→验证） |

### 2. 挑战回路 — 下游打回上游

```
P2 发现 P1 需求不合理 → 回 P1
Code review 发现 blocker → 回 P4
P5 测试失败 → 回 P4
P6 E2E 失败 → 回 P4（最多 3 次）
P7 生产挂了 → 回滚 + 回 P4
```

### 3. 强制输出模板 — 不能省略

Bug 修复必须输出五段式（用户报告/复现/根因/修复/验证），缺一段不能进入下一阶段。

TDD 必须输出 RED/GREEN 模板，每个循环都贴命令输出。

### 4. 分层测试 — 该快的地方快

```
P4：相关模块测试（秒级）
P5：全量回归（1-2 分钟）
P6：E2E 端到端（2-5 分钟，后台跑）
小改动：只跑 build，跳过测试
```

### 5. 日志优先调试 — 别猜

```
Sentry → Vercel 函数日志 → 浏览器 Console → Supabase 日志
    ↓ 找到错误？跳到假设
    ↓ 没有？再看代码
```

### 6. 自我进化（P8）— 越用越强

每次重要任务后自动：反思 → 编码新规则 → 搜索更强 skill → 更新 pipeline 自身。

反复违反的规则自动**升级**到 CLAUDE.md（每次会话自动加载）。

## 6 条铁律

| # | 铁律 | 防止什么 |
|---|------|---------|
| 1 | **设计先行** | 做错东西 |
| 2 | **测试先行** | 未测试代码上线（中/大改动） |
| 3 | **根因先行** | 猜测式修复 |
| 3b | **锚定用户** | 测错场景 |
| 4 | **证据先行** | "应该没问题" |
| 5 | **安全先行** | 密钥泄露 |

## 安装

```bash
git clone https://github.com/evanchai/super-dev-pipeline.git ~/.claude/skills/super-dev-pipeline
```

在项目 `CLAUDE.md` 中加一行：

```markdown
## Workflow
所有开发任务使用 `super-dev-pipeline` skill 自动编排。
```

自动检测项目能力，无需额外配置。

## License

MIT
