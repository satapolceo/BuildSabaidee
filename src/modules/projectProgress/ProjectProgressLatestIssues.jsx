import React from 'react';
import { getSiteTicketPriorityLabel, getSiteTicketStatusLabel } from '../siteTickets/siteTicketI18n';

function ProjectProgressLatestIssues({ labels, issues, language = 'EN', formatDate }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.latestIssuesTitle}</div>
      <div className="mt-4 space-y-3">
        {issues.length ? issues.map((ticket) => (
          <div key={ticket.id} className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{ticket.title || '-'}</div>
                <div className="mt-1 text-xs text-slate-500">{ticket.locationText || '-'}</div>
              </div>
              <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">{getSiteTicketStatusLabel(ticket.status, language)}</div>
            </div>
            {ticket.firstPhoto?.imageData ? <img src={ticket.firstPhoto.imageData} alt={labels.latestIssuesTitle} className="mt-3 h-28 w-full rounded-xl object-cover" /> : null}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="rounded-xl bg-white px-3 py-2">{labels.assigneeLabel}: {ticket.assigneeName || '-'}</div>
              <div className="rounded-xl bg-white px-3 py-2">{getSiteTicketPriorityLabel(ticket.priority, language)}</div>
            </div>
            <div className="mt-3 text-sm text-slate-600">{ticket.description || '-'}</div>
            <div className="mt-3 text-xs text-slate-500">{ticket.dueState?.dueDate ? `${ticket.dueState.overdue ? labels.overdueTickets : labels.lastActivityLabel}: ${ticket.dueState.dueDate}` : formatDate(ticket.updatedAt || ticket.createdAt)}</div>
          </div>
        )) : <div className="rounded-[1.3rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">{labels.issueEmpty}</div>}
      </div>
    </div>
  );
}

export default ProjectProgressLatestIssues;
