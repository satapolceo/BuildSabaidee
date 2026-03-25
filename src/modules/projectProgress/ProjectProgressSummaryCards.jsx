import React from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, ListChecks } from 'lucide-react';

const ICONS = {
  total: ListChecks,
  completed: CheckCircle2,
  open: CircleDashed,
  pending: Clock3,
  overdue: AlertTriangle,
};

function Card({ label, value, tone = 'slate', icon: Icon }) {
  const toneClass = tone === 'emerald'
    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
    : tone === 'amber'
      ? 'border-amber-100 bg-amber-50 text-amber-700'
      : tone === 'rose'
        ? 'border-rose-100 bg-rose-50 text-rose-700'
        : 'border-slate-200 bg-white text-slate-900';

  return (
    <div className={`rounded-[1.4rem] border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">{label}</div>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ProjectProgressSummaryCards({ labels, summary, formatNumber }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Card label={labels.totalTickets} value={formatNumber(summary.total || 0)} icon={ICONS.total} />
      <Card label={labels.completedTickets} value={formatNumber(summary.completed || 0)} tone="emerald" icon={ICONS.completed} />
      <Card label={labels.openTickets} value={formatNumber(summary.open || 0)} tone="slate" icon={ICONS.open} />
      <Card label={labels.pendingApprovalTickets} value={formatNumber(summary.pendingApproval || 0)} tone="amber" icon={ICONS.pending} />
      <Card label={labels.overdueTickets} value={formatNumber(summary.overdue || 0)} tone="rose" icon={ICONS.overdue} />
    </div>
  );
}

export default ProjectProgressSummaryCards;
