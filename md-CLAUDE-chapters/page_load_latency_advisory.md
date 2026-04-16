# Page-Load Latency Advisory

_A portable playbook for reducing first-load JS weight on a modern docs or
marketing site. Written after a Docusaurus + React 18 engagement that moved an
Algolia-mode entry bundle from 268 KB gz → 127 KB gz (-53 %); the patterns
below also apply to NextJS (App Router or Pages Router) and to any
React/Vite/webpack site that ships a single entry chunk._

The scenario this is written for: you (or someone on your team) notices a
page-load metric in production that feels slow — Cloudflare Web Analytics
showing 5-6 s on average, Real User Monitoring LCP drifting up, Lighthouse
mobile dropping below 0.7. You want to know whether the number is real,
what to do about it, and how to know when you're done.

---

## 0. Keep one rule in view

**Claim = evidence × reproducibility.** Every size or timing claim in this
document should be something you can reproduce on your laptop in under five
minutes. If a win can't be reproduced, you didn't land a win — you landed a
measurement artefact.

Corollary: when a teammate hands you an investigation memo, treat every
claim inside it as a hypothesis until you re-measure. The most expensive
debugging happens on top of a false premise. (See §4 Pitfalls for the
actual example this bit me on.)

---

## 1. First: is the metric real?

Before editing any code, cross-reference at least three independent
sources. If they all point the same direction, you have a real problem.
If they disagree, the disagreement itself is the investigation.

For page-load latency, the three sources I use are:

1. **The aggregate metric from production.** Cloudflare Web Analytics
   `Page Load`, Sentry Web Vitals, RUM. Gives you the distribution and
   the trend, not the root cause.
2. **Lab-controlled Lighthouse.** Run it mobile-emulated against the
   production URL. Capture FCP, LCP, TBT, transferred JS, unused JS,
   the first-load request waterfall. Rule: if the prod aggregate says
   slow and Lighthouse says fine, you're probably looking at a long-tail
   geography/device problem, not a bundle problem. If both say slow, the
   bundle is a candidate.
3. **Static inspection of the built site.** `curl -sL https://your.site |
   grep -oE '<script[^>]*src="[^"]*"'` plus `wc -c` and `gzip -c … | wc -c`
   on every script the HTML loads. If main.js dwarfs everything else in
   the first-paint critical path, you have a bundle-shape problem.

Document these three numbers before you touch anything. The diff between
them narrates the problem. In the engagement this was written after:

- Cloudflare: ~5.8 s average page load.
- Lighthouse mobile on `/`: FCP 4.0 s, LCP 5.5 s, Performance 0.65.
- `main.js`: 980 KB raw / 268 KB gz on the homepage first-paint path.

Three independent pointers at "mobile first-load JS is heavier than it
should be." That's a real problem.

---

## 2. Get a real bundle map before guessing

Reading the minified entry bundle with your eyes does not scale. Use
the tool.

### webpack (Docusaurus / CRA / bespoke)

Install `webpack-bundle-analyzer` if you don't already have it. The
default mode opens a browser — that's hostile to headless runs. Make
it write a static HTML + machine-readable stats file instead:

```js
// Inside a plugin invoked from your webpack/docusaurus config
new BundleAnalyzerPlugin({
  analyzerMode: 'static',
  reportFilename: '/tmp/bundle.html',
  openAnalyzer: false,
  generateStatsFile: true,
  statsFilename: '/tmp/stats.json',
});
```

Gate it on an env var so CI doesn't always pay for it:

```
BUNDLE_REPORT_PATH=/tmp/bundle.html \
BUNDLE_STATS_PATH=/tmp/stats.json \
yarn build --locale en
```

### NextJS

