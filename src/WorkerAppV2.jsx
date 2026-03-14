import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileImage,
  Home,
  LoaderCircle,
  MapPin,
  Mic,
  Package,
  Square,
  Trash2,
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
  createVoiceNoteRecord,
  getTodayAttendance,
  getWorkerTasks,
  loadFromStorage,
  saveToStorage,
  updateWorkerTaskStatus,
} from './workerStorage';
import { compressImageFile, DATA_SAVER_DEFAULTS, formatBytes } from './imageDataSaver';

const TAB_HOME = 'home';
const TAB_TASKS = 'tasks';
const TAB_ACTIVITY = 'activity';
const TAB_PROFILE = 'profile';

const SCREEN_HOME = 'home';
const SCREEN_TASKS = 'tasks';
const SCREEN_ACTIVITY = 'activity';
const SCREEN_PROFILE = 'profile';
const SCREEN_PHOTO = 'photo';
const SCREEN_VOICE = 'voice';
const SCREEN_REQUEST = 'request';
const SCREEN_ISSUE = 'issue';

const defaultPhotoForm = { category: '', detail: '', imageData: '', imageStats: null, originalName: '' };
const defaultIssueForm = { category: 'safety', urgency: 'high', detail: '', imageData: '', imageStats: null, originalName: '' };
const defaultRequestForm = { itemName: '', quantity: '1', unit: 'piece', note: '', imageData: '', imageStats: null, originalName: '' };

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

