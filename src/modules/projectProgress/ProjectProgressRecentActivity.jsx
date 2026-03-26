import React from 'react';
import { formatProjectActivityTitle } from './projectProgressService';

function ProjectProgressRecentActivity({ labels, items, formatDate }) {
  const getSourceLabel = (item) => {
    if (item.source === 'report') return labels.activitySourceReport;
    if (item.source === 'photo_report') return labels.eventPhotoReportSubmitted || 'Photo report';
    if (item.source === 'milestone') return labels.eventMilestoneSubmitted || 'Milestone';
    return labels.activitySourceTicket;
  };

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.recentActivityTitle}</div>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{formatProjectActivityTitle(item, labels)}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{getSourceLabel(item)}</div>
              </div>
              <div className="text-xs text-slate-500">{formatDate(item.changedAt)}</div>
            </div>
            <div className="mt-2 text-sm text-slate-700">{item.sourceTitle || '-'}</div>
            <div className="mt-1 text-sm text-slate-600">{item.note || '-'}</div>
            <div className="mt-2 text-xs text-slate-500">{item.changedBy?.name || '-'}</div>
          </div>
        )) : <div className="rounded-[1.3rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">{labels.activityEmpty}</div>}
      </div>
    </div>
  );
}

export default ProjectProgressRecentActivity;
