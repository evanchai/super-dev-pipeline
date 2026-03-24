import { describe, expect, test } from "bun:test";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
const SKILL = path.join(ROOT, "SKILL.md");
const REFS = path.join(ROOT, "references");
const README = path.join(ROOT, "README.md");
const PACKAGE = path.join(ROOT, "package.json");

const REQUIRED_REFS = ["TDD.md", "DEBUG.md", "RELEASE.md", "STATE.md"];
const REQUIRED_PHASES = [
  "## P1 产品设计",
  "## P2 UI/UX 设计",
  "## P3 实现计划",
  "## P4 编码实现",
  "## P5 验证检查",
  "## P6 发布上线",
  "## P7 上线验证",
  "## P8 自我进化",
];

function read(file: string) {
  return fs.readFileSync(file, "utf8");
}

function lineCount(file: string) {
  return read(file).split("\n").length;
}

function assertContainsAll(content: string, patterns: string[]) {
  for (const pattern of patterns) {
    expect(content).toContain(pattern);
  }
}

describe("super-dev-pipeline harness: structure", () => {
  test("main skill and references exist", () => {
    expect(fs.existsSync(SKILL)).toBe(true);
    expect(fs.existsSync(README)).toBe(true);
    expect(fs.existsSync(PACKAGE)).toBe(true);
    for (const ref of REQUIRED_REFS) {
      expect(fs.existsSync(path.join(REFS, ref))).toBe(true);
    }
  });

  test("main skill stays lean enough for prompt compliance", () => {
    expect(lineCount(SKILL)).toBeLessThanOrEqual(350);
  });

  test("reference files stay focused", () => {
    for (const ref of REQUIRED_REFS) {
      expect(lineCount(path.join(REFS, ref))).toBeLessThanOrEqual(130);
    }
  });

  test("main skill declares all phase sections", () => {
    const content = read(SKILL);
    assertContainsAll(content, REQUIRED_PHASES);
  });

  test("main skill points to every reference file", () => {
    const content = read(SKILL);
    assertContainsAll(content, [
      "references/TDD.md",
      "references/DEBUG.md",
      "references/RELEASE.md",
      "references/STATE.md",
    ]);
  });
});

describe("super-dev-pipeline harness: routing contracts", () => {
  test("entry routing keeps core task types stable", () => {
    const content = read(SKILL);
    assertContainsAll(content, [
      "| 新项目 / 新功能 | 大 | `P1` |",
      "| UI 改动 | 大 | `P2` |",
      "| 架构变更 / 数据模型变更 | 大 | `P3` |",
      "| bug 修复 / 单模块逻辑改动 | 中 | `P4` |",
      "| 文案 / 颜色 / 间距 / typo | 小 | `P4` 轻量模式 |",
      "| 纯性能优化 | 中 | `P5` |",
    ]);
  });

  test("codex review and release gates keep documented downgrade paths", () => {
    const content = read(SKILL);
    assertContainsAll(content, [
      "/codex review",
      "/codex release",
      "review skipped by policy",
      "degraded-review",
      "degraded-release",
      "skipped by policy",
    ]);
  });

  test("auto sidecars stay bound to concrete skills", () => {
    const content = read(SKILL);
    assertContainsAll(content, [
      "/office-hours",
      "/freeze",
      "/careful",
      "/investigate",
    ]);
  });
});

describe("super-dev-pipeline harness: stale rule prevention", () => {
  test("main skill does not regress to old names or raw codex CLI prompts", () => {
    const content = read(SKILL);
    const forbiddenSnippets = [
      "release-flow",
      'codex exec "<release-prompt>"',
      "codex review --base",
      "TodoWrite",
      "`dev-pipeline`",
      "/skills/dev-pipeline/",
    ];

    for (const token of forbiddenSnippets) {
      expect(content.includes(token)).toBe(false);
    }
  });

  test("release reference stays focused on P5-P7 only", () => {
    const content = read(path.join(REFS, "RELEASE.md"));
    expect(content.includes("P4b Review 对接")).toBe(false);
  });

  test("state reference no longer carries vague night-mode prose", () => {
    const content = read(path.join(REFS, "STATE.md"));
    expect(content.includes("Night Mode")).toBe(false);
  });
});

describe("super-dev-pipeline harness: repo docs contracts", () => {
  test("README install instructions use the current skill name", () => {
    const content = read(README);
    assertContainsAll(content, [
      "super-dev-pipeline",
      "~/.claude/skills/super-dev-pipeline",
      "bun test tests/",
    ]);
    expect(content.includes("`dev-pipeline`")).toBe(false);
    expect(content.includes("/skills/dev-pipeline/")).toBe(false);
  });

  test("package.json exposes the harness entrypoint", () => {
    const content = read(PACKAGE);
    assertContainsAll(content, [
      '"scripts"',
      '"test": "bun test tests/"',
    ]);
  });
});
