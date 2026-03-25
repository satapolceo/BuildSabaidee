import { createAttachmentDraft, normalizeAttachmentDraft } from '../attachments/attachmentModel';

export const SITE_TICKET_STATUS = {
  new: 'new',
  inProgress: 'in_progress',
  pendingApproval: 'pending_approval',
  completed: 'completed',
  closed: 'closed',
};

export const SITE_TICKET_PRIORITY = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

export const SITE_TICKET_CATEGORY = {
  issue: 'issue',
  defect: 'defect',
  safety: 'safety',
  quality: 'quality',
  material: 'material',
  progress: 'progress',
};

export function createSiteTicketId(prefix = 'ticket') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSiteTicketNote({
  id = createSiteTicketId('ticket_note'),
  text = '',
  createdBy = null,
  createdAt = Date.now(),
} = {}) {
  return {
    id,
    text: String(text || '').trim(),
    createdBy,
    createdAt,
  };
}

export function createSiteTicket({
  id = createSiteTicketId(),
  projectId = '',
  projectName = '',
  title = '',
  description = '',
  category = SITE_TICKET_CATEGORY.issue,
  priority = SITE_TICKET_PRIORITY.medium,
  locationText = '',
  assigneeId = '',
  assigneeName = '',
  createdBy = null,
  lastUpdatedBy = null,
  dueDate = '',
  status = SITE_TICKET_STATUS.new,
  attachments = [],
  notes = [],
  timeline = [],
  createdAt = Date.now(),
  updatedAt = Date.now(),
} = {}) {
  return {
    id,
    projectId: String(projectId || ''),
    projectName: String(projectName || ''),
    title: String(title || '').trim(),
    description: String(description || '').trim(),
    category,
    priority,
    locationText: String(locationText || '').trim(),
    assigneeId: String(assigneeId || ''),
    assigneeName: String(assigneeName || '').trim(),
    createdBy: createdBy ? {
      id: String(createdBy.id || ''),
      name: String(createdBy.name || ''),
      role: String(createdBy.role || 'worker'),
    } : null,
    lastUpdatedBy: lastUpdatedBy ? {
      id: String(lastUpdatedBy.id || ''),
      name: String(lastUpdatedBy.name || ''),
      role: String(lastUpdatedBy.role || ''),
    } : null,
    dueDate: dueDate || '',
    status,
    attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
    notes: Array.isArray(notes) ? notes.filter((entry) => entry?.text) : [],
    timeline: Array.isArray(timeline) ? timeline.filter(Boolean) : [],
    createdAt: Number(createdAt || Date.now()),
    updatedAt: Number(updatedAt || createdAt || Date.now()),
  };
}

export function getAttachmentDraftFromSiteTicket(ticket = {}) {
  const attachments = Array.isArray(ticket.attachments) ? ticket.attachments : [];
  const photos = attachments.filter((item) => item?.kind === 'photo');
  const voiceNote = attachments.find((item) => item?.kind === 'voice') || null;
  const noteAttachment = attachments.find((item) => item?.kind === 'note');

  return normalizeAttachmentDraft(createAttachmentDraft({
    linkedType: 'site_ticket',
    status: 'draft',
    photos,
    voiceNote,
    note: noteAttachment?.text || '',
  }));
}

export function createDefaultSiteTicketForm({
  projectId = '',
  projectName = '',
  currentUser = null,
} = {}) {
  return {
    id: '',
    projectId: String(projectId || ''),
    projectName: String(projectName || ''),
    title: '',
    description: '',
    category: SITE_TICKET_CATEGORY.issue,
    priority: SITE_TICKET_PRIORITY.high,
    locationText: '',
    assigneeId: '',
    assigneeName: '',
    createdBy: currentUser ? {
      id: String(currentUser.id || ''),
      name: String(currentUser.name || ''),
      role: String(currentUser.role || 'worker'),
    } : null,
    dueDate: '',
    status: SITE_TICKET_STATUS.new,
    lastUpdatedBy: currentUser ? {
      id: String(currentUser.id || ''),
      name: String(currentUser.name || ''),
      role: String(currentUser.role || 'worker'),
    } : null,
    attachmentsDraft: createAttachmentDraft({
      linkedType: 'site_ticket',
      status: 'draft',
    }),
    updateNote: '',
  };
}

export function normalizeSiteTicket(input = {}) {
  return createSiteTicket({
    ...input,
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    notes: Array.isArray(input.notes) ? input.notes : [],
  });
}

export function normalizeSiteTicketList(items = []) {
  return (Array.isArray(items) ? items : []).map(normalizeSiteTicket).filter(Boolean);
}

export function canEditSiteTicket(role = 'worker') {
  return ['supervisor', 'contractor', 'project_manager', 'site_manager', 'admin'].includes(role);
}

export function isOwnerSiteTicketRole(role = 'worker') {
  return role === 'owner';
}
