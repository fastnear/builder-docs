import React, { useEffect } from "react";
import Head from "@docusaurus/Head";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import FastnearDirectOperation from "@site/src/components/FastnearDirectOperation";
import { getFastnearPageModelById } from "@site/src/components/FastnearDirectOperation/pageModels";
import { buildHostedOperationStructuredData } from "@site/src/utils/structuredData";

function useEmbedAutoHeight() {
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) {
      return undefined;
    }

    let frameId = 0;
    let lastHeight = 0;

    const postHeight = () => {
      const nextHeight = Math.ceil(
        Math.max(
          document.documentElement?.scrollHeight || 0,
          document.body?.scrollHeight || 0,
          document.documentElement?.offsetHeight || 0,
          document.body?.offsetHeight || 0
        )
      );

      if (!nextHeight || Math.abs(nextHeight - lastHeight) < 2) {
        return;
      }

      lastHeight = nextHeight;
      window.parent.postMessage(
        {
          type: "fastnear-docs:resize",
          height: nextHeight,
          pathname: window.location.pathname,
        },
        "*"
      );
    };

    const schedulePost = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(postHeight);
    };

    schedulePost();

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedulePost) : undefined;
    observer?.observe(document.documentElement);
    if (document.body) {
      observer?.observe(document.body);
    }

    window.addEventListener("load", schedulePost);
    window.addEventListener("resize", schedulePost);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      observer?.disconnect();
      window.removeEventListener("load", schedulePost);
      window.removeEventListener("resize", schedulePost);
    };
  }, []);
}

function useColorSchemaParam() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const colorSchema = new URLSearchParams(window.location.search).get("colorSchema");
    if (colorSchema !== "dark" && colorSchema !== "light") {
      return undefined;
    }

    const previousTheme = document.documentElement.getAttribute("data-theme");
    const previousChoice = document.documentElement.getAttribute("data-theme-choice");

    document.documentElement.setAttribute("data-theme", colorSchema);
    document.documentElement.setAttribute("data-theme-choice", colorSchema);

    return () => {
      if (previousTheme) {
        document.documentElement.setAttribute("data-theme", previousTheme);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }

      if (previousChoice) {
        document.documentElement.setAttribute("data-theme-choice", previousChoice);
      } else {
        document.documentElement.removeAttribute("data-theme-choice");
      }
    };
  }, []);
}

export default function FastnearHostedOperationPage({ pageModelId }) {
  const pageModel = getFastnearPageModelById(pageModelId);
  const { siteConfig } = useDocusaurusContext();
  const structuredData = buildHostedOperationStructuredData({ pageModelId, siteConfig });

  useEmbedAutoHeight();
  useColorSchemaParam();

  return (
    <div className="fastnear-docs-host-page">
      <Head>
        <title>{pageModel?.info?.title || "FastNear Docs"}</title>
        <meta name="robots" content="noindex" />
        {structuredData?.structuredData ? (
          <script type="application/ld+json">
            {JSON.stringify(structuredData.structuredData)}
          </script>
        ) : null}
        {structuredData?.breadcrumbStructuredData ? (
          <script type="application/ld+json">
            {JSON.stringify(structuredData.breadcrumbStructuredData)}
          </script>
        ) : null}
      </Head>
      <FastnearDirectOperation pageModelId={pageModelId} />
    </div>
  );
}
