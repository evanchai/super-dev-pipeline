# Super Dev Pipeline

Dual-agent development pipeline for Claude Code.

- Claude Code owns `P1-P5`: product design, UI/UX, implementation planning, coding, and verification.
- Codex owns `P4b`, `P6`, `P7`: independent code review, release, and production verification.
- Long instructions are split into stage-specific references so the main skill stays lean enough to follow reliably.

## What It Solves

Claude Code is good at writing code, but shipping software needs more than one linear pass. This skill adds:

- smart entry routing
- concrete quality gates between phases
- automatic sidecars for discovery, safety, debugging, review, and release
- a release handoff between Claude and Codex
- a lean prompt footprint instead of a single giant `SKILL.md`

## Phase Map

| Phase | Owner | Purpose |
|------|-------|---------|
| `P1` | Claude | Product design, scope, success criteria |
| `P2` | Claude | UI/UX design |
| `P3` | Claude | Implementation plan |
| `P4a` | Claude | Coding via TDD or structured debugging |
| `P4b` | Codex | Independent code review gate |
| `P5` | Claude | Verification and `Release Handoff` |
| `P6` | Codex | Release |
| `P7` | Codex | Production verification |
| `P8` | Claude | Evolve the workflow |

## Repo Layout

```text
SKILL.md
references/
  TDD.md
  DEBUG.md
  RELEASE.md
  STATE.md
tests/
  super-dev-pipeline.test.ts
package.json
```

- `SKILL.md`: routing, phase ownership, gates, downgrade rules
- `references/TDD.md`: P4a path for new features, refactors, and medium/large tested changes
- `references/DEBUG.md`: P4a path for bug fixing and root-cause work
- `references/RELEASE.md`: P5-P7 release handoff, deployment, and production verification
- `references/STATE.md`: state persistence, batch mode, hook/state rules
- `tests/`: harness that protects the structure and routing contracts

## Auto Sidecars

The skill references concrete helpers instead of vague abstractions:

- `/office-hours` for high-ambiguity product discovery
- `/freeze` for edit scoping during bug fixes
- `/careful` for destructive commands and production work
- `/investigate` for structured debugging
- `/codex review` for independent review gates
- `/codex release` for release and production verification

Small low-risk changes can still skip review or release gates when repo policy explicitly allows `skipped by policy`.

## Install

```bash
git clone https://github.com/evanchai/super-dev-pipeline.git ~/.claude/skills/super-dev-pipeline
```

Add this to your project `CLAUDE.md`:

```md
## Workflow

All development tasks default to `super-dev-pipeline`.
```

## Validate

```bash
cd ~/.claude/skills/super-dev-pipeline
bun test tests/
```

The harness checks:

- main skill stays lean
- references stay focused
- phase routing stays stable
- concrete sidecar bindings remain present
- old raw Codex CLI patterns and stale names do not return

## 中文

这是一个给 Claude Code 用的双代理开发流水线：

- Claude 负责 `P1-P5`
- Codex 负责 `P4b/P6/P7`
- 主文件只保留流程骨架
- 详细说明拆到 `references/`
- 仓库自带 Bun harness，避免 skill 改着改着回退到旧逻辑

适合想把需求、设计、实现、验证、发布串成一条稳定流程的人。

## License

MIT
