export function getProjectProgressStage(progress = 0, copy = {}) {
  const safeProgress = Number(progress || 0);
  if (safeProgress >= 100) return copy.stageHandover || 'Near handover';
  if (safeProgress >= 81) return copy.stageFinishing || 'Finishing';
  if (safeProgress >= 61) return copy.stageSystems || 'Systems';
  if (safeProgress >= 31) return copy.stageStructure || 'Structure';
  if (safeProgress >= 11) return copy.stageFoundation || 'Foundation';
  return copy.stagePlanning || 'Planning';
}

export function calculateProjectHealth({ projectProgress = 0, ticketSummary = {}, reports = [] } = {}) {
  const progressBase = Number(projectProgress || 0);
  const totalTickets = Number(ticketSummary.total || 0);
  const completedTickets = Number(ticketSummary.completed || 0);
  const overdueTickets = Number(ticketSummary.overdue || 0);
  const pendingApprovalTickets = Number(ticketSummary.pendingApproval || 0);
  const completionRatio = totalTickets > 0 ? (completedTickets / totalTickets) * 100 : progressBase;
  const overduePenalty = Math.min(overdueTickets * 6, 24);
  const pendingPenalty = Math.min(pendingApprovalTickets * 3, 12);
  const reportBonus = reports.length > 0 ? 6 : 0;
  const blended = (progressBase * 0.55) + (completionRatio * 0.35) + reportBonus - overduePenalty - pendingPenalty;
  return Math.max(0, Math.min(100, Math.round(blended)));
}

export function formatProjectActivityTitle(item = {}, copy = {}) {
  if (item.source === 'report') return copy.eventReportSaved || 'Report saved';
  if (item.eventType === 'status_changed') return copy.eventStatusChanged || 'Status changed';
  if (item.eventType === 'assignee_changed') return copy.eventAssigneeChanged || 'Assignee changed';
  if (item.eventType === 'note_added') return copy.eventNoteAdded || 'Note added';
  if (item.eventType === 'attachment_added') return copy.eventAttachmentAdded || 'Attachment added';
  if (item.eventType === 'ticket_updated') return copy.eventTicketUpdated || 'Ticket updated';
  return copy.eventCreated || 'Created';
}
