/**
 * Build a Keep a Changelog from git tags and conventional commit subjects.
 * Writes CHANGELOG.md and optional per-tag notes under scripts/.release-notes/
 *
 * Run from repo root: node scripts/backfill-changelog.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO = "https://github.com/R0binT/Arrmada";
const NOTES_DIR = path.join("scripts", ".release-notes");

const SECTION_ORDER = ["Added", "Fixed", "Changed", "Maintenance"];

const TYPE_TO_SECTION = {
  feat: "Added",
  fix: "Fixed",
  perf: "Changed",
  refactor: "Changed",
  docs: "Maintenance",
  ci: "Maintenance",
  chore: "Maintenance",
  test: "Maintenance",
  style: "Changed",
};

const run = (cmd) =>
  execSync(cmd, { encoding: "utf8" }).trim();

const tags = run("git tag --list \"v*\" --sort=version:refname")
  .split("\n")
  .filter(Boolean);

if (tags.length === 0) {
  throw new Error("No v* tags found");
}

const categorize = (subject) => {
  const match = /^(feat|fix|perf|refactor|docs|ci|chore|test|style)(?:\([^)]*\))?!?:\s*(.+)$/i.exec(
    subject,
  );
  if (!match) {
    if (/^release:/i.test(subject)) return null;
    return { section: "Maintenance", text: subject };
  }
  const type = match[1].toLowerCase();
  if (type === "chore" && /^release\b/i.test(match[2])) return null;
  const section = TYPE_TO_SECTION[type] ?? "Maintenance";
  return { section, text: match[2].trim() };
};

const commitsBetween = (fromRef, toRef) => {
  const range = fromRef ? `${fromRef}..${toRef}` : toRef;
  const log = run(`git log ${range} --pretty=format:%s`);
  return log ? log.split("\n").filter(Boolean) : [];
};

const tagDate = (tag) => {
  const iso = run(`git log -1 --format=%cs ${tag}`);
  return iso;
};

const buildSectionMarkdown = (version, date, entries, previousTag) => {
  const bySection = Object.fromEntries(SECTION_ORDER.map((s) => [s, []]));
  for (const entry of entries) {
    if (!entry) continue;
    bySection[entry.section].push(entry.text);
  }

  const lines = [`## [${version}] - ${date}`, ""];
  for (const section of SECTION_ORDER) {
    const items = bySection[section];
    if (!items.length) continue;
    lines.push(`### ${section}`, "");
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }
  if (lines.length === 2) {
    lines.push("- No user-facing changes recorded.", "");
  }

  const compare =
    previousTag != null
      ? `${REPO}/compare/${previousTag}...v${version}`
      : `${REPO}/releases/tag/v${version}`;

  return { body: lines.join("\n").trimEnd(), compare, version };
};

fs.mkdirSync(NOTES_DIR, { recursive: true });

const blocks = [];
const footers = [];

for (let i = 0; i < tags.length; i += 1) {
  const tag = tags[i];
  const version = tag.replace(/^v/, "");
  const previousTag = i > 0 ? tags[i - 1] : null;
  const subjects = commitsBetween(previousTag, tag);
  const entries = subjects
    .map(categorize)
    .filter((e) => e != null);
  // Dedupe identical texts within a section
  const seen = new Set();
  const unique = [];
  for (const entry of entries) {
    const key = `${entry.section}:${entry.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(entry);
  }

  const { body, compare } = buildSectionMarkdown(
    version,
    tagDate(tag),
    unique,
    previousTag,
  );
  blocks.push(body);
  footers.push(`[${version}]: ${compare}`);

  const notesPath = path.join(NOTES_DIR, `${tag}.md`);
  const releaseNotes = [
    body.replace(/^## \[[^\]]+\] - [^\n]+\n\n/, `## Arrmada ${version}\n\n`),
    "",
    "### Downloads",
    "",
    `- \`Arrmada-${version}.apk\` (attached to this release when the publish workflow succeeds)`,
    "",
    `**Full Changelog**: ${compare}`,
    "",
  ].join("\n");
  fs.writeFileSync(notesPath, releaseNotes);
}

const changelog = [
  "# Changelog",
  "",
  "All notable changes to Arrmada are documented in this file.",
  "",
  "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),",
  "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).",
  "",
  ...blocks.reverse().flatMap((block, index, arr) =>
    index < arr.length - 1 ? [block, ""] : [block],
  ),
  "",
  ...footers.reverse(),
  "",
].join("\n");

fs.writeFileSync("CHANGELOG.md", changelog);
console.log(`Wrote CHANGELOG.md (${tags.length} releases)`);
console.log(`Wrote notes under ${NOTES_DIR}/`);
