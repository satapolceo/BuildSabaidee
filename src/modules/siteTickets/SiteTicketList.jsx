import React from 'react';
import { AlertTriangle, CheckCircle2, Clock3, MapPin, UserCircle2 } from 'lucide-react';
import {
  getSiteTicketCopy,
  getSiteTicketCategoryLabel,
  getSiteTicketPriorityLabel,
  getSiteTicketStatusLabel,
} from './siteTicketI18n';
import { getSiteTicketDueState } from './siteTicketService';
import { getSiteTicketStatusTone } from './siteTicketStatusUtils';

function getPriorityTone(priority) {
  if (priority === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (priority === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (priority === 'medium') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

function SiteTicketList({
  tickets,
  labels,
  language = 'EN',
  summary,
  onSelect,
  onCreate,
}) {
  const copy = getSiteTicketCopy(language);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{labels.listSummary}</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-4 text-center shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400">{labels.listOpenSummary}</div>
          <div className="mt-2 text-2xl font-bold text-blue-700">{summary.open}</div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-4 text-center shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-400">{labels.listCriticalSummary}</div>
          <div className="mt-2 text-2xl font-bold text-rose-700">{summary.critical}</div>
        </div>
      </div>

      <button
        onClick={onCreate}
        className="min-h-12 w-full rounded-[1.2rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        {labels.newTicket}
      </button>

      {tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            (function renderCard() {
              const dueState = getSiteTicketDueState(ticket);
              return (
            <button
              key={ticket.id}
              onClick={() => onSelect(ticket.id)}
              className="w-full rounded-[1.4rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900">{ticket.title}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{ticket.projectName || '-'}</div>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityTone(ticket.priority)}`}>
                  {getSiteTicketPriorityLabel(ticket.priority, language)}
                </span>
              </div>

              <div className="mt-3 line-clamp-2 text-sm text-slate-600">{ticket.description || '-'}</div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="font-semibold text-slate-700">{getSiteTicketCategoryLabel(ticket.category, language)}</div>
                  <div className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${getSiteTicketStatusTone(ticket.status, dueState.overdue)}`}>
                    {getSiteTicketStatusLabel(ticket.status, language)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <UserCircle2 className="h-3.5 w-3.5" />
                    <span className="truncate">{ticket.assigneeName || ticket.createdBy?.name || '-'}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{ticket.locationText || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{ticket.dueDate || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  {dueState.overdue ? <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">{copy.overdueLabel}</span> : null}
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {ticket.attachments?.length || 0}
                  </span>
                  {ticket.priority === 'critical' ? <AlertTriangle className="h-4 w-4 text-rose-500" /> : null}
                </div>
              </div>
            </button>
              );
            })()
          ))}
        </div>
      ) : (
        <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {labels.empty}
        </div>
      )}
    </div>
  );
}

export default SiteTicketList;
