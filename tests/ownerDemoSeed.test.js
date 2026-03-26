import { describe, expect, it } from 'vitest';
import { buildOwnerDemoSeedBundle, mergeSeededRecords } from '../src/demo/ownerDemoSeed';
import { buildProjectProgressSelectors } from '../src/modules/projectProgress/projectProgressSelectors';
import { getProjectProgressCopy } from '../src/modules/projectProgress/projectProgressI18n';

describe('owner demo seed bundle', () => {
  it('creates the minimum demo records needed for the owner experience', () => {
    const seedBundle = buildOwnerDemoSeedBundle(Date.parse('2026-03-26T08:00:00Z'));

    expect(seedBundle.projects.length).toBeGreaterThanOrEqual(3);
    expect(seedBundle.workers.length).toBeGreaterThanOrEqual(5);
    expect(seedBundle.docs.length).toBeGreaterThanOrEqual(4);
    expect(seedBundle.siteTickets).toHaveLength(35);
    expect(seedBundle.dailyReports).toHaveLength(23);

    const statuses = new Set(seedBundle.siteTickets.map((ticket) => ticket.status));
    expect(statuses.has('new')).toBe(true);
    expect(statuses.has('in_progress')).toBe(true);
    expect(statuses.has('pending_approval')).toBe(true);
    expect(statuses.has('completed')).toBe(true);
    expect(statuses.has('closed')).toBe(true);

    expect(seedBundle.siteTickets.some((ticket) => ticket.attachments.some((item) => item.kind === 'photo'))).toBe(true);
    expect(seedBundle.dailyReports.some((report) => report.attachments.some((item) => item.kind === 'photo'))).toBe(true);
  });

  it('produces populated owner project progress data for the primary demo project', () => {
    const seedBundle = buildOwnerDemoSeedBundle(Date.parse('2026-03-26T08:00:00Z'));
    const labels = getProjectProgressCopy('EN');
    const primaryProjectId = seedBundle.projects[0].id;

    const progressData = buildProjectProgressSelectors({
      projectsList: seedBundle.projects,
      workersList: seedBundle.workers,
      siteTickets: seedBundle.siteTickets,
      dailyReports: seedBundle.dailyReports,
      selectedProjectId: primaryProjectId,
      labels,
    });

    expect(progressData.selectedProject?.id).toBe(primaryProjectId);
    expect(progressData.ticketSummary.total).toBeGreaterThan(0);
    expect(progressData.latestIssues.length).toBeGreaterThan(0);
    expect(progressData.latestReports.length).toBeGreaterThan(0);
    expect(progressData.latestPhotos.length).toBeGreaterThan(0);
    expect(progressData.recentActivity.length).toBeGreaterThan(0);
    expect(progressData.mainContact?.name).toBeTruthy();
  });

  it('replaces prior demo-seed records without dropping unrelated local records', () => {
    const seedBundle = buildOwnerDemoSeedBundle(Date.parse('2026-03-26T08:00:00Z'));
    const merged = mergeSeededRecords(
      [
        { id: 'legacy-demo', demoSeedKey: 'owner_demo_seed_v1' },
        { id: 'real-user-ticket', title: 'Keep me' },
      ],
      seedBundle.siteTickets.slice(0, 2),
    );

    expect(merged.map((item) => item.id)).toEqual([
      seedBundle.siteTickets[0].id,
      seedBundle.siteTickets[1].id,
      'real-user-ticket',
    ]);
  });
});
