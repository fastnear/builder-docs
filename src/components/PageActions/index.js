import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

function CopyGlyph(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"
      />
    </svg>
  );
}

function CheckGlyph(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PageActions({ actions, className }) {
  const [busyActionId, setBusyActionId] = useState(null);
  const [completedActionId, setCompletedActionId] = useState(null);

  const visibleActions = (actions || []).filter(Boolean);
  const primaryAction = visibleActions[0];

  useEffect(() => {
    if (!completedActionId || typeof window === 'undefined') {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCompletedActionId(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [completedActionId]);

  if (!primaryAction) {
    return null;
  }

  async function handleActionClick() {
    try {
      setBusyActionId(primaryAction.id);
      await primaryAction.onSelect();
      setCompletedActionId(primaryAction.id);
    } finally {
      setBusyActionId(null);
    }
  }

  const isBusy = busyActionId === primaryAction.id;
  const isCompleted = completedActionId === primaryAction.id;
  const label = isBusy
    ? primaryAction.pendingLabel || primaryAction.label
    : isCompleted
      ? primaryAction.completedLabel || primaryAction.label
      : primaryAction.label;

  return (
    <div className={clsx('fastnear-doc-page-actions', className)} data-markdown-skip>
      <button
        type="button"
        className="fastnear-doc-page-actions__button"
        onClick={handleActionClick}
        disabled={isBusy}
      >
        {isCompleted ? (
          <CheckGlyph className="fastnear-doc-page-actions__icon" />
        ) : (
          <CopyGlyph className="fastnear-doc-page-actions__icon" />
        )}
        <span>{label}</span>
      </button>
    </div>
  );
}
