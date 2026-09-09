import React from 'react';

export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="font-title font-bold text-grey-dark text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-grey-ink italic mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatTile({ label, value, accent = 'orange' }) {
  const colors = {
    orange: 'text-orange-deep',
    grey: 'text-grey-dark',
    red: 'text-red-600',
    green: 'text-green-700',
  };
  return (
    <div className="card p-4">
      <div className={`font-title font-bold text-3xl ${colors[accent] || colors.orange}`}>{value}</div>
      <div className="text-xs text-grey-medium uppercase tracking-wide font-semibold mt-1">{label}</div>
    </div>
  );
}

const CRITICALITY_STYLES = {
  high: 'bg-status-red text-red-800',
  medium: 'bg-status-amber text-amber-900',
  low: 'bg-status-green text-green-900',
};
export function CriticalityBadge({ value, label }) {
  return <span className={`badge ${CRITICALITY_STYLES[value] || 'bg-grey-light text-grey-ink'}`}>{label}</span>;
}

const STATUS_STYLES = {
  open: 'bg-status-amber text-amber-900',
  in_progress: 'bg-overlayBlue/15 text-overlayBlue',
  closed: 'bg-status-green text-green-900',
  cancelled: 'bg-grey-line text-grey-ink',
  to_do: 'bg-grey-light text-grey-ink',
  done: 'bg-status-green text-green-900',
  effective: 'bg-status-green text-green-900',
  not_effective: 'bg-status-red text-red-800',
  pending: 'bg-status-amber text-amber-900',
};
export function StatusBadge({ value, label }) {
  return <span className={`badge ${STATUS_STYLES[value] || 'bg-grey-light text-grey-ink'}`}>{label}</span>;
}

export function StageProgress({ stage, total = 7 }) {
  const idx = Number(String(stage).replace('S', '')) || 1;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? 'bg-orange' : 'bg-grey-line'}`} />
      ))}
      <span className="ms-2 text-xs font-semibold text-grey-medium whitespace-nowrap">S{idx}/{total}</span>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-grey-dark/40 p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-card shadow-card w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-title font-bold text-lg text-grey-dark">{title}</h3>
          <button onClick={onClose} className="text-grey-medium hover:text-grey-dark text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ message }) {
  return <div className="text-center py-10 text-sm text-grey-medium">{message}</div>;
}

export function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
