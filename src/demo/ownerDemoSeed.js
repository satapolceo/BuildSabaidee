import { WORKER_STORAGE_KEYS } from '../workerStorage';
import { createPhotoAttachment, createNoteAttachment } from '../modules/attachments/attachmentModel';
import {
  SITE_TICKET_CATEGORY,
  SITE_TICKET_PRIORITY,
  SITE_TICKET_STATUS,
  createSiteTicket,
} from '../modules/siteTickets/siteTicketModel';
import {
  SITE_TICKET_EVENT_TYPE,
  createSiteTicketTimelineEvent,
} from '../modules/siteTickets/siteTicketTimelineModel';
import { createDailyReport } from '../modules/dailyReports/dailyReportModel';

export const OWNER_DEMO_SEED_KEY = 'owner_demo_seed_v1';

const DAY_MS = 24 * 60 * 60 * 1000;

const PROJECT_IDS = {
  riverside: 'demo-project-riverside-villa',
  skyline: 'demo-project-skyline-townhome',
  retreat: 'demo-project-rainforest-retreat',
};

const WORKER_IDS = {
  manager: 'demo-worker-project-manager',
  supervisor: 'demo-worker-site-supervisor',
  engineer: 'demo-worker-site-engineer',
  foreman: 'demo-worker-foreman',
  workerA: 'demo-worker-team-a',
  workerB: 'demo-worker-team-b',
};

function toSvgDataUrl(label = 'BuildSabaidee', accent = '#2563eb', background = '#dbeafe') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
      <rect width="480" height="320" rx="28" fill="${background}"/>
      <rect x="26" y="26" width="428" height="268" rx="22" fill="white" opacity="0.9"/>
      <circle cx="102" cy="102" r="42" fill="${accent}" opacity="0.14"/>
      <circle cx="388" cy="226" r="54" fill="${accent}" opacity="0.18"/>
      <text x="42" y="188" fill="#0f172a" font-size="28" font-family="Arial, sans-serif" font-weight="700">${label}</text>
      <text x="42" y="224" fill="#334155" font-size="18" font-family="Arial, sans-serif">Owner demo preview</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createDemoActor(id, name, role) {
  return { id, name, role };
}

function createTimeline(ticketId, status, assignee, createdBy, createdAt, updatedAt, note) {
  const timeline = [
    createSiteTicketTimelineEvent({
      ticketId,
      eventType: SITE_TICKET_EVENT_TYPE.created,
      newStatus: SITE_TICKET_STATUS.new,
      note,
      changedBy: createdBy,
      changedAt: createdAt,
    }),
  ];

  if (assignee?.id) {
    timeline.push(createSiteTicketTimelineEvent({
      ticketId,
      eventType: SITE_TICKET_EVENT_TYPE.assigneeChanged,
      oldAssigneeId: '',
      newAssigneeId: assignee.id,
      oldAssigneeName: '',
      newAssigneeName: assignee.name,
      changedBy: createDemoActor(WORKER_IDS.manager, 'Bounmy S.', 'project_manager'),
      changedAt: createdAt + (2 * 60 * 60 * 1000),
    }));
  }

  if (status !== SITE_TICKET_STATUS.new) {
    timeline.push(createSiteTicketTimelineEvent({
      ticketId,
      eventType: SITE_TICKET_EVENT_TYPE.statusChanged,
      oldStatus: SITE_TICKET_STATUS.new,
      newStatus: status,
      changedBy: assignee || createdBy,
      changedAt: updatedAt - (60 * 60 * 1000),
    }));
  }

  if (note) {
    timeline.push(createSiteTicketTimelineEvent({
      ticketId,
      eventType: SITE_TICKET_EVENT_TYPE.noteAdded,
      note,
      changedBy: assignee || createdBy,
      changedAt: updatedAt,
    }));
  }

  return timeline;
}