`@next/bundle-analyzer`, wrapped into `next.config.js`:

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(/* your config */);
```

```
ANALYZE=true next build
```

Next also gives you `next build`'s per-route "First Load JS" table at the
end of the build. Scan the routes where First Load JS is biggest; those
are the entry points for shedding weight.

### Read the stats file like a database

Don't eyeball the treemap. Parse `stats.json` to get real numbers. One
short Python script against webpack stats:

```python
import json, collections
s = json.load(open('stats.json'))
main = next(c for c in s['chunks'] if c['names'] == ['main'])
by_pkg = collections.Counter()
for m in s['modules']:
    if main['id'] not in (m.get('chunks') or []): continue
    name = m.get('name') or ''
    if 'node_modules/' in name:
        rest = name.split('node_modules/', 1)[1]
        pkg = '/'.join(rest.split('/', 2)[:2]) if rest.startswith('@') else rest.split('/', 1)[0]
    else:
        pkg = '(app)'
    by_pkg[pkg] += m.get('size') or 0
for pkg, size in by_pkg.most_common(15):
    print(f'{size:>9}  {pkg}')
```

The output is your ranked shopping list. Everything else in this chapter
is about what to do once you're staring at that list.

---

## 3. Pattern: "the static import that dragged a lazy module into main"

This is, by a wide margin, the most common anti-pattern I find in
webpack/Next bundles that "should be" light.

Symptom: the bundle analyzer shows a module you expected to be lazy —
like `@docsearch/react/Sidepanel.js`, or a heavy icon set, or a markdown
editor — sitting inside your `main.js` / `pages/_app.js` chunk.

Cause: somewhere upstream, a file you _do_ statically import re-exports
or statically imports the heavy thing. Webpack/Next can't split a module
that's reachable from the entry via a purely static import chain. The
lazy `import()` you wrote for the same module gets merged with the
static reference, and the whole thing ends up in the entry chunk.

### How to find it

From the stats file, pick the module you're surprised to see in main.
Look at its `reasons` array (webpack stats exposes this). The "harmony
import specifier" reason tells you exactly which module caused the
inclusion. Walk that chain upward until you hit an import you control.

### How to fix it

Break the static chain. Replace one of the upstream imports with a
dynamic one. Two idioms:

```js
// React
const Heavy = React.lazy(() => import('./Heavy'));
// usage (must be under a Suspense boundary)
<Suspense fallback={<Shell />}><Heavy /></Suspense>
```

```js
// NextJS
import dynamic from 'next/dynamic';
const Heavy = dynamic(() => import('./Heavy'), {
  loading: () => <Shell />,
  ssr: false, // if hydration mismatch is a concern
});
```

Verify with the bundle analyzer after the change. The module you cared
about should be in its own chunk; main.js should shrink by approximately
the module's minified+gzipped size.

**Concrete example from the Docusaurus engagement.** The Algolia DocSearch
adapter's SearchBar did `import { SidepanelButton } from
'@docsearch/react/sidepanel'`. Our swizzle statically imported that
SearchBar as a fallback for the non-Algolia path. The full Sidepanel
module (380 KB raw) ended up in main.js on every page load, even though
we rendered a different component (LazyAlgoliaSearchBar) in Algolia
mode. Wrapping the fallback in `React.lazy` dropped main.js by 102 KB
gzipped. Hours of investigation; five lines of code to fix.

---

## 4. Pattern: "config-time data embedded in a runtime config object"

Symptom: your bundle analyzer shows that `siteConfig`, `themeConfig`,
`publicRuntimeConfig`, or an equivalent global is a surprising fraction
of your main chunk.

Cause: at build time, you attached a large pre-computed data structure
to the config object because "it's cached there and every page needs
it." It's now serialized into every page's first-load bundle.

### How to find it

If your bundle tool supports generated files, inspect
`.docusaurus/docusaurus.config.mjs` (or `.next/build-manifest.json`,
NextJS equivalents). Measure each top-level key's character count.
Anything over 20 KB is worth a hard look.

### How to fix it

Move the data to a sibling JSON file that your runtime code
dynamic-imports only at the point of use. On Docusaurus:

```js
// In docusaurus.config.js (config load time)
fs.writeFileSync(
  'src/data/generatedFoo.json',
  JSON.stringify(computedLargeThing)
);

