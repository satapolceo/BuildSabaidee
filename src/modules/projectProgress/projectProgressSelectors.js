import { normalizeDailyReportList } from '../dailyReports/dailyReportModel';
import { normalizeSiteTicketList, SITE_TICKET_STATUS } from '../siteTickets/siteTicketModel';
import { getSiteTicketDueState } from '../siteTickets/siteTicketService';
import { getVisibleTicketTimeline } from '../siteTickets/siteTicketTimelineService';
import { calculateProjectHealth, getProjectProgressStage } from './projectProgressService';

function normalizeProject(project = {}) {
  return {
    ...project,
    id: String(project.id || ''),
    name: String(project.name || '').trim(),
    progress: Number(project.progress || 0),
  };
}

function normalizeWorker(worker = {}) {
  return {
    ...worker,
    id: String(worker.id || ''),
    assignedSiteId: String(worker.assignedSiteId || ''),
  };
}

function toTimestamp(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortByRecent(items = [], keys = []) {
  return [...items].sort((left, right) => {
    const leftValue = Math.max(...keys.map((key) => toTimestamp(left?.[key])));
    const rightValue = Math.max(...keys.map((key) => toTimestamp(right?.[key])));
    return rightValue - leftValue;
  });
}

export function buildProjectProgressSelectors({
  projectsList = [],
  workersList = [],
  siteTickets = [],
  dailyReports = [],
  selectedProjectId = '',
  labels = {},
} = {}) {
  const normalizedProjects = (Array.isArray(projectsList) ? projectsList : []).map(normalizeProject).filter((project) => project.id);
  const projectOptions = normalizedProjects.map((project) => ({ value: project.id, label: project.name || project.id }));
  const selectedProject = normalizedProjects.find((project) => project.id === String(selectedProjectId || '')) || normalizedProjects[0] || null;
  if (!selectedProject) {
    return {
      projectOptions,
      selectedProject: null,
      ticketSummary: { total: 0, completed: 0, open: 0, pendingApproval: 0, overdue: 0 },
      latestIssues: [],
      latestReports: [],
      latestPhotos: [],
      recentActivity: [],
      mainContact: null,
      projectHealth: 0,
      currentStage: labels.stagePlanning || 'Planning',
    };
  }

  const projectId = String(selectedProject.id || '');
  const normalizedTickets = normalizeSiteTicketList(siteTickets).filter((ticket) => String(ticket.projectId || '') === projectId);
  const normalizedReports = normalizeDailyReportList(dailyReports).filter((report) => String(report.projectId || '') === projectId);
  const workers = (Array.isArray(workersList) ? workersList : []).map(normalizeWorker).filter((worker) => worker.assignedSiteId === projectId);

  const ticketSummary = normalizedTickets.reduce((summary, ticket) => {
    const overdue = getSiteTicketDueState(ticket).overdue;
    const completed = ticket.status === SITE_TICKET_STATUS.completed || ticket.status === SITE_TICKET_STATUS.closed;
    return {
      total: summary.total + 1,
      completed: summary.completed + (completed ? 1 : 0),
      open: summary.open + (completed ? 0 : 1),
      pendingApproval: summary.pendingApproval + (ticket.status === SITE_TICKET_STATUS.pendingApproval ? 1 : 0),
      overdue: summary.overdue + (overdue ? 1 : 0),
    };
  }, { total: 0, completed: 0, open: 0, pendingApproval: 0, overdue: 0 });

  const latestIssues = sortByRecent(normalizedTickets, ['updatedAt', 'createdAt']).slice(0, 4).map((ticket) => ({
    ...ticket,
    dueState: getSiteTicketDueState(ticket),
    firstPhoto: (ticket.attachments || []).find((item) => item?.kind === 'photo') || null,
  }));

  const latestReports = sortByRecent(normalizedReports, ['reportDate', 'updatedAt', 'createdAt']).slice(0, 3);

  const latestPhotos = sortByRecent([
    ...normalizedReports.flatMap((report) => (report.attachments || []).filter((item) => item?.kind === 'photo').map((item) => ({
      ...item,
      source: 'report',
      projectId,
      parentId: report.id,
      parentTitle: report.area || report.projectName || '',
      capturedAt: report.updatedAt || report.createdAt,
    }))),
    ...normalizedTickets.flatMap((ticket) => (ticket.attachments || []).filter((item) => item?.kind === 'photo').map((item) => ({
      ...item,
      source: 'ticket',
      projectId,
      parentId: ticket.id,
      parentTitle: ticket.title || ticket.locationText || '',
      capturedAt: ticket.updatedAt || ticket.createdAt,
    }))),
  ], ['capturedAt']).slice(0, 6);

  const recentTicketActivity = normalizedTickets.flatMap((ticket) => getVisibleTicketTimeline(ticket).map((event) => ({
    id: `${ticket.id}_${event.id}`,
    source: 'ticket',
    sourceTitle: ticket.title || ticket.locationText || ticket.projectName || '',
    eventType: event.eventType,
    note: event.note || '',
    changedBy: event.changedBy,
    changedAt: event.changedAt,
  })));

  const recentReportActivity = normalizedReports.map((report) => ({
    id: `report_${report.id}`,
    source: 'report',
    sourceTitle: report.area || report.projectName || report.id,
    eventType: 'report_saved',
    note: report.workSummary || report.issueSummary || report.tomorrowPlan || '',
    changedBy: report.createdBy,
    changedAt: report.updatedAt || report.createdAt,
  }));

  const recentActivity = sortByRecent([...recentTicketActivity, ...recentReportActivity], ['changedAt']).slice(0, 6);

  const mainContact = workers.find((worker) => ['project_manager', 'site_manager', 'project_engineer', 'site_engineer', 'supervisor', 'foreman', 'contractor'].includes(worker.role)) || workers[0] || null;
  const projectHealth = calculateProjectHealth({
    projectProgress: selectedProject.progress,
    ticketSummary,
    reports: normalizedReports,
  });

  return {
    projectOptions,
    selectedProject,
    ticketSummary,
    latestIssues,
    latestReports,
    latestPhotos,
    recentActivity,
    mainContact,
    projectHealth,
    currentStage: getProjectProgressStage(selectedProject.progress || projectHealth, labels),
  };
}
