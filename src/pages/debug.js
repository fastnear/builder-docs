import React from "react";
import Layout from "@theme/Layout";
import Head from "@docusaurus/Head";
import BrowserOnly from "@docusaurus/BrowserOnly";

// Hidden internal tool. Not linked from any nav/sidebar/footer and excluded from
// the sitemap (see docusaurus.config.js). The `noindex` meta keeps it out of
// search engines; the local search theme already uses `indexPages: false`.
export default function DebugPage() {
  return (
    <Layout title="Debug — API Key / Rate Limit Tester">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="container margin-vert--lg">
        <BrowserOnly fallback={<p>Loading debugger…</p>}>
          {() => {
            const RateLimitDebugger =
              require("@site/src/components/RateLimitDebugger").default;
            return <RateLimitDebugger />;
          }}
        </BrowserOnly>
      </main>
    </Layout>
  );
}
