import React from 'react';

function ProjectProgressLatestReports({ labels, reports, formatDate, formatNumber }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.latestReportsTitle}</div>
      <div className="mt-4 space-y-3">
        {reports.length ? reports.map((report) => (
          <div key={report.id} className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{report.area || '-'}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{labels.reportDateLabel}</div>
              </div>
              <div className="text-xs font-medium text-slate-500">{report.reportDate || '-'}</div>
            </div>
            <div className="mt-3 text-sm text-slate-700">{report.workSummary || '-'}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="rounded-xl bg-white px-3 py-2">{labels.workerCount}: {formatNumber(report.workerCount || 0)}</div>
              <div className="rounded-xl bg-white px-3 py-2">{labels.relatedTickets}: {formatNumber((report.relatedTicketIds || []).length)}</div>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div><span className="font-medium text-slate-800">{labels.issueSummary}:</span> {report.issueSummary || '-'}</div>
              <div><span className="font-medium text-slate-800">{labels.tomorrowPlan}:</span> {report.tomorrowPlan || '-'}</div>
            </div>
            <div className="mt-3 text-xs text-slate-500">{labels.createdByLabel}: {report.createdBy?.name || '-'} • {formatDate(report.updatedAt || report.createdAt)}</div>
          </div>
        )) : <div className="rounded-[1.3rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">{labels.reportEmpty}</div>}
      </div>
    </div>
  );
}

export default ProjectProgressLatestReports;
