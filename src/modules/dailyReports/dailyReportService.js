import { buildAttachmentPayload, normalizeAttachmentDraft } from '../attachments/attachmentModel';
import { getSiteTicketDueState } from '../siteTickets/siteTicketService';
import { SITE_TICKET_STATUS } from '../siteTickets/siteTicketModel';
import {
  createDailyReport,
  createDefaultDailyReportForm,
  getAttachmentDraftFromDailyReport,
  normalizeDailyReport,
} from './dailyReportModel';

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesReportDate(ticket = {}, reportDate = '') {
  if (!reportDate) return true;
  const updatedAt = Number(ticket.updatedAt || ticket.createdAt || 0);
  if (!updatedAt) return false;
  return new Date(updatedAt).toISOString().split('T')[0] === reportDate;
}

export function buildDailyReportTicketInsights(tickets = [], { projectId = '', reportDate = '' } = {}) {
  const filtered = (Array.isArray(tickets) ? tickets : []).filter((ticket) => {
    const sameProject = !projectId || String(ticket.projectId || '') === String(projectId || '');
    return sameProject && matchesReportDate(ticket, reportDate);
  });

  return {
    total: filtered.length,
    completed: filtered.filter((ticket) => ticket.status === SITE_TICKET_STATUS.completed).length,
    pendingApproval: filtered.filter((ticket) => ticket.status === SITE_TICKET_STATUS.pendingApproval).length,
    overdue: filtered.filter((ticket) => getSiteTicketDueState(ticket).overdue).length,
    open: filtered.filter((ticket) => ![SITE_TICKET_STATUS.completed, SITE_TICKET_STATUS.closed].includes(ticket.status)).length,
    tickets: filtered,
  };
}

export function createDailyReportFromForm({
  form = {},
  currentUser = null,
  relatedTickets = [],
} = {}) {
  const timestamp = Date.now();
  const attachmentsPayload = buildAttachmentPayload({
    projectId: form.projectId,
    linkedType: 'daily_report',
    linkedId: form.id || '',
    createdBy: currentUser,
    draft: normalizeAttachmentDraft(form.attachmentsDraft),
  });
  const ticketSnapshot = buildDailyReportTicketInsights(relatedTickets, {
    projectId: form.projectId,
    reportDate: form.reportDate,
  });

  return normalizeDailyReport(createDailyReport({
    id: form.id || undefined,
    projectId: form.projectId,
    projectName: form.projectName,
    reportDate: form.reportDate,
    area: form.area,
    workSummary: form.workSummary,
    workerCount: form.workerCount,
    materialSummary: form.materialSummary,
    issueSummary: form.issueSummary,
    tomorrowPlan: form.tomorrowPlan,
    attachments: attachmentsPayload.attachments,
    relatedTicketIds: form.relatedTicketIds,
    createdBy: currentUser || form.createdBy,
    ticketSnapshot,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

export function updateDailyReportFromForm(report = {}, {
  form = {},
  actor = null,
  relatedTickets = [],
} = {}) {
  const currentReport = normalizeDailyReport(report);
  const attachmentsPayload = buildAttachmentPayload({
    projectId: form.projectId || currentReport.projectId,
    linkedType: 'daily_report',
    linkedId: currentReport.id,
    createdBy: actor || currentReport.createdBy,
    draft: normalizeAttachmentDraft(form.attachmentsDraft),
  });
  const ticketSnapshot = buildDailyReportTicketInsights(relatedTickets, {
    projectId: form.projectId || currentReport.projectId,
    reportDate: form.reportDate || currentReport.reportDate,
  });

  return normalizeDailyReport({
    ...currentReport,
    projectId: form.projectId || currentReport.projectId,
    projectName: form.projectName || currentReport.projectName,
    reportDate: form.reportDate || currentReport.reportDate,
    area: form.area,
    workSummary: form.workSummary,
    workerCount: form.workerCount,
    materialSummary: form.materialSummary,
    issueSummary: form.issueSummary,
    tomorrowPlan: form.tomorrowPlan,
    attachments: attachmentsPayload.attachments,
    relatedTicketIds: form.relatedTicketIds,
    ticketSnapshot,
    updatedAt: Date.now(),
  });
}

export function buildDailyReportFormFromReport(report = {}, currentUser = null) {
  const normalized = normalizeDailyReport(report);
  return {
    ...createDefaultDailyReportForm({
      projectId: normalized.projectId,
      projectName: normalized.projectName,
      currentUser: currentUser || normalized.createdBy,
      reportDate: normalized.reportDate,
    }),
    ...normalized,
    workerCount: normalized.workerCount ? String(normalized.workerCount) : '',
    attachmentsDraft: getAttachmentDraftFromDailyReport(normalized),
  };
}

export function filterDailyReports(reports = [], filters = {}) {
  const projectId = String(filters.projectId || 'all');
  const reportDate = String(filters.reportDate || '');
  const search = normalizeSearchValue(filters.search);

  return (Array.isArray(reports) ? reports : []).filter((report) => {
    const matchesProject = projectId === 'all' || String(report.projectId || '') === projectId;
    const matchesDate = !reportDate || String(report.reportDate || '') === reportDate;
    const haystack = normalizeSearchValue([
      report.projectName,
      report.area,
      report.workSummary,
      report.issueSummary,
      report.tomorrowPlan,
      report.createdBy?.name,
    ].join(' '));
    const matchesSearch = !search || haystack.includes(search);
    return matchesProject && matchesDate && matchesSearch;
  });
}

export function sortDailyReports(reports = []) {
  return [...(Array.isArray(reports) ? reports : [])]
    .sort((left, right) => Number(right.updatedAt || right.createdAt || 0) - Number(left.updatedAt || left.createdAt || 0));
}

export function getVisibleDailyReports(reports = [], {
  role = 'worker',
  currentUserId = '',
  projectId = '',
} = {}) {
  const normalizedProjectId = String(projectId || '');
  if (role === 'admin') return sortDailyReports(reports);
  if (['owner', 'supervisor', 'contractor', 'project_manager', 'site_manager'].includes(role)) {
    return sortDailyReports(
      reports.filter((report) => !normalizedProjectId || String(report.projectId || '') === normalizedProjectId),
    );
  }

  return sortDailyReports(
    reports.filter((report) => (
      (!normalizedProjectId || String(report.projectId || '') === normalizedProjectId)
      && String(report.createdBy?.id || '') === String(currentUserId || '')
    )),
  );
}

export function getDailyReportSummaryCounts(reports = []) {
  const today = new Date().toISOString().split('T')[0];
  return (Array.isArray(reports) ? reports : []).reduce((summary, report) => ({
    total: summary.total + 1,
    today: summary.today + (report.reportDate === today ? 1 : 0),
    withIssues: summary.withIssues + (String(report.issueSummary || '').trim() ? 1 : 0),
  }), { total: 0, today: 0, withIssues: 0 });
}
