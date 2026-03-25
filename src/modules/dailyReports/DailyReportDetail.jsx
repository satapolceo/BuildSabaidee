import React from 'react';
import { CalendarDays, ClipboardList, Paperclip, UserCircle2, Users } from 'lucide-react';
import { canEditDailyReport } from './dailyReportModel';
import DailyReportForm from './DailyReportForm';
import { getSiteTicketStatusLabel } from '../siteTickets/siteTicketI18n';

function formatDate(value, language = 'EN') {
  if (!value) return '-';
  const locale = language === 'TH' ? 'th-TH' : language === 'LA' ? 'lo-LA' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function AttachmentItem({ item, labels }) {
  if (item.kind === 'photo') {
    return (
      <div className="rounded-2xl bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{labels.attachmentPhoto}</div>
        <img src={item.imageData} alt={labels.attachmentPhoto} className="mt-3 h-28 w-full rounded-xl object-cover" />
      </div>
    );
  }

  if (item.kind === 'voice') {
    return (
      <div className="rounded-2xl bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{labels.attachmentVoice}</div>
        <audio controls src={item.audioData} className="mt-3 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{labels.attachmentNote}</div>
      <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{item.text || '-'}</div>
    </div>
  );
}

function SnapshotGrid({ labels, snapshot }) {
  const items = [
    { label: labels.ticketTotal, value: snapshot?.total || 0 },
    { label: labels.ticketCompleted, value: snapshot?.completed || 0 },
    { label: labels.ticketPendingApproval, value: snapshot?.pendingApproval || 0 },
    { label: labels.ticketOverdue, value: snapshot?.overdue || 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-slate-50 px-3 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</div>
          <div className="mt-2 text-xl font-bold text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function DailyReportDetail({
  report,
  labels,
  language = 'EN',
  role = 'worker',
  editing = false,
  form,
  errors,
  projectOptions,
  relatedTickets = [],
  ticketSnapshot,
  onFieldChange,
  onAttachmentChange,
  onToggleTicket,
  onEdit,
  onSubmit,
  onCancel,
  onBack,
}) {
  if (!report) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {labels.empty}
      </div>
    );
  }

  if (editing) {
    return (
      <DailyReportForm
        labels={labels}
        language={language}
        role={role}
        mode="edit"
        form={form}
        errors={errors}
        projectOptions={projectOptions}
        relatedTickets={relatedTickets}
        ticketSnapshot={ticketSnapshot}
        onFieldChange={onFieldChange}
        onAttachmentChange={onAttachmentChange}
        onToggleTicket={onToggleTicket}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );
  }

  const canEdit = canEditDailyReport(role);

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.detailTab}</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{report.area || '-'}</div>
          <div className="mt-1 text-sm text-slate-500">{report.projectName || '-'}</div>
        </div>
        <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{report.reportDate || '-'}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.workerCountLabel}</div>
          <div className="mt-2 flex items-center gap-2 font-medium text-slate-800"><Users className="h-4 w-4" />{report.workerCount || 0}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.reportDateLabel}</div>
          <div className="mt-2 flex items-center gap-2 font-medium text-slate-800"><CalendarDays className="h-4 w-4" />{report.reportDate || '-'}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.workSummaryLabel}</div><div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{report.workSummary || '-'}</div></div>
        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.materialSummaryLabel}</div><div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{report.materialSummary || '-'}</div></div>
        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.issueSummaryLabel}</div><div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{report.issueSummary || '-'}</div></div>
        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.tomorrowPlanLabel}</div><div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{report.tomorrowPlan || '-'}</div></div>
      </div>

      <div className="mt-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.ticketSnapshotTitle}</div>
        <SnapshotGrid labels={labels} snapshot={report.ticketSnapshot} />
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"><ClipboardList className="h-4 w-4" />{labels.relatedTicketsTitle}</div>
        <div className="space-y-3">
          {relatedTickets.length ? relatedTickets.map((ticket) => (
            <div key={ticket.id} className="rounded-2xl bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-900">{ticket.title}</div>
              <div className="mt-1 text-xs text-slate-500">{ticket.locationText || '-'} • {getSiteTicketStatusLabel(ticket.status, language)}</div>
            </div>
          )) : <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">{labels.noRelatedTickets}</div>}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"><Paperclip className="h-4 w-4" />{labels.attachmentSectionTitle}</div>
        <div className="space-y-3">
          {report.attachments?.length ? report.attachments.map((item) => <AttachmentItem key={item.id} item={item} labels={labels} />) : <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">{labels.attachmentPreviewEmpty}</div>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.createdByLabel}</div><div className="mt-2 flex items-center gap-2 font-medium text-slate-800"><UserCircle2 className="h-4 w-4" />{report.createdBy?.name || '-'}</div></div>
        <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.updatedAtLabel}</div><div className="mt-2 font-medium text-slate-800">{formatDate(report.updatedAt, language)}</div></div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={onBack} className="min-h-12 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{labels.backToList}</button>
        {canEdit ? <button onClick={onEdit} className="min-h-12 rounded-[1.2rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{labels.editReport}</button> : null}
      </div>
    </div>
  );
}

export default DailyReportDetail;
