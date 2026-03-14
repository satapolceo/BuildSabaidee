import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileImage,
  Home,
  MapPin,
  Package,
  ShieldAlert,
  UserCircle2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  TASK_STATUS,
  WORKER_STORAGE_KEYS,
  createAttendanceRecord,
  createIssueReport,
  createMaterialRequest,
  createPhotoReport,
  getTodayAttendance,
  getWorkerTasks,
  loadFromStorage,
  saveToStorage,
  updateWorkerTaskStatus,
} from './workerStorage';

const TAB_HOME = 'home';
const TAB_TASKS = 'tasks';
const TAB_ACTIVITY = 'activity';
const TAB_PROFILE = 'profile';

const SCREEN_HOME = 'home';
const SCREEN_TASKS = 'tasks';
const SCREEN_ACTIVITY = 'activity';
const SCREEN_PROFILE = 'profile';
const SCREEN_PHOTO = 'photo';
const SCREEN_REQUEST = 'request';
const SCREEN_ISSUE = 'issue';

const defaultPhotoForm = { category: '', detail: '', imageData: '' };
const defaultIssueForm = { category: 'safety', urgency: 'high', detail: '', imageData: '' };
const defaultRequestForm = { itemName: '', quantity: '1', unit: 'piece', note: '', imageData: '' };

const pickText = (t, key, fallback) => {
  const value = t(key);
  return value && value !== key ? value : fallback;
};

const formatTime = (timestamp, locale) =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));

const formatDateTime = (timestamp, locale) =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));

