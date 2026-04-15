#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const args = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  [path.join(__dirname, "bootstrap-i18n.js"), "--locale", "ru", ...args],
  {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
  }
);

process.exit(result.status ?? 1);
