#!/usr/bin/env node

/*
  Russian terminology audit.

  Scans the Russian locale for known terminology defects:
    - calques (продакшен, bare стриминг)
    - capitalized «Вы»-address (never capitalize Вы)
    - non-hyphenated hybrid compounds (API ключ → API-ключ)
    - Cyrillicized protocol names (ЖСОН, АПИ)
    - bare Latin `predecessor` in Russian prose
    - mixed-language glue words (English connective sitting between
      Cyrillic words — usually an auto-translate leftover)

  Sources inspected:
    - i18n/ru/** (prose, .md and .mdx, minus transaction-flow which is
      out of scope by directive)
    - src/data/fastnearTranslations.ru.json (translation pool)

  Exits 0 if clean, 1 if any errors are found. Optional `--json` emits
  findings as structured JSON. `--quiet` suppresses the clean-run banner.

  Run:
      yarn audit:ru-terminology
*/

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

const SCAN_DIRS = [
  { relPath: "i18n/ru", extensions: new Set([".md", ".mdx"]) },
];

const SCAN_FILES = [
  "src/data/fastnearTranslations.ru.json",
];

// Content-wise exempt paths: scanning them would flag meta-references
// (e.g. the style guide intentionally lists forbidden patterns as examples).
const ALWAYS_EXCLUDE = [
  // Chapter files: intentionally reference forbidden patterns as examples.
  /md-CLAUDE-chapters\//,
  /scripts\/audit-ru-terminology\.js$/,
  // User directive: `/transaction-flow/` is hidden and not indexed.
  /docusaurus-plugin-content-docs\/current\/transaction-flow\//,
];

const CHECKS = [
  {
    id: "calque-production",
    label: "Calque «продакшен» — use «боевой» / «боевая среда»",
    pattern: /продакшен|продуктив/i,
  },
  {
    id: "calque-streaming",
    label: "Bare «стриминг» — use «потоковая передача» (or «стрим» in a compound)",
    // стриминг not preceded or followed by a hyphen (i.e. not inside a compound like стрим-соединение)
    pattern: /(?<![а-яёa-z-])стриминг(?!-)/i,
  },
  {
    id: "voice-capital-vy",
    label: "«Вы» / «Вам» / «Ваш» capitalized — never capitalize the Вы-address",
    // Explicit non-letter lookarounds since `\b` in JS is ASCII-only and
    // misses word boundaries around Cyrillic characters. Sentence-starting
    // Вы is also flagged — the style guide rule is to rephrase to avoid
    // Вы-address entirely.
    pattern:
      /(?<![а-яёА-ЯЁa-zA-Z0-9_])(Вы|Вам|Вас|Ваш[аеиоу]?)(?![а-яёА-ЯЁa-zA-Z0-9_])/,
  },
  {
    id: "hyphenation-compound",
    label: "Non-hyphenated hybrid — use «API-ключ», «HTTP-запрос», etc.",
    // Latin abbreviation + space + Russian noun = wrong; should be hyphenated.
    pattern:
      /\b(API|JSON|HTTP|REST|gRPC|JWT|OAuth|SDK|URL|URI|Bearer|FT|NFT|IAM|WebSocket)\s+(ключ[ауеыов]?|запрос[ауеыов]?|ответ[ауеыов]?|метод[ауеыов]?|заголов[а-я]+|токен[ауеыов]?|объект[ауеыов]?|эндпоинт[ауеыов]?|контракт[ауеыов]?)/,
  },
  {
    id: "latin-cyrillicized",
    label: "Cyrillicized protocol name — keep Latin (JSON, API, REST, HTTP)",
    // Cyrillic-safe boundaries (see voice-capital-vy rationale).
    pattern:
      /(?<![а-яёА-ЯЁa-zA-Z0-9_])(ЖСОН|АПИ|РЕСТ|ХТТП|ГРПЦ|ДЖВТ|ОАУТ)(?![а-яёА-ЯЁa-zA-Z0-9_])/,
  },
  {
    id: "bare-predecessor",
    label: "Bare «predecessor» in Russian prose — use «предшественник»",
    // predecessor preceded by Cyrillic letter (Russian prose, not code).
    // Negative lookahead: predecessor_id and predecessor.id stay Latin (code).
    pattern: /[а-яё]\s+predecessor(?![_.])\b/i,
  },
  {
    id: "mixed-language-glue",
    label: "Mixed-language: English glue word embedded in Russian prose",
    customCheck: true,
  },
];

