const STORAGE_PREFIX = 'buildsabaidee.worker.';

export const WORKER_STORAGE_KEYS = {
  attendance: `${STORAGE_PREFIX}attendance`,
  photoReports: `${STORAGE_PREFIX}photoReports`,
  issues: `${STORAGE_PREFIX}issues`,
  materialRequests: `${STORAGE_PREFIX}materialRequests`,
  tasks: `${STORAGE_PREFIX}tasks`,
};

export const ATTENDANCE_STATUS = {
  saved: 'saved',
};

export const TASK_STATUS = {
  notStarted: 'not_started',
  inProgress: 'in_progress',
  completed: 'completed',
};

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
