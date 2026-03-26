const ADMIN_FALLBACK_EMAIL = 'admin@buildsabaidee.app';

export const REVIEWER_TRUSTED_ROLES = [
  'admin',
  'manager',
  'project_manager',
  'site_manager',
  'supervisor',
  'contractor',
];

export const TRUSTED_ROLE_TO_BUCKET = {
  admin: 'admin',
  platform_owner: 'admin',
  manager: 'user',
  project_manager: 'user',
  site_manager: 'user',
  supervisor: 'user',
  contractor: 'user',
  owner: 'owner',
  supplier: 'supplier',
  worker: 'worker',
  technician: 'worker',
  general_worker: 'worker',
  skilled_worker: 'worker',
  foreman: 'worker',
};

function normalizeRoleValue(value) {
  return String(value || '').trim().toLowerCase();
}

export function getRoleBucketFromTrustedRole(role) {
  return TRUSTED_ROLE_TO_BUCKET[normalizeRoleValue(role)] || '';
}

export function resolveTrustedRoleClaims({ claims = {}, email = '' } = {}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const claimedRole = normalizeRoleValue(claims?.role);
  const bucketFromClaim = getRoleBucketFromTrustedRole(claimedRole);

  if (bucketFromClaim) {
    return {
      trustedRole: claimedRole,
      roleBucket: bucketFromClaim,
      canReview: REVIEWER_TRUSTED_ROLES.includes(claimedRole),
      source: 'custom_claim',
    };
  }

  if (claims?.admin === true || claims?.platformOwner === true || normalizedEmail == ADMIN_FALLBACK_EMAIL) {
    return {
      trustedRole: 'admin',
      roleBucket: 'admin',
      canReview: true,
      source: normalizedEmail == ADMIN_FALLBACK_EMAIL ? 'email_fallback' : 'legacy_claim',
    };
  }

  return {
    trustedRole: '',
    roleBucket: '',
    canReview: false,
    source: '',
  };
}

export function createTrustedAuthSession({ user, idTokenResult, fallbackDisplayName = '' } = {}) {
  if (!user) return null;

  const resolved = resolveTrustedRoleClaims({
    claims: idTokenResult?.claims || {},
    email: user.email || '',
  });

  if (!resolved.roleBucket) return null;

  return {
    role: resolved.roleBucket,
    trustedRole: resolved.trustedRole,
    roleSource: resolved.source,
    authSource: 'firebase',
    canReview: resolved.canReview,
    email: String(user.email || '').trim().toLowerCase(),
    displayName: user.displayName || fallbackDisplayName || String(user.email || '').trim() || 'BuildSabaidee User',
    uid: user.uid,
    signedInAt: Date.now(),
  };
}
