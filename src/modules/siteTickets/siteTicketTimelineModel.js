export const SITE_TICKET_EVENT_TYPE = {
  created: 'created',
  statusChanged: 'status_changed',
  assigneeChanged: 'assignee_changed',
  noteAdded: 'note_added',
  attachmentAdded: 'attachment_added',
  ticketUpdated: 'ticket_updated',
};

export function createSiteTicketTimelineId(prefix = 'ticket_event') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSiteTicketTimelineEvent({
  id = createSiteTicketTimelineId(),
  ticketId = '',
  eventType = SITE_TICKET_EVENT_TYPE.ticketUpdated,
  oldStatus = '',
  newStatus = '',
  oldAssigneeId = '',
  newAssigneeId = '',
  oldAssigneeName = '',
  newAssigneeName = '',
  note = '',
  changedBy = null,
  changedAt = Date.now(),
} = {}) {
  return {
    id,
    ticketId: String(ticketId || ''),
    eventType,
    oldStatus: String(oldStatus || ''),
    newStatus: String(newStatus || ''),
    oldAssigneeId: String(oldAssigneeId || ''),
    newAssigneeId: String(newAssigneeId || ''),
    oldAssigneeName: String(oldAssigneeName || ''),
    newAssigneeName: String(newAssigneeName || ''),
    note: String(note || '').trim(),
    changedBy: changedBy ? {
      id: String(changedBy.id || ''),
      name: String(changedBy.name || ''),
      role: String(changedBy.role || ''),
    } : null,
    changedAt: Number(changedAt || Date.now()),
  };
}

export function normalizeSiteTicketTimeline(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map((item) => createSiteTicketTimelineEvent(item))
    .sort((left, right) => Number(right.changedAt || 0) - Number(left.changedAt || 0));
}
