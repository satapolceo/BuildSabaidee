import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import OwnerProjectProgressView from '../src/modules/projectProgress/OwnerProjectProgressView';
import { buildProjectProgressSelectors } from '../src/modules/projectProgress/projectProgressSelectors';
import { getProjectProgressCopy } from '../src/modules/projectProgress/projectProgressI18n';

const labels = getProjectProgressCopy('EN');
const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};
const formatNumber = (value) => String(value);

const projectsList = [
  { id: 'p1', name: 'Sky Tower', progress: 68, location: 'Vientiane' },
  { id: 'p2', name: 'Garden Villa', progress: 22, location: 'Xaythany' },
];

const workersList = [
  { id: 'w1', name: 'Noy', role: 'supervisor', assignedSiteId: 'p1' },
  { id: 'w2', name: 'Kham', role: 'worker', assignedSiteId: 'p1' },
];

const siteTickets = [
  {
    id: 't1',
    projectId: 'p1',
    projectName: 'Sky Tower',
    title: 'Waterproofing defect',
    description: 'Leak found near roof drain.',
    locationText: 'Roof slab',
    priority: 'high',
    status: 'pending_approval',
    assigneeId: 'w1',
    assigneeName: 'Noy',
    createdBy: { id: 'w2', name: 'Kham', role: 'worker' },
    dueDate: '2026-03-20',
    attachments: [{ id: 'a1', kind: 'photo', imageData: 'data:image/jpeg;base64,abc' }],
    timeline: [
      { id: 'e1', eventType: 'created', changedBy: { id: 'w2', name: 'Kham', role: 'worker' }, changedAt: Date.parse('2026-03-21T08:00:00Z'), note: 'Leak started after rain' },
      { id: 'e2', eventType: 'status_changed', changedBy: { id: 'w1', name: 'Noy', role: 'supervisor' }, changedAt: Date.parse('2026-03-22T09:00:00Z'), note: 'Waiting for owner review' },
    ],
    createdAt: Date.parse('2026-03-21T08:00:00Z'),
    updatedAt: Date.parse('2026-03-22T09:00:00Z'),
  },
  {
    id: 't2',
    projectId: 'p1',
    projectName: 'Sky Tower',
    title: 'Tile repair',
    description: 'Entrance tile reset complete.',
    locationText: 'Lobby',
    priority: 'medium',
    status: 'completed',
    assigneeId: 'w1',
    assigneeName: 'Noy',
    createdBy: { id: 'w1', name: 'Noy', role: 'supervisor' },
    dueDate: '2026-03-28',
    attachments: [],
    timeline: [
      { id: 'e3', eventType: 'created', changedBy: { id: 'w1', name: 'Noy', role: 'supervisor' }, changedAt: Date.parse('2026-03-24T07:00:00Z'), note: 'Repair started' },
    ],
    createdAt: Date.parse('2026-03-24T07:00:00Z'),
    updatedAt: Date.parse('2026-03-24T14:00:00Z'),
  },
];

const dailyReports = [
  {
    id: 'r1',
    projectId: 'p1',
    projectName: 'Sky Tower',
    reportDate: '2026-03-24',
    area: 'Roof slab',
    workSummary: 'Waterproofing inspection and tile replacement completed.',
    workerCount: 6,
    materialSummary: 'Sealant and replacement tiles delivered.',
    issueSummary: 'Owner review still needed for drain detail.',
    tomorrowPlan: 'Seal final edge and confirm approval.',
    attachments: [
      { id: 'ra1', kind: 'photo', imageData: 'data:image/jpeg;base64,def' },
      { id: 'ra2', kind: 'note', text: 'Inspection passed on west side' },
    ],
    relatedTicketIds: ['t1'],
    createdBy: { id: 'w1', name: 'Noy', role: 'supervisor' },
    createdAt: Date.parse('2026-03-24T17:00:00Z'),
    updatedAt: Date.parse('2026-03-24T17:30:00Z'),
  },
];

function renderProgress(role = 'owner') {
  const data = buildProjectProgressSelectors({
    projectsList,
    workersList,
    siteTickets,
    dailyReports,
    selectedProjectId: 'p1',
    labels,
  });

  return render(
    <OwnerProjectProgressView
      labels={labels}
      language="EN"
      role={role}
      data={data}
      selectedProjectId="p1"
      onProjectChange={() => {}}
      formatDate={formatDate}
      formatNumber={formatNumber}
    />
  );
}

describe('Owner project progress module', () => {
  it('renders aggregated owner progress summary from tickets and reports', () => {
    renderProgress();

    expect(screen.getByText('Project Progress Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Tickets')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending Approval').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
    expect(screen.getByText('Systems')).toBeInTheDocument();
    expect(screen.getByText('52%')).toBeInTheDocument();
  });

  it('renders latest report and latest issue sections with current data', () => {
    renderProgress();

    expect(screen.getByText('Latest Issue Highlights')).toBeInTheDocument();
    expect(screen.getAllByText('Waterproofing defect').length).toBeGreaterThan(0);
    expect(screen.getByText('Latest Daily Reports')).toBeInTheDocument();
    expect(screen.getAllByText('Roof slab').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Waterproofing inspection and tile replacement completed.').length).toBeGreaterThan(0);
    expect(screen.getByText('Latest Site Photos')).toBeInTheDocument();
  });

  it('stays read-only for owners and shows the role-safe badge', () => {
    renderProgress('owner');

    expect(screen.getByText('Owner view: read-only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save/i })).not.toBeInTheDocument();
  });

  it('shows recent activity aggregated from ticket timeline and daily reports', () => {
    renderProgress('admin');

    expect(screen.getByText('Admin view: broader read-only access')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Status changed')).toBeInTheDocument();
    expect(screen.getByText('Waiting for owner review')).toBeInTheDocument();
    expect(screen.getByText('Report saved')).toBeInTheDocument();
    expect(screen.getByText('Seal final edge and confirm approval.')).toBeInTheDocument();
  });
});



