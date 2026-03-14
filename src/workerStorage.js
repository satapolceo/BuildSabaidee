const STORAGE_PREFIX = 'buildsabaidee.worker.';

export const WORKER_STORAGE_KEYS = {
  attendance: `${STORAGE_PREFIX}attendance`,
  photoReports: `${STORAGE_PREFIX}photoReports`,
  voiceNotes: `${STORAGE_PREFIX}voiceNotes`,
  issues: `${STORAGE_PREFIX}issues`,
  materialRequests: `${STORAGE_PREFIX}materialRequests`,
  tasks: `${STORAGE_PREFIX}tasks`,
  settings: `${STORAGE_PREFIX}settings`,
};

export const ATTENDANCE_STATUS = {
  saved: 'saved',
};

export const TASK_STATUS = {
  notStarted: 'not_started',
  inProgress: 'in_progress',
  completed: 'completed',
};

function createSyncFields(status = 'local', timestamp = Date.now()) {
  return {
    syncStatus: status,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function loadFromStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return fallback;
  }
}

export function saveToStorage(key, value) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
}

export function createLocalId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getDateKey(timestamp = Date.now()) {
  return new Date(timestamp).toISOString().split('T')[0];
}

export function getTimeLabel(timestamp) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

export function createAttendanceRecord({
  workerId,
  workerName,
  siteName,
  type,
  note = '',
  status = ATTENDANCE_STATUS.saved,
  timestamp = Date.now(),
}) {
  return {
    id: createLocalId('attendance'),
    workerId,
    workerName,
    siteName,
    type,
    timestamp,
    dateKey: getDateKey(timestamp),
    note,
    status,
    ...createSyncFields('local', timestamp),
  };
}

export function getTodayAttendance(records, workerId, dateKey = getDateKey()) {
  const workerRecords = records
    .filter((record) => String(record.workerId || '') === String(workerId || '') && record.dateKey === dateKey)
    .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));

  const checkIn = workerRecords.find((record) => record.type === 'checkin') || null;
  const checkOut = [...workerRecords].reverse().find((record) => record.type === 'checkout') || null;

  return {
    records: workerRecords,
    checkIn,
    checkOut,
    status: checkOut ? 'checked_out' : checkIn ? 'checked_in' : 'not_started',
  };
}

export function createPhotoReport({
  workerId,
  workerName,
  siteName,
  category,
  detail,
  imageData,
  imageMeta = {},
  status = 'submitted',
  timestamp = Date.now(),
}) {
  return {
    id: createLocalId('photo_report'),
    workerId,
    workerName,
    siteName,
    category,
    detail,
    imageData,
    submittedAt: timestamp,
    dateKey: getDateKey(timestamp),
    status,
    imageMeta,
    ...createSyncFields(status === 'submitted' ? 'pending' : 'local', timestamp),
  };
}

export function createPhotoBatchPhoto({
  imageData,
  imageMeta = {},
  originalName = '',
  timestamp = Date.now(),
}) {
  return {
    id: createLocalId('photo_item'),
    imageData,
    imageMeta,
    originalName,
    capturedAt: timestamp,
  };
}

export function createPhotoSubmissionBatch({
  workerId,
  workerName,
  projectId = '',
  projectName = '',
  workType,
  tradeTeam,
  roomId,
  roomName,
  batchTitle,
  notes = '',
  photos = [],
  voiceNote = null,
  status = 'submitted',
  timestamp = Date.now(),
}) {
  const normalizedStatus = status === 'draft' ? 'draft' : 'submitted';
  return {
    id: createLocalId('photo_batch'),
    workerId,
    workerName,
    projectId,
    projectName,
    siteName: projectName,
    workType,
    tradeTeam,
    roomId,
    roomName,
    batchTitle,
    notes,
    photos,
    voiceNote,
    photoCount: photos.length,
    submittedAt: timestamp,
    dateKey: getDateKey(timestamp),
    status: normalizedStatus,
    ...createSyncFields(normalizedStatus === 'submitted' ? 'pending' : 'local', timestamp),
  };
}

