import React, { useEffect, useState } from 'react';

import berryClubSnapshots from '@site/src/data/berryClubSnapshots.json';
import styles from './styles.module.css';

const RPC_URL = 'https://rpc.mainnet.fastnear.com';
const CONTRACT_ID = 'berryclub.ek.near';
const BOARD_SIZE = 50;
const DEFAULT_FALLBACK_SNAPSHOT =
  berryClubSnapshots.snapshots.find((snapshot) => snapshot.id === 'recent') ||
  null;

function colorToHex(color) {
  return `#${Number(color).toString(16).padStart(6, '0').slice(-6)}`;
}

function encodeArgsBase64(args) {
  return btoa(JSON.stringify(args));
}

function decodeJsonBytes(bytes) {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bytes)));
}

function decodeLine(encodedLine) {
  const binary = atob(encodedLine);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const colors = [];

  for (let offset = 4; offset + 4 <= bytes.length; offset += 8) {
    colors.push(view.getUint32(offset, true) & 0xffffff);
  }

  while (colors.length < BOARD_SIZE) {
    colors.push(0);
  }

  return colors.slice(0, BOARD_SIZE);
}

function decodeBoard(lines) {
  const decodedLines = lines.slice(0, BOARD_SIZE).map(decodeLine);

  while (decodedLines.length < BOARD_SIZE) {
    decodedLines.push(Array(BOARD_SIZE).fill(0));
  }

  return decodedLines;
}

async function fetchLiveBoard() {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'berry-live-board',
      method: 'query',
      params: {
        request_type: 'call_function',
        finality: 'final',
        account_id: CONTRACT_ID,
        method_name: 'get_lines',
        args_base64: encodeArgsBase64({
          lines: Array.from({ length: BOARD_SIZE }, (_, index) => index),
        }),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed with ${response.status}`);
  }

  const payload = await response.json();

  if (payload.error) {
    throw new Error(payload.error.message || 'RPC returned an error');
  }

  const result = payload.result;

  return {
    board: decodeBoard(decodeJsonBytes(result.result)),
    blockHeight: result.block_height,
    blockHash: result.block_hash,
  };
}

function Board({ board, title }) {
  return (
    <div className={styles.board} aria-label={title}>
      {board.flat().map((color, index) => (
        <div
          key={index}
          className={styles.pixel}
          style={{ backgroundColor: colorToHex(color) }}
        />
      ))}
    </div>
  );
}

export default function BerryClubLiveBoard({
  fallbackSnapshot,
  title,
  uiText = {},
}) {
  const resolvedFallbackSnapshot = fallbackSnapshot || DEFAULT_FALLBACK_SNAPSHOT;
  const resolvedUiText = {
    title: uiText.title || 'Live Berry Club board',
    blockHeightLabel: uiText.blockHeightLabel || 'Block',
    blockHashLabel: uiText.blockHashLabel || 'Block hash',
    sourceLabel: uiText.sourceLabel || 'Source',
    sourceValue: uiText.sourceValue || 'Mainnet RPC `get_lines`',
    loadingLabel: uiText.loadingLabel || 'Loading live board...',
    refreshingLabel:
      uiText.refreshingLabel || 'Refreshing live board from RPC...',
    fallbackLabel:
      uiText.fallbackLabel ||
      'Showing the latest saved snapshot while the live RPC read updates.',
    errorLabel: uiText.errorLabel || 'Live RPC read failed.',
    emptyLabel: uiText.emptyLabel || 'No board data available yet.',
  };

  const [board, setBoard] = useState(resolvedFallbackSnapshot?.board || null);
  const [blockHeight, setBlockHeight] = useState(
    resolvedFallbackSnapshot?.blockHeight || null
  );
  const [blockHash, setBlockHash] = useState(null);
  const [status, setStatus] = useState(
    resolvedFallbackSnapshot ? 'refreshing' : 'loading'
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    fetchLiveBoard()
      .then((result) => {
        if (!active) {
          return;
        }

        setBoard(result.board);
        setBlockHeight(result.blockHeight);
        setBlockHash(result.blockHash);
        setStatus('ready');
        setError(null);
      })
      .catch((fetchError) => {
        if (!active) {
          return;
        }

        setError(fetchError.message);
        setStatus(resolvedFallbackSnapshot ? 'fallback' : 'error');
      });

    return () => {
      active = false;
    };
  }, [resolvedFallbackSnapshot]);

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>{title || resolvedUiText.title}</h2>
          <dl className={styles.metaList}>
            <div className={styles.metaItem}>
              <dt>{resolvedUiText.sourceLabel}</dt>
              <dd>{resolvedUiText.sourceValue}</dd>
            </div>
            {blockHeight ? (
              <div className={styles.metaItem}>
                <dt>{resolvedUiText.blockHeightLabel}</dt>
                <dd>{blockHeight}</dd>
              </div>
            ) : null}
            {blockHash ? (
              <div className={styles.metaItem}>
                <dt>{resolvedUiText.blockHashLabel}</dt>
                <dd className={styles.hashValue}>{blockHash}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className={styles.statusBlock}>
          {status === 'loading' ? (
            <p className={styles.status}>{resolvedUiText.loadingLabel}</p>
          ) : null}
          {status === 'refreshing' ? (
            <>
              <p className={styles.status}>{resolvedUiText.refreshingLabel}</p>
              <p className={styles.helper}>{resolvedUiText.fallbackLabel}</p>
            </>
          ) : null}
          {status === 'fallback' ? (
            <>
              <p className={styles.status}>{resolvedUiText.errorLabel}</p>
              <p className={styles.helper}>{resolvedUiText.fallbackLabel}</p>
            </>
          ) : null}
          {status === 'error' ? (
            <>
              <p className={styles.status}>{resolvedUiText.errorLabel}</p>
              {error ? <p className={styles.helper}>{error}</p> : null}
            </>
          ) : null}
        </div>
      </div>

      {board ? (
        <Board board={board} title={title || resolvedUiText.title} />
      ) : (
        <div className={styles.emptyBoard}>{resolvedUiText.emptyLabel}</div>
      )}
    </section>
  );
}
