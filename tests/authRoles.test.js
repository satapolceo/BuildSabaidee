import { describe, expect, it } from 'vitest';
import {
  createTrustedAuthSession,
  resolveTrustedRoleClaims,
} from '../src/services/authRoles.js';

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
});
