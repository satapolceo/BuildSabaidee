import React from 'react';
import { CalendarDays, Clock3, MapPin, Paperclip, UserCircle2 } from 'lucide-react';
import { canEditSiteTicket } from './siteTicketModel';
import {
  getSiteTicketCategoryLabel,
  getSiteTicketPriorityLabel,
  getSiteTicketStatusLabel,
} from './siteTicketI18n';
import SiteTicketForm from './SiteTicketForm';
import SiteTicketAssignmentPanel from './SiteTicketAssignmentPanel';
import SiteTicketTimeline from './SiteTicketTimeline';
import { getSiteTicketDueState } from './siteTicketService';
import { getSiteTicketStatusTone } from './siteTicketStatusUtils';

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

function AttachmentItem({ item, labels, language }) {
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
        <div className="mt-3 text-sm font-medium text-slate-800">{Math.max(1, Math.round((item.durationMs || 0) / 1000))}s</div>
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

function SiteTicketDetail({
  ticket,
  labels,
  language = 'EN',
  role = 'worker',
  projectOptions,
  assigneeOptions,
  editing = false,
  form,
  errors,
  onFieldChange,
  onAttachmentChange,
  onEdit,
  onSubmit,
  onCancel,
  onBack,
}) {
  if (!ticket) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {labels.empty}
      </div>
    );
  }

  if (editing) {
    return (
      <SiteTicketForm
        labels={labels}
        language={language}
        role={role}
        mode="edit"
        form={form}
        errors={errors}
        projectOptions={projectOptions}
        assigneeOptions={assigneeOptions}
        onFieldChange={onFieldChange}
        onAttachmentChange={onAttachmentChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );
  }

  const canEdit = canEditSiteTicket(role);
  const dueState = getSiteTicketDueState(ticket);

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.detailTab}</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{ticket.title}</div>
          <div className="mt-1 text-sm text-slate-500">{ticket.projectName || '-'}</div>
        </div>
        <div className="text-right">
          <div className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getSiteTicketStatusTone(ticket.status, dueState.overdue)}`}>
            {getSiteTicketStatusLabel(ticket.status, language)}
          </div>
          <div className="mt-1 text-xs text-slate-500">{getSiteTicketPriorityLabel(ticket.priority, language)}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{ticket.description || '-'}</div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.categoryLabel}</div>
          <div className="mt-2 font-medium text-slate-800">{getSiteTicketCategoryLabel(ticket.category, language)}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.locationLabel}</div>
          <div className="mt-2 flex items-center gap-2 font-medium text-slate-800"><MapPin className="h-4 w-4" />{ticket.locationText || '-'}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.assigneeLabel}</div>
          <div className="mt-2 flex items-center gap-2 font-medium text-slate-800"><UserCircle2 className="h-4 w-4" />{ticket.assigneeName || '-'}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.dueDateLabel}</div>
          <div className="mt-2 flex items-center gap-2 font-medium text-slate-800"><CalendarDays className="h-4 w-4" />{ticket.dueDate || '-'}</div>
          <div className={`mt-2 text-xs font-semibold ${dueState.overdue ? 'text-rose-600' : 'text-emerald-600'}`}>{dueState.overdue ? labels.overdueLabel : labels.onTimeLabel}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.createdByLabel}</div>
          <div className="mt-2 font-medium text-slate-800">{ticket.createdBy?.name || '-'}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.updatedAtLabel}</div>
          <div className="mt-2 flex items-center gap-2 font-medium text-slate-800"><Clock3 className="h-4 w-4" />{formatDate(ticket.updatedAt, language)}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{labels.lastUpdatedByLabel}</div>
          <div className="mt-2 font-medium text-slate-800">{ticket.lastUpdatedBy?.name || '-'}</div>
        </div>
      </div>

      <div className="mt-5">
        <SiteTicketAssignmentPanel ticket={ticket} labels={labels} language={language} />
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <Paperclip className="h-4 w-4" />
          <span>{labels.attachmentSectionTitle}</span>
        </div>
        <div className="mt-3 space-y-3">
          {ticket.attachments?.length ? ticket.attachments.map((item) => (
            <AttachmentItem key={item.id} item={item} labels={labels} language={language} />
          )) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">{labels.attachmentPreviewEmpty}</div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.noteHistoryTitle}</div>
        <div className="mt-3 space-y-3">
          {ticket.notes?.length ? ticket.notes.map((note) => (
            <div key={note.id} className="rounded-2xl bg-slate-50 px-4 py-4">
              <div className="text-sm font-medium text-slate-900">{note.createdBy?.name || '-'}</div>
              <div className="mt-1 text-xs text-slate-500">{formatDate(note.createdAt, language)}</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{note.text}</div>
            </div>
          )) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">{labels.attachmentPreviewEmpty}</div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <SiteTicketTimeline ticket={ticket} labels={labels} language={language} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={onBack} className="min-h-12 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          {labels.backToList}
        </button>
        {canEdit ? (
          <button onClick={onEdit} className="min-h-12 rounded-[1.2rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            {labels.editTicket}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default SiteTicketDetail;
