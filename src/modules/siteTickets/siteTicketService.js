import { buildAttachmentPayload, normalizeAttachmentDraft } from '../attachments/attachmentModel';
import {
  SITE_TICKET_PRIORITY,
  SITE_TICKET_STATUS,
  createDefaultSiteTicketForm,
  createSiteTicket,
  createSiteTicketNote,
  normalizeSiteTicket,
} from './siteTicketModel';
import { buildTicketCreatedTimeline, buildTicketUpdateTimeline } from './siteTicketTimelineService';
import { isSiteTicketOverdue } from './siteTicketStatusUtils';

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

export function migrateLegacyIssuesToSiteTickets(legacyIssues = [], context = {}) {
  const {
    currentProject = null,
    projectsList = [],
  } = context;

  return (Array.isArray(legacyIssues) ? legacyIssues : []).map((issue) => {
    const projectId = String(issue.projectId || currentProject?.id || '');
    const projectName = issue.projectName
      || projectsList.find((project) => String(project.id) === projectId)?.name
      || issue.siteName
      || currentProject?.name
      || '';

    return normalizeSiteTicket({
      id: issue.id,
      projectId,
      projectName,
      title: issue.category ? `${issue.category} issue` : 'Site issue',
      description: issue.detail || '',
      category: issue.category || 'issue',
      priority: issue.urgency || SITE_TICKET_PRIORITY.high,
      locationText: issue.siteName || '',
      assigneeId: '',
      assigneeName: '',
      createdBy: {
        id: issue.workerId || '',
        name: issue.workerName || '',
        role: 'worker',
      },
      dueDate: '',
      status: issue.status === 'resolved' ? SITE_TICKET_STATUS.completed : SITE_TICKET_STATUS.new,
      attachments: issue.imageData
        ? [{
            id: `${issue.id}_legacy_photo`,
            kind: 'photo',
            imageData: issue.imageData,
            imageMeta: issue.imageStats || {},
            originalName: issue.originalName || '',
            capturedAt: issue.reportedAt || issue.createdAt || Date.now(),
            source: 'legacy_issue',
          }]
        : [],
      notes: [],
      createdAt: issue.reportedAt || issue.createdAt || Date.now(),
      updatedAt: issue.updatedAt || issue.reportedAt || issue.createdAt || Date.now(),
    });
  });
}

