import React from 'react';
import { getVisibleTicketTimeline } from './siteTicketTimelineService';
import {
  getSiteTicketCopy,
  getSiteTicketEventTypeLabel,
  getSiteTicketStatusLabel,
} from './siteTicketI18n';

function formatEventDate(value, language = 'EN') {
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

function replaceTemplate(template = '', values = {}) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

function renderEventSummary(event, language = 'EN') {
  const copy = getSiteTicketCopy(language);
  if (event.eventType === 'status_changed') {
    return replaceTemplate(copy.changedFromTo, {
      from: getSiteTicketStatusLabel(event.oldStatus, language),
      to: getSiteTicketStatusLabel(event.newStatus, language),
    });
  }
  if (event.eventType === 'assignee_changed') {
    return replaceTemplate(copy.assignedFromTo, {
      from: event.oldAssigneeName || copy.noAssignee,
      to: event.newAssigneeName || copy.noAssignee,
    });
  }
  return event.note || '-';
}

function SiteTicketTimeline({
  ticket,
  labels,
  language = 'EN',
}) {
  const items = getVisibleTicketTimeline(ticket);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.timelineTitle}</div>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((event) => (
          <div key={event.id} className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{getSiteTicketEventTypeLabel(event.eventType, language)}</div>
                <div className="mt-1 text-xs text-slate-500">{event.changedBy?.name || '-'}</div>
              </div>
              <div className="text-right text-xs text-slate-500">{formatEventDate(event.changedAt, language)}</div>
            </div>
            <div className="mt-2 text-sm text-slate-700">{renderEventSummary(event, language)}</div>
            {event.note && event.eventType !== 'status_changed' && event.eventType !== 'assignee_changed' ? (
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{event.note}</div>
            ) : null}
          </div>
        )) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">{labels.empty}</div>
        )}
      </div>
    </div>
  );
}

export default SiteTicketTimeline;
