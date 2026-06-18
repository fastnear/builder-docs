import React, { useEffect, useMemo, useRef, useState } from "react";

import ApiKeyManager from "@site/src/components/ApiKeyManager";
import { usePortalAuth } from "@site/src/components/FastnearDirectOperation/portalAuth";

const RPC_MAINNET = "https://rpc.mainnet.fastnear.com";

// Endpoint presets, RPC-first (the thing we want to "spam"). The authenticated
// JSON-RPC calls flow through the Cloudflare key-matcher snippet, so they
// actually exercise the UI-key origin restriction. /status is auth-optional and
// may return 200 regardless of origin — a reachability baseline only.
const PRESETS = {
  "rpc-block": {
    label: "RPC block — latest final block (default)",
    url: RPC_MAINNET,
    method: "POST",
    body: '{"jsonrpc":"2.0","id":"debug","method":"block","params":{"finality":"final"}}',
  },
  "rpc-view-account": {
    label: "RPC query view_account (root.near) — mirrors account-lookup",
    url: RPC_MAINNET,
    method: "POST",
    body: '{"jsonrpc":"2.0","id":"debug","method":"query","params":{"request_type":"view_account","account_id":"root.near","finality":"final"}}',
  },
  "rpc-gas-price": {
    label: "RPC gas_price",
    url: RPC_MAINNET,
    method: "POST",
    body: '{"jsonrpc":"2.0","id":"debug","method":"gas_price","params":[null]}',
  },
  "rpc-validators": {
    label: "RPC validators — heavier; account-lookup fans out from this",
    url: RPC_MAINNET,
    method: "POST",
    body: '{"jsonrpc":"2.0","id":"debug","method":"validators","params":[null]}',
  },
  "rest-status": {
    label: "REST GET /status — public baseline (may 200 regardless of origin)",
    url: "https://api.fastnear.com/status",
    method: "GET",
    body: "",
  },
  custom: {
    label: "Custom URL",
    url: RPC_MAINNET,
    method: "POST",
    body: '{"jsonrpc":"2.0","id":"debug","method":"block","params":{"finality":"final"}}',
  },
};

const mono = {
  fontFamily:
    "var(--ifm-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, monospace)",
};

function classify(status, bodyText) {
  if (status == null) return "CORS-blocked — status hidden by browser";
  if (status >= 200 && status < 300) return "ok";
  if (status === 401) return "missing/invalid key (401)";
  if (status === 402) return "quota exceeded (402)";
  if (status === 403) {
    return /origin_not_allowed/.test(bodyText || "")
      ? "origin_not_allowed (403)"
      : "forbidden (403)";
  }
  if (status === 429) return "rate limited (429)";
  return `status ${status}`;
}

