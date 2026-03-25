import {
  SITE_TICKET_EVENT_TYPE,
  createSiteTicketTimelineEvent,
  normalizeSiteTicketTimeline,
} from './siteTicketTimelineModel';

function normalizeActor(actor = null) {
  return actor ? {
    id: String(actor.id || ''),
    name: String(actor.name || ''),
    role: String(actor.role || ''),
  } : null;
}

export function buildTicketCreatedTimeline(ticket = {}, actor = null) {
  const attachmentNote = ticket.attachments?.find((item) => item.kind === 'note')?.text || '';
  return normalizeSiteTicketTimeline([
    createSiteTicketTimelineEvent({
      ticketId: ticket.id,
      eventType: SITE_TICKET_EVENT_TYPE.created,
      newStatus: ticket.status,
      newAssigneeId: ticket.assigneeId,
      newAssigneeName: ticket.assigneeName,
      note: attachmentNote || ticket.description || '',
      changedBy: normalizeActor(actor || ticket.createdBy),
      changedAt: ticket.createdAt,
    }),
    ...(ticket.attachments?.length ? [createSiteTicketTimelineEvent({
      ticketId: ticket.id,
      eventType: SITE_TICKET_EVENT_TYPE.attachmentAdded,
      note: `${ticket.attachments.length} attachment(s)`,
      changedBy: normalizeActor(actor || ticket.createdBy),
      changedAt: ticket.createdAt,
    })] : []),
  ]);
}

export function buildTicketUpdateTimeline(currentTicket = {}, nextTicket = {}, actor = null, noteText = '') {
  const events = [];
  const changedBy = normalizeActor(actor || nextTicket.lastUpdatedBy || currentTicket.lastUpdatedBy);
  const changedAt = nextTicket.updatedAt || Date.now();

  if (currentTicket.status !== nextTicket.status) {
    events.push(createSiteTicketTimelineEvent({
      ticketId: nextTicket.id,
      eventType: SITE_TICKET_EVENT_TYPE.statusChanged,
      oldStatus: currentTicket.status,
      newStatus: nextTicket.status,
      changedBy,
      changedAt,
    }));
  }

  if (
    String(currentTicket.assigneeId || '') !== String(nextTicket.assigneeId || '')
    || String(currentTicket.assigneeName || '') !== String(nextTicket.assigneeName || '')
  ) {
    events.push(createSiteTicketTimelineEvent({
      ticketId: nextTicket.id,
      eventType: SITE_TICKET_EVENT_TYPE.assigneeChanged,
      oldAssigneeId: currentTicket.assigneeId,
      newAssigneeId: nextTicket.assigneeId,
      oldAssigneeName: currentTicket.assigneeName,
      newAssigneeName: nextTicket.assigneeName,
      changedBy,
      changedAt,
    }));
  }

  if ((currentTicket.attachments?.length || 0) !== (nextTicket.attachments?.length || 0)) {
    events.push(createSiteTicketTimelineEvent({
      ticketId: nextTicket.id,
      eventType: SITE_TICKET_EVENT_TYPE.attachmentAdded,
      note: `${Math.max(0, (nextTicket.attachments?.length || 0) - (currentTicket.attachments?.length || 0))} new attachment(s)`,
      changedBy,
      changedAt,
    }));
  }

  if (String(noteText || '').trim()) {
    events.push(createSiteTicketTimelineEvent({
      ticketId: nextTicket.id,
      eventType: SITE_TICKET_EVENT_TYPE.noteAdded,
      note: noteText,
      changedBy,
      changedAt,
    }));
  }

  events.push(createSiteTicketTimelineEvent({
    ticketId: nextTicket.id,
    eventType: SITE_TICKET_EVENT_TYPE.ticketUpdated,
    oldStatus: currentTicket.status,
    newStatus: nextTicket.status,
    oldAssigneeId: currentTicket.assigneeId,
    newAssigneeId: nextTicket.assigneeId,
    oldAssigneeName: currentTicket.assigneeName,
    newAssigneeName: nextTicket.assigneeName,
    note: String(noteText || '').trim(),
    changedBy,
    changedAt,
  }));

  return normalizeSiteTicketTimeline([...(nextTicket.timeline || []), ...events]);
}

export function getVisibleTicketTimeline(ticket = {}) {
  return normalizeSiteTicketTimeline(ticket.timeline || []);
}