// In the component that actually needs it (render time)
async function loadFoo() {
  const mod = await import('@site/src/data/generatedFoo.json');
  return mod.default ?? mod;
}
```

In NextJS, write the JSON during `getStaticProps` or via a build script,
and fetch it at runtime (RSC, client component, or `dynamic` import).
Critically: **don't pass the data through `publicRuntimeConfig` or
`serverRuntimeConfig` thinking it'll be kept server-side** — anything
in `publicRuntimeConfig` ships to the client.

**Concrete example.** Six `docSidebar` items in our navbar each carried
a fully-resolved mobile-menu tree (`mobileSidebarItemsByLocale`) — about
52 KB raw / 10 KB gz of `themeConfig` in main.js. Moved the tree into a
generated JSON file, dynamic-imported on pointer-enter/click from the
mobile navbar component. Desktop users — the majority on a docs site —
stopped paying for mobile menu data.

---

## 5. Pattern: "the clientModule that imported the world"

This one is framework-specific. Both Docusaurus and NextJS let you
register code that runs on every client boot (Docusaurus `clientModules`,
NextJS `_app.js` / `layout.tsx` modules). Teams use them for analytics,
theme setup, polyfills. They're also a silent path for dragging entire
libraries into main.js.

Symptom: a library you "never explicitly imported" from your own code
shows up in main. When you trace reasons, the root is a framework
bootstrap file.

### How to find it

In Docusaurus, inspect `.docusaurus/client-modules.js` — it lists every
module that runs on boot. Walk each for `import` statements.

In NextJS App Router, look at `app/layout.tsx`, `app/providers.tsx`,
any `app/*/layout.tsx` shared with the route you're auditing. Pages
Router: `pages/_app.tsx`. Also any middleware or instrumentation.

### How to fix it

Three techniques, in order of increasing heavy-handedness:

1. **Dynamic-import inside the clientModule.** If the module only needs
   the heavy library _conditionally_ (e.g., only on routes with code
   blocks), gate the import behind a runtime check.
2. **Defer the whole clientModule.** If it only needs to run once per
   session and not before first paint, move it into a
   `requestIdleCallback` wrapper or a `useEffect` inside a top-level
   component.
3. **Replace the module with a no-op at bundle time.** This is a
   hammer; reach for it only when you're certain the module is a pure
   no-op at runtime and the import graph is what's expensive.

   ```js
   // webpack configureWebpack / NormalModuleReplacementPlugin equivalent
   resolve: {
     alias: {
       [require.resolve('heavy-clientmodule')]:
         require.resolve('./src/clientModules/noop.js'),
     },
   },
   ```

   **Only do this with a clear, in-file comment explaining which config
   flags make the module a no-op and what would need to change to revert.**
   Silent regressions here (e.g., someone adds a config flag later) fail
   in subtle ways.

**Concrete example.** Docusaurus's theme-classic registers a
`prism-include-languages` clientModule that imports all of
`prism-react-renderer` (135 KB raw / ~30 KB gz) just to iterate a
`themeConfig.prism.additionalLanguages` array. We had no additional
languages configured, so the module was a runtime no-op. A
`resolve.alias` to an empty module shed the whole dependency from main.

---

## 6. Pattern: the SSR-vs-CSR hydration trap

Once you start lazy-loading things that were previously static, you
risk hydration mismatches. The symptoms are subtle:

- Playwright tests start flaking with "element was detached from the
  DOM, retrying" — because React commits a Suspense boundary during
  hydration and elements above/beside it briefly re-mount.
- React 18's dev mode logs hydration warnings (but prod swallows them).
- A tiny percentage of users hit pages with unstyled content that
  suddenly pops into styled state.

### Three things that together make this safe

1. **Make the fallback render the same shape as the real thing.**
   If the real component wires a ref (like `wordWrap.codeBlockRef` in
   Docusaurus's CodeBlock), the fallback must wire the same ref. If
   the real component sets a class, the fallback should set it too —
   otherwise parent layout changes on swap.
2. **Decide your SSR story.** Either:
   a. Let React.lazy resolve on the server (it does if the module is
      available synchronously in Node — often true for webpack-emitted
      dynamic chunks). SSR produces the real HTML; hydration replays it.
   b. Wrap in `BrowserOnly` (Docusaurus) or `dynamic(..., { ssr: false })`
      (NextJS) and render the fallback on SSR. CSR hydrates the
      fallback, then lazy-resolves to the real thing.

   Option (a) is faster on first paint; option (b) is bulletproof
   against hydration mismatches. Pick one intentionally per boundary.
3. **Write the hydration test.** A Playwright spec that:
   - Loads the route.
   - Collects `console` warnings and `pageerror` events.
   - Asserts zero entries match `/hydrat|did not match|expected server HTML/i`.
   - Asserts the element you expected is visible after hydration.

   Run this spec for every locale and for every route where you
   introduced a lazy boundary. Cost: 20 minutes to write; blast radius
   of a silent hydration regression: hours of user-visible weirdness.

---

## 7. Pattern: the "bundle trim that wasn't"

Sometimes the big measured savings from a change don't show up in the
built bundle. Root causes are usually one of:

- **Two code paths were reaching the module.** You fixed one; the other
  still pulls it in. Example: both `CodeBlock/Content` and
  `prism-include-languages.js` imported `prism-react-renderer`. Only
  after BOTH were dynamic/no-op'd did prism leave main.
- **Tree-shaking was already doing its job.** Your "win" was a
  regression you just happened to undo. This is why step 1 in this
  chapter (three independent measurements before touching code) matters.
  If you can't see the savings in a fresh build vs a fresh baseline,
  you didn't land a win.
- **The bundler put the module in a "common" chunk instead of "main".**
  Your route manifest still loads the common chunk on first paint, so
  the byte cost is identical. Check webpack's `splitChunks.cacheGroups`
  or Next's bundle output to confirm where things landed.

---

## 8. Pattern: "we've been synthesizing bold"

Not strictly a bundle-size issue but a first-paint correctness issue:
your `@font-face` declarations promise browsers weights (500, 600, 700)
that aren't backed by real font files. Browser synthesizes them — that's
faux-bold rendering, and it looks subtly wrong on headings and buttons.

### How to find it

```bash
grep -A4 'font-weight:' src/**/*.css | rg 'src:.*woff2?'
```

For every `@font-face`, cross-reference the `font-weight` against the
file it `src:` to. If the file name doesn't encode the weight, open it
and check (or inspect the build output in DevTools — Chrome flags
"synthetic bold" in the Font panel).

### How to fix

Two options:

- Source the missing weight files. For Google Fonts via npm, `@fontsource/…`
  (static weights) or `@fontsource-variable/…` (one variable file per
  family). Variable fonts swap N static files for one with weight `100
  1000`; on a page that uses more than one weight, you save transfer
  bytes too.
- Delete the CSS declarations for weights you don't actually use. If
  `grep -r 'font-weight: 500' src/` returns nothing, stop claiming a 500
  face.

Self-host either way. Google Fonts on the render path adds DNS +
third-party round-trips.

---

## 9. Pattern: "one chunk per visitor"

Check which JS files the HTML actually loads on first paint. This is
the floor for how much work a first-time visitor does.

```bash
curl -sL https://your.site/ | grep -oE '<script[^>]*src="[^"]*"'
```

If the answer is `main.js + runtime~main.js`, every byte you shed from
`main.js` helps every first-time visitor — no code-splitting
calculus. If the answer is also `chunk-A.js + chunk-B.js + chunk-C.js`,
those are route-specific chunks on the critical path, and you should
measure their cost too.

**This is where the rewards compound.** On the engagement: the homepage
loaded exactly `main.js + runtime~main.js`. A 100 KB gz trim on main.js
was a 100 KB gz trim on every first-time visit to every page. Three
weeks of payoff.

---

## 10. Don't trust a win without a regression guardrail

The fastest way to lose a hard-won trim is to re-introduce the
dependency a month later. Guardrails:

- **CI bundle-size gate.** GitHub Action that builds the site, runs the
  bundle analyzer, and asserts `main.js` gzipped size is below a
  threshold. Fail the PR if it regresses. Store the number in-tree
  (`bundle-budget.json`) and bump it consciously.
- **Playwright smoke for every lazy boundary.** One test per boundary
  that loads a route, clicks the thing that triggers the lazy load,
  and asserts no hydration warnings and the expected content rendered.
- **A short "why is this lazy" comment in the swizzle or the webpack
  config.** When a future maintainer asks "can I just static-import
  this?", the answer needs to be right there, not buried in a PR body.

---

## 11. NextJS-specific appendix

The same patterns; different knobs.

- **Don't reach for `dynamic()` reflexively.** NextJS 13+ with RSC
  already keeps server components off the client bundle. If your
  component does not import browser-only libraries and does not use
  hooks, make it a server component and you pay zero JS for it. This
  is a bigger lever than `dynamic` in most cases.
- **`ssr: false` costs you LCP.** `dynamic(..., { ssr: false })` skips
  SSR for that subtree; the content renders only after hydration.
  Acceptable for _truly_ interactive widgets (analytics panels, CMS
  editors), not for hero copy.
- **"Use client" directive boundaries matter.** Every `"use client"`
  file is a potential entry into the client bundle. If you have a
  "use client" layout near the root, everything below it ships to the
  client. Prefer small, leaf-level client components.
- **Font subset the right way.** `next/font/google` is the default;
  check that it's generating one WOFF2 per subset you actually use, not
  the full Latin + Latin-ext + Cyrillic + Vietnamese pack by default.
- **`@next/bundle-analyzer` is your friend.** The per-route "First Load
  JS" table at the end of `next build` is the easiest starting point;
  the HTML treemap is the deep dive.
- **Server Actions + RSC shift the bundle surface.** A button that
  previously needed a fat client component to POST to an API now ships
  almost nothing. Review your existing client components periodically
  for candidates to demote to RSC.

---

## 12. Order of operations

When you start an audit like this, go in this order. Each step is
cheap; the earlier steps often make later steps unnecessary.

1. **Verify the metric.** §1.
2. **Map the bundle.** §2.
3. **Audit for static-import leaks.** §3.
4. **Audit for config-bloat.** §4.
5. **Audit for clientModule-world imports.** §5.
6. **Ship one trim. Measure. Commit.** Then repeat.
7. **Write the hydration test.** §6.
8. **Write the CI guardrail.** §10.
9. **Polish fonts / CSS.** §8.

Resist the urge to batch. A single trim that lands with a clean measurement
and a playwright test is worth ten speculative changes that "feel faster."

---

## 13. When to stop

You're done when:

- `main.js` raw size stops dropping despite continued work.
- The remaining dominant modules in main are things you actually can't
  remove (React, the routing library, your design system core).
- Lighthouse mobile shows FCP < 2 s and LCP < 2.5 s on the pages you
  care about most.
- Playwright hydration suite passes on every locale.
- Your CI has a bundle-size gate that will tell you when this
  regresses.

And then write this down somewhere, because three months from now,
someone on your team will open a PR that adds `import { Heavy } from
'big-thing'` to a top-level file, and the only thing between that PR
and a quiet 50 KB gz regression is a CI check and a reviewer who
remembers this document.

---

_Drafted after the `address-page-load-latency` branch reduced the
Algolia-mode entry bundle from 268 KB gz to 127 KB gz across eight
focused commits. Total time from starting the audit to the last commit:
one long afternoon. The patterns are simple; the hard part is
discipline about measurement and scope._