function rowColor(row) {
  if (row.status == null) return "var(--ifm-color-warning-dark, #b8860b)";
  if (row.status >= 200 && row.status < 300) return "var(--ifm-color-success-dark, #1a7f37)";
  if (row.status === 429) return "var(--ifm-color-warning-dark, #b8860b)";
  return "var(--ifm-color-danger-dark, #c1372f)";
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

// Single-quote a value for a POSIX shell command.
function shquote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export default function RateLimitDebugger() {
  const auth = usePortalAuth();
  const apiKey = auth?.apiKey || "";

  const [presetKey, setPresetKey] = useState("rpc-block");
  const [customUrl, setCustomUrl] = useState(RPC_MAINNET);
  const [customMethod, setCustomMethod] = useState("POST");
  const [customBody, setCustomBody] = useState(PRESETS["rpc-block"].body);
  const [authMode, setAuthMode] = useState("bearer"); // bearer | query | none

  const [count, setCount] = useState(25);
  const [concurrency, setConcurrency] = useState(1);
  const [delayMs, setDelayMs] = useState(200);

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [autoRetry, setAutoRetry] = useState(null);

  const controllerRef = useRef(null);
  const cancelledRef = useRef(false);
  const autoRunDoneRef = useRef(false);

  const effective = useMemo(() => {
    if (presetKey === "custom") {
      return { url: customUrl, method: customMethod, body: customBody };
    }
    const p = PRESETS[presetKey];
    return { url: p.url, method: p.method, body: p.body };
  }, [presetKey, customUrl, customMethod, customBody]);

  // Build the actual request the browser will send, applying the chosen auth mode.
  const buildRequest = () => {
    const headers = { Accept: "application/json" };
    let url = effective.url;
    let body;

    if (effective.method !== "GET" && effective.method !== "HEAD") {
      headers["Content-Type"] = "application/json";
      body = effective.body || undefined;
    }

    if (authMode === "bearer" && apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    } else if (authMode === "query" && apiKey) {
      try {
        const u = new URL(url);
        u.searchParams.set("apiKey", apiKey);
        url = u.toString();
      } catch (_error) {
        // leave url untouched if it is not parseable
      }
    }

    return { url, method: effective.method, headers, body };
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "(server)";

  const curlCommand = useMemo(() => {
    const { url, method, headers, body } = buildRequest();
    const lines = [`curl -s ${shquote(url)}`];
    if (method !== "GET") lines.push(`  -X ${method}`);
    Object.entries(headers).forEach(([k, v]) => {
      lines.push(`  -H ${shquote(`${k}: ${v}`)}`);
    });
    if (body) lines.push(`  --data-raw ${shquote(body)}`);
    return lines.join(" \\\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effective, authMode, apiKey]);

  // hey load-test script for the off-origin / lifted-key scenarios.
  const heyScript = useMemo(() => {
    const n = Math.max(1, Math.floor(Number(count) || 1));
    const c = Math.max(1, Math.floor(Number(concurrency) || 1));

    const heyLine = (extraHeaders) => {
      const { url, method, headers, body } = buildRequest();
      const parts = ["hey", `-n ${n}`, `-c ${c}`, `-m ${method}`];
      Object.entries(headers).forEach(([k, v]) => parts.push(`-H ${shquote(`${k}: ${v}`)}`));
      extraHeaders.forEach((h) => parts.push(`-H ${shquote(h)}`));
      if (body) parts.push(`-d ${shquote(body)}`);
      parts.push(shquote(url));
      return parts.join(" ");
    };

    return [
      "#!/usr/bin/env bash",
      '# Off-origin load test of a "lifted" API key using hey (github.com/rakyll/hey).',
      `# Compare hey's status-code + latency summary against the in-browser run on`,
      `# ${origin} (the browser sends that true Origin and cannot forge it).`,
      "",
      "echo '== 1) Naive lifted key: no Origin/Referer  (expect 403 origin_not_allowed) =='",
      heyLine([]),
      "",
      `echo '== 2) Forged MATCHING Origin: ${origin}  (Origin is forgeable outside a browser -> may return 200) =='`,
      heyLine([`Origin: ${origin}`]),
      "",
      "echo '== 3) Wrong Origin  (expect 403 origin_not_allowed) =='",
      heyLine(["Origin: https://evil.example.com"]),
      "",
    ].join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effective, authMode, apiKey, count, concurrency, origin]);

  const summary = useMemo(() => {
    const byStatus = {};
    results.forEach((r) => {
      const key = r.status == null ? "ERR" : String(r.status);
      byStatus[key] = (byStatus[key] || 0) + 1;
    });
    const first403 = results.find((r) => r.status === 403);
    const first429 = results.find((r) => r.status === 429);
    const ok2xx = results.filter((r) => r.status >= 200 && r.status < 300).length;
    const last = results[results.length - 1];
    const elapsedMs = last ? last.atMs + last.durationMs : 0;
    const rps = elapsedMs > 0 ? results.length / (elapsedMs / 1000) : 0;
    const durs = results.map((r) => r.durationMs).sort((a, b) => a - b);
    const avgMs = durs.length
      ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
      : 0;
    return {
      byStatus,
      first403,
      first429,
      ok2xx,
      elapsedMs,
      rps,
      total: results.length,
      avgMs,
      p50: percentile(durs, 50),
      p95: percentile(durs, 95),
    };
  }, [results]);

  const runTest = async (countOverride) => {
    if (running) return;
    setResults([]);
    setRunning(true);
    cancelledRef.current = false;
    const controller = new AbortController();
    controllerRef.current = controller;

    const startedAt = performance.now();
    const total = Math.max(1, Math.floor(Number(countOverride ?? count) || 1));
    const workers = Math.max(1, Math.floor(Number(concurrency) || 1));
    const pause = Math.max(0, Math.floor(Number(delayMs) || 0));
    const indexRef = { current: 0 };

    const doOne = async () => {
      const i = indexRef.current;
      indexRef.current += 1;
      if (i >= total || cancelledRef.current) return false;

      const atMs = Math.round(performance.now() - startedAt);
      const reqStart = performance.now();
      const { url, method, headers, body } = buildRequest();

      let row;
      try {
        const res = await fetch(url, { method, headers, body, signal: controller.signal });
        const text = await res.text().catch(() => "");
        row = {
          i,
          atMs,
          status: res.status,
          ok: res.ok,
          classification: classify(res.status, text),
          durationMs: Math.round(performance.now() - reqStart),
          score: res.headers.get("x-rate-limit-score"),
          cfRay: res.headers.get("cf-ray"),
          retryAfter: res.headers.get("retry-after"),
          bodySnippet: text.slice(0, 160),
          error: null,
        };
      } catch (error) {
        if (error && error.name === "AbortError") return false;
        row = {
          i,
          atMs,
          status: null,
          ok: false,
          classification: "network/CORS (possibly blocked without CORS headers)",
          durationMs: Math.round(performance.now() - reqStart),
          score: null,
          cfRay: null,
          retryAfter: null,
          bodySnippet: String((error && error.message) || error),
          error: (error && error.name) || "Error",
        };
      }

      setResults((prev) => [...prev, row]);
      return true;
    };

    const worker = async () => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (cancelledRef.current || indexRef.current >= total) return;
        const didRun = await doOne();
        if (!didRun) return;
        if (pause > 0 && !cancelledRef.current) await sleep(pause);
      }
    };

    try {
      await Promise.all(Array.from({ length: workers }, () => worker()));
    } finally {
      setRunning(false);
      controllerRef.current = null;
    }
  };

  // ?debug_retry=N  ->  set count to N and auto-run once on load.
  useEffect(() => {
    if (autoRunDoneRef.current || typeof window === "undefined") return;
    const retry = parseInt(
      new URLSearchParams(window.location.search).get("debug_retry") || "",
      10
    );
    if (Number.isFinite(retry) && retry > 0) {
      autoRunDoneRef.current = true;
      setCount(retry);
      setAutoRetry(retry);
      runTest(retry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTest = () => {
    cancelledRef.current = true;
    if (controllerRef.current) controllerRef.current.abort();
  };

  const applyBurst = () => {
    setConcurrency(10);
    setDelayMs(0);
  };

  const copy = (text) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const keyStatus = apiKey
    ? `present (from ${auth.apiKeySource === "url" ? "?apiKey= URL param" : "localStorage"})`
    : "none";

  const cell = {
    padding: "4px 8px",
    borderBottom: "1px solid var(--ifm-table-border-color, #ddd)",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      <h1>API Key / Rate Limit Debugger</h1>
      <p>
        Spams the FastNear RPC from <strong>this</strong> browser origin so you can
        see how the edge treats keyed requests. The browser sets{" "}
        <code>Origin</code>/<code>Referer</code> automatically and JavaScript cannot
        override them, so this page tests the <em>legit on-origin UI</em> path. To
        simulate a <strong>lifted key</strong> used from elsewhere, copy the{" "}
        <code>hey</code> script below and run it on another machine.
      </p>

      <div
        style={{
          padding: "10px 14px",
          marginBottom: "1rem",
          borderRadius: 8,
          background: "var(--ifm-color-emphasis-100)",
          border: "1px solid var(--ifm-color-emphasis-300)",
        }}
      >
        <div>
          Browser origin sent on every request: <code style={mono}>{origin}</code>
        </div>
        <div>
          API key: <strong>{keyStatus}</strong>
        </div>
        <div style={{ fontSize: "0.85rem", marginTop: 6 }}>
          Tip: open <code>{`${origin}/debug?apiKey=YOUR_KEY&debug_retry=100`}</code>{" "}
          to auto-run 100 requests on load.
        </div>
        {autoRetry ? (
          <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
            Auto-running <strong>{autoRetry}</strong> requests from{" "}
            <code>?debug_retry</code>.
          </div>
        ) : null}
      </div>

      <ApiKeyManager />

      <h2>Request</h2>
      <div style={{ display: "grid", gap: "0.75rem", maxWidth: 760 }}>
        <label>
          <div>Endpoint preset</div>
          <select
            value={presetKey}
            onChange={(e) => setPresetKey(e.target.value)}
            style={{ width: "100%", padding: 6 }}
          >
            {Object.entries(PRESETS).map(([k, p]) => (
              <option key={k} value={k}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {presetKey === "custom" ? (
          <>
            <label>
              <div>URL</div>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{ width: "100%", padding: 6, ...mono }}
                placeholder="https://rpc.testnet.fastnear.com"
              />
            </label>
            <label>
              <div>Method</div>
              <select
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                style={{ padding: 6 }}
              >
                {["GET", "POST", "PUT", "DELETE", "HEAD"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            {customMethod !== "GET" && customMethod !== "HEAD" ? (
              <label>
                <div>Body</div>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: 6, ...mono }}
                />
              </label>
            ) : null}
          </>
        ) : (
          <div style={{ ...mono, fontSize: "0.85rem", color: "var(--ifm-color-emphasis-700)" }}>
            {effective.method} {effective.url}
            {effective.body ? ` — ${effective.body}` : ""}
          </div>
        )}

        <label>
          <div>Auth attachment</div>
          <select
            value={authMode}
            onChange={(e) => setAuthMode(e.target.value)}
            style={{ padding: 6 }}
          >
            <option value="bearer">Authorization: Bearer &lt;key&gt;</option>
            <option value="query">?apiKey=&lt;key&gt; query param</option>
            <option value="none">No key</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <label>
            <div>Requests</div>
            <input
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              style={{ width: 90, padding: 6 }}
            />
          </label>
          <label>
            <div>Concurrency</div>
            <input
              type="number"
              min={1}
              value={concurrency}
              onChange={(e) => setConcurrency(e.target.value)}
              style={{ width: 90, padding: 6 }}
            />
          </label>
          <label>
            <div>Delay (ms)</div>
            <input
              type="number"
              min={0}
              value={delayMs}
              onChange={(e) => setDelayMs(e.target.value)}
              style={{ width: 90, padding: 6 }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {!running ? (
            <button className="button button--primary" onClick={() => runTest()} type="button">
              Run
            </button>
          ) : (
            <button className="button button--danger" onClick={stopTest} type="button">
              Stop
            </button>
          )}
          <button
            className="button button--secondary"
            onClick={applyBurst}
            type="button"
            disabled={running}
          >
            Burst preset (×10, 0ms)
          </button>
          <button
            className="button button--secondary"
            onClick={() => setResults([])}
            type="button"
            disabled={running}
          >
            Clear results
          </button>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--ifm-color-warning-dark, #b8860b)" }}>
          ⚠ Each run consumes real rate-limit budget against this key.
        </p>
      </div>

      <h2>Off-origin / lifted-key test (run with hey elsewhere)</h2>
      <p style={{ fontSize: "0.9rem" }}>
        Origin/Referer restriction only binds real browsers. A non-browser client
        holding a lifted key <strong>can forge</strong> the <code>Origin</code>{" "}
        header — variant&nbsp;2 demonstrates that limitation. Run this where{" "}
        <a href="https://github.com/rakyll/hey">hey</a> is installed, then compare its
        status-code + latency summary against this page&apos;s results.
      </p>
      <pre style={{ ...mono, whiteSpace: "pre-wrap" }}>{heyScript}</pre>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="button button--secondary button--sm" onClick={() => copy(heyScript)} type="button">
          Copy hey script
        </button>
        <button className="button button--secondary button--sm" onClick={() => copy(curlCommand)} type="button">
          Copy single curl
        </button>
      </div>

      {results.length > 0 ? (
        <>
          <h2>Summary (this browser origin)</h2>
          <ul>
            <li>Total: {summary.total}</li>
            <li>
              By status:{" "}
              {Object.entries(summary.byStatus)
                .map(([k, v]) => `${k}×${v}`)
                .join(", ")}
            </li>
            <li>
              First 403:{" "}
              {summary.first403
                ? `request #${summary.first403.i} at ${summary.first403.atMs}ms`
                : "none"}
            </li>
            <li>
              First 429:{" "}
              {summary.first429
                ? `request #${summary.first429.i} at ${summary.first429.atMs}ms`
                : "none"}
            </li>
            <li>
              <strong>≈ Effective cap: {summary.ok2xx} successful</strong> before limits hit
              {authMode === "query"
                ? " — in ?apiKey= mode this approximates your tier's per-minute budget"
                : " — note: in Bearer mode the preflight throttle (~100/min) hits first; switch to ?apiKey= to measure the actual plan limit"}
            </li>
            <li>Elapsed: {summary.elapsedMs}ms · Achieved: {summary.rps.toFixed(2)} req/s</li>
            <li>
              Latency: avg {summary.avgMs}ms · p50 {summary.p50}ms · p95 {summary.p95}ms
            </li>
          </ul>

          {summary.byStatus.ERR ? (
            <div
              style={{
                padding: "10px 14px",
                margin: "0 0 1rem",
                borderRadius: 8,
                border: "1px solid var(--ifm-color-warning-dark, #b8860b)",
                background: "var(--ifm-color-warning-contrast-background, #fff8e1)",
                color: "var(--ifm-color-warning-contrast-foreground, #4d3800)",
              }}
            >
              <strong>{summary.byStatus.ERR} request(s) returned no readable status (“ERR”).</strong>{" "}
              This is a CORS limitation, not a bug in this page: when a preflight (<code>OPTIONS</code>)
              is rate-limited, the edge returns <code>429</code> <em>without</em>{" "}
              <code>access-control-allow-origin</code>, so the browser blocks the response and
              JavaScript cannot read its status — it surfaces as “Failed to fetch”. The HTTP status is{" "}
              <em>unrecoverable from the browser by design</em>.
              {authMode === "bearer" ? (
                <>
                  {" "}
                  To see real statuses, switch <strong>Auth attachment</strong> to{" "}
                  <code>?apiKey=</code> below (the preflight URL then contains <code>apiKey=</code> and
                  is not caught by the anonymous per-IP rule), or fix it at the edge: exempt{" "}
                  <code>OPTIONS</code> from the anonymous rule, add <code>access-control-max-age</code>,
                  and return CORS headers on error responses.
                </>
              ) : null}
            </div>
          ) : null}

          <h2>Results</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--ifm-color-emphasis-700)" }}>
            Status code and body are reliable. <code>x-rate-limit-score</code>,{" "}
            <code>cf-ray</code> and <code>retry-after</code> are only visible if the
            server exposes them via <code>Access-Control-Expose-Headers</code> —
            otherwise they read as <code>—</code>. Browser latencies include CORS
            preflight; <code>hey</code> latencies do not.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ ...mono, fontSize: "0.8rem", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "t+ms", "status", "class", "dur", "score", "cf-ray", "retry", "body"].map(
                    (h) => (
                      <th key={h} style={{ ...cell, textAlign: "left" }}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.i}>
                    <td style={cell}>{r.i}</td>
                    <td style={cell}>{r.atMs}</td>
                    <td style={{ ...cell, color: rowColor(r), fontWeight: 600 }}>
                      {r.status == null ? "ERR" : r.status}
                    </td>
                    <td style={cell}>{r.classification}</td>
                    <td style={cell}>{r.durationMs}</td>
                    <td style={cell}>{r.score || "—"}</td>
                    <td style={cell}>{r.cfRay || "—"}</td>
                    <td style={cell}>{r.retryAfter || "—"}</td>
                    <td style={{ ...cell, whiteSpace: "normal", maxWidth: 360 }}>
                      {r.bodySnippet}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
