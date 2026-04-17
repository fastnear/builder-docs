import React, { useEffect, useMemo, useRef } from "react";

function scrollResponseMatchIntoView(activeMatchElement) {
  if (!activeMatchElement) {
    return;
  }

  const scrollContainer = activeMatchElement.closest("[data-fastnear-response-scroll-container]");
  if (!scrollContainer) {
    activeMatchElement.scrollIntoView({
      block: "center",
      inline: "nearest",
    });
    return;
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const matchRect = activeMatchElement.getBoundingClientRect();
  const nextTop =
    scrollContainer.scrollTop +
    (matchRect.top - containerRect.top) -
    scrollContainer.clientHeight / 2 +
    matchRect.height / 2;

  scrollContainer.scrollTo({
    top: Math.max(0, nextTop),
    behavior: "auto",
  });
}

function tokenizeJsonText(text) {
  const tokens = [];
  let cursor = 0;

  while (cursor < text.length) {
    const character = text[cursor];

    if (/\s/.test(character)) {
      let end = cursor + 1;
      while (end < text.length && /\s/.test(text[end])) {
        end += 1;
      }
      tokens.push({ end, start: cursor, type: "plain" });
      cursor = end;
      continue;
    }

    if (character === '"') {
      let end = cursor + 1;
      let escaped = false;
      while (end < text.length) {
        const nextCharacter = text[end];
        if (escaped) {
          escaped = false;
          end += 1;
          continue;
        }
        if (nextCharacter === "\\") {
          escaped = true;
          end += 1;
          continue;
        }
        if (nextCharacter === '"') {
          end += 1;
          break;
        }
        end += 1;
      }

      let lookahead = end;
      while (lookahead < text.length && /\s/.test(text[lookahead])) {
        lookahead += 1;
      }

      tokens.push({
        end,
        start: cursor,
        type: text[lookahead] === ":" ? "key" : "string",
      });
      cursor = end;
      continue;
    }

    const numberMatch = text.slice(cursor).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (numberMatch) {
      const end = cursor + numberMatch[0].length;
      tokens.push({ end, start: cursor, type: "number" });
      cursor = end;
      continue;
    }

    if (text.startsWith("true", cursor) || text.startsWith("false", cursor)) {
      const literal = text.startsWith("true", cursor) ? "true" : "false";
      tokens.push({
        end: cursor + literal.length,
        start: cursor,
        type: "boolean",
      });
      cursor += literal.length;
      continue;
    }

    if (text.startsWith("null", cursor)) {
      tokens.push({
        end: cursor + 4,
        start: cursor,
        type: "null",
      });
      cursor += 4;
      continue;
    }

    if (/^[\[\]{}:,]$/.test(character)) {
      tokens.push({
        end: cursor + 1,
        start: cursor,
        type: "punctuation",
      });
      cursor += 1;
      continue;
    }

    tokens.push({
      end: cursor + 1,
      start: cursor,
      type: "plain",
    });
    cursor += 1;
  }

  return tokens;
}

function renderTokenRange(text, tokens, rangeStart, rangeEnd, keyPrefix) {
  const children = [];
  let tokenIndex = 0;

  while (tokenIndex < tokens.length && tokens[tokenIndex].end <= rangeStart) {
    tokenIndex += 1;
  }

  while (tokenIndex < tokens.length) {
    const token = tokens[tokenIndex];
    if (token.start >= rangeEnd) {
      break;
    }

    const sliceStart = Math.max(rangeStart, token.start);
    const sliceEnd = Math.min(rangeEnd, token.end);
    const sliceText = text.slice(sliceStart, sliceEnd);

    if (sliceText) {
      children.push(
        token.type === "plain" ? (
          <React.Fragment key={`${keyPrefix}-${sliceStart}-${sliceEnd}`}>
            {sliceText}
          </React.Fragment>
        ) : (
          <span
            key={`${keyPrefix}-${sliceStart}-${sliceEnd}`}
            className={`fastnear-json-token fastnear-json-token--${token.type}`}
          >
            {sliceText}
          </span>
        )
      );
    }

    tokenIndex += 1;
  }

  return children;
}

export default function FastnearJsonResponseText({
  activeMatchIndex = -1,
  className = "",
  matches = [],
  text,
}) {
  const activeMatchRefs = useRef([]);
  const tokens = useMemo(() => tokenizeJsonText(text), [text]);

  useEffect(() => {
    if (activeMatchIndex < 0 || activeMatchIndex >= matches.length) {
      return;
    }

    scrollResponseMatchIntoView(activeMatchRefs.current[activeMatchIndex]);
  }, [activeMatchIndex, matches.length]);

  if (!matches.length) {
    return <pre className={className}>{renderTokenRange(text, tokens, 0, text.length, "full")}</pre>;
  }

  const children = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      children.push(...renderTokenRange(text, tokens, cursor, match.start, `gap-${cursor}`));
    }

    const isActive = index === activeMatchIndex;
    children.push(
      <mark
        key={`response-match-${match.start}-${match.end}`}
        ref={(element) => {
          activeMatchRefs.current[index] = element;
        }}
        className={`fastnear-interaction__response-match ${isActive ? "is-active" : ""}`}
        data-fastnear-response-match-index={index}
        data-fastnear-response-match-active={isActive ? "true" : "false"}
      >
        {renderTokenRange(text, tokens, match.start, match.end, `match-${index}`)}
      </mark>
    );
    cursor = match.end;
  });

  if (cursor < text.length) {
    children.push(...renderTokenRange(text, tokens, cursor, text.length, `tail-${cursor}`));
  }

  return <pre className={className}>{children}</pre>;
}
