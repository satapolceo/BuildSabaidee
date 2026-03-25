import { SITE_TICKET_STATUS } from './siteTicketModel';

export function isSiteTicketClosed(status = '') {
  return status === SITE_TICKET_STATUS.closed;
}

export function isSiteTicketCompleted(status = '') {
  return status === SITE_TICKET_STATUS.completed;
}

export function isSiteTicketOverdue(ticket = {}, now = Date.now()) {
  if (!ticket?.dueDate) return false;
  if (isSiteTicketClosed(ticket.status) || isSiteTicketCompleted(ticket.status)) return false;
  const dueAt = new Date(ticket.dueDate).getTime();
  if (Number.isNaN(dueAt)) return false;
  return dueAt < now;
}

export function getSiteTicketStatusTone(status = '', overdue = false) {
  if (overdue) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === SITE_TICKET_STATUS.closed) return 'border-slate-200 bg-slate-100 text-slate-700';
  if (status === SITE_TICKET_STATUS.completed) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === SITE_TICKET_STATUS.pendingApproval) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === SITE_TICKET_STATUS.inProgress) return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-violet-200 bg-violet-50 text-violet-700';
}
