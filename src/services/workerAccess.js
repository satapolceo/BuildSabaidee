function normalizeStringList(values = []) {
  const seen = new Set();
  return (Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function normalizeEmailValue(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function normalizeWorkerProjectMembership(worker = {}) {
  const assignedProjectIds = normalizeStringList([
    ...(Array.isArray(worker?.assignedProjectIds) ? worker.assignedProjectIds : []),
    worker?.assignedSiteId,
    worker?.projectId,
  ]);
  const preferredActiveProjectId = String(
    worker?.activeProjectId
    || worker?.assignedSiteId
    || worker?.projectId
    || assignedProjectIds[0]
    || ''
  ).trim();
  const activeProjectId = assignedProjectIds.includes(preferredActiveProjectId)
    ? preferredActiveProjectId
    : (assignedProjectIds[0] || '');

  return {
    ...worker,
    authUid: String(worker?.authUid || '').trim(),
    email: normalizeEmailValue(worker?.email),
    assignedProjectIds,
    activeProjectId,
    assignedSiteId: String(worker?.assignedSiteId || activeProjectId || '').trim(),
  };
}

export function matchWorkerToAuthIdentity(worker = {}, authIdentity = {}) {
  const normalizedWorker = normalizeWorkerProjectMembership(worker);
  const authUid = String(authIdentity?.uid || '').trim();
  const authEmail = normalizeEmailValue(authIdentity?.email);

  if (normalizedWorker.authUid && authUid && normalizedWorker.authUid === authUid) return true;
  if (normalizedWorker.email && authEmail && normalizedWorker.email === authEmail) return true;
  return false;
}

export function findWorkerByAuthIdentity(workers = [], authIdentity = {}) {
  return (Array.isArray(workers) ? workers : [])
    .map((worker) => normalizeWorkerProjectMembership(worker))
    .find((worker) => matchWorkerToAuthIdentity(worker, authIdentity))
    || null;
}

export function createWorkerAuthSession({ user, workerRecord } = {}) {
  if (!user || !workerRecord?.id) return null;

  const normalizedWorker = normalizeWorkerProjectMembership(workerRecord);
  const displayName = normalizedWorker.name
    || user.displayName
    || user.email
    || 'BuildSabaidee Worker';
  const trustedRole = String(normalizedWorker.role || 'worker').trim().toLowerCase() || 'worker';

  return {
    role: 'worker',
    trustedRole,
    roleSource: normalizedWorker.authUid === user.uid ? 'worker_auth_uid' : 'worker_email_match',
    authSource: 'firebase',
    canReview: false,
    email: normalizeEmailValue(user.email),
    displayName,
    uid: user.uid,
    workerId: String(normalizedWorker.id),
    signedInAt: Date.now(),
    assignedProjectIds: normalizedWorker.assignedProjectIds,
    activeProjectId: normalizedWorker.activeProjectId,
  };
}
