import { describe, expect, it } from 'vitest';
import {
  createTrustedAuthSession,
  resolveTrustedRoleClaims,
} from '../src/services/authRoles.js';
import {
  createWorkerAuthSession,
  findWorkerByAuthIdentity,
  normalizeWorkerProjectMembership,
} from '../src/services/workerAccess.js';

describe('trusted auth roles', () => {
  it('maps reviewer custom claims into the manager dashboard bucket', () => {
    expect(resolveTrustedRoleClaims({
      claims: { role: 'project_manager' },
      email: 'manager@example.com',
    })).toMatchObject({
      trustedRole: 'project_manager',
      roleBucket: 'user',
      canReview: true,
      source: 'custom_claim',
    });
  });

  it('keeps owner as read-only and outside reviewer roles', () => {
    expect(resolveTrustedRoleClaims({
      claims: { role: 'owner' },
      email: 'owner@example.com',
    })).toMatchObject({
      trustedRole: 'owner',
      roleBucket: 'owner',
      canReview: false,
    });
  });

  it('uses the transitional admin email fallback when a trusted claim is absent', () => {
    expect(resolveTrustedRoleClaims({
      claims: {},
      email: 'admin@buildsabaidee.app',
    })).toMatchObject({
      trustedRole: 'admin',
      roleBucket: 'admin',
      canReview: true,
      source: 'email_fallback',
    });
  });

  it('creates a firebase-backed auth session from trusted claims', () => {
    const session = createTrustedAuthSession({
      user: {
        uid: 'u1',
        email: 'manager@example.com',
        displayName: 'Manager One',
      },
      idTokenResult: {
        claims: { role: 'site_manager' },
      },
    });

    expect(session).toMatchObject({
      role: 'user',
      trustedRole: 'site_manager',
      authSource: 'firebase',
      canReview: true,
      email: 'manager@example.com',
      displayName: 'Manager One',
    });
  });

  it('normalizes worker membership and can create a worker firebase session', () => {
    const normalizedWorker = normalizeWorkerProjectMembership({
      id: 'worker-1',
      role: 'technician',
      assignedSiteId: 'p1',
      assignedProjectIds: ['p2', 'p1', 'p2'],
      activeProjectId: 'p2',
      email: 'tech@example.com',
    });

    expect(normalizedWorker).toMatchObject({
      assignedProjectIds: ['p2', 'p1'],
      activeProjectId: 'p2',
      email: 'tech@example.com',
    });

    expect(findWorkerByAuthIdentity([normalizedWorker], { email: 'TECH@example.com' })?.id).toBe('worker-1');

    expect(createWorkerAuthSession({
      user: {
        uid: 'firebase-uid-1',
        email: 'tech@example.com',
        displayName: 'Tech One',
      },
      workerRecord: normalizedWorker,
    })).toMatchObject({
      role: 'worker',
      trustedRole: 'technician',
      workerId: 'worker-1',
      assignedProjectIds: ['p2', 'p1'],
      activeProjectId: 'p2',
    });
  });
});