export function createSiteTicketFromForm({
  form = {},
  currentUser = null,
} = {}) {
  const timestamp = Date.now();
  const attachmentsPayload = buildAttachmentPayload({
    projectId: form.projectId,
    linkedType: 'site_ticket',
    linkedId: form.id || '',
    createdBy: currentUser,
    draft: normalizeAttachmentDraft(form.attachmentsDraft),
  });

  const nextTicket = createSiteTicket({
    id: form.id || undefined,
    projectId: form.projectId,
    projectName: form.projectName,
    title: form.title,
    description: form.description,
    category: form.category,
    priority: form.priority,
    locationText: form.locationText,
    assigneeId: form.assigneeId,
    assigneeName: form.assigneeName,
    createdBy: currentUser || form.createdBy,
    lastUpdatedBy: currentUser || form.createdBy,
    dueDate: form.dueDate,
    status: form.status || SITE_TICKET_STATUS.new,
    attachments: attachmentsPayload.attachments,
    notes: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return normalizeSiteTicket({
    ...nextTicket,
    timeline: buildTicketCreatedTimeline(nextTicket, currentUser),
  });
}

export function updateSiteTicketFromForm(ticket = {}, {
  form = {},
  actor = null,
} = {}) {
  const currentTicket = normalizeSiteTicket(ticket);
  const nextDraft = normalizeAttachmentDraft(form.attachmentsDraft);
  const attachmentsPayload = buildAttachmentPayload({
    projectId: form.projectId || currentTicket.projectId,
    linkedType: 'site_ticket',
    linkedId: currentTicket.id,
    createdBy: actor || currentTicket.createdBy,
    draft: nextDraft,
  });
  const updateNoteText = String(form.updateNote || '').trim();

  return normalizeSiteTicket({
    ...(function buildNextTicket() {
      const nextTicket = normalizeSiteTicket({
        ...currentTicket,
        projectId: form.projectId || currentTicket.projectId,
        projectName: form.projectName || currentTicket.projectName,
        title: form.title,
    description: form.description,
    category: form.category,
    priority: form.priority,
    locationText: form.locationText,
        assigneeId: form.assigneeId,
        assigneeName: form.assigneeName,
        dueDate: form.dueDate,
        status: form.status,
        attachments: attachmentsPayload.attachments,
        notes: updateNoteText
          ? [
              createSiteTicketNote({
                text: updateNoteText,
                createdBy: actor,
              }),
              ...currentTicket.notes,
            ]
          : currentTicket.notes,
        lastUpdatedBy: actor || currentTicket.lastUpdatedBy || currentTicket.createdBy,
        updatedAt: Date.now(),
      });

      return {
        ...nextTicket,
        timeline: buildTicketUpdateTimeline(currentTicket, nextTicket, actor, updateNoteText),
      };
    })(),
  });
}

export function buildTicketFormFromTicket(ticket = {}, currentUser = null) {
  const normalized = normalizeSiteTicket(ticket);
  return {
    ...createDefaultSiteTicketForm({
      projectId: normalized.projectId,
      projectName: normalized.projectName,
      currentUser: currentUser || normalized.createdBy,
    }),
    ...normalized,
    attachmentsDraft: {
      linkedType: 'site_ticket',
      status: 'draft',
      photos: normalized.attachments.filter((item) => item?.kind === 'photo'),
      voiceNote: normalized.attachments.find((item) => item?.kind === 'voice') || null,
      note: normalized.attachments.find((item) => item?.kind === 'note')?.text || '',
    },
    updateNote: '',
  };
}

export function filterSiteTickets(tickets = [], filters = {}) {
  const search = normalizeSearchValue(filters.search);
  const projectId = String(filters.projectId || 'all');
  const status = String(filters.status || 'all');
  const priority = String(filters.priority || 'all');
  const assigneeId = String(filters.assigneeId || 'all');

  return (Array.isArray(tickets) ? tickets : []).filter((ticket) => {
    const matchesProject = projectId === 'all' || String(ticket.projectId) === projectId;
    const matchesStatus = status === 'all' || ticket.status === status;
    const matchesPriority = priority === 'all' || ticket.priority === priority;
    const matchesAssignee = assigneeId === 'all' || String(ticket.assigneeId || '') === assigneeId;
    const haystack = normalizeSearchValue([
      ticket.title,
      ticket.description,
      ticket.category,
      ticket.locationText,
      ticket.assigneeName,
      ticket.projectName,
      ticket.createdBy?.name,
    ].join(' '));
    const matchesSearch = !search || haystack.includes(search);
    return matchesProject && matchesStatus && matchesPriority && matchesAssignee && matchesSearch;
  });
}

export function sortSiteTickets(tickets = []) {
  return [...(Array.isArray(tickets) ? tickets : [])]
    .sort((left, right) => Number(right.updatedAt || right.createdAt || 0) - Number(left.updatedAt || left.createdAt || 0));
}

export function getVisibleSiteTickets(tickets = [], {
  role = 'worker',
  currentUserId = '',
  projectId = '',
} = {}) {
  const normalizedProjectId = String(projectId || '');
  if (role === 'admin') return sortSiteTickets(tickets);
  if (role === 'owner') {
    return sortSiteTickets(
      tickets.filter((ticket) => !normalizedProjectId || String(ticket.projectId) === normalizedProjectId),
    );
  }
  if (['supervisor', 'contractor', 'project_manager', 'site_manager'].includes(role)) {
    return sortSiteTickets(
      tickets.filter((ticket) => !normalizedProjectId || String(ticket.projectId) === normalizedProjectId),
    );
  }
  return sortSiteTickets(
    tickets.filter((ticket) => (
      (!normalizedProjectId || String(ticket.projectId) === normalizedProjectId)
      && (
        String(ticket.createdBy?.id || '') === String(currentUserId || '')
        || String(ticket.assigneeId || '') === String(currentUserId || '')
      )
    )),
  );
}

export function getSiteTicketSummaryCounts(tickets = []) {
  return (Array.isArray(tickets) ? tickets : []).reduce((summary, ticket) => ({
    total: summary.total + 1,
    open: summary.open + (ticket.status === SITE_TICKET_STATUS.closed ? 0 : 1),
    critical: summary.critical + (ticket.priority === SITE_TICKET_PRIORITY.critical ? 1 : 0),
  }), { total: 0, open: 0, critical: 0 });
}

export function getSiteTicketDueState(ticket = {}, now = Date.now()) {
  return {
    dueDate: ticket?.dueDate || '',
    overdue: isSiteTicketOverdue(ticket, now),
  };
}
