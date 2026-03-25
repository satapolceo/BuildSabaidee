import { createAttachmentDraft, normalizeAttachmentDraft } from '../attachments/attachmentModel';

export function createDailyReportId(prefix = 'daily_report') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createDailyReport({
  id = createDailyReportId(),
  projectId = '',
  projectName = '',
  reportDate = '',
  area = '',
  workSummary = '',
  workerCount = '',
  materialSummary = '',
  issueSummary = '',
  tomorrowPlan = '',
  attachments = [],
  relatedTicketIds = [],
  createdBy = null,
  ticketSnapshot = null,
  createdAt = Date.now(),
  updatedAt = Date.now(),
} = {}) {
  return {
    id,
    projectId: String(projectId || ''),
    projectName: String(projectName || ''),
    reportDate: String(reportDate || ''),
    area: String(area || '').trim(),
    workSummary: String(workSummary || '').trim(),
    workerCount: Number(workerCount || 0),
    materialSummary: String(materialSummary || '').trim(),
    issueSummary: String(issueSummary || '').trim(),
    tomorrowPlan: String(tomorrowPlan || '').trim(),
    attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
    relatedTicketIds: Array.isArray(relatedTicketIds)
      ? [...new Set(relatedTicketIds.map((item) => String(item || '')).filter(Boolean))]
      : [],
    createdBy: createdBy ? {
      id: String(createdBy.id || ''),
      name: String(createdBy.name || ''),
      role: String(createdBy.role || 'worker'),
    } : null,
    ticketSnapshot: ticketSnapshot ? {
      total: Number(ticketSnapshot.total || 0),
      completed: Number(ticketSnapshot.completed || 0),
      pendingApproval: Number(ticketSnapshot.pendingApproval || 0),
      overdue: Number(ticketSnapshot.overdue || 0),
      open: Number(ticketSnapshot.open || 0),
    } : null,
    createdAt: Number(createdAt || Date.now()),
    updatedAt: Number(updatedAt || createdAt || Date.now()),
  };
}

export function createDefaultDailyReportForm({
  projectId = '',
  projectName = '',
  currentUser = null,
  reportDate = '',
} = {}) {
  return {
    id: '',
    projectId: String(projectId || ''),
    projectName: String(projectName || ''),
    reportDate: String(reportDate || ''),
    area: '',
    workSummary: '',
    workerCount: '',
    materialSummary: '',
    issueSummary: '',
    tomorrowPlan: '',
    attachmentsDraft: createAttachmentDraft({
      linkedType: 'daily_report',
      status: 'draft',
    }),
    relatedTicketIds: [],
    createdBy: currentUser ? {
      id: String(currentUser.id || ''),
      name: String(currentUser.name || ''),
      role: String(currentUser.role || 'worker'),
    } : null,
  };
}

export function normalizeDailyReport(input = {}) {
  return createDailyReport({
    ...input,
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    relatedTicketIds: Array.isArray(input.relatedTicketIds) ? input.relatedTicketIds : [],
  });
}

export function normalizeDailyReportList(items = []) {
  return (Array.isArray(items) ? items : []).map(normalizeDailyReport).filter(Boolean);
}

export function getAttachmentDraftFromDailyReport(report = {}) {
  const attachments = Array.isArray(report.attachments) ? report.attachments : [];
  const photos = attachments.filter((item) => item?.kind === 'photo');
  const voiceNote = attachments.find((item) => item?.kind === 'voice') || null;
  const noteAttachment = attachments.find((item) => item?.kind === 'note');

  return normalizeAttachmentDraft(createAttachmentDraft({
    linkedType: 'daily_report',
    status: 'draft',
    photos,
    voiceNote,
    note: noteAttachment?.text || '',
  }));
}

export function canEditDailyReport(role = 'worker') {
  return ['worker', 'supervisor', 'contractor', 'project_manager', 'site_manager', 'admin'].includes(role);
}

export function isOwnerDailyReportRole(role = 'worker') {
  return role === 'owner';
}
