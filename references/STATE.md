# State Reference

在需要断点恢复、批量任务、hooks 自检时读取本文件。

## 1. PIPELINE_STATE.json

用途：
- 记录单个任务当前阶段
- 支持新 session best-effort 恢复

示例：

```json
{
  "phase": "P4",
  "task": "feat: 用户登录",
  "completedPhases": ["P1", "P2", "P3"],
  "currentStep": "P4a-tdd",
  "pendingIssues": ["review blocker #2"],
  "designDoc": "docs/design/2026-03-21-login.md",
  "timestamp": "2026-03-21T15:00:00Z"
}
```

规则：
- 在明显阶段转换或准备结束 session 时尽量更新
- 超过 72 小时只作提醒，不自动阻塞
- 轻量模式可不写
- 必须加入 `.gitignore`

## 2. TASK_QUEUE.json

用途：
- 管理 auto-loop 中多个任务的进度

状态流转：

```text
pending → in_progress → completed
                     → failed
                     → blocked
```

规则：
- auto-loop 不进 P1/P2
- 每个任务完成后更新结果摘要
- 不自动新增 discovered task
- 必须加入 `.gitignore`

## 3. 两个状态文件的关系

- `TASK_QUEUE.json` 管任务间进度
- `PIPELINE_STATE.json` 管单任务内进度
- auto-loop 时可共存；恢复时先看 task queue，再看 pipeline state

## 4. Git Hooks 自检

只在项目真的依赖本地 hooks 时执行，不要把它当全局硬门禁。

建议检查：
- `.git/hooks/pre-push` 是否存在且可执行
- 是否和当前项目测试方式匹配
- 不覆盖用户已有 hook，除非用户明确同意
