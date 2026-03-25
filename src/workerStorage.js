const STORAGE_PREFIX = 'buildsabaidee.worker.';

export const WORKER_STORAGE_KEYS = {
  attendance: `${STORAGE_PREFIX}attendance`,
  photoReports: `${STORAGE_PREFIX}photoReports`,
  voiceNotes: `${STORAGE_PREFIX}voiceNotes`,
  issues: `${STORAGE_PREFIX}issues`,
  siteTickets: `${STORAGE_PREFIX}siteTickets`,
  dailyReports: `${STORAGE_PREFIX}dailyReports`,
  materialRequests: `${STORAGE_PREFIX}materialRequests`,
  paymentRequests: `${STORAGE_PREFIX}paymentRequests`,
  milestoneSubmissions: `${STORAGE_PREFIX}milestoneSubmissions`,
  tasks: `${STORAGE_PREFIX}tasks`,
  settings: `${STORAGE_PREFIX}settings`,
  workerPresets: `${STORAGE_PREFIX}workerPresets`,
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

function normalizeBatchPhotoItem(photo, fallbackTimestamp = Date.now()) {
  if (!photo) return null;
  if (typeof photo === 'string') {
    return createPhotoBatchPhoto({
      imageData: photo,
      timestamp: fallbackTimestamp,
    });
  }
  if (!photo.imageData) return null;

  return {
    id: photo.id || createLocalId('photo_item'),
    imageData: photo.imageData,
    imageMeta: photo.imageMeta || photo.imageStats || {},
    originalName: photo.originalName || '',
    capturedAt: Number(photo.capturedAt || photo.timestamp || fallbackTimestamp),
  };
}

function normalizeBatchVoiceNote(voiceNote, fallbackTimestamp = Date.now()) {
  if (!voiceNote) return null;
  if (typeof voiceNote === 'string') {
    return {
      id: createLocalId('batch_voice'),
      audioData: voiceNote,
      durationMs: 0,
      mimeType: 'audio/webm',
      recordedAt: fallbackTimestamp,
      source: 'inline',
    };
  }

  const audioData = voiceNote.audioData || voiceNote.audioUrl || '';
  if (!audioData) return null;

  return {
    id: voiceNote.id || createLocalId('batch_voice'),
    audioData,
    durationMs: Number(voiceNote.durationMs || voiceNote.duration || 0),
    mimeType: voiceNote.mimeType || 'audio/webm',
    recordedAt: Number(voiceNote.recordedAt || voiceNote.updatedAt || voiceNote.createdAt || fallbackTimestamp),
    source: voiceNote.source || 'inline',
  };
}

export function createPhotoSubmissionBatch({
  workerId,
  workerName,
  projectId = '',
  projectName = '',
  workType,
  workSubcategory = '',
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
    workSubcategory,
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

  const timestamp = Number(entry.submittedAt || entry.updatedAt || entry.createdAt || Date.now());
  const normalizedPhotos = Array.isArray(entry.photos)
    ? entry.photos.map((photo) => normalizeBatchPhotoItem(photo, timestamp)).filter(Boolean)
    : null;
  const normalizedVoiceNote = normalizeBatchVoiceNote(entry.voiceNote, timestamp);

  if (normalizedPhotos) {
    const normalizedStatus = entry.status === 'draft' ? 'draft' : 'submitted';
    return {
      ...entry,
      projectId: entry.projectId || '',
      projectName: entry.projectName || entry.siteName || '',
      siteName: entry.projectName || entry.siteName || '',
      workType: entry.workType || entry.category || '',
      workSubcategory: entry.workSubcategory || '',
      tradeTeam: entry.tradeTeam || '',
      roomId: entry.roomId || '',
      roomName: entry.roomName || '',
      batchTitle: entry.batchTitle || entry.workType || entry.category || '',
      notes: entry.notes || entry.detail || '',
      photos: normalizedPhotos,
      photoCount: entry.photoCount || normalizedPhotos.length,
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

  const normalizedStatus = entry.status === 'submitted' ? 'submitted' : 'draft';
  return {
    id: entry.id || createLocalId('photo_batch'),
    workerId: entry.workerId || '',
    workerName: entry.workerName || '',
    projectId: entry.projectId || '',
    projectName: entry.siteName || entry.projectName || '',
    siteName: entry.siteName || entry.projectName || '',
    workType: entry.category || '',
    workSubcategory: entry.workSubcategory || '',
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

export function createDailyReportRecord({
  workerId,
  workerName,
  siteName,
  projectId = '',
  projectName = '',
  reportDate = '',
  area = '',
  workSummary = '',
  workerCount = 0,
  materialSummary = '',
  issueSummary = '',
  tomorrowPlan = '',
  attachments = [],
  relatedTicketIds = [],
  ticketSnapshot = null,
  status = 'submitted',
  timestamp = Date.now(),
}) {
  return {
    id: createLocalId('daily_report'),
    workerId,
    workerName,
    siteName,
    projectId,
    projectName,
    reportDate: reportDate || getDateKey(timestamp),
    area,
    workSummary,
    workerCount: Number(workerCount || 0),
    materialSummary,
    issueSummary,
    tomorrowPlan,
    attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
    relatedTicketIds: Array.isArray(relatedTicketIds) ? relatedTicketIds.filter(Boolean) : [],
    ticketSnapshot,
    submittedAt: timestamp,
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
  requestType = 'equipment',
  taskCategory = '',
  areaZone = '',
  projectName = '',
}) {
  return {
    id: createLocalId('material_request'),
    workerId,
    workerName,
    siteName,
    projectName,
    itemName,
    quantity,
    unit,
    note,
    imageData,
    requestType,
    taskCategory,
    areaZone,
    requestedAt: timestamp,
    dateKey: getDateKey(timestamp),
    status,
    ...createSyncFields('pending', timestamp),
  };
}

export function createPaymentRequest({
  workerId,
  workerName,
  siteName,
  projectName = '',
  amount,
  taskCategory = '',
  areaZone = '',
  note = '',
  status = 'pending',
  timestamp = Date.now(),
}) {
  return {
    id: createLocalId('payment_request'),
    workerId,
    workerName,
    siteName,
    projectName,
    amount: Number(amount || 0),
    taskCategory,
    areaZone,
    note,
    requestedAt: timestamp,
    dateKey: getDateKey(timestamp),
    status,
    ...createSyncFields('pending', timestamp),
  };
}

export function createMilestoneSubmission({
  workerId,
  workerName,
  siteName,
  projectName = '',
  taskCategory = '',
  areaZone = '',
  progress = '',
  note = '',
  photos = [],
  status = 'submitted',
  timestamp = Date.now(),
}) {
  return {
    id: createLocalId('milestone_submission'),
    workerId,
    workerName,
    siteName,
    projectName,
    taskCategory,
    areaZone,
    progress,
    note,
    photos,
    photoCount: Array.isArray(photos) ? photos.length : 0,
    submittedAt: timestamp,
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