const formatDuration = (durationMs = 0) => {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const readBlobAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
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
  const localCopy = language === 'TH'
    ? {
        todayStatusLabel: 'สถานะวันนี้',
        notCheckedIn: 'ยังไม่เข้างาน',
        working: 'กำลังทำงาน',
        checkedOut: 'เลิกงานแล้ว',
        gateHelper: 'ต้องเช็กอินก่อนจึงจะถ่ายรูปหรืออัดเสียงได้',
        readyHelper: 'แตะปุ่มด้านล่างเพื่ออัปเดตงานจากหน้างาน',
        doneHelper: 'บันทึกครบแล้วสำหรับวันนี้',
        checkoutHelper: 'เช็กเอาต์ได้หลังจากลงเวลาเข้างานแล้ว',
        photoDesc: 'ถ่ายรูปหรือเลือกรูปจากมือถือ แล้วส่งอัปเดตงานแบบสั้นๆ',
        voiceTitle: 'บันทึกเสียงหน้างาน',
        voiceDesc: 'อัดเสียงสั้นๆ เพื่ออัปเดตงานหรือฝากข้อมูลให้หัวหน้าทีม',
        voiceHelp: 'เหมาะกับการใช้งานตอนมือเปื้อนหรือพิมพ์ไม่สะดวก',
        voiceStart: 'เริ่มอัดเสียง',
        voiceStop: 'หยุดอัดเสียง',
        recording: 'กำลังอัดเสียง...',
        voiceRecent: 'เสียงล่าสุด',
        voiceReady: 'บันทึกเสียงล่าสุด',
        voiceDelete: 'ลบเสียง',
        voiceSaved: 'บันทึกเสียงแล้ว',
        voiceDeleted: 'ลบเสียงแล้ว',
        voiceFallback: 'เบราว์เซอร์นี้ยังไม่รองรับการอัดเสียงจากหน้าเว็บ',
        voicePermission: 'ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาอนุญาตการใช้งาน',
        voiceProcessing: 'กำลังเตรียมไฟล์เสียง...',
        duration: 'ความยาว',
        photoPick: 'ถ่ายรูปหรือเลือกรูป',
        photoRetake: 'ถ่ายใหม่',
        photoRemove: 'ลบรูป',
        photoHelp: 'รองรับกล้องมือถือ และเลือกรูปจากแกลเลอรีได้',
        photoCaptured: 'บันทึกรูปแล้ว',
        photoRemoved: 'ลบรูปแล้ว',
        checkinSaved: 'เช็กอินแล้ว',
        checkoutSaved: 'เช็กเอาต์แล้ว',
        openPhoto: 'เปิดหน้าถ่ายรูป',
        openVoice: 'เปิดหน้าอัดเสียง',
        ready: 'พร้อมใช้งาน',
        active: 'กำลังใช้งาน',
        disabled: 'ยังใช้ไม่ได้',
        done: 'เสร็จแล้ว',
        lastVoice: 'เสียงล่าสุด',
      }
    : language === 'LA'
      ? {
          todayStatusLabel: 'ສະຖານະມື້ນີ້',
          notCheckedIn: 'ຍັງບໍ່ເຂົ້າວຽກ',
          working: 'ກຳລັງເຮັດວຽກ',
          checkedOut: 'ເລີກວຽກແລ້ວ',
          gateHelper: 'ຕ້ອງເຊັກອິນກ່ອນ ຈຶ່ງຈະຖ່າຍຮູບ ຫຼື ອັດສຽງໄດ້',
          readyHelper: 'ແຕະປຸ່ມລຸ່ມນີ້ເພື່ອອັບເດດວຽກໜ້າງານ',
          doneHelper: 'ບັນທຶກຄົບແລ້ວສຳລັບມື້ນີ້',
          checkoutHelper: 'ເຊັກອາວທ໌ໄດ້ຫຼັງຈາກເຊັກອິນແລ້ວ',
          photoDesc: 'ຖ່າຍຮູບ ຫຼື ເລືອກຮູບຈາກມືຖື ແລ້ວສົ່ງອັບເດດວຽກແບບສັ້ນໆ',
          voiceTitle: 'ບັນທຶກສຽງໜ້າງານ',
          voiceDesc: 'ອັດສຽງສັ້ນໆ ເພື່ອອັບເດດວຽກ ຫຼື ຝາກຂໍ້ມູນໃຫ້ຫົວໜ້າທີມ',
          voiceHelp: 'ເໝາະສຳລັບເວລາມືເປື້ອນ ຫຼື ບໍ່ສະດວກພິມ',
          voiceStart: 'ເລີ່ມອັດສຽງ',
          voiceStop: 'ຢຸດອັດສຽງ',
          recording: 'ກຳລັງອັດສຽງ...',
          voiceRecent: 'ສຽງຫຼ້າສຸດ',
          voiceReady: 'ສຽງຫຼ້າສຸດ',
          voiceDelete: 'ລຶບສຽງ',
          voiceSaved: 'ບັນທຶກສຽງແລ້ວ',
          voiceDeleted: 'ລຶບສຽງແລ້ວ',
          voiceFallback: 'ເບຣາວເຊີນີ້ຍັງບໍ່ຮອງຮັບການອັດສຽງຈາກໜ້າເວັບ',
          voicePermission: 'ບໍ່ສາມາດເຂົ້າເຖິງໄມໂຄໂຟນໄດ້ ກະລຸນາອະນຸຍາດການໃຊ້ງານ',
          voiceProcessing: 'ກຳລັງຈັດກຽມໄຟລ໌ສຽງ...',
          duration: 'ຄວາມຍາວ',
          photoPick: 'ຖ່າຍຮູບ ຫຼື ເລືອກຮູບ',
          photoRetake: 'ຖ່າຍໃໝ່',
          photoRemove: 'ລຶບຮູບ',
          photoHelp: 'ຮອງຮັບກ້ອງມືຖື ແລະ ເລືອກຮູບຈາກຄັງຮູບໄດ້',
          photoCaptured: 'ບັນທຶກຮູບແລ້ວ',
          photoRemoved: 'ລຶບຮູບແລ້ວ',
          checkinSaved: 'ເຊັກອິນແລ້ວ',
          checkoutSaved: 'ເຊັກອາວທ໌ແລ້ວ',
          openPhoto: 'ເປີດໜ້າຖ່າຍຮູບ',
          openVoice: 'ເປີດໜ້າອັດສຽງ',
          ready: 'ພ້ອມໃຊ້ງານ',
          active: 'ກຳລັງໃຊ້ງານ',
          disabled: 'ຍັງໃຊ້ບໍ່ໄດ້',
          done: 'ສຳເລັດແລ້ວ',
          lastVoice: 'ສຽງຫຼ້າສຸດ',
        }
      : {
          todayStatusLabel: 'Today status',
          notCheckedIn: 'Not checked in',
          working: 'Working',
          checkedOut: 'Checked out',
          gateHelper: 'Check in first before taking photos or recording voice notes',
          readyHelper: 'Use the actions below to update work from the site',
          doneHelper: 'Today is fully recorded',
          checkoutHelper: 'Check out becomes available after check-in',
          photoDesc: 'Take or choose a photo from mobile, then send a short work update',
          voiceTitle: 'Voice Notes',
          voiceDesc: 'Record a short voice note to update work or leave a message for the team lead',
          voiceHelp: 'Useful when hands are dirty or typing is slow',
          voiceStart: 'Start recording',
          voiceStop: 'Stop recording',
          recording: 'Recording...',
          voiceRecent: 'Recent voice notes',
          voiceReady: 'Latest voice note',
          voiceDelete: 'Delete',
          voiceSaved: 'Voice note saved',
          voiceDeleted: 'Voice note deleted',
          voiceFallback: 'This browser does not support in-page voice recording yet',
          voicePermission: 'Microphone access was blocked. Please allow microphone permission.',
          voiceProcessing: 'Preparing audio...',
          duration: 'Duration',
          photoPick: 'Take or choose photo',
          photoRetake: 'Retake',
          photoRemove: 'Remove photo',
          photoHelp: 'Works with mobile camera capture and gallery selection',
          photoCaptured: 'Photo captured',
          photoRemoved: 'Photo removed',
          checkinSaved: 'Checked in',
          checkoutSaved: 'Checked out',
          openPhoto: 'Photo screen opened',
          openVoice: 'Voice screen opened',
          ready: 'Ready',
          active: 'Active',
          disabled: 'Disabled',
          done: 'Done',
          lastVoice: 'Latest voice note',
        };
  const siteName = currentProject?.name || pickText(t, 'worker_site_name_fallback', 'Project not assigned');
  const today = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState(TAB_HOME);
  const [activeScreen, setActiveScreen] = useState(SCREEN_HOME);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [toast, setToast] = useState('');
  const [validationError, setValidationError] = useState('');
  const [attendanceNote, setAttendanceNote] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.attendance, []));
  const [photoReports, setPhotoReports] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.photoReports, []));
  const [voiceNotes, setVoiceNotes] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.voiceNotes, []));
  const [issues, setIssues] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.issues, []));
  const [materialRequests, setMaterialRequests] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.materialRequests, []));
  const [settings, setSettings] = useState(() => ({ ...DATA_SAVER_DEFAULTS, ...loadFromStorage(WORKER_STORAGE_KEYS.settings, {}) }));
  const [tasks, setTasks] = useState(() => {
    const saved = loadFromStorage(WORKER_STORAGE_KEYS.tasks, []);
    return getWorkerTasks(saved, currentWorker.id, siteName);
  });

  const [photoForm, setPhotoForm] = useState(defaultPhotoForm);
  const [issueForm, setIssueForm] = useState(defaultIssueForm);
  const [requestForm, setRequestForm] = useState(defaultRequestForm);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const canRecordVoice = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined';

  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.attendance, attendanceRecords), [attendanceRecords]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.photoReports, photoReports), [photoReports]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.voiceNotes, voiceNotes), [voiceNotes]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.issues, issues), [issues]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.materialRequests, materialRequests), [materialRequests]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.settings, settings), [settings]);
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

  useEffect(() => () => {
    mediaRecorderRef.current?.stream?.getTracks?.().forEach((track) => track.stop());
    mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
  }, []);

  const todayAttendance = useMemo(
    () => getTodayAttendance(attendanceRecords, currentWorker.id, today),
    [attendanceRecords, currentWorker.id, today]
  );
  const latestPhotoReports = useMemo(
    () => photoReports.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [photoReports, currentWorker.id]
  );
  const latestVoiceNotes = useMemo(
    () => voiceNotes.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [voiceNotes, currentWorker.id]
  );
  const latestIssues = useMemo(
    () => issues.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [issues, currentWorker.id]
  );
  const latestRequests = useMemo(
    () => materialRequests.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [materialRequests, currentWorker.id]
  );

  const isCheckedIn = Boolean(todayAttendance.checkIn);
  const isCheckedOut = Boolean(todayAttendance.checkOut);
  const canUseWorkActions = isCheckedIn && !isCheckedOut;
  const todayPhotoCount = latestPhotoReports.filter((entry) => entry.dateKey === today).length;
  const todayVoiceCount = latestVoiceNotes.filter((entry) => entry.dateKey === today).length;
  const todayStatus = isCheckedOut ? localCopy.checkedOut : isCheckedIn ? localCopy.working : localCopy.notCheckedIn;

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
      audioData: '',
      timestamp: entry.submittedAt,
    }));

    const voiceItems = latestVoiceNotes.map((entry) => ({
      id: entry.id,
      type: 'voice',
      title: localCopy.voiceSaved,
      detail: `${siteName} • ${formatDateTime(entry.recordedAt, locale)} • ${formatDuration(entry.durationMs)}`,
      status: entry.status,
      imageData: '',
      audioData: entry.audioData,
      timestamp: entry.recordedAt,
    }));

    const issueItems = latestIssues.map((entry) => ({
      id: entry.id,
      type: 'issue',
        title: pickText(t, 'worker_sos', 'Report Issue / SOS'),
        detail: `${entry.category} • ${entry.urgency} • ${formatDateTime(entry.reportedAt, locale)}`,
        status: entry.status,
        imageData: entry.imageData,
        audioData: '',
        timestamp: entry.reportedAt,
      }));

    const requestItems = latestRequests.map((entry) => ({
      id: entry.id,
      type: 'request',
        title: pickText(t, 'worker_material', 'Request Material'),
        detail: `${entry.itemName} • ${entry.quantity} ${entry.unit} • ${formatDateTime(entry.requestedAt, locale)}`,
        status: entry.status,
        imageData: entry.imageData,
        audioData: '',
        timestamp: entry.requestedAt,
      }));

    return [...attendanceItems, ...photoItems, ...voiceItems, ...issueItems, ...requestItems]
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .slice(0, 12);
  }, [attendanceRecords, currentWorker.id, latestIssues, latestPhotoReports, latestRequests, latestVoiceNotes, locale, localCopy.voiceSaved, siteName, t]);

  const pendingItems = [
    ...latestRequests.filter((entry) => entry.status === 'pending').map((entry) => ({ id: entry.id, label: `${pickText(t, 'worker_material', 'Material')} • ${entry.itemName}` })),
    ...latestIssues.filter((entry) => entry.status === 'open').map((entry) => ({ id: entry.id, label: `${pickText(t, 'worker_sos', 'SOS')} • ${entry.category}` })),
    ...tasks.filter((entry) => entry.status !== TASK_STATUS.completed).map((entry) => ({ id: entry.id, label: pickText(t, `worker_task_title_${entry.title}`, entry.title) })),
  ].slice(0, 4);

  const latestNotifications = [
    { id: 'attendance', title: todayStatus },
    { id: 'photos', title: latestPhotoReports[0] ? `${pickText(t, 'worker_photo', 'Photo')} • ${latestPhotoReports[0].category}` : pickText(t, 'worker_notification_sync', 'Offline data has been safely saved') },
    { id: 'voice', title: latestVoiceNotes[0] ? `${localCopy.lastVoice} • ${formatDuration(latestVoiceNotes[0].durationMs)}` : isCheckedOut ? localCopy.doneHelper : isCheckedIn ? localCopy.readyHelper : localCopy.gateHelper },
  ];

  const openScreen = (screen, message = '') => {
    setValidationError('');
    setVoiceError('');
    setActiveScreen(screen);
    if (message) setToast(message);
  };

  const goBack = () => {
    setValidationError('');
    setVoiceError('');
    setActiveScreen(activeTab);
  };

  const pushToast = (messageKey, fallback) => setToast(localCopy[messageKey] || pickText(t, messageKey, fallback));

  const withBusyAction = async (actionKey, callback) => {
    setBusyAction(actionKey);
    try {
      await callback();
    } finally {
      setBusyAction('');
    }
  };

  const handleAttendance = async (type) => {
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

    await withBusyAction(type, async () => {
      await wait(420);
      const record = createAttendanceRecord({
        workerId: currentWorker.id,
        workerName: currentWorker.name,
        siteName,
        type,
        note: attendanceNote,
      });
      setAttendanceRecords((current) => [...current, record]);
      setAttendanceNote('');
      setToast(type === 'checkin' ? localCopy.checkinSaved : localCopy.checkoutSaved);
    });
  };

  const handleFileChange = async (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await withBusyAction('photo-upload', async () => {
      const { imageData, stats } = await compressImageFile(file, settings);
      setter((current) => ({
        ...current,
        imageData,
        imageStats: stats,
        originalName: file.name || '',
      }));
      setToast(localCopy.photoCaptured);
    });
    event.target.value = '';
  };

  const submitPhoto = async () => {
    setValidationError('');
    if (!canUseWorkActions) {
      setValidationError(localCopy.gateHelper);
      return;
    }
    if (!photoForm.category || !photoForm.detail || !photoForm.imageData) {
      setValidationError(pickText(t, 'worker_validation_required', 'Please complete required fields'));
      return;
    }

    await withBusyAction('photo-submit', async () => {
      const record = createPhotoReport({
        workerId: currentWorker.id,
        workerName: currentWorker.name,
        siteName,
        category: photoForm.category,
        detail: photoForm.detail,
        imageData: photoForm.imageData,
        imageMeta: photoForm.imageStats || {},
        status: online ? 'submitted' : 'queued',
      });
      setPhotoReports((current) => [...current, record]);
      setPhotoForm(defaultPhotoForm);
      pushToast('worker_action_sent_success', 'Sent successfully');
    });
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

  const clearImageForm = (setter) => {
    setter((current) => ({ ...current, imageData: '', imageStats: null, originalName: '' }));
    setToast(localCopy.photoRemoved);
  };

  const startVoiceRecording = async () => {
    setValidationError('');
    setVoiceError('');
    if (!canUseWorkActions) {
      setValidationError(localCopy.gateHelper);
      return;
    }
    if (!canRecordVoice) {
      setVoiceError(localCopy.voiceFallback);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setIsRecordingVoice(false);
        setIsVoiceProcessing(true);
        try {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioData = await readBlobAsDataUrl(audioBlob);
          const record = createVoiceNoteRecord({
            workerId: currentWorker.id,
            workerName: currentWorker.name,
            siteName,
            audioData,
            durationMs: Date.now() - recordingStartedAtRef.current,
            mimeType,
          });
          setVoiceNotes((current) => [...current, record]);
          setToast(localCopy.voiceSaved);
        } catch (error) {
          console.error('Voice note processing failed:', error);
          setVoiceError(localCopy.voiceProcessing);
        } finally {
          setIsVoiceProcessing(false);
          stream.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
        }
      };

      recorder.start();
      setIsRecordingVoice(true);
    } catch (error) {
      console.error('Voice recording failed:', error);
      setVoiceError(localCopy.voicePermission);
      setIsRecordingVoice(false);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const deleteVoiceNote = (voiceId) => {
    setVoiceNotes((current) => current.filter((entry) => entry.id !== voiceId));
    setToast(localCopy.voiceDeleted);
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

  const actionButtons = [
    {
      id: 'checkin',
      label: pickText(t, 'worker_checkin_cta', 'Check In'),
      helper: isCheckedIn ? localCopy.done : localCopy.ready,
      icon: CheckCircle2,
      tone: 'blue',
      disabled: isCheckedIn,
      loading: busyAction === 'checkin',
      active: !isCheckedIn,
      onClick: () => handleAttendance('checkin'),
    },
    {
      id: 'checkout',
      label: pickText(t, 'worker_checkout_cta', 'Check Out'),
      helper: isCheckedOut ? localCopy.done : isCheckedIn ? localCopy.active : localCopy.disabled,
      icon: Clock3,
      tone: 'emerald',
      disabled: !isCheckedIn || isCheckedOut,
      loading: busyAction === 'checkout',
      active: isCheckedIn && !isCheckedOut,
      onClick: () => handleAttendance('checkout'),
    },
    {
      id: 'photo',
      label: pickText(t, 'worker_photo', 'Upload Photo'),
      helper: todayPhotoCount > 0 ? `${todayPhotoCount} ${localCopy.done}` : canUseWorkActions ? localCopy.active : localCopy.disabled,
      icon: Camera,
      tone: 'slate',
      disabled: !canUseWorkActions,
      loading: busyAction === 'photo-upload' || busyAction === 'photo-submit',
      active: activeScreen === SCREEN_PHOTO || todayPhotoCount > 0,
      onClick: () => openScreen(SCREEN_PHOTO, localCopy.openPhoto),
    },
    {
      id: 'voice',
      label: localCopy.voiceTitle,
      helper: isRecordingVoice ? localCopy.recording : todayVoiceCount > 0 ? `${todayVoiceCount} ${localCopy.done}` : canUseWorkActions ? localCopy.active : localCopy.disabled,
      icon: Mic,
      tone: 'amber',
      disabled: !canUseWorkActions,
      loading: isVoiceProcessing,
      active: activeScreen === SCREEN_VOICE || isRecordingVoice || todayVoiceCount > 0,
      onClick: () => openScreen(SCREEN_VOICE, localCopy.openVoice),
    },
  ];

  const renderHome = () => (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[1.9rem] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
        <div className="bg-gradient-to-br from-slate-950 via-blue-900 to-blue-700 p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/75">{pickText(t, 'worker_attendance_title', 'Attendance')}</div>
              <div className="mt-2 text-2xl font-semibold">{todayStatus}</div>
              <div className="mt-2 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50">
                {localCopy.todayStatusLabel}: {todayStatus}
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
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {isCheckedOut ? localCopy.doneHelper : isCheckedIn ? localCopy.readyHelper : localCopy.gateHelper}
          </div>
        </div>
      </section>

      <section className="sticky bottom-3 z-10 -mx-1 rounded-[1.8rem] border border-slate-200/80 bg-white/95 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-slate-900">{pickText(t, 'worker_action_primary', 'Quick Actions')}</div>
          <div className="text-xs text-slate-500">{localCopy.checkoutHelper}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {actionButtons.map((action) => (
            <WorkerActionButton key={action.id} {...action} />
          ))}
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
                    {item.type === 'photo' ? <FileImage className="h-5 w-5" /> : item.type === 'request' ? <Package className="h-5 w-5" /> : item.type === 'issue' ? <AlertTriangle className="h-5 w-5" /> : item.type === 'voice' ? <Mic className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{item.status}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
                    {item.imageData ? <img src={item.imageData} alt={item.title} className="mt-3 h-24 w-full rounded-2xl object-cover" /> : null}
                    {item.audioData ? <audio controls src={item.audioData} className="mt-3 w-full" /> : null}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label={pickText(t, 'worker_photo', 'Photo')} value={`${latestPhotoReports.length}`} compact />
          <MetricCard label={pickText(t, 'worker_material', 'Material')} value={`${latestRequests.length}`} compact />
          <MetricCard label={pickText(t, 'worker_sos', 'SOS')} value={`${latestIssues.length}`} compact />
          <MetricCard label={localCopy.voiceTitle} value={`${latestVoiceNotes.length}`} compact />
        </div>
      </div>
      <DataSaverCard settings={settings} setSettings={setSettings} t={t} />
    </div>
  );

  const renderPhotoScreen = () => (
    <SinglePurposeScreen
      title={pickText(t, 'worker_photo_screen_title', 'Submit Work Photo')}
      subtitle={localCopy.photoDesc}
      onBack={goBack}
      t={t}
    >
      <DataSaverCard settings={settings} setSettings={setSettings} t={t} compact />
      <FormCard title={pickText(t, 'worker_photo', 'Upload Photo')}>
        <FilePicker
          imageData={photoForm.imageData}
          onChange={(event) => handleFileChange(event, setPhotoForm)}
          onRemove={() => clearImageForm(setPhotoForm)}
          label={pickText(t, 'worker_report_photo', 'Photo')}
          helperText={localCopy.photoHelp}
          actionLabel={localCopy.photoPick}
          retakeLabel={localCopy.photoRetake}
          removeLabel={localCopy.photoRemove}
          loading={busyAction === 'photo-upload'}
          t={t}
        />
        {photoForm.imageStats ? (
          <div className="mt-3 rounded-[1.2rem] bg-blue-50 p-3 text-sm text-blue-900">
            <div className="font-semibold">{pickText(t, 'worker_auto_data_saver', 'The app automatically optimizes files to save data')}</div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white px-3 py-2">
                <div className="text-slate-500">{pickText(t, 'worker_original_file_size', 'Original file size')}</div>
                <div className="mt-1 font-semibold text-slate-900">{formatBytes(photoForm.imageStats.originalBytes)}</div>
              </div>
              <div className="rounded-xl bg-white px-3 py-2">
                <div className="text-slate-500">{pickText(t, 'worker_compressed_file_size', 'Compressed size')}</div>
                <div className="mt-1 font-semibold text-slate-900">{formatBytes(photoForm.imageStats.compressedBytes)}</div>
              </div>
            </div>
          </div>
        ) : null}
        <input value={photoForm.category} onChange={(event) => setPhotoForm((current) => ({ ...current, category: event.target.value }))} placeholder={pickText(t, 'worker_report_category', 'Job category')} className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        <textarea value={photoForm.detail} onChange={(event) => setPhotoForm((current) => ({ ...current, detail: event.target.value }))} placeholder={pickText(t, 'worker_report_details', 'Details')} rows={4} className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        <button disabled={busyAction === 'photo-submit'} onClick={submitPhoto} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300">
          {busyAction === 'photo-submit' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {pickText(t, 'worker_report_submit', 'Submit report')}
        </button>
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

  const renderVoiceScreen = () => (
    <SinglePurposeScreen
      title={localCopy.voiceTitle}
      subtitle={localCopy.voiceDesc}
      onBack={goBack}
      t={t}
    >
      <FormCard title={localCopy.voiceTitle}>
        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl p-3 ${isRecordingVoice ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
              <Mic className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900">{isRecordingVoice ? localCopy.recording : localCopy.voiceHelp}</div>
              <div className="mt-1 text-sm text-slate-500">{isVoiceProcessing ? localCopy.voiceProcessing : canRecordVoice ? localCopy.readyHelper : localCopy.voiceFallback}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button onClick={startVoiceRecording} disabled={!canUseWorkActions || !canRecordVoice || isRecordingVoice || isVoiceProcessing} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.2rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
              <Mic className="h-4 w-4" />
              {localCopy.voiceStart}
            </button>
            <button onClick={stopVoiceRecording} disabled={!isRecordingVoice} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.2rem] bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-200">
              <Square className="h-4 w-4" />
              {localCopy.voiceStop}
            </button>
          </div>
        </div>
        {voiceError ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{voiceError}</div> : null}
      </FormCard>
      <FormCard title={localCopy.voiceRecent}>
        <HistoryList
          items={latestVoiceNotes}
          emptyLabel={pickText(t, 'worker_no_data', 'No data yet')}
          renderItem={(item) => (
            <VoiceHistoryCard
              title={`${localCopy.voiceReady} • ${formatDateTime(item.recordedAt, locale)}`}
              durationLabel={`${localCopy.duration}: ${formatDuration(item.durationMs)}`}
              status={item.status}
              audioData={item.audioData}
              onDelete={() => deleteVoiceNote(item.id)}
              deleteLabel={localCopy.voiceDelete}
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
        <FilePicker imageData={requestForm.imageData} onChange={(event) => handleFileChange(event, setRequestForm)} onRemove={() => clearImageForm(setRequestForm)} label={pickText(t, 'worker_req_photo_cta', 'Attach photo')} helperText={localCopy.photoHelp} actionLabel={localCopy.photoPick} retakeLabel={localCopy.photoRetake} removeLabel={localCopy.photoRemove} loading={busyAction === 'photo-upload'} optional t={t} />
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
          <FilePicker imageData={issueForm.imageData} onChange={(event) => handleFileChange(event, setIssueForm)} onRemove={() => clearImageForm(setIssueForm)} label={pickText(t, 'worker_sos_photo_optional', 'Photo optional')} helperText={localCopy.photoHelp} actionLabel={localCopy.photoPick} retakeLabel={localCopy.photoRetake} removeLabel={localCopy.photoRemove} loading={busyAction === 'photo-upload'} optional t={t} />
          <div className="mt-3">
            <button onClick={submitIssue} className="w-full rounded-[1.2rem] bg-amber-500 px-4 py-3 text-sm font-semibold text-white">{pickText(t, 'worker_issue_submit', 'Submit issue')}</button>
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
    if (activeScreen === SCREEN_VOICE) return renderVoiceScreen();
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

function DataSaverCard({ settings, setSettings, t, compact = false }) {
  return (
    <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-slate-900">{pickText(t, 'worker_data_saver_mode', 'Data Saver Mode')}</div>
          <div className="mt-1 text-sm text-slate-500">{pickText(t, 'worker_auto_data_saver', 'The app automatically optimizes files to save data')}</div>
        </div>
        <button onClick={() => setSettings((current) => ({ ...current, dataSaverMode: !current.dataSaverMode }))} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${settings.dataSaverMode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {settings.dataSaverMode ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className={`mt-3 ${compact ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-3 gap-3'}`}>
        {['low', 'medium', 'high'].map((level) => (
          <button
            key={level}
            onClick={() => setSettings((current) => ({ ...current, uploadQuality: level }))}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${settings.uploadQuality === level ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {pickText(t, `worker_quality_${level}`, level)}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-500">{pickText(t, 'worker_upload_quality', 'Upload Quality')}</div>
    </div>
  );
}

function FilePicker({ imageData, onChange, onRemove, label, helperText, actionLabel, retakeLabel, removeLabel, loading = false, optional = false, t }) {
  const inputRef = useRef(null);

  return (
    <div className="mt-3 rounded-[1.3rem] border border-dashed border-slate-300 bg-slate-50 p-4">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" />
      {imageData ? <img src={imageData} alt={label} className="mx-auto mb-3 max-h-44 w-full rounded-2xl object-cover" /> : <Camera className="mx-auto h-8 w-8 text-slate-400" />}
      <div className="text-center text-sm font-medium text-slate-700">{label}</div>
      <div className="mt-1 text-center text-xs text-slate-500">{helperText || (optional ? pickText(t, 'worker_optional_label', 'Optional') : pickText(t, 'worker_required_label', 'Required'))}</div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" disabled={loading} onClick={() => inputRef.current?.click()} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : (imageData ? retakeLabel : actionLabel)}
        </button>
        <button type="button" disabled={!imageData || loading} onClick={onRemove} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400">
          {removeLabel}
        </button>
      </div>
    </div>
  );
}

function WorkerActionButton({ label, helper, icon: Icon, tone, disabled, loading, active, onClick }) {
  const palette = tone === 'emerald'
    ? { base: 'border-emerald-200 bg-emerald-50 text-emerald-900', active: 'border-emerald-500 bg-emerald-600 text-white', disabled: 'border-slate-200 bg-slate-100 text-slate-400' }
    : tone === 'amber'
      ? { base: 'border-amber-200 bg-amber-50 text-amber-900', active: 'border-amber-500 bg-amber-500 text-slate-950', disabled: 'border-slate-200 bg-slate-100 text-slate-400' }
      : tone === 'slate'
        ? { base: 'border-slate-200 bg-slate-50 text-slate-900', active: 'border-slate-700 bg-slate-900 text-white', disabled: 'border-slate-200 bg-slate-100 text-slate-400' }
        : { base: 'border-blue-200 bg-blue-50 text-blue-900', active: 'border-blue-500 bg-blue-700 text-white', disabled: 'border-slate-200 bg-slate-100 text-slate-400' };
  const className = disabled ? palette.disabled : active || loading ? palette.active : palette.base;

  return (
    <button onClick={onClick} disabled={disabled || loading} className={`min-h-[88px] rounded-[1.35rem] border px-4 py-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{label}</div>
          <div className={`mt-1 text-xs ${disabled ? 'text-slate-400' : active || loading ? 'text-white/85' : 'text-current/75'}`}>{helper}</div>
        </div>
        <div className="shrink-0 rounded-2xl bg-white/15 p-2">
          {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
        </div>
      </div>
    </button>
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

function VoiceHistoryCard({ title, durationLabel, status, audioData, onDelete, deleteLabel }) {
  return (
    <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{durationLabel}</div>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">{status}</span>
      </div>
      <audio controls src={audioData} className="mt-3 w-full" />
      <button onClick={onDelete} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
        <Trash2 className="h-4 w-4" />
        {deleteLabel}
      </button>
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