const formatDate = (value, locale) =>
  new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function WorkerAppV2({ onNavigate, t, language = 'TH', workersList = [], projectsList = [] }) {
  const currentWorker = useMemo(() => {
    const worker = workersList.find((entry) => entry?.name || entry?.companyName) || {};
    return {
      id: worker.id || 'worker-local',
      name: worker.name || worker.companyName || pickText(t, 'worker_role_worker', 'Worker'),
      assignedSiteId: worker.assignedSiteId || '',
    };
  }, [workersList, t]);

  const currentProject = useMemo(
    () => projectsList.find((project) => String(project.id) === String(currentWorker.assignedSiteId)) || null,
    [projectsList, currentWorker.assignedSiteId]
  );

  const locale = language === 'TH' ? 'th-TH' : language === 'LA' ? 'lo-LA' : 'en-GB';
  const siteName = currentProject?.name || pickText(t, 'worker_site_name_fallback', 'Project not assigned');
  const today = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState(TAB_HOME);
  const [activeScreen, setActiveScreen] = useState(SCREEN_HOME);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [toast, setToast] = useState('');
  const [validationError, setValidationError] = useState('');
  const [attendanceNote, setAttendanceNote] = useState('');

  const [attendanceRecords, setAttendanceRecords] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.attendance, []));
  const [photoReports, setPhotoReports] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.photoReports, []));
  const [issues, setIssues] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.issues, []));
  const [materialRequests, setMaterialRequests] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.materialRequests, []));
  const [tasks, setTasks] = useState(() => {
    const saved = loadFromStorage(WORKER_STORAGE_KEYS.tasks, []);
    return getWorkerTasks(saved, currentWorker.id, siteName);
  });

  const [photoForm, setPhotoForm] = useState(defaultPhotoForm);
  const [issueForm, setIssueForm] = useState(defaultIssueForm);
  const [requestForm, setRequestForm] = useState(defaultRequestForm);

  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.attendance, attendanceRecords), [attendanceRecords]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.photoReports, photoReports), [photoReports]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.issues, issues), [issues]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.materialRequests, materialRequests), [materialRequests]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.tasks, tasks), [tasks]);

  useEffect(() => {
    setTasks(getWorkerTasks(loadFromStorage(WORKER_STORAGE_KEYS.tasks, []), currentWorker.id, siteName));
  }, [currentWorker.id, siteName]);

  useEffect(() => {
    const handler = () => setOnline(navigator.onLine);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const todayAttendance = useMemo(
    () => getTodayAttendance(attendanceRecords, currentWorker.id, today),
    [attendanceRecords, currentWorker.id, today]
  );
  const latestPhotoReports = useMemo(
    () => photoReports.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [photoReports, currentWorker.id]
  );
  const latestIssues = useMemo(
    () => issues.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [issues, currentWorker.id]
  );
  const latestRequests = useMemo(
    () => materialRequests.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [materialRequests, currentWorker.id]
  );

  const activityFeed = useMemo(() => {
    const attendanceItems = attendanceRecords
      .filter((entry) => entry.workerId === currentWorker.id)
      .slice(-5)
      .map((entry) => ({
        id: entry.id,
        type: 'attendance',
        title: entry.type === 'checkin' ? pickText(t, 'worker_checkin_cta', 'Check In') : pickText(t, 'worker_checkout_cta', 'Check Out'),
        detail: `${entry.siteName || siteName} • ${formatDateTime(entry.timestamp, locale)}`,
        status: entry.status,
        imageData: '',
        timestamp: entry.timestamp,
      }));

    const photoItems = latestPhotoReports.map((entry) => ({
      id: entry.id,
      type: 'photo',
      title: pickText(t, 'worker_photo', 'Upload Photo'),
      detail: `${entry.category} • ${formatDateTime(entry.submittedAt, locale)}`,
      status: entry.status,
      imageData: entry.imageData,
      timestamp: entry.submittedAt,
    }));

    const issueItems = latestIssues.map((entry) => ({
      id: entry.id,
      type: 'issue',
      title: pickText(t, 'worker_sos', 'Report Issue / SOS'),
      detail: `${entry.category} • ${entry.urgency} • ${formatDateTime(entry.reportedAt, locale)}`,
      status: entry.status,
      imageData: entry.imageData,
      timestamp: entry.reportedAt,
    }));

    const requestItems = latestRequests.map((entry) => ({
      id: entry.id,
      type: 'request',
      title: pickText(t, 'worker_material', 'Request Material'),
      detail: `${entry.itemName} • ${entry.quantity} ${entry.unit} • ${formatDateTime(entry.requestedAt, locale)}`,
      status: entry.status,
      imageData: entry.imageData,
      timestamp: entry.requestedAt,
    }));

    return [...attendanceItems, ...photoItems, ...issueItems, ...requestItems]
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .slice(0, 12);
  }, [attendanceRecords, currentWorker.id, latestIssues, latestPhotoReports, latestRequests, locale, siteName, t]);

  const pendingItems = [
    ...latestRequests.filter((entry) => entry.status === 'pending').map((entry) => ({ id: entry.id, label: `${pickText(t, 'worker_material', 'Material')} • ${entry.itemName}` })),
    ...latestIssues.filter((entry) => entry.status === 'open').map((entry) => ({ id: entry.id, label: `${pickText(t, 'worker_sos', 'SOS')} • ${entry.category}` })),
    ...tasks.filter((entry) => entry.status !== TASK_STATUS.completed).map((entry) => ({ id: entry.id, label: pickText(t, `worker_task_title_${entry.title}`, entry.title) })),
  ].slice(0, 4);

  const latestNotifications = [
    { id: 'attendance', title: pickText(t, todayAttendance.status === 'checked_out' ? 'worker_attendance_checked_out' : todayAttendance.status === 'checked_in' ? 'worker_attendance_checked_in' : 'worker_attendance_not_started', 'Attendance updated') },
    { id: 'photos', title: latestPhotoReports[0] ? `${pickText(t, 'worker_photo', 'Photo')} • ${latestPhotoReports[0].category}` : pickText(t, 'worker_notification_sync', 'Offline data has been safely saved') },
    { id: 'issues', title: latestIssues[0] ? `${pickText(t, 'worker_sos', 'SOS')} • ${latestIssues[0].urgency}` : pickText(t, 'worker_notification_request', 'A previous material request is still pending') },
  ];

  const openScreen = (screen) => {
    setValidationError('');
    setActiveScreen(screen);
  };

  const goBack = () => {
    setValidationError('');
    setActiveScreen(activeTab);
  };

  const pushToast = (messageKey, fallback) => setToast(pickText(t, messageKey, fallback));

  const handleAttendance = (type) => {
    setValidationError('');
    if (type === 'checkin' && todayAttendance.checkIn) {
      setValidationError(pickText(t, 'worker_validation_checkin_exists', 'Check-in already recorded today'));
      return;
    }
    if (type === 'checkout' && !todayAttendance.checkIn) {
      setValidationError(pickText(t, 'worker_validation_checkout_requires_checkin', 'Check in first before checking out'));
      return;
    }
    if (type === 'checkout' && todayAttendance.checkOut) {
      setValidationError(pickText(t, 'worker_validation_checkout_exists', 'Check-out already recorded today'));
      return;
    }

    const record = createAttendanceRecord({
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      siteName,
      type,
      note: attendanceNote,
    });

    setAttendanceRecords((current) => [...current, record]);
    setAttendanceNote('');
    pushToast(type === 'checkin' ? 'worker_attendance_checkin_saved' : 'worker_attendance_checkout_saved', type === 'checkin' ? 'Check-in saved' : 'Check-out saved');
  };

  const handleFileChange = async (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageData = await readFileAsDataUrl(file);
    setter((current) => ({ ...current, imageData }));
  };

  const submitPhoto = () => {
    setValidationError('');
    if (!photoForm.category || !photoForm.detail || !photoForm.imageData) {
      setValidationError(pickText(t, 'worker_validation_required', 'Please complete required fields'));
      return;
    }

    const record = createPhotoReport({
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      siteName,
      category: photoForm.category,
      detail: photoForm.detail,
      imageData: photoForm.imageData,
      status: online ? 'submitted' : 'queued',
    });

    setPhotoReports((current) => [...current, record]);
    setPhotoForm(defaultPhotoForm);
    pushToast('worker_action_sent_success', 'Sent successfully');
  };

  const submitIssue = (forceCritical = false) => {
    setValidationError('');
    if (!issueForm.category || !issueForm.detail) {
      setValidationError(pickText(t, 'worker_validation_required', 'Please complete required fields'));
      return;
    }

    const record = createIssueReport({
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      siteName,
      category: issueForm.category,
      urgency: forceCritical ? 'critical' : issueForm.urgency,
      detail: issueForm.detail,
      imageData: issueForm.imageData,
      status: 'open',
    });

    setIssues((current) => [...current, record]);
    setIssueForm(defaultIssueForm);
    pushToast('worker_action_sent_success', forceCritical ? 'SOS sent successfully' : 'Issue sent successfully');
  };

  const submitRequest = () => {
    setValidationError('');
    if (!requestForm.itemName || !requestForm.quantity || Number(requestForm.quantity) <= 0 || !requestForm.unit) {
      setValidationError(pickText(t, 'worker_validation_material_quantity', 'Enter a valid quantity'));
      return;
    }

    const record = createMaterialRequest({
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      siteName,
      itemName: requestForm.itemName,
      quantity: Number(requestForm.quantity),
      unit: requestForm.unit,
      note: requestForm.note,
      imageData: requestForm.imageData,
      status: 'pending',
    });

    setMaterialRequests((current) => [...current, record]);
    setRequestForm(defaultRequestForm);
    pushToast('worker_action_sent_success', 'Request sent successfully');
  };

  const setTabScreen = (tab) => {
    setActiveTab(tab);
    setActiveScreen(tab);
    setValidationError('');
  };

  const navItems = [
    { id: TAB_HOME, label: pickText(t, 'worker_nav_home', 'Home'), icon: Home },
    { id: TAB_TASKS, label: pickText(t, 'worker_nav_tasks', 'My Tasks'), icon: ClipboardList },
    { id: TAB_ACTIVITY, label: pickText(t, 'worker_activity_title', 'Recent Activity'), icon: Clock3 },
    { id: TAB_PROFILE, label: pickText(t, 'worker_nav_chat', 'Profile'), icon: UserCircle2 },
  ];

  const renderHome = () => (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[1.9rem] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
        <div className="bg-gradient-to-br from-slate-950 via-blue-900 to-blue-700 p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/75">{pickText(t, 'worker_attendance_title', 'Attendance')}</div>
              <div className="mt-2 text-2xl font-semibold">
                {pickText(
                  t,
                  todayAttendance.status === 'checked_out'
                    ? 'worker_attendance_checked_out'
                    : todayAttendance.status === 'checked_in'
                      ? 'worker_attendance_checked_in'
                      : 'worker_attendance_not_started',
                  'Attendance'
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3"><Clock3 className="h-6 w-6" /></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="text-xs text-blue-100/70">{pickText(t, 'worker_last_checkin', 'Latest check-in')}</div>
              <div className="mt-1 font-medium">{todayAttendance.checkIn ? formatTime(todayAttendance.checkIn.timestamp, locale) : '-'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="text-xs text-blue-100/70">{pickText(t, 'worker_last_checkout', 'Latest check-out')}</div>
              <div className="mt-1 font-medium">{todayAttendance.checkOut ? formatTime(todayAttendance.checkOut.timestamp, locale) : '-'}</div>
            </div>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <input
            value={attendanceNote}
            onChange={(event) => setAttendanceNote(event.target.value)}
            placeholder={pickText(t, 'worker_note_label', 'Note')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleAttendance('checkin')} className="rounded-[1.3rem] bg-blue-700 px-4 py-4 text-sm font-semibold text-white active:scale-[0.99]">
              {pickText(t, 'worker_checkin_cta', 'Check In')}
            </button>
            <button onClick={() => handleAttendance('checkout')} className="rounded-[1.3rem] bg-emerald-600 px-4 py-4 text-sm font-semibold text-white active:scale-[0.99]">
              {pickText(t, 'worker_checkout_cta', 'Check Out')}
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 text-base font-semibold text-slate-900">{pickText(t, 'worker_action_primary', 'Quick Actions')}</div>
        <div className="grid grid-cols-1 gap-3">
          {[
            { id: SCREEN_PHOTO, title: pickText(t, 'worker_photo', 'Upload Photo'), description: pickText(t, 'worker_action_upload_desc', 'Send photos and progress updates'), icon: Camera, tone: 'blue' },
            { id: SCREEN_REQUEST, title: pickText(t, 'worker_material', 'Request Material'), description: pickText(t, 'worker_action_request_desc', 'Request materials and tools'), icon: Package, tone: 'orange' },
            { id: SCREEN_ISSUE, title: pickText(t, 'worker_sos', 'Report Issue / SOS'), description: pickText(t, 'worker_action_sos_desc', 'Report urgent issues to the team'), icon: ShieldAlert, tone: 'red' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => openScreen(action.id)}
                className={`flex items-center gap-4 rounded-[1.5rem] border p-4 text-left shadow-sm active:scale-[0.99] ${action.tone === 'red' ? 'border-rose-200 bg-rose-50' : action.tone === 'orange' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${action.tone === 'red' ? 'bg-rose-600' : action.tone === 'orange' ? 'bg-orange-500' : 'bg-blue-700'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-slate-900">{action.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{action.description}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-slate-900">{pickText(t, 'worker_today_title', 'Today')}</div>
          <button onClick={() => setTabScreen(TAB_TASKS)} className="text-sm font-semibold text-blue-700">{pickText(t, 'worker_nav_tasks', 'My Tasks')}</button>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{pickText(t, `worker_task_title_${task.title}`, task.title)}</div>
                  <div className="mt-1 text-xs text-slate-500">{siteName} • {formatDate(task.dueDate, locale)}</div>
                </div>
                <select value={task.status} onChange={(event) => setTasks((current) => updateWorkerTaskStatus(current, task.id, event.target.value))} className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs">
                  <option value={TASK_STATUS.notStarted}>{pickText(t, 'worker_task_status_not_started', 'Not started')}</option>
                  <option value={TASK_STATUS.inProgress}>{pickText(t, 'worker_task_status_in_progress', 'In progress')}</option>
                  <option value={TASK_STATUS.completed}>{pickText(t, 'worker_task_status_done', 'Done')}</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <div className="mb-3 text-base font-semibold text-slate-900">{pickText(t, 'worker_pending_title', 'Pending')}</div>
          <div className="space-y-2">
            {pendingItems.length ? pendingItems.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{item.label}</div>) : <div className="text-sm text-slate-500">{pickText(t, 'worker_saved_locally', 'Saved locally')}</div>}
          </div>
        </div>
        <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-base font-semibold text-slate-900">{pickText(t, 'worker_latest_alerts_title', 'Latest Notifications')}</div>
            <button onClick={() => setTabScreen(TAB_ACTIVITY)} className="text-sm font-semibold text-blue-700">{pickText(t, 'worker_activity_title', 'Recent Activity')}</button>
          </div>
          <div className="space-y-2">
            {latestNotifications.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{item.title}</div>)}
          </div>
        </div>
      </section>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-4">
      <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="mb-3 text-lg font-semibold text-slate-900">{pickText(t, 'worker_nav_tasks', 'My Tasks')}</div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-[1.3rem] border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{pickText(t, `worker_task_title_${task.title}`, task.title)}</div>
                  <div className="mt-1 text-sm text-slate-500">{task.note ? pickText(t, `worker_task_note_${task.note}`, task.note) : siteName}</div>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{task.progress}%</span>
              </div>
              <div className="mt-3 flex gap-2">
                {[TASK_STATUS.notStarted, TASK_STATUS.inProgress, TASK_STATUS.completed].map((status) => (
                  <button key={status} onClick={() => setTasks((current) => updateWorkerTaskStatus(current, task.id, status))} className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold ${task.status === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {pickText(t, status === TASK_STATUS.notStarted ? 'worker_task_status_not_started' : status === TASK_STATUS.inProgress ? 'worker_task_status_in_progress' : 'worker_task_status_done', status)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4">
      <ScreenHeader title={pickText(t, 'worker_activity_title', 'Recent Activity')} subtitle={pickText(t, 'worker_submitted_items', 'Submitted items from this app')} />
      <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="space-y-3">
          {activityFeed.length ? (
            activityFeed.map((item) => (
              <div key={item.id} className="rounded-[1.3rem] border border-slate-200 p-3.5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                    {item.type === 'photo' ? <FileImage className="h-5 w-5" /> : item.type === 'request' ? <Package className="h-5 w-5" /> : item.type === 'issue' ? <AlertTriangle className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{item.status}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
                    {item.imageData ? <img src={item.imageData} alt={item.title} className="mt-3 h-24 w-full rounded-2xl object-cover" /> : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState label={pickText(t, 'worker_no_data', 'No data yet')} />
          )}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="text-lg font-semibold text-slate-900">{currentWorker.name}</div>
        <div className="mt-1 text-sm text-slate-500">{siteName}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricCard label={pickText(t, 'worker_recent_attendance', 'Recent attendance')} value={`${todayAttendance.records.length}`} />
          <MetricCard label={pickText(t, 'worker_sync_queue', 'Sync queue')} value={`${photoReports.filter((entry) => entry.status === 'queued').length}`} />
        </div>
      </div>
      <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="mb-3 text-base font-semibold text-slate-900">{pickText(t, 'worker_submitted_items', 'Submitted items')}</div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label={pickText(t, 'worker_photo', 'Photo')} value={`${latestPhotoReports.length}`} compact />
          <MetricCard label={pickText(t, 'worker_material', 'Material')} value={`${latestRequests.length}`} compact />
          <MetricCard label={pickText(t, 'worker_sos', 'SOS')} value={`${latestIssues.length}`} compact />
        </div>
      </div>
    </div>
  );

  const renderPhotoScreen = () => (
    <SinglePurposeScreen
      title={pickText(t, 'worker_photo_screen_title', 'Submit Work Photo')}
      subtitle={pickText(t, 'worker_photo_screen_desc', 'Upload a work photo with category and details')}
      onBack={goBack}
      t={t}
    >
      <FormCard title={pickText(t, 'worker_photo', 'Upload Photo')}>
        <FilePicker imageData={photoForm.imageData} onChange={(event) => handleFileChange(event, setPhotoForm)} label={pickText(t, 'worker_report_photo', 'Photo')} t={t} />
        <input value={photoForm.category} onChange={(event) => setPhotoForm((current) => ({ ...current, category: event.target.value }))} placeholder={pickText(t, 'worker_report_category', 'Job category')} className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        <textarea value={photoForm.detail} onChange={(event) => setPhotoForm((current) => ({ ...current, detail: event.target.value }))} placeholder={pickText(t, 'worker_report_details', 'Details')} rows={4} className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        <button onClick={submitPhoto} className="mt-3 w-full rounded-[1.2rem] bg-blue-700 px-4 py-3 text-sm font-semibold text-white">{pickText(t, 'worker_report_submit', 'Submit report')}</button>
      </FormCard>
      <FormCard title={pickText(t, 'worker_recent_reports', 'Recent Photo Reports')}>
        <HistoryList
          items={latestPhotoReports}
          emptyLabel={pickText(t, 'worker_no_data', 'No data yet')}
          renderItem={(item) => (
            <HistoryCard
              title={item.category}
              detail={`${item.detail} • ${formatDateTime(item.submittedAt, locale)}`}
              status={pickText(t, item.status === 'queued' ? 'worker_saved_locally' : 'worker_record_status_submitted', item.status)}
              imageData={item.imageData}
            />
          )}
        />
      </FormCard>
    </SinglePurposeScreen>
  );

  const renderRequestScreen = () => (
    <SinglePurposeScreen
      title={pickText(t, 'worker_request_screen_title', 'Request Material')}
      subtitle={pickText(t, 'worker_request_screen_desc', 'Submit material requests and check pending items')}
      onBack={goBack}
      t={t}
    >
      <FormCard title={pickText(t, 'worker_material', 'Request Material')}>
        <input value={requestForm.itemName} onChange={(event) => setRequestForm((current) => ({ ...current, itemName: event.target.value }))} placeholder={pickText(t, 'worker_request_item_name', 'Item')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <input type="number" min="1" value={requestForm.quantity} onChange={(event) => setRequestForm((current) => ({ ...current, quantity: event.target.value }))} placeholder={pickText(t, 'worker_request_quantity', 'Quantity')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          <input value={requestForm.unit} onChange={(event) => setRequestForm((current) => ({ ...current, unit: event.target.value }))} placeholder={pickText(t, 'worker_request_unit', 'Unit')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </div>
        <input value={requestForm.note} onChange={(event) => setRequestForm((current) => ({ ...current, note: event.target.value }))} placeholder={pickText(t, 'worker_note_label', 'Note')} className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        <FilePicker imageData={requestForm.imageData} onChange={(event) => handleFileChange(event, setRequestForm)} label={pickText(t, 'worker_req_photo_cta', 'Attach photo')} optional t={t} />
        <button onClick={submitRequest} className="mt-3 w-full rounded-[1.2rem] bg-orange-500 px-4 py-3 text-sm font-semibold text-white">{pickText(t, 'worker_request_submit_cta', 'Send request')}</button>
      </FormCard>
      <FormCard title={pickText(t, 'worker_recent_requests', 'Recent Requests')}>
        <HistoryList
          items={latestRequests}
          emptyLabel={pickText(t, 'worker_no_data', 'No data yet')}
          renderItem={(item) => (
            <HistoryCard
              title={`${item.itemName} • ${item.quantity} ${item.unit}`}
              detail={`${item.note || '-'} • ${formatDateTime(item.requestedAt, locale)}`}
              status={item.status}
              imageData={item.imageData}
            />
          )}
        />
      </FormCard>
    </SinglePurposeScreen>
  );

  const renderIssueScreen = () => {
    const criticalMode = issueForm.urgency === 'critical';
    return (
      <SinglePurposeScreen
        title={pickText(t, 'worker_issue_screen_title', 'Report Issue / SOS')}
        subtitle={pickText(t, 'worker_issue_screen_desc', 'Send issue details or trigger a fast SOS report')}
        onBack={goBack}
        t={t}
      >
        <div className={`rounded-[1.6rem] border p-4 ${criticalMode ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl p-2 ${criticalMode ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className={`text-sm font-semibold ${criticalMode ? 'text-rose-700' : 'text-amber-800'}`}>{criticalMode ? pickText(t, 'worker_sos_mode_title', 'SOS mode enabled') : pickText(t, 'worker_issue_mode_title', 'Issue report mode')}</div>
              <div className={`mt-1 text-sm ${criticalMode ? 'text-rose-600' : 'text-amber-700'}`}>{criticalMode ? pickText(t, 'worker_sos_mode_desc', 'Urgent issue will be highlighted clearly in the latest list') : pickText(t, 'worker_issue_mode_desc', 'Use this form to report on-site problems clearly')}</div>
            </div>
          </div>
        </div>
        <FormCard title={pickText(t, 'worker_sos', 'Report Issue / SOS')}>
          <div className="grid grid-cols-2 gap-3">
            <input value={issueForm.category} onChange={(event) => setIssueForm((current) => ({ ...current, category: event.target.value }))} placeholder={pickText(t, 'worker_issue_category', 'Issue category')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            <select value={issueForm.urgency} onChange={(event) => setIssueForm((current) => ({ ...current, urgency: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="low">{pickText(t, 'worker_issue_urgency_low', 'Low')}</option>
              <option value="medium">{pickText(t, 'worker_issue_urgency_medium', 'Medium')}</option>
              <option value="high">{pickText(t, 'worker_issue_urgency_high', 'High')}</option>
              <option value="critical">{pickText(t, 'worker_issue_urgency_critical', 'Critical')}</option>
            </select>
          </div>
          <textarea value={issueForm.detail} onChange={(event) => setIssueForm((current) => ({ ...current, detail: event.target.value }))} placeholder={pickText(t, 'worker_sos_desc', 'Describe the issue')} rows={4} className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          <FilePicker imageData={issueForm.imageData} onChange={(event) => handleFileChange(event, setIssueForm)} label={pickText(t, 'worker_sos_photo_optional', 'Photo optional')} optional t={t} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={() => submitIssue(false)} className="rounded-[1.2rem] bg-amber-500 px-4 py-3 text-sm font-semibold text-white">{pickText(t, 'worker_issue_submit', 'Submit issue')}</button>
            <button onClick={() => { setIssueForm((current) => ({ ...current, urgency: 'critical' })); submitIssue(true); }} className="rounded-[1.2rem] bg-rose-600 px-4 py-3 text-sm font-semibold text-white">{pickText(t, 'worker_sos', 'SOS')}</button>
          </div>
        </FormCard>
        <FormCard title={pickText(t, 'worker_recent_issues', 'Recent Issues')}>
          <HistoryList
            items={latestIssues}
            emptyLabel={pickText(t, 'worker_no_data', 'No data yet')}
            renderItem={(item) => (
              <HistoryCard
                title={`${item.category} • ${item.urgency}`}
                detail={`${item.detail} • ${formatDateTime(item.reportedAt, locale)}`}
                status={item.status}
                imageData={item.imageData}
                danger={item.urgency === 'critical'}
              />
            )}
          />
        </FormCard>
      </SinglePurposeScreen>
    );
  };

  const renderBody = () => {
    if (activeScreen === SCREEN_PHOTO) return renderPhotoScreen();
    if (activeScreen === SCREEN_REQUEST) return renderRequestScreen();
    if (activeScreen === SCREEN_ISSUE) return renderIssueScreen();
    if (activeScreen === SCREEN_TASKS) return renderTasks();
    if (activeScreen === SCREEN_ACTIVITY) return renderActivity();
    if (activeScreen === SCREEN_PROFILE) return renderProfile();
    return renderHome();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1d4ed8_0%,_#0f172a_38%,_#020617_100%)] p-0 sm:p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#eef3f8] shadow-[0_28px_80px_rgba(15,23,42,0.45)] sm:min-h-[820px] sm:max-h-[92vh] sm:rounded-[2.4rem] sm:border-[10px] sm:border-slate-950">
        <div className="bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-5 pb-6 pt-6 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-semibold">{currentWorker.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">{pickText(t, 'worker_header_badge', 'Worker App')}</div>
                <div className="mt-1 text-lg font-semibold">{currentWorker.name}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-blue-100/90"><MapPin className="h-3.5 w-3.5" />{siteName}</div>
              </div>
            </div>
            <button onClick={() => onNavigate('landing')} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/90 active:scale-95">×</button>
          </div>
          <div className="mt-5 rounded-[1.6rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-blue-100/80">{pickText(t, 'worker_header_caption', 'Ready for field work')}</div>
                <h1 className="mt-1 text-2xl font-semibold">{pickText(t, 'worker_hero_title', 'Clock in and update work from mobile')}</h1>
              </div>
              <div className="rounded-2xl bg-orange-400 p-3 text-slate-950"><CheckCircle2 className="h-6 w-6" /></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.5rem)' }}>
          <div className={`mb-4 rounded-[1.4rem] border p-4 shadow-sm ${online ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
            <div className="flex items-start gap-3">
              <div className={`rounded-2xl p-2 ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}</div>
              <div>
                <div className="text-sm font-semibold">{online ? pickText(t, 'worker_status_online', 'Online') : pickText(t, 'worker_offline_mode', 'Offline mode')}</div>
                <div className="mt-1 text-sm">{pickText(t, 'worker_sync_when_online', 'Data will sync automatically when online')}</div>
              </div>
            </div>
          </div>

          {validationError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{validationError}</div> : null}
          {toast ? <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">{toast}</div> : null}

          {renderBody()}
        </div>

        <div className="border-t border-slate-200 bg-white px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] pt-3">
          <div className="grid grid-cols-4 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeTab && activeScreen === activeTab;
              return (
                <button key={item.id} onClick={() => setTabScreen(item.id)} className={`rounded-2xl px-2 py-3 text-center ${active ? 'bg-blue-700 text-white' : 'text-slate-500'}`}>
                  <Icon className="mx-auto h-5 w-5" />
                  <div className="mt-1 text-[11px] font-semibold">{item.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SinglePurposeScreen({ title, subtitle, onBack, t, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-[0.98]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <div className="text-sm text-slate-500">{subtitle || pickText(t, 'worker_recent_history', 'Recent history')}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function ScreenHeader({ title, subtitle }) {
  return (
    <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

function FormCard({ title, children }) {
  return (
    <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
      <div className="mb-3 text-base font-semibold text-slate-900">{title}</div>
      {children}
    </div>
  );
}

function FilePicker({ imageData, onChange, label, optional = false, t }) {
  return (
    <label className="block rounded-[1.3rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
      <input type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" />
      {imageData ? <img src={imageData} alt={label} className="mx-auto mb-3 max-h-40 w-full rounded-2xl object-cover" /> : <Camera className="mx-auto h-8 w-8 text-slate-400" />}
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="mt-1 text-xs text-slate-500">{optional ? pickText(t, 'worker_optional_label', 'Optional') : pickText(t, 'worker_required_label', 'Required')}</div>
    </label>
  );
}

function HistoryList({ items, emptyLabel, renderItem }) {
  if (!items.length) return <EmptyState label={emptyLabel} />;
  return <div className="space-y-3">{items.map((item) => <div key={item.id}>{renderItem(item)}</div>)}</div>;
}

function HistoryCard({ title, detail, status, imageData, danger = false }) {
  return (
    <div className={`rounded-[1.3rem] border p-3.5 ${danger ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{detail}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${danger ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-600'}`}>{status}</span>
      </div>
      {imageData ? <img src={imageData} alt={title} className="mt-3 h-24 w-full rounded-2xl object-cover" /> : null}
    </div>
  );
}

function EmptyState({ label }) {
  return <div className="rounded-[1.3rem] bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">{label}</div>;
}

function MetricCard({ label, value, compact = false }) {
  return (
    <div className={`rounded-2xl bg-slate-50 ${compact ? 'px-3 py-3' : 'px-4 py-3'}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 font-semibold text-slate-900 ${compact ? 'text-lg' : 'text-xl'}`}>{value}</div>
    </div>
  );
}

export default WorkerAppV2;