export function normalizePhotoSubmissionBatch(entry) {
  if (!entry) return null;

  const normalizedVoiceNote = entry.voiceNote
    ? {
        id: entry.voiceNote.id || createLocalId('batch_voice'),
        audioData: entry.voiceNote.audioData || '',
        durationMs: Number(entry.voiceNote.durationMs || 0),
        mimeType: entry.voiceNote.mimeType || 'audio/webm',
        recordedAt: Number(entry.voiceNote.recordedAt || entry.updatedAt || entry.createdAt || Date.now()),
        source: entry.voiceNote.source || 'inline',
      }
    : null;

  if (Array.isArray(entry.photos)) {
    const timestamp = Number(entry.submittedAt || entry.updatedAt || entry.createdAt || Date.now());
    const normalizedStatus = entry.status === 'draft' ? 'draft' : 'submitted';
    return {
      ...entry,
      projectId: entry.projectId || '',
      projectName: entry.projectName || entry.siteName || '',
      siteName: entry.projectName || entry.siteName || '',
      workType: entry.workType || entry.category || '',
      tradeTeam: entry.tradeTeam || '',
      roomId: entry.roomId || '',
      roomName: entry.roomName || '',
      batchTitle: entry.batchTitle || entry.workType || entry.category || '',
      notes: entry.notes || entry.detail || '',
      photos: entry.photos,
      photoCount: entry.photoCount || entry.photos.length,
      voiceNote: normalizedVoiceNote,
      submittedAt: timestamp,
      dateKey: entry.dateKey || getDateKey(timestamp),
      status: normalizedStatus,
      syncStatus: entry.syncStatus || (normalizedStatus === 'submitted' ? 'pending' : 'local'),
      createdAt: entry.createdAt || timestamp,
      updatedAt: entry.updatedAt || timestamp,
    };
  }

  if (!entry.imageData) return null;

  const timestamp = Number(entry.submittedAt || entry.updatedAt || entry.createdAt || Date.now());
  const normalizedStatus = entry.status === 'submitted' ? 'submitted' : 'draft';
  return {
    id: entry.id || createLocalId('photo_batch'),
    workerId: entry.workerId || '',
    workerName: entry.workerName || '',
    projectId: entry.projectId || '',
    projectName: entry.siteName || entry.projectName || '',
    siteName: entry.siteName || entry.projectName || '',
    workType: entry.category || '',
    tradeTeam: entry.tradeTeam || '',
    roomId: entry.roomId || '',
    roomName: entry.roomName || '',
    batchTitle: entry.category || 'Work photo',
    notes: entry.detail || '',
    photos: [
      createPhotoBatchPhoto({
        imageData: entry.imageData,
        imageMeta: entry.imageMeta || {},
        originalName: entry.originalName || '',
        timestamp,
      }),
    ],
    photoCount: 1,
    voiceNote: normalizedVoiceNote,
    submittedAt: timestamp,
    dateKey: entry.dateKey || getDateKey(timestamp),
    status: normalizedStatus,
    syncStatus: entry.syncStatus || (normalizedStatus === 'submitted' ? 'pending' : 'local'),
    createdAt: entry.createdAt || timestamp,
    updatedAt: entry.updatedAt || timestamp,
  };
}

export function createVoiceNoteRecord({
  workerId,
  workerName,
  siteName,
  audioData,
  durationMs = 0,
  mimeType = 'audio/webm',
  status = 'saved',
  timestamp = Date.now(),
}) {
  return {
    id: createLocalId('voice_note'),
    workerId,
    workerName,
    siteName,
    audioData,
    durationMs,
    mimeType,
    recordedAt: timestamp,
    dateKey: getDateKey(timestamp),
    status,
    ...createSyncFields('local', timestamp),
  };
}

export function createIssueReport({
  workerId,
  workerName,
  siteName,
  category,
  urgency,
  detail,
  imageData = '',
  status = 'open',
  timestamp = Date.now(),
}) {
  return {
    id: createLocalId('issue'),
    workerId,
    workerName,
    siteName,
    category,
    urgency,
    detail,
    imageData,
    reportedAt: timestamp,
    dateKey: getDateKey(timestamp),
    status,
    ...createSyncFields('pending', timestamp),
  };
}

export function createMaterialRequest({
  workerId,
  workerName,
  siteName,
  itemName,
  quantity,
  unit,
  note = '',
  imageData = '',
  status = 'pending',
  timestamp = Date.now(),
}) {
  return {
    id: createLocalId('material_request'),
    workerId,
    workerName,
    siteName,
    itemName,
    quantity,
    unit,
    note,
    imageData,
    requestedAt: timestamp,
    dateKey: getDateKey(timestamp),
    status,
    ...createSyncFields('pending', timestamp),
  };
}

export function createDefaultWorkerTasks(workerId, siteName) {
  const today = Date.now();
  return [
    {
      id: createLocalId('task'),
      workerId,
      title: 'foundation_pour',
      project: siteName,
      dueDate: getDateKey(today),
      status: TASK_STATUS.inProgress,
      progress: 55,
      note: 'zone_a_concrete_team',
    },
    {
      id: createLocalId('task'),
      workerId,
      title: 'rebar_storage',
      project: siteName,
      dueDate: getDateKey(today),
      status: TASK_STATUS.notStarted,
      progress: 0,
      note: 'material_yard_queue',
    },
  ];
}

export function getWorkerTasks(tasks, workerId, siteName) {
  const filtered = tasks.filter((task) => String(task.workerId || '') === String(workerId || ''));
  return filtered.length > 0 ? filtered : createDefaultWorkerTasks(workerId, siteName);
}

export function updateWorkerTaskStatus(tasks, taskId, nextStatus) {
  return tasks.map((task) => {
    if (task.id !== taskId) return task;

    const progress = nextStatus === TASK_STATUS.completed ? 100 : nextStatus === TASK_STATUS.inProgress ? Math.max(Number(task.progress || 0), 25) : 0;
    return { ...task, status: nextStatus, progress };
  });
}