const ENGLISH_GLUE =
  /[а-яё]{3,}\s+(by|for|to|with|from|of|the|an?|that|whose|was|were|is|are|have|has|had|this|these|those|it|or|which|where|when|how|what|who|whom|their|them|they|into|onto|about|because|if)\s+([a-zа-яё]{2,})/i;

function stripNoise(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")            // fenced code blocks
    .replace(/`[^`\n]+`/g, " ")                  // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")    // markdown links → display text
    .replace(/https?:\/\/\S+/g, " ")            // URLs
    .replace(/\{[^}\n]+\}/g, " ");              // template vars / URL params
}

function shouldExcludeFile(relPath) {
  return ALWAYS_EXCLUDE.some((re) => re.test(relPath));
}

function walkDir(dir, extensions, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, extensions, acc);
    } else if (extensions.has(path.extname(entry.name))) {
      acc.push(full);
    }
  }
  return acc;
}

function enumerateTargets() {
  const files = [];

  for (const dir of SCAN_DIRS) {
    const abs = path.join(ROOT, dir.relPath);
    if (!fs.existsSync(abs)) continue;
    for (const file of walkDir(abs, dir.extensions)) {
      files.push(file);
    }
  }

  for (const rel of SCAN_FILES) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      files.push(abs);
    }
  }

  return files.filter((abs) => !shouldExcludeFile(path.relative(ROOT, abs)));
}

function runChecks(absPath) {
  const relPath = path.relative(ROOT, absPath);
  const source = fs.readFileSync(absPath, "utf8");
  const lines = source.split("\n");
  const findings = [];

  lines.forEach((line, idx) => {
    const stripped = stripNoise(line);

    for (const check of CHECKS) {
      if (check.customCheck) {
        const match = stripped.match(ENGLISH_GLUE);
        if (match) {
          findings.push({
            checkId: check.id,
            label: check.label,
            file: relPath,
            line: idx + 1,
            snippet: trimSnippet(line, match[0]),
          });
        }
        continue;
      }

      const match = stripped.match(check.pattern);
      if (match) {
        findings.push({
          checkId: check.id,
          label: check.label,
          file: relPath,
          line: idx + 1,
          snippet: trimSnippet(line, match[0]),
        });
      }
    }
  });

  return findings;
}

function trimSnippet(line, match) {
  const trimmed = line.trim();
  if (trimmed.length <= 140) return trimmed;
  const idx = trimmed.indexOf(match);
  if (idx < 0) return `${trimmed.slice(0, 137)}…`;
  const start = Math.max(0, idx - 40);
  const end = Math.min(trimmed.length, idx + match.length + 60);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < trimmed.length ? "…" : "";
  return `${prefix}${trimmed.slice(start, end)}${suffix}`;
}

function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const quiet = argv.includes("--quiet");

  const targets = enumerateTargets();
  const allFindings = [];

  for (const target of targets) {
    const findings = runChecks(target);
    allFindings.push(...findings);
  }

  if (asJson) {
    process.stdout.write(`${JSON.stringify({ findings: allFindings, count: allFindings.length, filesScanned: targets.length }, null, 2)}\n`);
    process.exit(allFindings.length === 0 ? 0 : 1);
  }

  if (allFindings.length === 0) {
    if (!quiet) {
      console.log(`✓ Russian terminology audit clean (${targets.length} files scanned).`);
    }
    process.exit(0);
  }

  // Group by check id
  const byCheck = new Map();
  for (const f of allFindings) {
    if (!byCheck.has(f.checkId)) byCheck.set(f.checkId, { label: f.label, findings: [] });
    byCheck.get(f.checkId).findings.push(f);
  }

  console.log(`✗ Russian terminology audit: ${allFindings.length} finding(s) across ${byCheck.size} check(s). Files scanned: ${targets.length}.\n`);

  for (const [checkId, { label, findings }] of byCheck) {
    console.log(`  [${checkId}] ${label} — ${findings.length} hit(s):`);
    for (const f of findings) {
      console.log(`    ${f.file}:${f.line}: ${f.snippet}`);
    }
    console.log("");
  }

  console.log(`See i18n/ru/GLOSSARY.md and md-CLAUDE-chapters/i18n_translating_russian.md for guidance.`);
  process.exit(1);
}

main();
