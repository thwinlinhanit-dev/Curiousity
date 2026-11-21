import type { ReactNode } from "react";
import { t } from "../i18n";

// The v2 component set (design plan §3.3). Everything else composes these.

export type Status = { passed: boolean; status: string };

// Three words everywhere: Not started / In progress / Mastered.
// Review-due is In progress plus a dot, never a fourth hue.
export function StatusPill({ st }: { st: Status }) {
  const due = !st.passed && st.status === "due";
  const label = st.passed ? t("status.mastered") : st.status === "new" ? t("status.notStarted") : t("status.underWay");
  const cls = st.passed ? "status-mastered" : st.status === "new" ? "status-not-started" : due ? "status-review-due" : "status-under-way";
  return (
    <span className={`status-chip ${cls}`} title={due ? t("status.reviewDue") : undefined}>
      {label}
    </span>
  );
}

// Standards marker: an icon with a tooltip, not a shouty pill (plan §3.3).
export function StandardsBadge() {
  return (
    <span className="std-icon" role="img" aria-label={t("standards.label")} title={t("standards.label")}>
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.5l5 2v4c0 3.2-2.1 5.6-5 7-2.9-1.4-5-3.8-5-7v-4l5-2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M5.6 8l1.7 1.7 3.1-3.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function ListRow({ index, title, meta, status, standards, onClick, trailing }: {
  index?: number; title: ReactNode; meta?: ReactNode; status?: Status; standards?: boolean;
  onClick: () => void; trailing?: ReactNode;
}) {
  return (
    <li>
      <button className="list-row" onClick={onClick}>
        {index != null && <span className="row-index tabular" aria-hidden="true">{index}</span>}
        <span className="row-main">
          <span className="row-title">{title}</span>
          {meta && <span className="row-meta">{meta}</span>}
        </span>
        {standards && <StandardsBadge />}
        {status && <StatusPill st={status} />}
        {trailing}
        <span className="row-chevron" aria-hidden="true">›</span>
      </button>
    </li>
  );
}

export function Panel({ children, className = "", sunk = false }: { children: ReactNode; className?: string; sunk?: boolean }) {
  return <div className={`panel ${sunk ? "panel-sunk" : ""} ${className}`}>{children}</div>;
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <span className="progress-thin" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}
      aria-label={label ?? `${value} of ${max}`}>
      <i style={{ width: `${pct}%` }} />
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="state-box empty-state" role="status">
      <span className="state-icon" aria-hidden="true">○</span>
      <p className="state-title">{title}</p>
      {body && <p className="state-body">{body}</p>}
      {action && <button className="btn" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

export function ErrorState({ title, body, onRetry, retryLabel }: { title?: string; body: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div className="state-box error-state" role="alert">
      <span className="state-icon" aria-hidden="true">!</span>
      <p className="state-title">{title ?? t("states.errorTitle")}</p>
      <p className="state-body">{body}</p>
      {onRetry && <button className="btn" onClick={onRetry}>{retryLabel ?? t("states.retry")}</button>}
    </div>
  );
}

export function Skeleton({ rows = 3, label }: { rows?: number; label?: string }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => <span key={i} className="skeleton-row" style={{ width: `${88 - (i % 3) * 14}%` }} />)}
      <span className="sr-only">{label ?? t("states.loading")}</span>
    </div>
  );
}

export function IconButton({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean }) {
  return (
    <button className="icon-btn" aria-label={label} title={label} onClick={onClick}
      aria-pressed={pressed}>
      {children}
    </button>
  );
}