function buildDemoProjects(now) {
  return [
    {
      id: PROJECT_IDS.riverside,
      name: 'Riverside Pool Villa Renovation',
      location: 'Luang Prabang Riverside',
      progress: 68,
      status: 'active',
      workers: 14,
      projectValue: 2725000,
      startDate: '2026-02-01',
      endDate: '2026-07-15',
      clientName: 'Alinda Phonsavath',
      supervisor: {
        name: 'Noy Chanthavong',
        position: 'Site Supervisor',
        phone: '020 5555 1122',
        email: 'noy@buildsabaidee.app',
        otherContact: 'LINE: noy-site',
        notes: 'Coordinates owner walkthrough every Friday.',
      },
      createdAt: now - (3 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: PROJECT_IDS.skyline,
      name: 'Skyline Townhome Block B',
      location: 'Sisattanak, Vientiane',
      progress: 41,
      status: 'active',
      workers: 11,
      projectValue: 1950000,
      startDate: '2026-01-15',
      endDate: '2026-08-30',
      supervisor: {
        name: 'Khamla Douangphachanh',
        position: 'Project Engineer',
        phone: '020 4444 2244',
        email: 'khamla@buildsabaidee.app',
        otherContact: 'WhatsApp: khamla-engineer',
        notes: 'Tracks MEP and owner material approvals.',
      },
      createdAt: now - (8 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: PROJECT_IDS.retreat,
      name: 'Rainforest Retreat Cabin',
      location: 'Vang Vieng Hillside',
      progress: 92,
      status: 'completed',
      workers: 6,
      projectValue: 1180000,
      startDate: '2025-10-01',
      endDate: '2026-03-10',
      supervisor: {
        name: 'Somvang Keoboualapha',
        position: 'Foreman',
        phone: '020 3333 8899',
        email: 'somvang@buildsabaidee.app',
        otherContact: 'Telegram: somvang-foreman',
        notes: 'Close-out and handover support.',
      },
      createdAt: now - (14 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
  ];
}

function buildDemoWorkers(now) {
  return [
    {
      id: WORKER_IDS.manager,
      name: 'Bounmy S.',
      phone: '020 2222 1199',
      role: 'project_manager',
      wage: 0,
      assignedSiteId: PROJECT_IDS.riverside,
      attendanceRate: 96,
      createdAt: now - (12 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: WORKER_IDS.supervisor,
      name: 'Noy Chanthavong',
      phone: '020 5555 1122',
      role: 'supervisor',
      wage: 220000,
      assignedSiteId: PROJECT_IDS.riverside,
      attendanceRate: 98,
      createdAt: now - (11 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: WORKER_IDS.engineer,
      name: 'Khamla Douangphachanh',
      phone: '020 4444 2244',
      role: 'site_engineer',
      wage: 240000,
      assignedSiteId: PROJECT_IDS.skyline,
      attendanceRate: 93,
      createdAt: now - (10 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: WORKER_IDS.foreman,
      name: 'Somvang Keoboualapha',
      phone: '020 3333 8899',
      role: 'foreman',
      wage: 190000,
      assignedSiteId: PROJECT_IDS.retreat,
      attendanceRate: 97,
      createdAt: now - (10 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: WORKER_IDS.workerA,
      name: 'Phonepaseuth Team A',
      phone: '020 7777 1020',
      role: 'worker',
      wage: 150000,
      assignedSiteId: PROJECT_IDS.riverside,
      attendanceRate: 92,
      createdAt: now - (9 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: WORKER_IDS.workerB,
      name: 'Sengthong Team B',
      phone: '020 8888 2030',
      role: 'worker',
      wage: 150000,
      assignedSiteId: PROJECT_IDS.skyline,
      attendanceRate: 91,
      createdAt: now - (9 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
  ];
}

function buildDemoDocs(now) {
  return [
    {
      id: 'demo-doc-quotation-riverside',
      type: 'quotation',
      title: 'Owner variation quotation: pool deck and facade lighting',
      amount: 2850000,
      date: '2026-03-12',
      projectId: PROJECT_IDS.riverside,
      status: 'approved',
      submittedBy: 'Bounmy S.',
      customerName: 'Alinda Phonsavath',
      createdAt: now - (15 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: 'demo-doc-agreement-riverside',
      type: 'agreement',
      title: 'Main renovation agreement',
      amount: 2725000,
      date: '2026-03-14',
      projectId: PROJECT_IDS.riverside,
      status: 'approved',
      submittedBy: 'BuildSabaidee Contract Team',
      customerName: 'Alinda Phonsavath',
      createdAt: now - (13 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: 'demo-doc-invoice-riverside-progress3',
      type: 'invoice',
      title: 'Progress claim 3: waterproofing and pool edge works',
      amount: 450000,
      date: '2026-03-24',
      projectId: PROJECT_IDS.riverside,
      status: 'pending',
      submittedBy: 'Noy Chanthavong',
      customerName: 'Alinda Phonsavath',
      createdAt: now - (2 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: 'demo-doc-report-riverside-weekly',
      type: 'report',
      title: 'Weekly owner site update',
      amount: 0,
      date: '2026-03-25',
      projectId: PROJECT_IDS.riverside,
      status: 'approved',
      submittedBy: 'Bounmy S.',
      customerName: 'Alinda Phonsavath',
      createdAt: now - (1 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: 'demo-doc-invoice-skyline-approval',
      type: 'invoice',
      title: 'Townhome block B electrical milestone',
      amount: 325000,
      date: '2026-03-20',
      projectId: PROJECT_IDS.skyline,
      status: 'pending',
      submittedBy: 'Khamla Douangphachanh',
      customerName: 'Skyline Development',
      createdAt: now - (4 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
    {
      id: 'demo-doc-billing-retreat-handover',
      type: 'billing',
      title: 'Final handover billing',
      amount: 180000,
      date: '2026-03-08',
      projectId: PROJECT_IDS.retreat,
      status: 'approved',
      submittedBy: 'Somvang Keoboualapha',
      customerName: 'Rainforest Retreat',
      createdAt: now - (18 * DAY_MS),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    },
  ];
}

function createDemoTicket(index, projectId, projectName, status, now) {
  const priorities = [
    SITE_TICKET_PRIORITY.high,
    SITE_TICKET_PRIORITY.medium,
    SITE_TICKET_PRIORITY.low,
    SITE_TICKET_PRIORITY.critical,
  ];
  const categories = [
    SITE_TICKET_CATEGORY.defect,
    SITE_TICKET_CATEGORY.quality,
    SITE_TICKET_CATEGORY.issue,
    SITE_TICKET_CATEGORY.progress,
    SITE_TICKET_CATEGORY.material,
  ];
  const titles = [
    'Waterproofing touch-up needed',
    'Tile alignment review',
    'Owner light fixture approval',
    'Pool coping installation follow-up',
    'Door hardware shortage',
    'Paint finish snag list',
    'Cabinet hinge adjustment',
  ];
  const createdBy = createDemoActor(WORKER_IDS.workerA, 'Phonepaseuth Team A', 'worker');
  const assignee = status === SITE_TICKET_STATUS.new
    ? null
    : createDemoActor(
        index % 2 === 0 ? WORKER_IDS.supervisor : WORKER_IDS.engineer,
        index % 2 === 0 ? 'Noy Chanthavong' : 'Khamla Douangphachanh',
        index % 2 === 0 ? 'supervisor' : 'site_engineer',
      );
  const createdAt = now - ((index + 1) * 7 * 60 * 60 * 1000);
  const updatedAt = createdAt + (index % 5) * 60 * 60 * 1000;
  const dueDate = new Date(now + (((index % 9) - 4) * DAY_MS)).toISOString().split('T')[0];
  const photo = createPhotoAttachment({
    id: `demo-photo-ticket-${index + 1}`,
    imageData: toSvgDataUrl(`Ticket ${index + 1}`, index % 2 === 0 ? '#0284c7' : '#16a34a', index % 2 === 0 ? '#e0f2fe' : '#dcfce7'),
    imageMeta: { width: 480, height: 320, compressed: true, source: 'demo_seed' },
    originalName: `ticket-${index + 1}.svg`,
    capturedAt: createdAt,
    source: 'demo_seed',
  });
  const noteText = `${titles[index % titles.length]} at ${projectName}.`;

  return {
    ...createSiteTicket({
      id: `demo-ticket-${index + 1}`,
      projectId,
      projectName,
      title: `${titles[index % titles.length]} ${index + 1}`,
      description: `Site inspection item ${index + 1} for ${projectName}.`,
      category: categories[index % categories.length],
      priority: priorities[index % priorities.length],
      locationText: index % 2 === 0 ? 'Main facade' : 'Roof terrace',
      assigneeId: assignee?.id || '',
      assigneeName: assignee?.name || '',
      createdBy,
      lastUpdatedBy: assignee || createdBy,
      dueDate,
      status,
      attachments: [
        photo,
        ...(index % 3 === 0 ? [createNoteAttachment({
          id: `demo-note-ticket-${index + 1}`,
          text: noteText,
          updatedAt: updatedAt,
          source: 'demo_seed',
        })] : []),
      ],
      notes: index % 4 === 0 ? [{
        id: `demo-ticket-note-${index + 1}`,
        text: 'Owner asked for the latest site photo before approval.',
        createdBy: assignee || createdBy,
        createdAt: updatedAt,
      }] : [],
      timeline: createTimeline(`demo-ticket-${index + 1}`, status, assignee, createdBy, createdAt, updatedAt, noteText),
      createdAt,
      updatedAt,
    }),
    demoSeedKey: OWNER_DEMO_SEED_KEY,
  };
}

function buildDemoTickets(now) {
  const statuses = [
    ...Array.from({ length: 7 }, () => SITE_TICKET_STATUS.new),
    ...Array.from({ length: 8 }, () => SITE_TICKET_STATUS.inProgress),
    ...Array.from({ length: 7 }, () => SITE_TICKET_STATUS.pendingApproval),
    ...Array.from({ length: 7 }, () => SITE_TICKET_STATUS.completed),
    ...Array.from({ length: 6 }, () => SITE_TICKET_STATUS.closed),
  ];

  return statuses.map((status, index) => {
    const projectIndex = index < 18 ? 0 : index < 28 ? 1 : 2;
    const projectId = [PROJECT_IDS.riverside, PROJECT_IDS.skyline, PROJECT_IDS.retreat][projectIndex];
    const projectName = [
      'Riverside Pool Villa Renovation',
      'Skyline Townhome Block B',
      'Rainforest Retreat Cabin',
    ][projectIndex];
    return createDemoTicket(index, projectId, projectName, status, now);
  });
}

function buildReportAttachment(index, timestamp) {
  return createPhotoAttachment({
    id: `demo-report-photo-${index + 1}`,
    imageData: toSvgDataUrl(`Report ${index + 1}`, '#0f766e', '#ccfbf1'),
    imageMeta: { width: 480, height: 320, compressed: true, source: 'demo_seed' },
    originalName: `report-${index + 1}.svg`,
    capturedAt: timestamp,
    source: 'demo_seed',
  });
}

function summarizeTicketsForReport(tickets) {
  return {
    total: tickets.length,
    completed: tickets.filter((ticket) => ticket.status === SITE_TICKET_STATUS.completed).length,
    pendingApproval: tickets.filter((ticket) => ticket.status === SITE_TICKET_STATUS.pendingApproval).length,
    overdue: tickets.filter((ticket) => (
      ![SITE_TICKET_STATUS.completed, SITE_TICKET_STATUS.closed].includes(ticket.status)
      && ticket.dueDate
      && Date.parse(ticket.dueDate) < Date.now()
    )).length,
    open: tickets.filter((ticket) => ![SITE_TICKET_STATUS.completed, SITE_TICKET_STATUS.closed].includes(ticket.status)).length,
  };
}

function buildDemoReports(now, tickets) {
  const reports = [];
  for (let index = 0; index < 23; index += 1) {
    const projectIndex = index < 12 ? 0 : index < 18 ? 1 : 2;
    const projectId = [PROJECT_IDS.riverside, PROJECT_IDS.skyline, PROJECT_IDS.retreat][projectIndex];
    const projectName = [
      'Riverside Pool Villa Renovation',
      'Skyline Townhome Block B',
      'Rainforest Retreat Cabin',
    ][projectIndex];
    const reportDate = new Date(now - (index * DAY_MS)).toISOString().split('T')[0];
    const createdAt = now - (index * DAY_MS) - (2 * 60 * 60 * 1000);
    const relatedTickets = tickets
      .filter((ticket) => ticket.projectId === projectId)
      .slice(index % 5, (index % 5) + 3);
    const ticketSnapshot = summarizeTicketsForReport(relatedTickets);

    reports.push({
      ...createDailyReport({
        id: `demo-report-${index + 1}`,
        projectId,
        projectName,
        reportDate,
        area: projectIndex === 0 ? 'Pool terrace and facade' : projectIndex === 1 ? 'Townhome block B level 2' : 'Cabin handover area',
        workSummary: projectIndex === 0
          ? 'Waterproofing, tile replacement, and facade touch-up moved forward on schedule.'
          : projectIndex === 1
            ? 'Electrical rough-in and gypsum board closure continued with owner review items logged.'
            : 'Final snag clearing and handover prep completed for the owner walkthrough.',
        workerCount: projectIndex === 0 ? 14 : projectIndex === 1 ? 11 : 6,
        materialSummary: projectIndex === 0
          ? 'Deck tiles, sealant, and facade lights delivered.'
          : projectIndex === 1
            ? 'Conduit, switches, and board sheets were issued from stock.'
            : 'Cleaning materials and touch-up paint consumed during close-out.',
        issueSummary: ticketSnapshot.pendingApproval
          ? 'Pending owner approval items still open before final sign-off.'
          : 'No approval blockers reported during this shift.',
        tomorrowPlan: projectIndex === 0
          ? 'Close pending approval items and prepare the owner progress photo set.'
          : projectIndex === 1
            ? 'Continue room checks and close the highest-priority defects.'
            : 'Complete the final owner handover checklist.',
        attachments: [
          buildReportAttachment(index, createdAt),
          ...(index % 4 === 0 ? [createNoteAttachment({
            id: `demo-report-note-${index + 1}`,
            text: 'Owner-ready daily summary prepared for follow-up.',
            updatedAt: createdAt + (20 * 60 * 1000),
            source: 'demo_seed',
          })] : []),
        ],
        relatedTicketIds: relatedTickets.map((ticket) => ticket.id),
        createdBy: projectIndex === 0
          ? createDemoActor(WORKER_IDS.supervisor, 'Noy Chanthavong', 'supervisor')
          : projectIndex === 1
            ? createDemoActor(WORKER_IDS.engineer, 'Khamla Douangphachanh', 'site_engineer')
            : createDemoActor(WORKER_IDS.foreman, 'Somvang Keoboualapha', 'foreman'),
        ticketSnapshot,
        createdAt,
        updatedAt: createdAt + (30 * 60 * 1000),
      }),
      demoSeedKey: OWNER_DEMO_SEED_KEY,
    });
  }
  return reports;
}

export function buildOwnerDemoSeedBundle(now = Date.now()) {
  const projects = buildDemoProjects(now);
  const workers = buildDemoWorkers(now);
  const docs = buildDemoDocs(now);
  const siteTickets = buildDemoTickets(now);
  const dailyReports = buildDemoReports(now, siteTickets);

  return {
    projects,
    workers,
    docs,
    siteTickets,
    dailyReports,
    storageKeys: {
      siteTickets: WORKER_STORAGE_KEYS.siteTickets,
      dailyReports: WORKER_STORAGE_KEYS.dailyReports,
    },
  };
}

export function mergeSeededRecords(existing = [], seeded = []) {
  const preserved = (Array.isArray(existing) ? existing : []).filter((item) => item?.demoSeedKey !== OWNER_DEMO_SEED_KEY);
  return [...seeded, ...preserved];
}
