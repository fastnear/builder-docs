import React from 'react';

import styles from './styles.module.css';

function colorToHex(color) {
  return `#${Number(color).toString(16).padStart(6, '0').slice(-6)}`;
}

function SnapshotCard({ snapshot, label, uiText }) {
  const hashPreview = `${snapshot.txHash.slice(0, 8)}...${snapshot.txHash.slice(-8)}`;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{label}</h3>
        <dl className={styles.metaList}>
          <div className={styles.metaItem}>
            <dt>{uiText.blockHeightLabel}</dt>
            <dd>{snapshot.blockHeight}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>{uiText.timestampLabel}</dt>
            <dd>{snapshot.timestamp}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>{uiText.txHashLabel}</dt>
            <dd className={styles.hashValue} title={snapshot.txHash}>
              {hashPreview}
            </dd>
          </div>
        </dl>
      </div>

      <div className={styles.board} aria-label={`${label} Berry Club board snapshot`}>
        {snapshot.board.flat().map((color, index) => (
          <div
            key={`${snapshot.id}-${index}`}
            className={styles.pixel}
            style={{ backgroundColor: colorToHex(color) }}
          />
        ))}
      </div>
    </article>
  );
}

export default function BerryClubSnapshotGallery({
  snapshots,
  labels = {},
  uiText = {},
}) {
  const resolvedUiText = {
    blockHeightLabel: uiText.blockHeightLabel || 'Block',
    timestampLabel: uiText.timestampLabel || 'Time',
    txHashLabel: uiText.txHashLabel || 'Transaction',
  };

  return (
    <div className={styles.gallery}>
      {snapshots.map((snapshot) => (
        <SnapshotCard
          key={snapshot.id}
          snapshot={snapshot}
          label={labels[snapshot.id] || snapshot.label || snapshot.id}
          uiText={resolvedUiText}
        />
      ))}
    </div>
  );
}
