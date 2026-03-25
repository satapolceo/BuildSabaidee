import React from 'react';
import { CalendarDays, CheckCircle2, ClipboardList, Paperclip, Users } from 'lucide-react';

function SummaryCard({ label, value, tone = 'slate' }) {
  const className = tone === 'blue'
    ? 'border-blue-100 bg-blue-50 text-blue-700'
    : tone === 'amber'
      ? 'border-amber-100 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-white text-slate-900';

  return (
    <div className={`rounded-2xl border px-3 py-4 text-center shadow-sm ${className}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-75">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function DailyReportList({ reports, labels, summary, onSelect, onCreate }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label={labels.listSummary} value={summary.total} />
        <SummaryCard label={labels.listTodaySummary} value={summary.today} tone="blue" />
        <SummaryCard label={labels.listIssueSummary} value={summary.withIssues} tone="amber" />
      </div>

      <button
        onClick={onCreate}
        className="min-h-12 w-full rounded-[1.2rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        {labels.newReport}
      </button>

      {reports.length ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => onSelect(report.id)}
              className="w-full rounded-[1.4rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900">{report.area || '-'}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{report.projectName || '-'}</div>
                </div>
                <div className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {report.reportDate || '-'}
                </div>
              </div>

              <div className="mt-3 line-clamp-2 text-sm text-slate-600">{report.workSummary || '-'}</div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>{report.workerCount || 0}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>{report.attachments?.length || 0}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span>{report.relatedTicketIds?.length || 0} {labels.reportCardRelatedTickets.toLowerCase()}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{report.ticketSnapshot?.completed || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{report.createdBy?.name || '-'} • {report.reportDate || '-'}</span>
              </div>
            </button>
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

export default DailyReportList;
