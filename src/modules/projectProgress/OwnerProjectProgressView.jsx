import React from 'react';
import ProjectProgressSummaryCards from './ProjectProgressSummaryCards';
import ProjectProgressLatestIssues from './ProjectProgressLatestIssues';
import ProjectProgressLatestReports from './ProjectProgressLatestReports';
import ProjectProgressRecentActivity from './ProjectProgressRecentActivity';

function PhotoStrip({ labels, items, formatDate }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.latestPhotosTitle}</div>
      {items.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((item) => (
            <div key={`${item.source}_${item.parentId}_${item.id}`} className="overflow-hidden rounded-[1.3rem] border border-slate-200 bg-slate-50">
              <img src={item.imageData} alt={item.parentTitle || labels.latestPhotosTitle} className="h-32 w-full object-cover" />
              <div className="p-3">
                <div className="truncate text-sm font-semibold text-slate-900">{item.parentTitle || '-'}</div>
                <div className="mt-1 text-xs text-slate-500">{formatDate(item.capturedAt)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="mt-4 rounded-[1.3rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">{labels.photoEmpty}</div>}
    </div>
  );
}

function OwnerProjectProgressView({
  labels,
  language = 'EN',
  role = 'owner',
  data,
  selectedProjectId,
  onProjectChange,
  formatDate,
  formatNumber,
}) {
  const selectedProject = data?.selectedProject;
  const summary = data?.ticketSummary || { total: 0, completed: 0, open: 0, pendingApproval: 0, overdue: 0 };
  const latestReport = data?.latestReports?.[0] || null;
  const readOnlyLabel = role === 'admin' ? labels.readOnlyAdmin : labels.readOnlyOwner;

  return (
    <div className="space-y-5">
      <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.title}</div>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{selectedProject?.name || labels.noProject}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{labels.progressSimpleSummary}</p>
            <div className="mt-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{readOnlyLabel}</div>
          </div>
          <div className="w-full max-w-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700">{labels.projectSelectLabel}</label>
            <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)} className="min-h-12 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400">
              {(data?.projectOptions || []).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedProject ? (
        <>
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr,0.95fr]">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.progressSnapshotTitle}</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{selectedProject.name}</div>
                <div className="mt-4 h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" style={{ width: `${Math.min(Number(selectedProject.progress || 0), 100)}%` }}></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{labels.progressHealthLabel}</span>
                  <span className="font-semibold text-slate-900">{formatNumber(data?.projectHealth || 0)}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.currentStageLabel}</div><div className="mt-2 font-semibold text-slate-900">{data?.currentStage || '-'}</div></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.lastReportLabel}</div><div className="mt-2 font-semibold text-slate-900">{latestReport?.reportDate || '-'}</div></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.lastActivityLabel}</div><div className="mt-2 font-semibold text-slate-900">{data?.recentActivity?.[0] ? formatDate(data.recentActivity[0].changedAt) : '-'}</div></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.createdByLabel}</div><div className="mt-2 font-semibold text-slate-900">{data?.mainContact?.name || latestReport?.createdBy?.name || '-'}</div></div>
              </div>
            </div>
          </div>

          <ProjectProgressSummaryCards labels={labels} summary={summary} formatNumber={formatNumber} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ProjectProgressLatestIssues labels={labels} issues={data?.latestIssues || []} language={language} formatDate={formatDate} />
            <ProjectProgressLatestReports labels={labels} reports={data?.latestReports || []} formatDate={formatDate} formatNumber={formatNumber} />
          </div>

          <PhotoStrip labels={labels} items={data?.latestPhotos || []} formatDate={formatDate} />
          <ProjectProgressRecentActivity labels={labels} items={data?.recentActivity || []} formatDate={formatDate} />
        </>
      ) : (
        <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">{labels.noProject}</div>
      )}
    </div>
  );
}

export default OwnerProjectProgressView;
