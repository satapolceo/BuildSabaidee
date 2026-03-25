import React from 'react';
import { CalendarDays, UserCircle2 } from 'lucide-react';
import { getSiteTicketDueState } from './siteTicketService';
import { getSiteTicketStatusTone } from './siteTicketStatusUtils';
import { getSiteTicketStatusLabel } from './siteTicketI18n';

function formatDueDate(value, language = 'EN') {
  if (!value) return '-';
  const locale = language === 'TH' ? 'th-TH' : language === 'LA' ? 'lo-LA' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function SiteTicketAssignmentPanel({
  ticket,
  labels,
  language = 'EN',
}) {
  const dueState = getSiteTicketDueState(ticket);
  const dueTone = dueState.overdue ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-slate-700 bg-slate-50 border-slate-200';

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.assignmentTitle}</div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.assigneeLabel}</div>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
            <UserCircle2 className="h-4 w-4" />
            {ticket.assigneeName || labels.noAssignee}
          </div>
        </div>
        <div className={`rounded-2xl border p-3 ${getSiteTicketStatusTone(ticket.status, dueState.overdue)}`}>
          <div className="text-xs uppercase tracking-[0.14em] opacity-70">{labels.statusLabel}</div>
          <div className="mt-2 text-sm font-semibold">{getSiteTicketStatusLabel(ticket.status, language)}</div>
        </div>
        <div className={`rounded-2xl border p-3 ${dueTone}`}>
          <div className="text-xs uppercase tracking-[0.14em] opacity-70">{labels.dueDateLabel}</div>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4" />
            {formatDueDate(ticket.dueDate, language)}
          </div>
          <div className="mt-2 text-xs font-semibold">
            {dueState.overdue ? labels.overdueLabel : labels.onTimeLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiteTicketAssignmentPanel;
