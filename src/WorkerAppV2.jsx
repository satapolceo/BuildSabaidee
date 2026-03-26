import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Camera,
  ChevronDown,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileImage,
  Home,
  LoaderCircle,
  MapPin,
  MessageSquare,
  Mic,
  Package,
  Plus,
  Send,
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
  createDailyReportRecord,
  createMaterialRequest,
  createMilestoneSubmission,
  createPaymentRequest,
  createPhotoSubmissionBatch,
  createVoiceNoteRecord,
  getTodayAttendance,
  getWorkerTasks,
  loadFromStorage,
  normalizePhotoSubmissionBatch,
  saveToStorage,
  updateWorkerTaskStatus,
} from './workerStorage';
import { compressImageFile, DATA_SAVER_DEFAULTS } from './imageDataSaver';
import AttachmentComposer from './modules/attachments/AttachmentComposer';
import DailyReportDetail from './modules/dailyReports/DailyReportDetail';
import DailyReportFilters from './modules/dailyReports/DailyReportFilters';
import DailyReportForm from './modules/dailyReports/DailyReportForm';
import DailyReportList from './modules/dailyReports/DailyReportList';
import SiteTicketDetail from './modules/siteTickets/SiteTicketDetail';
import SiteTicketFilters from './modules/siteTickets/SiteTicketFilters';
import SiteTicketForm from './modules/siteTickets/SiteTicketForm';
import SiteTicketList from './modules/siteTickets/SiteTicketList';
import {
  SITE_TICKET_STATUS,
  canEditSiteTicket,
  normalizeSiteTicketList,
} from './modules/siteTickets/siteTicketModel';
import {
  createSiteTicketFromForm,
  filterSiteTickets,
  getSiteTicketSummaryCounts,
  getVisibleSiteTickets,
  migrateLegacyIssuesToSiteTickets,
  sortSiteTickets,
  updateSiteTicketFromForm,
} from './modules/siteTickets/siteTicketService';
import {
  getSiteTicketCopy,
  getSiteTicketPriorityOptions,
  getSiteTicketStatusOptions,
} from './modules/siteTickets/siteTicketI18n';
import useSiteTicketForm from './modules/siteTickets/useSiteTicketForm';
import { canEditDailyReport, normalizeDailyReportList } from './modules/dailyReports/dailyReportModel';
import {
  buildDailyReportTicketInsights,
  createDailyReportFromForm,
  filterDailyReports,
  getDailyReportSummaryCounts,
  getVisibleDailyReports,
  sortDailyReports,
  updateDailyReportFromForm,
} from './modules/dailyReports/dailyReportService';
import { getDailyReportCopy } from './modules/dailyReports/dailyReportI18n';
import useDailyReportForm from './modules/dailyReports/useDailyReportForm';
import {
  TAB_HOME,
  TAB_TASKS,
  TAB_ACTIVITY,
  TAB_CHAT,
  SCREEN_HOME,
  SCREEN_TASKS,
  SCREEN_ACTIVITY,
  SCREEN_PROFILE,
  SCREEN_CHAT,
  SCREEN_WORK_REPORTS,
  SCREEN_PHOTO,
  SCREEN_VOICE,
  SCREEN_REQUEST,
  SCREEN_ISSUE,
  SCREEN_DELIVERY,
  SCREEN_PAYMENT,
  SCREEN_MILESTONE,
  SCREEN_DAILY_REPORT,
  createWorkerNavItems,
  createWorkerActionButtons,
  getLocalizedConstructionTaskCategoryOptions,
  getLocalizedConstructionAreaZoneOptions,
  getLocalizedConstructionSubcategoryOptions,
  getLocalizedStandardConstructionPhraseOptions,
} from './workerMobileMenuConfig';

const defaultPhotoBatch = {
  projectId: '',
  projectName: '',
  taskCategory: '',
  workSubcategory: '',
  areaZone: '',
  workType: '',
  tradeTeam: '',
  roomId: '',
  roomName: '',
  batchTitle: '',
  notes: '',
  standardPhrase: '',
  photos: [],
  voiceNote: null,
  status: 'draft',
};
const defaultIssueForm = { category: 'safety', urgency: 'high', detail: '', imageData: '', imageStats: null, originalName: '', standardPhrase: '' };
const defaultRequestForm = { itemName: '', quantity: '1', unit: 'piece', note: '', taskCategory: '', areaZone: '', imageData: '', imageStats: null, originalName: '', standardPhrase: '' };
const defaultPaymentForm = { amount: '', taskCategory: '', areaZone: '', note: '', standardPhrase: '' };
const defaultMilestoneForm = { taskCategory: '', areaZone: '', progress: '', note: '', photos: [], standardPhrase: '' };

const PROJECT_BATCH_LIBRARY = {
  default: {
    workTypes: [
      { value: 'structure', labels: { TH: 'งานโครงสร้าง', LA: 'ວຽກໂຄງສ້າງ', EN: 'Structure' } },
      { value: 'electrical', labels: { TH: 'งานไฟฟ้า', LA: 'ວຽກໄຟຟ້າ', EN: 'Electrical' } },
      { value: 'finishing', labels: { TH: 'งานเก็บงาน', LA: 'ວຽກເກັບລາຍລະອຽດ', EN: 'Finishing' } },
    ],
    tradeTeams: [
      { value: 'civil-core', workTypes: ['structure'], labels: { TH: 'ทีมโครงสร้างหลัก', LA: 'ທີມໂຄງສ້າງຫຼັກ', EN: 'Core Structure Team' } },
      { value: 'electric-install', workTypes: ['electrical'], labels: { TH: 'ทีมติดตั้งไฟฟ้า', LA: 'ທີມຕິດຕັ້ງໄຟຟ້າ', EN: 'Electrical Install Team' } },
      { value: 'finish-detail', workTypes: ['finishing'], labels: { TH: 'ทีมเก็บรายละเอียด', LA: 'ທີມເກັບລາຍລະອຽດ', EN: 'Finishing Detail Team' } },
    ],
    rooms: [
      { value: 'zone-a', workTypes: ['structure'], tradeTeams: ['civil-core'], labels: { TH: 'โซน A', LA: 'ໂຊນ A', EN: 'Zone A' } },
      { value: 'electrical-riser', workTypes: ['electrical'], tradeTeams: ['electric-install'], labels: { TH: 'ชาฟท์ไฟฟ้า', LA: 'ຊາຟໄຟຟ້າ', EN: 'Electrical Riser' } },
      { value: 'handover-floor', workTypes: ['finishing'], tradeTeams: ['finish-detail'], labels: { TH: 'พื้นที่ส่งมอบ', LA: 'ພື້ນທີ່ສົ່ງມອບ', EN: 'Handover Area' } },
    ],
  },
  tower: {
    workTypes: [
      { value: 'structure', labels: { TH: 'งานโครงสร้าง', LA: 'ວຽກໂຄງສ້າງ', EN: 'Structure' } },
      { value: 'mep', labels: { TH: 'งานระบบ MEP', LA: 'ວຽກລະບົບ MEP', EN: 'MEP' } },
      { value: 'finishing', labels: { TH: 'งานตกแต่ง', LA: 'ວຽກຕົກແຕ່ງ', EN: 'Interior Finish' } },
    ],
    tradeTeams: [
      { value: 'concrete-team', workTypes: ['structure'], labels: { TH: 'ทีมเทคอนกรีต', LA: 'ທີມເທຄອນກຣີດ', EN: 'Concrete Team' } },
      { value: 'mep-roughin', workTypes: ['mep'], labels: { TH: 'ทีมงานระบบเดินท่อ', LA: 'ທີມລະບົບເດີນທໍ່', EN: 'MEP Rough-in Team' } },
      { value: 'ceiling-team', workTypes: ['finishing'], labels: { TH: 'ทีมฝ้าเพดาน', LA: 'ທີມຝ້າເພດານ', EN: 'Ceiling Team' } },
    ],
    rooms: [
      { value: 'core-12', workTypes: ['structure'], tradeTeams: ['concrete-team'], labels: { TH: 'คอร์ชั้น 12', LA: 'ແກນຊັ້ນ 12', EN: 'Core Level 12' } },
      { value: 'corridor-12', workTypes: ['mep', 'finishing'], tradeTeams: ['mep-roughin', 'ceiling-team'], labels: { TH: 'โถงทางเดินชั้น 12', LA: 'ທາງເດີນຊັ້ນ 12', EN: 'Level 12 Corridor' } },
      { value: 'unit-1203', workTypes: ['mep', 'finishing'], tradeTeams: ['mep-roughin', 'ceiling-team'], labels: { TH: 'ห้อง 1203', LA: 'ຫ້ອງ 1203', EN: 'Unit 1203' } },
    ],
  },
  villa: {
    workTypes: [
      { value: 'foundation', labels: { TH: 'งานฐานราก', LA: 'ວຽກຖານຮາກ', EN: 'Foundation' } },
      { value: 'plumbing', labels: { TH: 'งานประปา', LA: 'ວຽກປະປາ', EN: 'Plumbing' } },
      { value: 'finishing', labels: { TH: 'งานเก็บงาน', LA: 'ວຽກເກັບລາຍລະອຽດ', EN: 'Finishing' } },
    ],
    tradeTeams: [
      { value: 'footing-team', workTypes: ['foundation'], labels: { TH: 'ทีมฐานราก', LA: 'ທີມຖານຮາກ', EN: 'Footing Team' } },
      { value: 'pipe-team', workTypes: ['plumbing'], labels: { TH: 'ทีมเดินท่อ', LA: 'ທີມເດີນທໍ່', EN: 'Pipe Team' } },
      { value: 'paint-team', workTypes: ['finishing'], labels: { TH: 'ทีมทาสี', LA: 'ທີມທາສີ', EN: 'Painting Team' } },
    ],
    rooms: [
      { value: 'front-yard', workTypes: ['foundation'], tradeTeams: ['footing-team'], labels: { TH: 'ลานหน้าบ้าน', LA: 'ເດີ່ນໜ້າບ້ານ', EN: 'Front Yard' } },
      { value: 'master-bath', workTypes: ['plumbing', 'finishing'], tradeTeams: ['pipe-team', 'paint-team'], labels: { TH: 'ห้องน้ำมาสเตอร์', LA: 'ຫ້ອງນ້ຳຫຼັກ', EN: 'Master Bath' } },
      { value: 'living-room', workTypes: ['finishing'], tradeTeams: ['paint-team'], labels: { TH: 'ห้องนั่งเล่น', LA: 'ຫ້ອງນັ່ງເລ່ນ', EN: 'Living Room' } },
    ],
  },
};

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

const wait = (ms = 0) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getLocalizedValue = (labels = {}, language = 'EN') => labels[language] || labels.EN || labels.TH || labels.LA || '';

const normalizeProjectOptions = (items = [], language = 'EN') =>
  items.map((item) => ({ ...item, label: getLocalizedValue(item.labels, language) }));

const getProjectBatchConfigKey = (project = {}) => {
  const name = String(project?.name || '').toLowerCase();
  if (name.includes('tower') || name.includes('condo') || name.includes('apartment')) return 'tower';
  if (name.includes('villa') || name.includes('house') || name.includes('home')) return 'villa';
  return 'default';
};

const getOptionLabel = (options, value) => options.find((option) => option.value === value)?.label || value || '-';

const getProjectNameById = (projects, projectId) =>
  projects.find((project) => String(project.id) === String(projectId))?.name || '';

const getPreferredProject = (projects, currentProject) => {
  if (currentProject?.id) return currentProject;
  return projects[0] || null;
};

const normalizeWorkerIdentity = (entry, t) => {
  const rawName = entry?.name ?? entry?.companyName ?? '';
  const name = String(rawName || '').trim() || pickText(t, 'worker_role_worker', 'Worker');
  return {
    id: String(entry?.id || 'worker-local'),
    name,
    assignedSiteId: String(entry?.assignedSiteId || ''),
    role: String(entry?.role || 'worker'),
  };
};

const prependUniqueOption = (items = [], nextValue = '') => {
  const normalized = String(nextValue || '').trim();
  if (!normalized) return items;
  return [normalized, ...items.filter((item) => item !== normalized)];
};

const mergeOptionLists = (...groups) => {
  const seen = new Set();
  const result = [];
  groups.flat().filter(Boolean).forEach((item) => {
    if (seen.has(item)) return;
    seen.add(item);
    result.push(item);
  });
  return result;
};

const createDefaultPhotoBatchForm = (project) => ({
  ...defaultPhotoBatch,
  projectId: project?.id ? String(project.id) : '',
  projectName: project?.name || '',
  status: 'draft',
});

const resolveBatchSelectionDefaults = (current, projectBatchOptions, fallbackProjectName = '') => {
  const nextWorkType = projectBatchOptions.workTypes.some((option) => option.value === current.workType)
    ? current.workType
    : (projectBatchOptions.workTypes[0]?.value || '');
  const filteredTrades = projectBatchOptions.tradeTeams.filter((option) => !nextWorkType || option.workTypes?.includes(nextWorkType));
  const nextTradeTeam = filteredTrades.some((option) => option.value === current.tradeTeam)
    ? current.tradeTeam
    : (filteredTrades[0]?.value || '');
  const filteredRooms = projectBatchOptions.rooms.filter((option) => {
    const matchesWorkType = !nextWorkType || option.workTypes?.includes(nextWorkType);
    const matchesTrade = !nextTradeTeam || option.tradeTeams?.includes(nextTradeTeam);
    return matchesWorkType && matchesTrade;
  });
  const nextRoomId = filteredRooms.some((option) => option.value === current.roomId)
    ? current.roomId
    : (filteredRooms[0]?.value || '');
  const nextRoomName = nextRoomId ? getOptionLabel(filteredRooms, nextRoomId) : '';

  return {
    projectName: current.projectName || fallbackProjectName || '',
    workType: nextWorkType,
    tradeTeam: nextTradeTeam,
    roomId: nextRoomId,
    roomName: nextRoomName,
    taskCategory: current.taskCategory || (nextWorkType ? getOptionLabel(projectBatchOptions.workTypes, nextWorkType) : ''),
    areaZone: current.areaZone || nextRoomName,
  };
};

const formatBatchStatusLabel = (status, language) => {
  if (language === 'TH') return status === 'draft' ? 'ฉบับร่าง' : 'ส่งแล้ว';
  if (language === 'LA') return status === 'draft' ? 'ຮ່າງ' : 'ສົ່ງແລ້ວ';
  return status === 'draft' ? 'Draft' : 'Submitted';
};

const getBatchCardTone = (status) => (
  status === 'draft'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
);

function mergeSyncedRecords(sharedItems = [], localItems = [], normalizeItems = (items) => items) {
  const mergedMap = new Map();

  normalizeItems(Array.isArray(sharedItems) ? sharedItems : []).forEach((item) => {
    if (item?.id) mergedMap.set(String(item.id), item);
  });
  normalizeItems(Array.isArray(localItems) ? localItems : []).forEach((item) => {
    if (!item?.id) return;
    const itemId = String(item.id);
    const existing = mergedMap.get(itemId);
    if (!existing || Number(item.updatedAt || item.createdAt || 0) >= Number(existing.updatedAt || existing.createdAt || 0)) {
      mergedMap.set(itemId, item);
    }
  });

  return Array.from(mergedMap.values()).sort(
    (left, right) => Number(right.updatedAt || right.createdAt || 0) - Number(left.updatedAt || left.createdAt || 0),
  );
}

function WorkerAppV2({
  onNavigate,
  t,
  language = 'TH',
  workersList = [],
  projectsList = [],
  sharedAttendanceRecords = [],
  sharedPhotoReports = [],
  sharedMaterialRequests = [],
  sharedPaymentRequests = [],
  sharedMilestoneSubmissions = [],
  sharedSiteTickets = [],
  sharedDailyReports = [],
  sharedChats = [],
  onPersistAttendanceRecord = null,
  onPersistPhotoReport = null,
  onPersistMaterialRequest = null,
  onPersistPaymentRequest = null,
  onPersistMilestoneSubmission = null,
  onPersistSiteTicket = null,
  onPersistDailyReport = null,
  onPersistChatMessage = null,
}) {
  const currentWorker = useMemo(() => {
    const normalizedWorkers = (Array.isArray(workersList) ? workersList : []).map((entry) => normalizeWorkerIdentity(entry, t));
    return normalizedWorkers.find((entry) => entry.name) || normalizeWorkerIdentity({}, t);
  }, [workersList, t]);

  const currentProject = useMemo(
    () => projectsList.find((project) => String(project.id) === String(currentWorker.assignedSiteId)) || projectsList[0] || null,
    [projectsList, currentWorker.assignedSiteId]
  );
  const initialStoredSiteTicketsRef = useRef(null);
  const initialStoredDailyReportsRef = useRef(null);
  const initialStoredAttendanceRef = useRef(null);
  const initialStoredPhotoReportsRef = useRef(null);
  const initialStoredMaterialRequestsRef = useRef(null);
  const initialStoredPaymentRequestsRef = useRef(null);
  const initialStoredMilestonesRef = useRef(null);

  if (initialStoredAttendanceRef.current === null) {
    initialStoredAttendanceRef.current = Array.isArray(loadFromStorage(WORKER_STORAGE_KEYS.attendance, []))
      ? loadFromStorage(WORKER_STORAGE_KEYS.attendance, [])
      : [];
  }

  if (initialStoredPhotoReportsRef.current === null) {
    initialStoredPhotoReportsRef.current = loadFromStorage(WORKER_STORAGE_KEYS.photoReports, []).map(normalizePhotoSubmissionBatch).filter(Boolean);
  }

  if (initialStoredMaterialRequestsRef.current === null) {
    initialStoredMaterialRequestsRef.current = Array.isArray(loadFromStorage(WORKER_STORAGE_KEYS.materialRequests, []))
      ? loadFromStorage(WORKER_STORAGE_KEYS.materialRequests, [])
      : [];
  }

  if (initialStoredPaymentRequestsRef.current === null) {
    initialStoredPaymentRequestsRef.current = Array.isArray(loadFromStorage(WORKER_STORAGE_KEYS.paymentRequests, []))
      ? loadFromStorage(WORKER_STORAGE_KEYS.paymentRequests, [])
      : [];
  }

  if (initialStoredMilestonesRef.current === null) {
    initialStoredMilestonesRef.current = Array.isArray(loadFromStorage(WORKER_STORAGE_KEYS.milestoneSubmissions, []))
      ? loadFromStorage(WORKER_STORAGE_KEYS.milestoneSubmissions, [])
      : [];
  }

  if (initialStoredSiteTicketsRef.current === null) {
    const savedTickets = normalizeSiteTicketList(loadFromStorage(WORKER_STORAGE_KEYS.siteTickets, []));
    initialStoredSiteTicketsRef.current = savedTickets.length
      ? savedTickets
      : migrateLegacyIssuesToSiteTickets(loadFromStorage(WORKER_STORAGE_KEYS.issues, []), {
          currentProject: getPreferredProject(projectsList, currentProject),
          projectsList,
        });
  }

  if (initialStoredDailyReportsRef.current === null) {
    initialStoredDailyReportsRef.current = normalizeDailyReportList(loadFromStorage(WORKER_STORAGE_KEYS.dailyReports, []));
  }

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
        voiceTitle: 'Voice',
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
        photoTakeAction: 'ถ่ายรูป',
        photoChooseAction: 'เลือกรูป',
        photoRetake: 'ถ่ายใหม่',
        photoRemove: 'ลบรูป',
        photoHelp: 'แตะ ถ่ายรูป เพื่อเปิดกล้อง หรือ เลือกรูป เพื่อเปิดแกลเลอรี',
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
        photoBatchSaved: 'บันทึกชุดรูปแล้ว',
        photoBatchSubmitted: 'ส่งชุดรูปแล้ว',
        photoBatchCount: 'จำนวนรูป',
        batchDraft: 'ฉบับร่าง',
        batchSubmitted: 'ส่งแล้ว',
        batchVoiceAttached: 'แนบเสียงแล้ว',
        batchVoiceEmpty: 'ไม่แนบเสียง',
        batchSelectionHelp: 'เลือกโครงการ ประเภทงาน ทีม และห้องก่อนเพิ่มรูป',
        batchPhotoHelp: 'เพิ่มได้หลายรูปในชุดเดียว แล้วลบเฉพาะรูปที่ไม่ต้องการได้',
        batchEmpty: 'ยังไม่มีชุดรูปงาน',
        batchRecent: 'ชุดรูปงานล่าสุด',
        batchDraftAction: 'บันทึกฉบับร่าง',
        batchSubmitAction: 'ส่งชุดงาน',
        batchAttachLatestVoice: 'แนบเสียงล่าสุด',
        batchNoVoiceAvailable: 'ยังไม่มีเสียงล่าสุด',
        batchPhotoRequired: 'ต้องมีรูปอย่างน้อย 1 รูป',
        batchTitleAuto: 'อัปเดตหน้างาน',
        batchUpdated: 'อัปเดต',
        batchInlineVoice: 'เสียงในชุดงาน',
        batchVoiceStart: 'อัดเสียงในฟอร์ม',
        batchVoiceStop: 'หยุดอัด',
        batchVoiceDelete: 'ลบเสียงในฟอร์ม',
        batchVoiceReady: 'พร้อมบันทึกในชุดงาน',
        batchVoiceRecording: 'กำลังอัดเสียงในชุดงาน...',
        batchVoiceProcessing: 'กำลังเตรียมเสียงในชุดงาน...',
        batchVoiceSaved: 'บันทึกเสียงในชุดงานแล้ว',
        batchVoiceRemoved: 'ลบเสียงในชุดงานแล้ว',
        batchVoiceAttachedCount: 'มีเสียงแนบ',
        batchVoiceMissing: 'ยังไม่มีเสียงในชุดงาน',
        batchProjectDataLoading: 'กำลังโหลดรายการงานของโครงการ...',
        batchProjectDataReady: 'เลือกหมวดงาน ทีม และห้องจากข้อมูลของโครงการนี้',
        batchNoProjectData: 'โครงการนี้ยังไม่มีข้อมูลหมวดงานจำลอง',
        batchFilterTrade: 'เลือกประเภทงานก่อนจึงจะเลือกทีมได้',
        batchFilterRoom: 'เลือกประเภทงานและทีมก่อนจึงจะเลือกห้องได้',
        taskCategoryLabel: 'หมวดงาน',
        workSubcategoryLabel: 'หมวดย่อย',
        areaZoneLabel: 'พื้นที่ / โซน',
        standardPhrasesLabel: 'หมายเหตุมาตรฐาน',
        taskCategoryPlaceholder: 'เลือกหมวดงาน',
        workSubcategoryPlaceholder: 'เลือกหมวดย่อย',
        areaZonePlaceholder: 'เลือกพื้นที่ / โซน',
        standardPhrasesPlaceholder: 'เลือกหมายเหตุมาตรฐาน',
        addTaskCategoryLabel: 'เพิ่มหมวดงานเอง',
        addWorkSubcategoryLabel: 'เพิ่มหมวดย่อยเอง',
        addAreaZoneLabel: 'เพิ่มพื้นที่เอง',
        addStandardPhraseLabel: 'เพิ่มหมายเหตุเอง',
        addOptionAction: 'เพิ่มรายการ',
        customInputPlaceholder: 'พิมพ์แล้วเพิ่มเข้ารายการ',
        compactAddAction: 'เพิ่ม',
        compactAddSave: 'บันทึก',
        compactAddCancel: 'ยกเลิก',
        photoFlowHelper: 'โฟลว์มือถือแบบย่อ: เลือกหมวดงาน, พื้นที่, แนบรูป, ส่งงาน',
        projectAutoSelected: 'เลือกโครงการจากไซต์ที่รับผิดชอบให้อัตโนมัติ เพื่อลดขั้นตอนบนมือถือ',
        quickSubmitTitle: 'อัปเดตงาน',
        quickReportsTitle: 'รายงานงาน',
        quickIssueTitle: 'แจ้งปัญหาหน้างาน',
        quickDeliveryTitle: 'แจ้งรับของเข้าไซต์',
        quickEquipmentTitle: 'ขอเบิกวัสดุ / เครื่องมือ',
        quickPaymentTitle: 'ขอเบิกเงิน',
        quickMilestoneTitle: 'ส่งความคืบหน้างวดงาน',
        quickDailyReportTitle: 'สรุปรายวัน',
        quickReportsHelper: 'เลือกอัปเดตงาน สรุปรายวัน หรือส่งความคืบหน้างวดงาน',
        quickIssueHelper: 'แจ้งปัญหาหน้างานหรือของขาดได้ทันที',
        quickDeliveryHelper: 'บันทึกรับของหรือวัสดุเข้าไซต์งาน',
        quickEquipmentHelper: 'ขอเบิกวัสดุหรือเครื่องมือสำหรับงาน',
        quickPaymentHelper: 'ส่งคำขอเบิกเงินตามหมวดงานและพื้นที่',
        quickMilestoneHelper: 'ส่งความคืบหน้างวดงานพร้อมรูปและหมายเหตุ',
        quickDailyReportHelper: 'สรุปงานวันนี้พร้อมปัญหาและแผนพรุ่งนี้',
        quickActivityTitle: 'คำขอและกิจกรรม',
        quickActivityHelper: 'ดูคำขอล่าสุด สถานะงาน และรายการที่เพิ่งส่ง',
        quickChatTitle: 'แชท',
        quickChatHelper: 'คุยกับหัวหน้าหรือทีมโครงการจากหน้างาน',
        workReportsScreenTitle: 'รายงานงาน',
        workReportsScreenDesc: 'เลือกประเภทการรายงานให้ตรงกับงานที่ต้องส่งจากหน้างาน',
        requestsActivityTitle: 'คำขอและกิจกรรม',
        requestsActivityDesc: 'ดูคำขอที่ส่งแล้ว รายการล่าสุด และเปิดฟอร์มที่ใช้บ่อย',
        chatScreenTitle: 'แชทโครงการ',
        chatScreenDesc: 'ดูบทสนทนาล่าสุดและส่งข้อความถึงทีมโครงการ',
        chatEmpty: 'ยังไม่มีข้อความสำหรับโครงการนี้',
        chatSendAction: 'ส่งข้อความ',
        chatUnavailable: 'ยังไม่สามารถส่งข้อความได้ในหน้านี้',
        editableUpdateAction: 'อัปเดตรายการที่เลือก',
        editableSelectedHelper: 'เลือกจากรายการ หรือพิมพ์ค่าใหม่เพื่อเพิ่ม/แก้ได้ทันที',
        subcategoryHelper: 'เลือกหมวดหลักก่อน แล้วจึงเลือกหมวดย่อย',
        phraseHelper: 'เลือกวลีเพื่อเติมข้อความเร็วขึ้น หรือเพิ่มวลีใหม่ได้ทันที',
        requestItemPlaceholder: 'รายการหลัก',
        requestQuantityPlaceholder: 'จำนวน',
        requestUnitPlaceholder: 'หน่วย',
        requestNotePlaceholder: 'รายละเอียดเพิ่มเติม',
        requestPhotoHelper: 'แนบรูปประกอบได้เมื่อจำเป็น',
        requestSubmitAction: 'ส่งรายการ',
        requestRecentTitle: 'รายการล่าสุด',
        requestDeliveryScreenTitle: 'แจ้งรับของเข้าไซต์',
        requestDeliveryScreenDesc: 'บันทึกรับของหรือวัสดุเข้าไซต์พร้อมหมวดงานและพื้นที่จริง',
        requestEquipmentScreenTitle: 'ขอเบิกวัสดุ / เครื่องมือ',
        requestEquipmentScreenDesc: 'ส่งคำขอวัสดุหรือเครื่องมือพร้อมหมวดงานและพื้นที่ใช้งาน',
        paymentScreenTitle: 'ขอเบิกเงิน',
        paymentScreenDesc: 'กรอกจำนวน หมวดงาน และพื้นที่ เพื่อส่งคำขอเบิกเงิน',
        paymentAmountLabel: 'จำนวนเงิน',
        paymentAmountPlaceholder: 'กรอกจำนวนเงิน',
        paymentSubmitAction: 'ส่งคำขอเบิกเงิน',
        paymentRecentTitle: 'ประวัติขอเบิกเงิน',
        paymentSaved: 'ส่งคำขอเบิกเงินแล้ว',
        milestoneScreenTitle: 'ส่งความคืบหน้างวดงาน',
        milestoneScreenDesc: 'อัปเดตความคืบหน้า พร้อมรูป และหมายเหตุของงวดงาน',
        milestoneProgressLabel: 'ความคืบหน้า (%)',
        milestoneProgressPlaceholder: 'เช่น 45',
        milestoneSubmitAction: 'ส่งความคืบหน้างวดงาน',
        milestoneRecentTitle: 'ประวัติส่งความคืบหน้างวดงาน',
        milestoneSaved: 'ส่งความคืบหน้างวดงานแล้ว',
        requestSavedDelivery: 'บันทึกรับสินค้าเข้าไซต์แล้ว',
        requestSavedEquipment: 'ส่งคำขออุปกรณ์ / เครื่องมือแล้ว',
        attachmentPreviewTitle: 'ตัวอย่างก่อนส่ง',
        attachmentPreviewEmpty: 'ยังไม่มีรูป เสียง หรือโน้ตในชุดนี้',
        attachmentPreviewPhoto: 'รูป',
        attachmentPreviewVoice: 'เสียง',
        attachmentPreviewNote: 'โน้ต',
        attachmentPreviewRemove: 'ลบ',
        attachmentNoteLabel: 'โน้ตสั้น',
        originalSizeLabel: 'ขนาดไฟล์เดิม',
        compressedSizeLabel: 'ขนาดหลังบีบอัด',
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
          voiceTitle: 'Voice',
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
          photoTakeAction: 'ຖ່າຍຮູບ',
          photoChooseAction: 'ເລືອກຮູບ',
          photoRetake: 'ຖ່າຍໃໝ່',
          photoRemove: 'ລຶບຮູບ',
          photoHelp: 'ແຕະ ຖ່າຍຮູບ ເພື່ອເປີດກ້ອງ ຫຼື ເລືອກຮູບ ເພື່ອເປີດຄັງຮູບ',
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
          photoBatchSaved: 'ບັນທຶກຊຸດຮູບແລ້ວ',
          photoBatchSubmitted: 'ສົ່ງຊຸດຮູບແລ້ວ',
          photoBatchCount: 'ຈຳນວນຮູບ',
          batchDraft: 'ຮ່າງ',
          batchSubmitted: 'ສົ່ງແລ້ວ',
          batchVoiceAttached: 'ແນບສຽງແລ້ວ',
          batchVoiceEmpty: 'ບໍ່ໄດ້ແນບສຽງ',
          batchSelectionHelp: 'ເລືອກໂຄງການ ປະເພດວຽກ ທີມ ແລະ ຫ້ອງ ກ່ອນເພີ່ມຮູບ',
          batchPhotoHelp: 'ເພີ່ມໄດ້ຫຼາຍຮູບໃນຊຸດດຽວ ແລະ ລຶບສະເພາະຮູບທີ່ບໍ່ຕ້ອງການ',
          batchEmpty: 'ຍັງບໍ່ມີຊຸດຮູບວຽກ',
          batchRecent: 'ຊຸດຮູບວຽກຫຼ້າສຸດ',
          batchDraftAction: 'ບັນທຶກຮ່າງ',
          batchSubmitAction: 'ສົ່ງຊຸດວຽກ',
          batchAttachLatestVoice: 'ແນບສຽງຫຼ້າສຸດ',
          batchNoVoiceAvailable: 'ຍັງບໍ່ມີສຽງຫຼ້າສຸດ',
          batchPhotoRequired: 'ຕ້ອງມີຮູບຢ່າງໜ້ອຍ 1 ຮູບ',
          batchTitleAuto: 'ອັບເດດໜ້າວຽກ',
          batchUpdated: 'ອັບເດດ',
          batchInlineVoice: 'ສຽງໃນຊຸດວຽກ',
          batchVoiceStart: 'ອັດສຽງໃນຟອມ',
          batchVoiceStop: 'ຢຸດອັດ',
          batchVoiceDelete: 'ລຶບສຽງໃນຟອມ',
          batchVoiceReady: 'ພ້ອມບັນທຶກໃນຊຸດວຽກ',
          batchVoiceRecording: 'ກຳລັງອັດສຽງໃນຊຸດວຽກ...',
          batchVoiceProcessing: 'ກຳລັງຈັດກຽມສຽງໃນຊຸດວຽກ...',
          batchVoiceSaved: 'ບັນທຶກສຽງໃນຊຸດວຽກແລ້ວ',
          batchVoiceRemoved: 'ລຶບສຽງໃນຊຸດວຽກແລ້ວ',
          batchVoiceAttachedCount: 'ມີສຽງແນບ',
          batchVoiceMissing: 'ຍັງບໍ່ມີສຽງໃນຊຸດວຽກ',
          batchProjectDataLoading: 'ກຳລັງໂຫຼດລາຍການວຽກຂອງໂຄງການ...',
          batchProjectDataReady: 'ເລືອກປະເພດວຽກ ທີມ ແລະ ຫ້ອງ ຈາກຂໍ້ມູນໂຄງການນີ້',
          batchNoProjectData: 'ໂຄງການນີ້ຍັງບໍ່ມີຂໍ້ມູນຈຳລອງ',
          batchFilterTrade: 'ເລືອກປະເພດວຽກກ່ອນ ຈຶ່ງຈະເລືອກທີມໄດ້',
          batchFilterRoom: 'ເລືອກປະເພດວຽກ ແລະ ທີມ ກ່ອນ ຈຶ່ງຈະເລືອກຫ້ອງໄດ້',
          taskCategoryLabel: 'ໝວດວຽກ',
          workSubcategoryLabel: 'ໝວດຍ່ອຍ',
          areaZoneLabel: 'ພື້ນທີ່ / ໂຊນ',
          standardPhrasesLabel: 'ປະໂຫຍກມາດຕະຖານ',
          taskCategoryPlaceholder: 'ເລືອກໝວດວຽກ',
          workSubcategoryPlaceholder: 'ເລືອກໝວດຍ່ອຍ',
          areaZonePlaceholder: 'ເລືອກພື້ນທີ່ / ໂຊນ',
          standardPhrasesPlaceholder: 'ເລືອກປະໂຫຍກມາດຕະຖານ',
          addTaskCategoryLabel: 'ເພີ່ມໝວດວຽກເອງ',
          addWorkSubcategoryLabel: 'ເພີ່ມໝວດຍ່ອຍເອງ',
          addAreaZoneLabel: 'ເພີ່ມພື້ນທີ່ເອງ',
          addStandardPhraseLabel: 'ເພີ່ມປະໂຫຍກເອງ',
          addOptionAction: 'ເພີ່ມລາຍການ',
          customInputPlaceholder: 'ພິມແລ້ວເພີ່ມເຂົ້າລາຍການ',
          compactAddAction: 'ເພີ່ມ',
          compactAddSave: 'ບັນທຶກ',
          compactAddCancel: 'ຍົກເລີກ',
          photoFlowHelper: 'ໂຟລວ໌ມືຖືແບບຍໍ້: ເລືອກໝວດວຽກ, ພື້ນທີ່, ແນບຮູບ, ສົ່ງງານ',
          projectAutoSelected: 'ເລືອກໂຄງການໃຫ້ອັດຕະໂນມັດຈາກໄຊທ໌ທີ່ຮັບຜິດຊອບ ເພື່ອຫຼຸດຂັ້ນຕອນໃນມືຖື',
          quickSubmitTitle: 'ອັບເດດວຽກ',
          quickReportsTitle: 'ລາຍງານວຽກ',
          quickIssueTitle: 'ແຈ້ງບັນຫາໜ້າງານ',
          quickDeliveryTitle: 'ແຈ້ງຮັບຂອງເຂົ້າໄຊ',
          quickEquipmentTitle: 'ຂໍເບີກວັດສະດຸ / ເຄື່ອງມື',
          quickPaymentTitle: 'ຂໍເບີກເງິນ',
          quickMilestoneTitle: 'ສົ່ງຄວາມຄືບໜ້າຕາມງວດ',
          quickDailyReportTitle: 'ສະຫຼຸບປະຈຳວັນ',
          quickReportsHelper: 'ເລືອກອັບເດດວຽກ, ສະຫຼຸບປະຈຳວັນ, ຫຼື ສົ່ງຄວາມຄືບໜ້າຕາມງວດ',
          quickIssueHelper: 'ແຈ້ງບັນຫາໜ້າງານ ຫຼື ຂອງຂາດໄດ້ທັນທີ',
          quickDeliveryHelper: 'ບັນທຶກການຮັບຂອງ ຫຼື ວັດສະດຸເຂົ້າໄຊ',
          quickEquipmentHelper: 'ຂໍເບີກວັດສະດຸ ຫຼື ເຄື່ອງມືສຳລັບວຽກ',
          quickPaymentHelper: 'ສົ່ງຄຳຂໍເບີກເງິນຕາມໝວດວຽກ ແລະ ພື້ນທີ່',
          quickMilestoneHelper: 'ສົ່ງຄວາມຄືບໜ້າຕາມງວດພ້ອມຮູບ ແລະ ໝາຍເຫດ',
          quickDailyReportHelper: 'ສະຫຼຸບວຽກມື້ນີ້ພ້ອມບັນຫາ ແລະ ແຜນມື້ອື່ນ',
          quickActivityTitle: 'ຄຳຂໍ ແລະ ກິດຈະກຳ',
          quickActivityHelper: 'ເບິ່ງຄຳຂໍລ່າສຸດ, ສະຖານະວຽກ, ແລະ ລາຍການທີ່ສົ່ງແລ້ວ',
          quickChatTitle: 'ແຊັດ',
          quickChatHelper: 'ສົນທະນາກັບຫົວໜ້າ ຫຼື ທີມໂຄງການໄດ້ທັນທີ',
          workReportsScreenTitle: 'ລາຍງານວຽກ',
          workReportsScreenDesc: 'ເລືອກປະເພດລາຍງານໃຫ້ຕົງກັບວຽກທີ່ຕ້ອງສົ່ງ',
          requestsActivityTitle: 'ຄຳຂໍ ແລະ ກິດຈະກຳ',
          requestsActivityDesc: 'ເບິ່ງຄຳຂໍທີ່ສົ່ງແລ້ວ, ລາຍການລ່າສຸດ, ແລະ ເປີດຟອມທີ່ໃຊ້ບ່ອຍ',
          chatScreenTitle: 'ແຊັດໂຄງການ',
          chatScreenDesc: 'ເບິ່ງບົດສົນທະນາລ່າສຸດ ແລະ ສົ່ງຂໍ້ຄວາມຫາທີມໂຄງການ',
          chatEmpty: 'ຍັງບໍ່ມີຂໍ້ຄວາມສຳລັບໂຄງການນີ້',
          chatSendAction: 'ສົ່ງຂໍ້ຄວາມ',
          chatUnavailable: 'ຍັງບໍ່ສາມາດສົ່ງຂໍ້ຄວາມໄດ້ໃນໜ້ານີ້',
          editableUpdateAction: 'ອັບເດດລາຍການທີ່ເລືອກ',
          editableSelectedHelper: 'ເລືອກຈາກລາຍການ ຫຼື ພິມຄ່າໃໝ່ເພື່ອເພີ່ມ/ແກ້ໄຂໄດ້ທັນທີ',
          subcategoryHelper: 'ເລືອກໝວດຫຼັກກ່ອນ ແລ້ວຈຶ່ງເລືອກໝວດຍ່ອຍ',
          phraseHelper: 'ເລືອກປະໂຫຍກເພື່ອໃສ່ຂໍ້ຄວາມໄວ ຫຼື ເພີ່ມປະໂຫຍກໃໝ່ໄດ້ທັນທີ',
          requestItemPlaceholder: 'ລາຍການຫຼັກ',
          requestQuantityPlaceholder: 'ຈຳນວນ',
          requestUnitPlaceholder: 'ໜ່ວຍ',
          requestNotePlaceholder: 'ລາຍລະອຽດເພີ່ມ',
          requestPhotoHelper: 'ສາມາດແນບຮູບເພີ່ມເມື່ອຈຳເປັນ',
          requestSubmitAction: 'ສົ່ງລາຍການ',
          requestRecentTitle: 'ລາຍການຫຼ້າສຸດ',
          requestDeliveryScreenTitle: 'ແຈ້ງຮັບຂອງເຂົ້າໄຊ',
          requestDeliveryScreenDesc: 'ບັນທຶກການຮັບຂອງ ຫຼື ວັດສະດຸເຂົ້າໄຊພ້ອມໝວດວຽກ ແລະ ພື້ນທີ່',
          requestEquipmentScreenTitle: 'ຂໍເບີກວັດສະດຸ / ເຄື່ອງມື',
          requestEquipmentScreenDesc: 'ສົ່ງຄຳຂໍວັດສະດຸ ຫຼື ເຄື່ອງມືພ້ອມໝວດວຽກ ແລະ ພື້ນທີ່ໃຊ້ງານ',
          paymentScreenTitle: 'ຂໍເບີກເງິນ',
          paymentScreenDesc: 'ກອກຈຳນວນ ໝວດວຽກ ແລະ ພື້ນທີ່ ເພື່ອສົ່ງຄຳຂໍເບີກເງິນ',
          paymentAmountLabel: 'ຈຳນວນເງິນ',
          paymentAmountPlaceholder: 'ກອກຈຳນວນເງິນ',
          paymentSubmitAction: 'ສົ່ງຄຳຂໍເບີກເງິນ',
          paymentRecentTitle: 'ປະຫວັດຂໍເບີກເງິນ',
          paymentSaved: 'ສົ່ງຄຳຂໍເບີກເງິນແລ້ວ',
          milestoneScreenTitle: 'ສົ່ງຄວາມຄືບໜ້າຕາມງວດ',
          milestoneScreenDesc: 'ອັບເດດຄວາມຄືບໜ້າພ້ອມຮູບ ແລະ ໝາຍເຫດຂອງງວດງານ',
          milestoneProgressLabel: 'ຄວາມຄືບໜ້າ (%)',
          milestoneProgressPlaceholder: 'ຕົວຢ່າງ 45',
          milestoneSubmitAction: 'ສົ່ງຄວາມຄືບໜ້າຕາມງວດ',
          milestoneRecentTitle: 'ປະຫວັດສົ່ງຄວາມຄືບໜ້າຕາມງວດ',
          milestoneSaved: 'ສົ່ງຄວາມຄືບໜ້າຕາມງວດແລ້ວ',
          requestSavedDelivery: 'ບັນທຶກສິນຄ້າເຂົ້າໄຊແລ້ວ',
          requestSavedEquipment: 'ສົ່ງຄຳຂໍອຸປະກອນ / ເຄື່ອງມືແລ້ວ',
          attachmentPreviewTitle: 'ຕົວຢ່າງກ່ອນສົ່ງ',
          attachmentPreviewEmpty: 'ຍັງບໍ່ມີຮູບ ສຽງ ຫຼື ໂນ້ດໃນຊຸດນີ້',
          attachmentPreviewPhoto: 'ຮູບ',
          attachmentPreviewVoice: 'ສຽງ',
          attachmentPreviewNote: 'ໂນ້ດ',
          attachmentPreviewRemove: 'ລຶບ',
          attachmentNoteLabel: 'ໂນ້ດສັ້ນ',
          originalSizeLabel: 'ຂະໜາດໄຟລ໌ເດີມ',
          compressedSizeLabel: 'ຂະໜາດຫຼັງບີບອັດ',
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
          voiceTitle: 'Voice',
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
          photoTakeAction: 'Take photo',
          photoChooseAction: 'Choose photo',
          photoRetake: 'Retake',
          photoRemove: 'Remove photo',
          photoHelp: 'Use Take photo for the camera or Choose photo for the gallery/file picker',
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
          photoBatchSaved: 'Photo batch saved',
          photoBatchSubmitted: 'Photo batch submitted',
          photoBatchCount: 'Photos',
          batchDraft: 'Draft',
          batchSubmitted: 'Submitted',
          batchVoiceAttached: 'Voice attached',
          batchVoiceEmpty: 'No voice attached',
          batchSelectionHelp: 'Choose project, work type, trade/team, and room before adding photos',
          batchPhotoHelp: 'Add multiple photos in one batch and remove only the ones you do not want',
          batchEmpty: 'No work photo batches yet',
          batchRecent: 'Recent work photo batches',
          batchDraftAction: 'Save draft',
          batchSubmitAction: 'Submit batch',
          batchAttachLatestVoice: 'Attach latest voice note',
          batchNoVoiceAvailable: 'No recent voice note yet',
          batchPhotoRequired: 'Add at least one photo',
          batchTitleAuto: 'Site update',
          batchUpdated: 'Updated',
          batchInlineVoice: 'Inline batch voice',
          batchVoiceStart: 'Record in batch',
          batchVoiceStop: 'Stop recording',
          batchVoiceDelete: 'Delete batch voice',
          batchVoiceReady: 'Ready to record inside this batch',
          batchVoiceRecording: 'Recording inside this batch...',
          batchVoiceProcessing: 'Preparing inline batch audio...',
          batchVoiceSaved: 'Inline batch voice saved',
          batchVoiceRemoved: 'Inline batch voice removed',
          batchVoiceAttachedCount: 'Voice attached',
          batchVoiceMissing: 'No inline batch voice yet',
          batchProjectDataLoading: 'Loading project-specific work options...',
          batchProjectDataReady: 'Choose work type, team, and room from this project',
          batchNoProjectData: 'This project has no simulated work data yet',
          batchFilterTrade: 'Pick a work type before choosing a team',
          batchFilterRoom: 'Pick a work type and team before choosing a room',
          taskCategoryLabel: 'Task Category',
          workSubcategoryLabel: 'Work Subcategory',
          areaZoneLabel: 'Zone / Area',
          standardPhrasesLabel: 'Standard Notes',
          taskCategoryPlaceholder: 'Select task category',
          workSubcategoryPlaceholder: 'Select work subcategory',
          areaZonePlaceholder: 'Select zone / area',
          standardPhrasesPlaceholder: 'Select standard note',
          addTaskCategoryLabel: 'Add your own task category',
          addWorkSubcategoryLabel: 'Add your own subcategory',
          addAreaZoneLabel: 'Add your own zone / area',
          addStandardPhraseLabel: 'Add your own standard note',
          addOptionAction: 'Add option',
          customInputPlaceholder: 'Type a new option',
          compactAddAction: 'Add',
          compactAddSave: 'Save',
          compactAddCancel: 'Cancel',
          photoFlowHelper: 'Simplified mobile flow: choose task category, area, attach photos, submit',
          projectAutoSelected: 'The assigned project is selected automatically to reduce mobile steps',
          quickSubmitTitle: 'Update Work',
          quickReportsTitle: 'Work Reports',
          quickIssueTitle: 'Report Site Issue',
          quickDeliveryTitle: 'Receive Goods at Site',
          quickEquipmentTitle: 'Request Materials / Tools',
          quickPaymentTitle: 'Request Payment',
          quickMilestoneTitle: 'Submit Milestone Progress',
          quickDailyReportTitle: 'Daily Summary',
          quickReportsHelper: 'Open work update, daily summary, or milestone progress from one place',
          quickIssueHelper: 'Report on-site issues or shortages right away',
          quickDeliveryHelper: 'Log incoming goods and materials received at the site',
          quickEquipmentHelper: 'Request materials or tools needed for work',
          quickPaymentHelper: 'Submit a payment request by task category and work zone',
          quickMilestoneHelper: 'Send milestone progress with photos and notes',
          quickDailyReportHelper: 'Summarize today\'s work, issues, and tomorrow\'s plan',
          quickActivityTitle: 'Requests & Activity',
          quickActivityHelper: 'Review recent requests, updates, and submitted items',
          quickChatTitle: 'Chat',
          quickChatHelper: 'Open the project conversation with the site team',
          workReportsScreenTitle: 'Work Reports',
          workReportsScreenDesc: 'Choose the right report type for the work you need to send from site',
          requestsActivityTitle: 'Requests & Activity',
          requestsActivityDesc: 'See recent requests, activity, and open the most-used worker forms',
          chatScreenTitle: 'Project Chat',
          chatScreenDesc: 'Review the latest conversation and send a message to the project team',
          chatEmpty: 'No chat messages for this project yet',
          chatSendAction: 'Send message',
          chatUnavailable: 'Chat sending is not available on this screen yet',
          editableUpdateAction: 'Update selected option',
          editableSelectedHelper: 'Pick from the list or type a new value to add/update it instantly',
          subcategoryHelper: 'Select the main category first, then choose the subcategory',
          phraseHelper: 'Pick a phrase to fill the note quickly or add a new phrase inline',
          requestItemPlaceholder: 'Main item',
          requestQuantityPlaceholder: 'Quantity',
          requestUnitPlaceholder: 'Unit',
          requestNotePlaceholder: 'Extra details',
          requestPhotoHelper: 'Attach a supporting photo when needed',
          requestSubmitAction: 'Send entry',
          requestRecentTitle: 'Recent entries',
          requestDeliveryScreenTitle: 'Receive Goods at Site',
          requestDeliveryScreenDesc: 'Log incoming goods and materials with the real task category and work area',
          requestEquipmentScreenTitle: 'Request Materials / Tools',
          requestEquipmentScreenDesc: 'Send material or tool requests with the real task category and work area',
          paymentScreenTitle: 'Request Payment',
          paymentScreenDesc: 'Enter amount, task category, and zone before submitting the payment request',
          paymentAmountLabel: 'Amount',
          paymentAmountPlaceholder: 'Enter amount',
          paymentSubmitAction: 'Submit payment request',
          paymentRecentTitle: 'Recent payment requests',
          paymentSaved: 'Payment request submitted',
          milestoneScreenTitle: 'Submit Milestone Progress',
          milestoneScreenDesc: 'Update milestone progress with photos and notes',
          milestoneProgressLabel: 'Progress (%)',
          milestoneProgressPlaceholder: 'Example 45',
          milestoneSubmitAction: 'Submit milestone progress',
          milestoneRecentTitle: 'Recent milestone progress updates',
          milestoneSaved: 'Milestone progress submitted',
          requestSavedDelivery: 'Goods received at site',
          requestSavedEquipment: 'Equipment / tools request sent',
          attachmentPreviewTitle: 'Preview before submit',
          attachmentPreviewEmpty: 'No photos, voice, or note in this set yet',
          attachmentPreviewPhoto: 'Photo',
          attachmentPreviewVoice: 'Voice',
          attachmentPreviewNote: 'Note',
          attachmentPreviewRemove: 'Remove',
          attachmentNoteLabel: 'Short note',
          originalSizeLabel: 'Original file size',
          compressedSizeLabel: 'Compressed size',
        };
  const siteName = currentProject?.name || pickText(t, 'worker_site_name_fallback', 'Project not assigned');
  const today = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState(TAB_HOME);
  const [activeScreen, setActiveScreen] = useState(SCREEN_HOME);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [toast, setToast] = useState('');
  const [validationError, setValidationError] = useState('');
  const [attendanceNote, setAttendanceNote] = useState('');
  const [attendanceOverride, setAttendanceOverride] = useState(null);
  const [busyAction, setBusyAction] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [projectBatchOptions, setProjectBatchOptions] = useState({ workTypes: [], tradeTeams: [], rooms: [] });
  const [isProjectBatchOptionsLoading, setIsProjectBatchOptionsLoading] = useState(false);
  const [workerPresets, setWorkerPresets] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.workerPresets, {
    taskCategories: [],
    subcategories: {},
    areaZones: [],
    standardPhrases: [],
  }));
  const [customTaskCategories, setCustomTaskCategories] = useState(() => workerPresets.taskCategories || []);
  const [customSubcategories, setCustomSubcategories] = useState(() => workerPresets.subcategories || {});
  const [customAreaZones, setCustomAreaZones] = useState(() => workerPresets.areaZones || []);
  const [customStandardPhrases, setCustomStandardPhrases] = useState(() => workerPresets.standardPhrases || []);
  const [openAddField, setOpenAddField] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newWorkSubcategory, setNewWorkSubcategory] = useState('');
  const [newAreaZone, setNewAreaZone] = useState('');
  const [newStandardPhrase, setNewStandardPhrase] = useState('');

  const [localAttendanceRecords, setLocalAttendanceRecords] = useState(() => initialStoredAttendanceRef.current || []);
  const [localPhotoReports, setLocalPhotoReports] = useState(() => initialStoredPhotoReportsRef.current || []);
  const [voiceNotes, setVoiceNotes] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.voiceNotes, []));
  const [issues, setIssues] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.issues, []));
  const [localSiteTickets, setLocalSiteTickets] = useState(() => initialStoredSiteTicketsRef.current || []);
  const [localDailyReports, setLocalDailyReports] = useState(() => initialStoredDailyReportsRef.current || []);
  const [localMaterialRequests, setLocalMaterialRequests] = useState(() => initialStoredMaterialRequestsRef.current || []);
  const [localPaymentRequests, setLocalPaymentRequests] = useState(() => initialStoredPaymentRequestsRef.current || []);
  const [localMilestoneSubmissions, setLocalMilestoneSubmissions] = useState(() => initialStoredMilestonesRef.current || []);
  const [chatDraft, setChatDraft] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatContainerRef = useRef(null);
  const [settings, setSettings] = useState(() => ({ ...DATA_SAVER_DEFAULTS, ...loadFromStorage(WORKER_STORAGE_KEYS.settings, {}) }));
  const [tasks, setTasks] = useState(() => {
    const saved = loadFromStorage(WORKER_STORAGE_KEYS.tasks, []);
    return getWorkerTasks(saved, currentWorker.id, siteName);
  });

  const [photoBatchForm, setPhotoBatchForm] = useState(() => createDefaultPhotoBatchForm(getPreferredProject(projectsList, currentProject)));
  const [issueForm, setIssueForm] = useState(defaultIssueForm);
  const [requestForm, setRequestForm] = useState(defaultRequestForm);
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);
  const [milestoneForm, setMilestoneForm] = useState(defaultMilestoneForm);
  const [ticketFilters, setTicketFilters] = useState({
    search: '',
    projectId: 'all',
    status: 'all',
    priority: 'all',
    assigneeId: 'all',
  });
  const [ticketScreenTab, setTicketScreenTab] = useState('list');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [dailyReportFilters, setDailyReportFilters] = useState({
    search: '',
    projectId: 'all',
    reportDate: '',
  });
  const [dailyReportScreenTab, setDailyReportScreenTab] = useState('list');
  const [selectedDailyReportId, setSelectedDailyReportId] = useState('');
  const [isEditingDailyReport, setIsEditingDailyReport] = useState(false);
  const [requestMode, setRequestMode] = useState('equipment');
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const canRecordVoice = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined';

  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.voiceNotes, voiceNotes), [voiceNotes]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.issues, issues), [issues]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.tasks, tasks), [tasks]);
  useEffect(() => {
    saveToStorage(WORKER_STORAGE_KEYS.workerPresets, {
      taskCategories: customTaskCategories,
      subcategories: customSubcategories,
      areaZones: customAreaZones,
      standardPhrases: customStandardPhrases,
    });
  }, [customAreaZones, customStandardPhrases, customSubcategories, customTaskCategories]);

  useEffect(() => {
    setLocalPhotoReports((current) => current.map(normalizePhotoSubmissionBatch).filter(Boolean));
  }, []);

  useEffect(() => {
    setTasks(getWorkerTasks(loadFromStorage(WORKER_STORAGE_KEYS.tasks, []), currentWorker.id, siteName));
  }, [currentWorker.id, siteName]);

  const attendanceRecords = useMemo(
    () => mergeSyncedRecords(sharedAttendanceRecords, localAttendanceRecords, (items) => Array.isArray(items) ? items : []),
    [sharedAttendanceRecords, localAttendanceRecords]
  );
  const photoReports = useMemo(
    () => mergeSyncedRecords(sharedPhotoReports, localPhotoReports, (items) => (Array.isArray(items) ? items : []).map(normalizePhotoSubmissionBatch).filter(Boolean)),
    [sharedPhotoReports, localPhotoReports]
  );
  const materialRequests = useMemo(
    () => mergeSyncedRecords(sharedMaterialRequests, localMaterialRequests, (items) => Array.isArray(items) ? items : []),
    [sharedMaterialRequests, localMaterialRequests]
  );
  const paymentRequests = useMemo(
    () => mergeSyncedRecords(sharedPaymentRequests, localPaymentRequests, (items) => Array.isArray(items) ? items : []),
    [sharedPaymentRequests, localPaymentRequests]
  );
  const milestoneSubmissions = useMemo(
    () => mergeSyncedRecords(sharedMilestoneSubmissions, localMilestoneSubmissions, (items) => Array.isArray(items) ? items : []),
    [sharedMilestoneSubmissions, localMilestoneSubmissions]
  );
  const siteTickets = useMemo(
    () => mergeSyncedRecords(sharedSiteTickets, localSiteTickets, normalizeSiteTicketList),
    [sharedSiteTickets, localSiteTickets]
  );
  const dailyReports = useMemo(
    () => mergeSyncedRecords(sharedDailyReports, localDailyReports, normalizeDailyReportList),
    [sharedDailyReports, localDailyReports]
  );

  useEffect(() => {
    if (onPersistAttendanceRecord) return undefined;
    saveToStorage(WORKER_STORAGE_KEYS.attendance, localAttendanceRecords);
    return undefined;
  }, [localAttendanceRecords, onPersistAttendanceRecord]);

  useEffect(() => {
    if (onPersistPhotoReport) return undefined;
    saveToStorage(WORKER_STORAGE_KEYS.photoReports, localPhotoReports);
    return undefined;
  }, [localPhotoReports, onPersistPhotoReport]);

  useEffect(() => {
    if (onPersistSiteTicket) return undefined;
    saveToStorage(WORKER_STORAGE_KEYS.siteTickets, localSiteTickets);
    return undefined;
  }, [localSiteTickets, onPersistSiteTicket]);

  useEffect(() => {
    if (onPersistDailyReport) return undefined;
    saveToStorage(WORKER_STORAGE_KEYS.dailyReports, localDailyReports);
    return undefined;
  }, [localDailyReports, onPersistDailyReport]);

  useEffect(() => {
    if (onPersistMaterialRequest) return undefined;
    saveToStorage(WORKER_STORAGE_KEYS.materialRequests, localMaterialRequests);
    return undefined;
  }, [localMaterialRequests, onPersistMaterialRequest]);

  useEffect(() => {
    if (onPersistPaymentRequest) return undefined;
    saveToStorage(WORKER_STORAGE_KEYS.paymentRequests, localPaymentRequests);
    return undefined;
  }, [localPaymentRequests, onPersistPaymentRequest]);

  useEffect(() => {
    if (onPersistMilestoneSubmission) return undefined;
    saveToStorage(WORKER_STORAGE_KEYS.milestoneSubmissions, localMilestoneSubmissions);
    return undefined;
  }, [localMilestoneSubmissions, onPersistMilestoneSubmission]);

  useEffect(() => {
    if (!onPersistSiteTicket) return undefined;

    const bootstrapTickets = normalizeSiteTicketList(initialStoredSiteTicketsRef.current || []);
    if (!bootstrapTickets.length) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(bootstrapTickets.map((ticket) => onPersistSiteTicket(ticket)));
        if (cancelled) return;
        initialStoredSiteTicketsRef.current = [];
        saveToStorage(WORKER_STORAGE_KEYS.siteTickets, []);
        setLocalSiteTickets((current) => {
          const migratedIds = new Set(bootstrapTickets.map((ticket) => String(ticket.id || '')));
          return normalizeSiteTicketList(current).filter((ticket) => !migratedIds.has(String(ticket.id || '')));
        });
      } catch (error) {
        console.error('Failed to migrate stored site tickets:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onPersistSiteTicket]);

  useEffect(() => {
    if (!onPersistDailyReport) return undefined;

    const bootstrapReports = normalizeDailyReportList(initialStoredDailyReportsRef.current || []);
    if (!bootstrapReports.length) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(bootstrapReports.map((report) => onPersistDailyReport(report)));
        if (cancelled) return;
        initialStoredDailyReportsRef.current = [];
        saveToStorage(WORKER_STORAGE_KEYS.dailyReports, []);
        setLocalDailyReports((current) => {
          const migratedIds = new Set(bootstrapReports.map((report) => String(report.id || '')));
          return normalizeDailyReportList(current).filter((report) => !migratedIds.has(String(report.id || '')));
        });
      } catch (error) {
        console.error('Failed to migrate stored daily reports:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onPersistDailyReport]);

  useEffect(() => {
    if (!onPersistAttendanceRecord) return undefined;

    const bootstrapAttendance = Array.isArray(initialStoredAttendanceRef.current) ? initialStoredAttendanceRef.current : [];
    if (!bootstrapAttendance.length) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(bootstrapAttendance.map((record) => onPersistAttendanceRecord(record)));
        if (cancelled) return;
        initialStoredAttendanceRef.current = [];
        saveToStorage(WORKER_STORAGE_KEYS.attendance, []);
        setLocalAttendanceRecords((current) => {
          const migratedIds = new Set(bootstrapAttendance.map((record) => String(record.id || '')));
          return current.filter((record) => !migratedIds.has(String(record.id || '')));
        });
      } catch (error) {
        console.error('Failed to migrate stored attendance records:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onPersistAttendanceRecord]);

  useEffect(() => {
    if (!onPersistPhotoReport) return undefined;

    const bootstrapReports = (Array.isArray(initialStoredPhotoReportsRef.current) ? initialStoredPhotoReportsRef.current : []).map(normalizePhotoSubmissionBatch).filter(Boolean);
    if (!bootstrapReports.length) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(bootstrapReports.map((record) => onPersistPhotoReport(record)));
        if (cancelled) return;
        initialStoredPhotoReportsRef.current = [];
        saveToStorage(WORKER_STORAGE_KEYS.photoReports, []);
        setLocalPhotoReports((current) => {
          const migratedIds = new Set(bootstrapReports.map((record) => String(record.id || '')));
          return current.filter((record) => !migratedIds.has(String(record.id || '')));
        });
      } catch (error) {
        console.error('Failed to migrate stored photo reports:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onPersistPhotoReport]);

  useEffect(() => {
    if (!onPersistMaterialRequest) return undefined;

    const bootstrapRequests = Array.isArray(initialStoredMaterialRequestsRef.current) ? initialStoredMaterialRequestsRef.current : [];
    if (!bootstrapRequests.length) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(bootstrapRequests.map((record) => onPersistMaterialRequest(record)));
        if (cancelled) return;
        initialStoredMaterialRequestsRef.current = [];
        saveToStorage(WORKER_STORAGE_KEYS.materialRequests, []);
        setLocalMaterialRequests((current) => {
          const migratedIds = new Set(bootstrapRequests.map((record) => String(record.id || '')));
          return current.filter((record) => !migratedIds.has(String(record.id || '')));
        });
      } catch (error) {
        console.error('Failed to migrate stored material requests:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onPersistMaterialRequest]);

  useEffect(() => {
    if (!onPersistPaymentRequest) return undefined;

    const bootstrapRequests = Array.isArray(initialStoredPaymentRequestsRef.current) ? initialStoredPaymentRequestsRef.current : [];
    if (!bootstrapRequests.length) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(bootstrapRequests.map((record) => onPersistPaymentRequest(record)));
        if (cancelled) return;
        initialStoredPaymentRequestsRef.current = [];
        saveToStorage(WORKER_STORAGE_KEYS.paymentRequests, []);
        setLocalPaymentRequests((current) => {
          const migratedIds = new Set(bootstrapRequests.map((record) => String(record.id || '')));
          return current.filter((record) => !migratedIds.has(String(record.id || '')));
        });
      } catch (error) {
        console.error('Failed to migrate stored payment requests:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onPersistPaymentRequest]);

  useEffect(() => {
    if (!onPersistMilestoneSubmission) return undefined;

    const bootstrapMilestones = Array.isArray(initialStoredMilestonesRef.current) ? initialStoredMilestonesRef.current : [];
    if (!bootstrapMilestones.length) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all(bootstrapMilestones.map((record) => onPersistMilestoneSubmission(record)));
        if (cancelled) return;
        initialStoredMilestonesRef.current = [];
        saveToStorage(WORKER_STORAGE_KEYS.milestoneSubmissions, []);
        setLocalMilestoneSubmissions((current) => {
          const migratedIds = new Set(bootstrapMilestones.map((record) => String(record.id || '')));
          return current.filter((record) => !migratedIds.has(String(record.id || '')));
        });
      } catch (error) {
        console.error('Failed to migrate stored milestone submissions:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onPersistMilestoneSubmission]);

  useEffect(() => {
    const preferredProject = getPreferredProject(projectsList, currentProject);
    if (!preferredProject?.id) return;
    setPhotoBatchForm((current) => {
      if (current.projectId) return current;
      return {
        ...current,
        projectId: String(preferredProject.id),
        projectName: preferredProject.name || '',
      };
    });
  }, [currentProject, projectsList]);

  useEffect(() => {
    if (!photoBatchForm.projectId) {
      setProjectBatchOptions({ workTypes: [], tradeTeams: [], rooms: [] });
      return undefined;
    }

    setIsProjectBatchOptionsLoading(true);
    const selectedProject = projectsList.find((project) => String(project.id) === String(photoBatchForm.projectId));
    const configKey = getProjectBatchConfigKey(selectedProject);
    const timeout = window.setTimeout(() => {
      const config = PROJECT_BATCH_LIBRARY[configKey] || PROJECT_BATCH_LIBRARY.default;
      setProjectBatchOptions({
        workTypes: normalizeProjectOptions(config.workTypes, language),
        tradeTeams: normalizeProjectOptions(config.tradeTeams, language),
        rooms: normalizeProjectOptions(config.rooms, language),
      });
      setIsProjectBatchOptionsLoading(false);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [language, photoBatchForm.projectId, projectsList]);

  useEffect(() => {
    setPhotoBatchForm((current) => {
      const selectionDefaults = resolveBatchSelectionDefaults(
        current,
        projectBatchOptions,
        getProjectNameById(projectsList, current.projectId)
      );

      if (
        selectionDefaults.projectName === current.projectName
        && selectionDefaults.workType === current.workType
        && selectionDefaults.tradeTeam === current.tradeTeam
        && selectionDefaults.roomId === current.roomId
        && selectionDefaults.roomName === current.roomName
        && selectionDefaults.taskCategory === current.taskCategory
        && selectionDefaults.areaZone === current.areaZone
      ) {
        return current;
      }

      return {
        ...current,
        ...selectionDefaults,
      };
    });
  }, [
    photoBatchForm.areaZone,
    photoBatchForm.projectId,
    photoBatchForm.projectName,
    photoBatchForm.roomId,
    photoBatchForm.roomName,
    photoBatchForm.taskCategory,
    photoBatchForm.tradeTeam,
    photoBatchForm.workType,
    projectBatchOptions,
    projectsList,
  ]);

  useEffect(() => {
    setAttendanceOverride(null);
  }, [attendanceRecords]);

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
  const roleVisibleTickets = useMemo(
    () => getVisibleSiteTickets(siteTickets, {
      role: currentWorker.role,
      currentUserId: currentWorker.id,
      projectId: currentWorker.assignedSiteId || currentProject?.id || '',
    }),
    [currentProject?.id, currentWorker.assignedSiteId, currentWorker.id, currentWorker.role, siteTickets]
  );
  const filteredSiteTickets = useMemo(
    () => sortSiteTickets(filterSiteTickets(roleVisibleTickets, ticketFilters)),
    [roleVisibleTickets, ticketFilters]
  );
  const ticketSummary = useMemo(() => getSiteTicketSummaryCounts(roleVisibleTickets), [roleVisibleTickets]);
  const selectedSiteTicket = useMemo(
    () => roleVisibleTickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [roleVisibleTickets, selectedTicketId]
  );
  const roleVisibleDailyReports = useMemo(
    () => getVisibleDailyReports(dailyReports, {
      role: currentWorker.role,
      currentUserId: currentWorker.id,
      projectId: currentWorker.assignedSiteId || currentProject?.id || '',
    }),
    [currentProject?.id, currentWorker.assignedSiteId, currentWorker.id, currentWorker.role, dailyReports]
  );
  const filteredDailyReports = useMemo(
    () => sortDailyReports(filterDailyReports(roleVisibleDailyReports, dailyReportFilters)),
    [roleVisibleDailyReports, dailyReportFilters]
  );
  const dailyReportSummary = useMemo(() => getDailyReportSummaryCounts(roleVisibleDailyReports), [roleVisibleDailyReports]);
  const selectedDailyReport = useMemo(
    () => roleVisibleDailyReports.find((report) => report.id === selectedDailyReportId) || null,
    [roleVisibleDailyReports, selectedDailyReportId]
  );
  const latestRequests = useMemo(
    () => materialRequests.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [materialRequests, currentWorker.id]
  );
  const latestPaymentRequests = useMemo(
    () => paymentRequests.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [paymentRequests, currentWorker.id]
  );
  const latestMilestones = useMemo(
    () => milestoneSubmissions.filter((entry) => entry.workerId === currentWorker.id).slice(-4).reverse(),
    [milestoneSubmissions, currentWorker.id]
  );
  const latestDailyReports = useMemo(
    () => roleVisibleDailyReports.slice(0, 4),
    [roleVisibleDailyReports]
  );
  const projectChatMessages = useMemo(
    () => (Array.isArray(sharedChats) ? sharedChats : [])
      .filter((entry) => String(entry?.projectId || '') === String(currentWorker.assignedSiteId || currentProject?.id || ''))
      .sort((left, right) => Number(left?.createdAt || 0) - Number(right?.createdAt || 0)),
    [currentProject?.id, currentWorker.assignedSiteId, sharedChats]
  );
  const workTypeOptions = useMemo(() => projectBatchOptions.workTypes, [projectBatchOptions.workTypes]);
  const tradeTeamOptions = useMemo(
    () => projectBatchOptions.tradeTeams.filter((option) => !photoBatchForm.workType || option.workTypes?.includes(photoBatchForm.workType)),
    [photoBatchForm.workType, projectBatchOptions.tradeTeams]
  );
  const roomOptions = useMemo(
    () => projectBatchOptions.rooms.filter((option) => {
      const matchesWorkType = !photoBatchForm.workType || option.workTypes?.includes(photoBatchForm.workType);
      const matchesTrade = !photoBatchForm.tradeTeam || option.tradeTeams?.includes(photoBatchForm.tradeTeam);
      return matchesWorkType && matchesTrade;
    }),
    [photoBatchForm.tradeTeam, photoBatchForm.workType, projectBatchOptions.rooms]
  );
  const taskCategoryOptions = useMemo(() => {
    const projectCategories = workTypeOptions.map((option) => option.label).filter(Boolean);
    return mergeOptionLists(customTaskCategories, getLocalizedConstructionTaskCategoryOptions(language), projectCategories);
  }, [customTaskCategories, language, workTypeOptions]);
  const workSubcategoryOptions = useMemo(() => mergeOptionLists(
    customSubcategories[photoBatchForm.taskCategory] || [],
    getLocalizedConstructionSubcategoryOptions(photoBatchForm.taskCategory, language)
  ), [customSubcategories, language, photoBatchForm.taskCategory]);
  const areaZoneOptions = useMemo(() => {
    const projectAreas = roomOptions.map((option) => option.label).filter(Boolean);
    return mergeOptionLists(customAreaZones, getLocalizedConstructionAreaZoneOptions(language), projectAreas);
  }, [customAreaZones, language, roomOptions]);
  const standardPhraseOptions = useMemo(
    () => mergeOptionLists(customStandardPhrases, getLocalizedStandardConstructionPhraseOptions(language)),
    [customStandardPhrases, language]
  );
  const siteTicketLabels = useMemo(() => getSiteTicketCopy(language), [language]);
  const ticketStatusOptions = useMemo(
    () => [{ value: 'all', label: siteTicketLabels.filterAll }, ...getSiteTicketStatusOptions(language)],
    [language, siteTicketLabels.filterAll]
  );
  const ticketPriorityOptions = useMemo(
    () => [{ value: 'all', label: siteTicketLabels.filterAll }, ...getSiteTicketPriorityOptions(language)],
    [language, siteTicketLabels.filterAll]
  );
  const siteTicketProjectOptions = useMemo(() => [
    { value: 'all', label: siteTicketLabels.filterAll },
    ...projectsList.map((project) => ({ value: String(project.id), label: project.name || String(project.id) })),
  ], [projectsList, siteTicketLabels.filterAll]);
  const siteTicketProjectFormOptions = useMemo(
    () => projectsList.map((project) => ({ value: String(project.id), label: project.name || String(project.id) })),
    [projectsList]
  );
  const siteTicketAssigneeOptions = useMemo(
    () => workersList
      .map((worker) => ({
        value: String(worker.id || ''),
        label: worker.name || worker.companyName || '',
      }))
      .filter((item) => item.value && item.label),
    [workersList]
  );
  const siteTicketAssigneeFilterOptions = useMemo(
    () => [{ value: 'all', label: siteTicketLabels.filterAll }, ...siteTicketAssigneeOptions],
    [siteTicketAssigneeOptions, siteTicketLabels.filterAll]
  );
  const dailyReportLabels = useMemo(() => getDailyReportCopy(language), [language]);
  const dailyReportProjectOptions = useMemo(() => [
    { value: 'all', label: dailyReportLabels.filterAll },
    ...projectsList.map((project) => ({ value: String(project.id), label: project.name || String(project.id) })),
  ], [dailyReportLabels.filterAll, projectsList]);
  const dailyReportProjectFormOptions = useMemo(
    () => projectsList.map((project) => ({ value: String(project.id), label: project.name || String(project.id) })),
    [projectsList]
  );
  const createTicketForm = useSiteTicketForm({
    initialProjectId: currentProject?.id ? String(currentProject.id) : '',
    initialProjectName: currentProject?.name || siteName,
    currentUser: currentWorker,
  });
  const editTicketForm = useSiteTicketForm({
    initialProjectId: currentProject?.id ? String(currentProject.id) : '',
    initialProjectName: currentProject?.name || siteName,
    currentUser: currentWorker,
    initialTicket: selectedSiteTicket,
  });
  const createDailyReportForm = useDailyReportForm({
    initialProjectId: currentProject?.id ? String(currentProject.id) : '',
    initialProjectName: currentProject?.name || siteName,
    currentUser: currentWorker,
    initialReportDate: today,
  });
  const editDailyReportForm = useDailyReportForm({
    initialProjectId: currentProject?.id ? String(currentProject.id) : '',
    initialProjectName: currentProject?.name || siteName,
    currentUser: currentWorker,
    initialReportDate: today,
    initialReport: selectedDailyReport,
  });

  useEffect(() => {
    setPhotoBatchForm((current) => {
      const nextTaskCategory = taskCategoryOptions.includes(current.taskCategory)
        ? current.taskCategory
        : (taskCategoryOptions[0] || '');
      const nextSubcategoryOptions = mergeOptionLists(
        customSubcategories[nextTaskCategory] || [],
        getLocalizedConstructionSubcategoryOptions(nextTaskCategory, language)
      );
      const nextWorkSubcategory = nextSubcategoryOptions.includes(current.workSubcategory)
        ? current.workSubcategory
        : (nextSubcategoryOptions[0] || '');

      if (nextTaskCategory === current.taskCategory && nextWorkSubcategory === current.workSubcategory) {
        return current;
      }

      return {
        ...current,
        taskCategory: nextTaskCategory,
        workSubcategory: nextWorkSubcategory,
      };
    });
  }, [customSubcategories, language, taskCategoryOptions]);

  const effectiveAttendance = attendanceOverride || todayAttendance;
  const isCheckedIn = Boolean(effectiveAttendance.checkIn);
  const isCheckedOut = Boolean(effectiveAttendance.checkOut);
  const canUseWorkActions = isCheckedIn && !isCheckedOut;
  const hasBatchRoomSelection = Boolean(photoBatchForm.areaZone || photoBatchForm.roomId);
  const canOpenWorkerTools = canUseWorkActions && hasBatchRoomSelection && !isProjectBatchOptionsLoading;
  const todayPhotoCount = photoReports
    .filter((entry) => entry.workerId === currentWorker.id && entry.dateKey === today)
    .reduce((total, entry) => total + Number(entry.photoCount || entry.photos?.length || 0), 0);
  const todayBatchCount = photoReports
    .filter((entry) => entry.workerId === currentWorker.id && entry.dateKey === today)
    .length;
  const todayVoiceCount = latestVoiceNotes.filter((entry) => entry.dateKey === today).length;
  const todayIssueCount = latestIssues.filter((entry) => entry.dateKey === today).length;
  const todayDeliveryCount = latestRequests.filter((entry) => entry.dateKey === today && entry.requestType === 'delivery').length;
  const todayEquipmentCount = latestRequests.filter((entry) => entry.dateKey === today && entry.requestType !== 'delivery').length;
  const todayPaymentCount = latestPaymentRequests.filter((entry) => entry.dateKey === today).length;
  const todayMilestoneCount = latestMilestones.filter((entry) => entry.dateKey === today).length;
  const todayDailyReportCount = roleVisibleDailyReports.filter((entry) => entry.reportDate === today).length;
  const todayStatus = isCheckedOut ? localCopy.checkedOut : isCheckedIn ? localCopy.working : localCopy.notCheckedIn;
  const isDeliveryMode = requestMode === 'delivery';
  const requestScreenTitle = isDeliveryMode ? localCopy.requestDeliveryScreenTitle : localCopy.requestEquipmentScreenTitle;
  const requestScreenDesc = isDeliveryMode ? localCopy.requestDeliveryScreenDesc : localCopy.requestEquipmentScreenDesc;
  const requestSubmitLabel = localCopy.requestSubmitAction;
  const requestRecentItems = latestRequests.filter((entry) => (isDeliveryMode ? entry.requestType === 'delivery' : entry.requestType !== 'delivery'));

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
      title: entry.batchTitle || pickText(t, 'worker_photo', 'Upload Photo'),
      detail: `${entry.projectName || siteName} • ${entry.roomName || '-'} • ${formatDateTime(entry.submittedAt, locale)}`,
      status: entry.status,
      imageData: entry.photos?.[0]?.imageData || '',
      audioData: entry.voiceNote?.audioData || '',
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
        title: entry.requestType === 'delivery' ? localCopy.quickDeliveryTitle : localCopy.quickEquipmentTitle,
        detail: `${entry.itemName} • ${entry.quantity} ${entry.unit} • ${entry.areaZone || '-'} • ${formatDateTime(entry.requestedAt, locale)}`,
        status: entry.status,
        imageData: entry.imageData,
        audioData: '',
        timestamp: entry.requestedAt,
      }));

    const paymentItems = latestPaymentRequests.map((entry) => ({
      id: entry.id,
      type: 'payment',
      title: localCopy.quickPaymentTitle,
      detail: `${entry.amount} • ${entry.taskCategory || '-'} • ${formatDateTime(entry.requestedAt, locale)}`,
      status: entry.status,
      imageData: '',
      audioData: '',
      timestamp: entry.requestedAt,
    }));

    const milestoneItems = latestMilestones.map((entry) => ({
      id: entry.id,
      type: 'milestone',
      title: localCopy.quickMilestoneTitle,
      detail: `${entry.progress}% • ${entry.areaZone || '-'} • ${formatDateTime(entry.submittedAt, locale)}`,
      status: entry.status,
      imageData: entry.photos?.[0]?.imageData || '',
      audioData: '',
      timestamp: entry.submittedAt,
    }));

    return [...attendanceItems, ...photoItems, ...voiceItems, ...issueItems, ...requestItems, ...paymentItems, ...milestoneItems]
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .slice(0, 12);
  }, [attendanceRecords, currentWorker.id, latestDailyReports, latestIssues, latestMilestones, latestPaymentRequests, latestPhotoReports, latestRequests, latestVoiceNotes, locale, localCopy.quickDailyReportTitle, localCopy.quickMilestoneTitle, localCopy.quickPaymentTitle, localCopy.voiceSaved, siteName, t]);

  const pendingItems = [
    ...latestPhotoReports.filter((entry) => entry.status === 'draft').map((entry) => ({ id: entry.id, label: `${pickText(t, 'worker_photo', 'Photo')} • ${entry.batchTitle || entry.workType}` })),
    ...latestRequests.filter((entry) => entry.status === 'pending').map((entry) => ({ id: entry.id, label: `${entry.requestType === 'delivery' ? localCopy.quickDeliveryTitle : localCopy.quickEquipmentTitle} • ${entry.itemName}` })),
    ...latestPaymentRequests.filter((entry) => entry.status === 'pending').map((entry) => ({ id: entry.id, label: `${localCopy.quickPaymentTitle} • ${entry.amount}` })),
    ...latestMilestones.filter((entry) => entry.status !== 'submitted').map((entry) => ({ id: entry.id, label: `${localCopy.quickMilestoneTitle} • ${entry.progress}%` })),
    ...latestIssues.filter((entry) => entry.status === 'open').map((entry) => ({ id: entry.id, label: `${pickText(t, 'worker_sos', 'SOS')} • ${entry.category}` })),
    ...tasks.filter((entry) => entry.status !== TASK_STATUS.completed).map((entry) => ({ id: entry.id, label: pickText(t, `worker_task_title_${entry.title}`, entry.title) })),
  ].slice(0, 4);

  const latestNotifications = [
    { id: 'attendance', title: todayStatus },
    { id: 'photos', title: latestPhotoReports[0] ? `${pickText(t, 'worker_photo', 'Photo')} • ${latestPhotoReports[0].batchTitle || latestPhotoReports[0].workType}` : pickText(t, 'worker_notification_sync', 'Offline data has been safely saved') },
    { id: 'requests', title: latestPaymentRequests[0] ? `${localCopy.quickPaymentTitle} • ${latestPaymentRequests[0].amount}` : latestRequests[0] ? `${latestRequests[0].requestType === 'delivery' ? localCopy.quickDeliveryTitle : localCopy.quickEquipmentTitle} • ${latestRequests[0].itemName}` : isCheckedOut ? localCopy.doneHelper : isCheckedIn ? localCopy.readyHelper : localCopy.gateHelper },
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

  const openRequestScreen = (mode) => {
    const nextMode = mode === 'delivery' ? 'delivery' : 'equipment';
    setRequestMode(nextMode);
    setRequestForm((current) => ({
      ...current,
      requestType: nextMode,
      taskCategory: current.taskCategory || photoBatchForm.taskCategory,
      areaZone: current.areaZone || photoBatchForm.areaZone,
    }));
    openScreen(nextMode === 'delivery' ? SCREEN_DELIVERY : SCREEN_REQUEST);
  };

  const openPaymentScreen = () => {
    setPaymentForm((current) => ({
      ...current,
      taskCategory: current.taskCategory || photoBatchForm.taskCategory,
      areaZone: current.areaZone || photoBatchForm.areaZone,
    }));
    openScreen(SCREEN_PAYMENT);
  };

  const openMilestoneScreen = () => {
    setMilestoneForm((current) => ({
      ...current,
      taskCategory: current.taskCategory || photoBatchForm.taskCategory,
      areaZone: current.areaZone || photoBatchForm.areaZone,
    }));
    openScreen(SCREEN_MILESTONE);
  };

  const pushToast = (messageKey, fallback) => setToast(localCopy[messageKey] || pickText(t, messageKey, fallback));

  useEffect(() => {
    if ((activeScreen === SCREEN_CHAT || activeTab === TAB_CHAT) && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeScreen, activeTab, projectChatMessages]);

  const handleSendChatMessage = async () => {
    const text = String(chatDraft || '').trim();
    if (!text) return;
    setChatError('');
    if (!currentWorker.assignedSiteId && !currentProject?.id) {
      setChatError(localCopy.chatUnavailable);
      return;
    }
    if (typeof onPersistChatMessage !== 'function') {
      setChatError(localCopy.chatUnavailable);
      return;
    }

    setChatBusy(true);
    try {
      await onPersistChatMessage({
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sender: currentWorker.name,
        senderRole: 'worker',
        text,
        audioUrl: '',
        projectId: String(currentWorker.assignedSiteId || currentProject?.id || ''),
        time: formatTime(Date.now(), locale),
        createdAt: Date.now(),
      });
      setChatDraft('');
    } catch (error) {
      setChatError(String(error?.message || localCopy.chatUnavailable));
    } finally {
      setChatBusy(false);
    }
  };

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
    if (type === 'checkin' && effectiveAttendance.checkIn) {
      setValidationError(pickText(t, 'worker_validation_checkin_exists', 'Check-in already recorded today'));
      return;
    }
    if (type === 'checkout' && !effectiveAttendance.checkIn) {
      setValidationError(pickText(t, 'worker_validation_checkout_requires_checkin', 'Check in first before checking out'));
      return;
    }
    if (type === 'checkout' && effectiveAttendance.checkOut) {
      setValidationError(pickText(t, 'worker_validation_checkout_exists', 'Check-out already recorded today'));
      return;
    }

    const optimisticTimestamp = Date.now();
    setAttendanceOverride({
      ...effectiveAttendance,
      checkIn: type === 'checkin' ? { timestamp: optimisticTimestamp } : effectiveAttendance.checkIn,
      checkOut: type === 'checkout' ? { timestamp: optimisticTimestamp } : effectiveAttendance.checkOut,
    });

    await withBusyAction(type, async () => {
      await wait(420);
      const record = createAttendanceRecord({
        workerId: currentWorker.id,
        workerName: currentWorker.name,
        siteName,
        projectId: currentProject?.id ? String(currentProject.id) : '',
        type,
        note: attendanceNote,
      });
      setLocalAttendanceRecords((current) => [...current.filter((item) => item.id !== record.id), record]);
      Promise.resolve(onPersistAttendanceRecord?.(record)).catch((error) => {
        console.error('Failed to persist attendance record:', error);
      });
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

  const handleBatchProjectChange = (projectId) => {
    setPhotoBatchForm((current) => ({
      ...current,
      projectId,
      projectName: getProjectNameById(projectsList, projectId),
      taskCategory: '',
      areaZone: '',
      workType: '',
      tradeTeam: '',
      roomId: '',
      roomName: '',
      status: 'draft',
    }));
  };

  const handleBatchOptionChange = (field, value) => {
    setPhotoBatchForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'workType'
        ? { taskCategory: getOptionLabel(workTypeOptions, value), tradeTeam: '', roomId: '', roomName: '', areaZone: '' }
        : field === 'tradeTeam'
          ? { roomId: '', roomName: '', areaZone: '' }
          : field === 'roomId'
            ? { roomName: getOptionLabel(roomOptions, value), areaZone: getOptionLabel(roomOptions, value) }
            : {}),
      status: 'draft',
    }));
  };

  const handleTaskCategoryChange = (value) => {
    const nextValue = value.trimStart();
    setPhotoBatchForm((current) => ({
      ...current,
      taskCategory: nextValue,
      workSubcategory: mergeOptionLists(
        customSubcategories[nextValue] || [],
        getLocalizedConstructionSubcategoryOptions(nextValue, language)
      )[0] || '',
      status: 'draft',
    }));
    setRequestForm((current) => ({ ...current, taskCategory: nextValue }));
    setPaymentForm((current) => ({ ...current, taskCategory: nextValue }));
    setMilestoneForm((current) => ({ ...current, taskCategory: nextValue }));
  };

  const handleWorkSubcategoryChange = (value) => {
    const nextValue = value.trimStart();
    setPhotoBatchForm((current) => ({
      ...current,
      workSubcategory: nextValue,
      status: 'draft',
    }));
  };

  const handleAreaZoneChange = (value) => {
    const nextValue = value.trimStart();
    setPhotoBatchForm((current) => ({
      ...current,
      areaZone: nextValue,
      roomId: nextValue,
      roomName: nextValue,
      status: 'draft',
    }));
    setRequestForm((current) => ({ ...current, areaZone: nextValue }));
    setPaymentForm((current) => ({ ...current, areaZone: nextValue }));
    setMilestoneForm((current) => ({ ...current, areaZone: nextValue }));
  };

  const toggleCompactAdd = (fieldId) => {
    setOpenAddField((current) => current === fieldId ? '' : fieldId);
  };

  const addTaskCategoryOption = (onSelect = handleTaskCategoryChange) => {
    const nextValue = newTaskCategory.trim();
    if (!nextValue) return;
    setCustomTaskCategories((current) => prependUniqueOption(current, nextValue));
    setCustomSubcategories((current) => (current[nextValue] ? current : { ...current, [nextValue]: [] }));
    onSelect(nextValue);
    setNewTaskCategory('');
    setOpenAddField('');
  };

  const addWorkSubcategoryOption = () => {
    const nextValue = newWorkSubcategory.trim();
    const categoryKey = photoBatchForm.taskCategory.trim();
    if (!nextValue || !categoryKey) return;
    setCustomSubcategories((current) => ({
      ...current,
      [categoryKey]: prependUniqueOption(current[categoryKey] || [], nextValue),
    }));
    handleWorkSubcategoryChange(nextValue);
    setNewWorkSubcategory('');
    setOpenAddField('');
  };

  const addAreaZoneOption = (onSelect = handleAreaZoneChange) => {
    const nextValue = newAreaZone.trim();
    if (!nextValue) return;
    setCustomAreaZones((current) => prependUniqueOption(current, nextValue));
    onSelect(nextValue);
    setNewAreaZone('');
    setOpenAddField('');
  };

  const applyStandardPhrase = (setter, value, textField = 'note') => {
    setter((current) => ({
      ...current,
      standardPhrase: value,
      [textField]: value,
      ...('status' in current ? { status: 'draft' } : {}),
    }));
  };

  const addStandardPhraseOption = (setter, textField = 'note') => {
    const nextValue = newStandardPhrase.trim();
    if (!nextValue) return;
    setCustomStandardPhrases((current) => prependUniqueOption(current, nextValue));
    applyStandardPhrase(setter, nextValue, textField);
    setNewStandardPhrase('');
    setOpenAddField('');
  };

  const resetPhotoBatchForm = () => {
    setPhotoBatchForm(createDefaultPhotoBatchForm(getPreferredProject(projectsList, currentProject)));
  };

  const submitPhotoBatch = async (nextStatus) => {
    setValidationError('');
    if (!canUseWorkActions) {
      setValidationError(localCopy.gateHelper);
      return;
    }

    if (!photoBatchForm.projectId || !photoBatchForm.taskCategory || !photoBatchForm.areaZone) {
      setValidationError(pickText(t, 'worker_validation_required', 'Please complete required fields'));
      return;
    }

    if (nextStatus === 'submitted' && !photoBatchForm.photos.length) {
      setValidationError(localCopy.batchPhotoRequired);
      return;
    }

    const timestamp = Date.now();
    const projectName = photoBatchForm.projectName || getProjectNameById(projectsList, photoBatchForm.projectId) || siteName;
    const workTypeLabel = photoBatchForm.taskCategory.trim() || getOptionLabel(workTypeOptions, photoBatchForm.workType);
    const roomName = photoBatchForm.areaZone.trim() || photoBatchForm.roomName || getOptionLabel(roomOptions, photoBatchForm.roomId);
    const tradeTeamName = photoBatchForm.tradeTeam || 'General Crew';
    const batchTitle = photoBatchForm.batchTitle.trim() || `${localCopy.batchTitleAuto} • ${workTypeLabel}`;

    await withBusyAction(nextStatus === 'draft' ? 'photo-draft' : 'photo-submit', async () => {
      const record = createPhotoSubmissionBatch({
        workerId: currentWorker.id,
        workerName: currentWorker.name,
        projectId: photoBatchForm.projectId,
        projectName,
        workType: workTypeLabel,
        workSubcategory: photoBatchForm.workSubcategory,
        tradeTeam: tradeTeamName,
        roomId: photoBatchForm.roomId || roomName,
        roomName,
        batchTitle,
        notes: photoBatchForm.notes.trim(),
        photos: photoBatchForm.photos.map((photo) => ({
          id: photo.id,
          imageData: photo.imageData,
          imageMeta: photo.imageStats || {},
          originalName: photo.originalName || '',
          capturedAt: photo.capturedAt || timestamp,
        })),
        voiceNote: photoBatchForm.voiceNote,
        status: nextStatus,
        timestamp,
      });
      setLocalPhotoReports((current) => [...current.filter((item) => item.id !== record.id), record]);
      Promise.resolve(onPersistPhotoReport?.(record)).catch((error) => {
        console.error('Failed to persist photo report:', error);
      });
      resetPhotoBatchForm();
      setToast(nextStatus === 'draft' ? localCopy.photoBatchSaved : localCopy.photoBatchSubmitted);
    });
  };

  const openTicketCreate = () => {
    createTicketForm.reset({
      projectId: currentProject?.id ? String(currentProject.id) : '',
      projectName: currentProject?.name || siteName,
    });
    setIsEditingTicket(false);
    setSelectedTicketId('');
    setTicketScreenTab('create');
  };

  const openTicketDetail = (ticketId) => {
    setSelectedTicketId(ticketId);
    setIsEditingTicket(false);
    setTicketScreenTab('detail');
  };

  const handleTicketFilterChange = (key, value) => {
    setTicketFilters((current) => ({ ...current, [key]: value }));
  };

  const submitSiteTicket = () => {
    setValidationError('');
    if (!createTicketForm.validate()) {
      setValidationError(siteTicketLabels.validationRequired);
      return;
    }

    const record = createSiteTicketFromForm({
      form: createTicketForm.form,
      currentUser: currentWorker,
    });

    const legacyRecord = createIssueReport({
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      siteName: record.projectName || siteName,
      category: record.category,
      urgency: record.priority,
      detail: record.description,
      imageData: record.attachments.find((item) => item.kind === 'photo')?.imageData || '',
      status: 'open',
    });

    setLocalSiteTickets((current) => [record, ...current.filter((ticket) => ticket.id !== record.id)]);
    Promise.resolve(onPersistSiteTicket?.(record)).catch((error) => {
      console.error('Failed to persist site ticket:', error);
    });
    setIssues((current) => [legacyRecord, ...current]);
    setSelectedTicketId(record.id);
    setTicketScreenTab('detail');
    createTicketForm.reset({
      projectId: currentProject?.id ? String(currentProject.id) : '',
      projectName: currentProject?.name || siteName,
    });
    setToast(siteTicketLabels.ticketSaved);
  };

  const startTicketEdit = () => {
    if (!selectedSiteTicket || !canEditSiteTicket(currentWorker.role)) return;
    setIsEditingTicket(true);
    setTicketScreenTab('detail');
  };

  const updateSiteTicket = () => {
    setValidationError('');
    if (!selectedSiteTicket) return;
    if (!editTicketForm.validate()) {
      setValidationError(siteTicketLabels.validationRequired);
      return;
    }

    const updated = updateSiteTicketFromForm(selectedSiteTicket, {
      form: editTicketForm.form,
      actor: currentWorker,
    });

    setLocalSiteTickets((current) => current.map((ticket) => (
      ticket.id === updated.id ? updated : ticket
    )));
    Promise.resolve(onPersistSiteTicket?.(updated)).catch((error) => {
      console.error('Failed to persist site ticket update:', error);
    });
    setIsEditingTicket(false);
    setSelectedTicketId(updated.id);
    setToast(siteTicketLabels.ticketUpdated);
  };

  const openDailyReportCreate = () => {
    createDailyReportForm.reset({
      projectId: currentProject?.id ? String(currentProject.id) : '',
      projectName: currentProject?.name || siteName,
      reportDate: today,
    });
    setIsEditingDailyReport(false);
    setSelectedDailyReportId('');
    setDailyReportScreenTab('create');
  };

  const openDailyReportDetail = (reportId) => {
    setSelectedDailyReportId(reportId);
    setIsEditingDailyReport(false);
    setDailyReportScreenTab('detail');
  };

  const handleDailyReportFilterChange = (key, value) => {
    setDailyReportFilters((current) => ({ ...current, [key]: value }));
  };

  const startDailyReportEdit = () => {
    if (!selectedDailyReport || !canEditDailyReport(currentWorker.role)) return;
    setIsEditingDailyReport(true);
    setDailyReportScreenTab('detail');
  };

  const submitDailyReport = () => {
    setValidationError('');
    if (!createDailyReportForm.validate()) {
      setValidationError(dailyReportLabels.validationRequired);
      return;
    }

    const record = createDailyReportFromForm({
      form: createDailyReportForm.form,
      currentUser: currentWorker,
      relatedTickets: roleVisibleTickets,
    });
    const storageRecord = createDailyReportRecord({
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      siteName,
      projectId: record.projectId,
      projectName: record.projectName,
      reportDate: record.reportDate,
      area: record.area,
      workSummary: record.workSummary,
      workerCount: record.workerCount,
      materialSummary: record.materialSummary,
      issueSummary: record.issueSummary,
      tomorrowPlan: record.tomorrowPlan,
      attachments: record.attachments,
      relatedTicketIds: record.relatedTicketIds,
      ticketSnapshot: record.ticketSnapshot,
    });

    const nextReport = {
      ...record,
      id: storageRecord.id,
      createdAt: storageRecord.createdAt,
      updatedAt: storageRecord.updatedAt,
    };

    setLocalDailyReports((current) => [nextReport, ...current.filter((report) => report.id !== nextReport.id)]);
    Promise.resolve(onPersistDailyReport?.(nextReport)).catch((error) => {
      console.error('Failed to persist daily report:', error);
    });
    setSelectedDailyReportId(nextReport.id);
    setDailyReportScreenTab('detail');
    createDailyReportForm.reset({
      projectId: currentProject?.id ? String(currentProject.id) : '',
      projectName: currentProject?.name || siteName,
      reportDate: today,
    });
    setToast(dailyReportLabels.reportSaved);
  };

  const updateDailyReport = () => {
    setValidationError('');
    if (!selectedDailyReport) return;
    if (!editDailyReportForm.validate()) {
      setValidationError(dailyReportLabels.validationRequired);
      return;
    }

    const updated = updateDailyReportFromForm(selectedDailyReport, {
      form: editDailyReportForm.form,
      actor: currentWorker,
      relatedTickets: roleVisibleTickets,
    });

    setLocalDailyReports((current) => current.map((report) => (
      report.id === updated.id ? updated : report
    )));
    Promise.resolve(onPersistDailyReport?.(updated)).catch((error) => {
      console.error('Failed to persist daily report update:', error);
    });
    setIsEditingDailyReport(false);
    setSelectedDailyReportId(updated.id);
    setToast(dailyReportLabels.reportUpdated);
  };

  const submitRequest = () => {
    setValidationError('');
    if (
      !requestForm.itemName
      || !requestForm.quantity
      || Number(requestForm.quantity) <= 0
      || !requestForm.unit
      || !requestForm.taskCategory
      || !requestForm.areaZone
    ) {
      setValidationError(pickText(t, 'worker_validation_material_quantity', 'Enter a valid quantity'));
      return;
    }

    const record = createMaterialRequest({
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      siteName,
      projectId: currentProject?.id ? String(currentProject.id) : '',
      itemName: requestForm.itemName,
      quantity: Number(requestForm.quantity),
      unit: requestForm.unit,
      note: requestForm.note,
      imageData: requestForm.imageData,
      requestType: requestMode,
      taskCategory: requestForm.taskCategory,
      areaZone: requestForm.areaZone,
      projectName: photoBatchForm.projectName || siteName,
      status: 'pending',
    });

    const nextRequest = {
      ...record,
      title: `${requestMode === 'delivery' ? localCopy.quickDeliveryTitle : localCopy.quickEquipmentTitle}: ${String(requestForm.itemName || '').trim().slice(0, 40)}`,
      requestedBy: currentWorker.name,
      itemsListText: `${requestForm.itemName} x${requestForm.quantity} ${requestForm.unit}${requestForm.note ? `\n${requestForm.note}` : ''}`,
      photoUrl: requestForm.imageData || '',
      date: record.dateKey,
    };

    setLocalMaterialRequests((current) => [...current.filter((item) => item.id !== nextRequest.id), nextRequest]);
    Promise.resolve(onPersistMaterialRequest?.(nextRequest)).catch((error) => {
      console.error('Failed to persist material request:', error);
    });
    setRequestForm((current) => ({
      ...defaultRequestForm,
      requestType: requestMode,
      taskCategory: current.taskCategory,
      areaZone: current.areaZone,
    }));
    setToast(isDeliveryMode ? localCopy.requestSavedDelivery : localCopy.requestSavedEquipment);
  };

  const submitPaymentRequest = () => {
    setValidationError('');
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0 || !paymentForm.taskCategory || !paymentForm.areaZone) {
      setValidationError(pickText(t, 'worker_validation_required', 'Please complete required fields'));
      return;
    }

    const record = createPaymentRequest({
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      siteName,
      projectId: currentProject?.id ? String(currentProject.id) : '',
      projectName: photoBatchForm.projectName || siteName,
      amount: Number(paymentForm.amount),
      taskCategory: paymentForm.taskCategory,
      areaZone: paymentForm.areaZone,
      note: paymentForm.note,
    });

    setLocalPaymentRequests((current) => [...current.filter((item) => item.id !== record.id), record]);
    Promise.resolve(onPersistPaymentRequest?.(record)).catch((error) => {
      console.error('Failed to persist payment request:', error);
    });
    setPaymentForm((current) => ({
      ...defaultPaymentForm,
      taskCategory: current.taskCategory,
      areaZone: current.areaZone,
    }));
    setToast(localCopy.paymentSaved);
  };

  const handleMilestonePhotoChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    await withBusyAction('milestone-upload', async () => {
      const nextPhotos = [];
      for (const file of files) {
        const { imageData, stats } = await compressImageFile(file, settings);
        nextPhotos.push({
          id: `milestone_photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          imageData,
          imageStats: stats,
          originalName: file.name || '',
          capturedAt: Date.now(),
        });
      }

      setMilestoneForm((current) => ({
        ...current,
        photos: [...current.photos, ...nextPhotos],
      }));
      setToast(localCopy.photoCaptured);
    });

    event.target.value = '';
  };

  const removeMilestonePhoto = (photoId) => {
    setMilestoneForm((current) => ({
      ...current,
      photos: current.photos.filter((photo) => photo.id !== photoId),
    }));
    setToast(localCopy.photoRemoved);
  };

  const submitMilestone = async () => {
    setValidationError('');
    if (!milestoneForm.taskCategory || !milestoneForm.areaZone || !milestoneForm.progress) {
      setValidationError(pickText(t, 'worker_validation_required', 'Please complete required fields'));
      return;
    }

    await withBusyAction('milestone-submit', async () => {
      const record = createMilestoneSubmission({
        workerId: currentWorker.id,
        workerName: currentWorker.name,
        siteName,
        projectId: currentProject?.id ? String(currentProject.id) : '',
        projectName: photoBatchForm.projectName || siteName,
        taskCategory: milestoneForm.taskCategory,
        areaZone: milestoneForm.areaZone,
        progress: milestoneForm.progress,
        note: milestoneForm.note,
        photos: milestoneForm.photos.map((photo) => ({
          id: photo.id,
          imageData: photo.imageData,
          imageMeta: photo.imageStats || {},
          originalName: photo.originalName || '',
          capturedAt: photo.capturedAt || Date.now(),
        })),
      });

      setLocalMilestoneSubmissions((current) => [...current.filter((item) => item.id !== record.id), record]);
      Promise.resolve(onPersistMilestoneSubmission?.(record)).catch((error) => {
        console.error('Failed to persist milestone submission:', error);
      });
      setMilestoneForm((current) => ({
        ...defaultMilestoneForm,
        taskCategory: current.taskCategory,
        areaZone: current.areaZone,
      }));
      setToast(localCopy.milestoneSaved);
    });
  };

  const clearImageForm = (setter) => {
    setter((current) => ({ ...current, imageData: '', imageStats: null, originalName: '' }));
    setToast(localCopy.photoRemoved);
  };

  const startAudioRecording = async () => {
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
          const durationMs = Date.now() - recordingStartedAtRef.current;

          const record = createVoiceNoteRecord({
            workerId: currentWorker.id,
            workerName: currentWorker.name,
            siteName,
            audioData,
            durationMs,
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

  const startVoiceRecording = () => startAudioRecording();
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

  const navItems = createWorkerNavItems({
    t,
    pickText,
    iconMap: {
      home: Home,
      tasks: ClipboardList,
      activity: Clock3,
      chat: MessageSquare,
    },
  });

  const actionButtons = createWorkerActionButtons({
    t,
    pickText,
    localCopy,
    state: {
      isCheckedIn,
      isCheckedOut,
      canUseWorkActions,
      canOpenWorkerTools,
      isProjectBatchOptionsLoading,
      hasBatchRoomSelection,
      todayBatchCount,
      todayPhotoCount,
      todayVoiceCount,
      todayIssueCount,
      todayDeliveryCount,
      todayEquipmentCount,
      todayPaymentCount,
      todayMilestoneCount,
      todayDailyReportCount,
      activeScreen,
      activeTab,
      isRecordingVoice,
      isVoiceProcessing,
      busyAction,
      tabActivity: TAB_ACTIVITY,
      tabChat: TAB_CHAT,
      screenWorkReports: SCREEN_WORK_REPORTS,
      screenPhoto: SCREEN_PHOTO,
      screenVoice: SCREEN_VOICE,
      screenIssue: SCREEN_ISSUE,
      screenDelivery: SCREEN_DELIVERY,
      screenRequest: SCREEN_REQUEST,
      screenPayment: SCREEN_PAYMENT,
      screenMilestone: SCREEN_MILESTONE,
      screenDailyReport: SCREEN_DAILY_REPORT,
      screenChat: SCREEN_CHAT,
      roomName: photoBatchForm.areaZone || photoBatchForm.roomName,
    },
    handlers: {
      onWorkReports: () => openScreen(SCREEN_WORK_REPORTS),
      onPhoto: () => openScreen(SCREEN_PHOTO, localCopy.openPhoto),
      onVoice: () => openScreen(SCREEN_VOICE, localCopy.openVoice),
      onIssue: () => openScreen(SCREEN_ISSUE),
      onDelivery: () => openRequestScreen('delivery'),
      onEquipment: () => openRequestScreen('equipment'),
      onPayment: openPaymentScreen,
      onMilestone: openMilestoneScreen,
      onDailyReport: () => openScreen(SCREEN_DAILY_REPORT),
      onActivity: () => setTabScreen(TAB_ACTIVITY),
      onChat: () => setTabScreen(TAB_CHAT),
    },
    icons: {
      photo: Camera,
      voice: Mic,
      issue: AlertTriangle,
      delivery: Package,
      equipment: ClipboardList,
      payment: Banknote,
      milestone: ClipboardCheck,
      dailyReport: ClipboardCheck,
      activity: Clock3,
      chat: MessageSquare,
    },
  });

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
          <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="text-xs text-blue-100/70">{pickText(t, 'worker_last_checkin', 'Latest check-in')}</div>
              <div className="mt-1 font-medium">{effectiveAttendance.checkIn ? formatTime(effectiveAttendance.checkIn.timestamp, locale) : '-'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="text-xs text-blue-100/70">{pickText(t, 'worker_last_checkout', 'Latest check-out')}</div>
              <div className="mt-1 font-medium">{effectiveAttendance.checkOut ? formatTime(effectiveAttendance.checkOut.timestamp, locale) : '-'}</div>
            </div>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <input
            value={attendanceNote}
            onChange={(event) => setAttendanceNote(event.target.value)}
            placeholder={pickText(t, 'worker_note_label', 'Note')}
            className="worker-locale-safe worker-mobile-input text-sm"
          />
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {isCheckedOut ? localCopy.doneHelper : isCheckedIn ? localCopy.readyHelper : localCopy.gateHelper}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleAttendance('checkin')}
              disabled={Boolean(effectiveAttendance.checkIn) || busyAction === 'checkin'}
              className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-semibold transition ${effectiveAttendance.checkIn ? 'bg-slate-100 text-slate-400' : 'bg-blue-700 text-white'}`}
            >
              {busyAction === 'checkin' ? pickText(t, 'auth_loading', 'Loading') : 'Check In'}
            </button>
            <button
              type="button"
              onClick={() => handleAttendance('checkout')}
              disabled={!effectiveAttendance.checkIn || Boolean(effectiveAttendance.checkOut) || busyAction === 'checkout'}
              className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-semibold transition ${!effectiveAttendance.checkIn || effectiveAttendance.checkOut ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white'}`}
            >
              {busyAction === 'checkout' ? pickText(t, 'auth_loading', 'Loading') : 'Check Out'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-base font-semibold text-slate-900">{pickText(t, 'worker_action_primary', 'Quick Actions')}</div>
          <div className="max-w-[14rem] text-xs leading-5 text-slate-500">{localCopy.checkoutHelper}</div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <MobileSelectField
                  value={task.status}
                  onChange={(nextValue) => setTasks((current) => updateWorkerTaskStatus(current, task.id, nextValue))}
                  options={[
                    { value: TASK_STATUS.notStarted, label: pickText(t, 'worker_task_status_not_started', 'Not started') },
                    { value: TASK_STATUS.inProgress, label: pickText(t, 'worker_task_status_in_progress', 'In progress') },
                    { value: TASK_STATUS.completed, label: pickText(t, 'worker_task_status_done', 'Done') },
                  ]}
                  compact
                  allowEmpty={false}
                />
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

  const renderWorkReportsScreen = () => (
    <SinglePurposeScreen
      title={localCopy.workReportsScreenTitle}
      subtitle={localCopy.workReportsScreenDesc}
      onBack={goBack}
      t={t}
    >
      <div className="grid grid-cols-1 gap-3">
        <ActionListCard
          title={localCopy.quickSubmitTitle}
          helper={localCopy.photoDesc}
          icon={Camera}
          tone="slate"
          onClick={() => openScreen(SCREEN_PHOTO, localCopy.openPhoto)}
        />
        <ActionListCard
          title={localCopy.quickDailyReportTitle}
          helper={localCopy.quickDailyReportHelper}
          icon={ClipboardCheck}
          tone="blue"
          onClick={() => openScreen(SCREEN_DAILY_REPORT)}
        />
        <ActionListCard
          title={localCopy.quickMilestoneTitle}
          helper={localCopy.quickMilestoneHelper}
          icon={ClipboardCheck}
          tone="emerald"
          onClick={openMilestoneScreen}
        />
      </div>
    </SinglePurposeScreen>
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
      <ScreenHeader title={localCopy.requestsActivityTitle} subtitle={localCopy.requestsActivityDesc} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ActionListCard
          title={localCopy.quickEquipmentTitle}
          helper={localCopy.quickEquipmentHelper}
          icon={ClipboardList}
          tone="amber"
          onClick={() => openRequestScreen('equipment')}
        />
        <ActionListCard
          title={localCopy.quickDeliveryTitle}
          helper={localCopy.quickDeliveryHelper}
          icon={Package}
          tone="blue"
          onClick={() => openRequestScreen('delivery')}
        />
        <ActionListCard
          title={localCopy.quickPaymentTitle}
          helper={localCopy.quickPaymentHelper}
          icon={Banknote}
          tone="emerald"
          onClick={openPaymentScreen}
        />
        <ActionListCard
          title={localCopy.quickChatTitle}
          helper={localCopy.quickChatHelper}
          icon={MessageSquare}
          tone="slate"
          onClick={() => setTabScreen(TAB_CHAT)}
        />
      </div>
      <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="space-y-3">
          {activityFeed.length ? (
            activityFeed.map((item) => (
              <div key={item.id} className="rounded-[1.3rem] border border-slate-200 p-3.5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                    {item.type === 'photo' ? <FileImage className="h-5 w-5" /> : item.type === 'request' ? <Package className="h-5 w-5" /> : item.type === 'payment' ? <Banknote className="h-5 w-5" /> : item.type === 'milestone' ? <ClipboardCheck className="h-5 w-5" /> : item.type === 'issue' ? <AlertTriangle className="h-5 w-5" /> : item.type === 'voice' ? <Mic className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
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

  const renderChatScreen = () => (
    <div className="space-y-4">
      <ScreenHeader title={localCopy.chatScreenTitle} subtitle={localCopy.chatScreenDesc} />
      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-slate-200/80">
        <div ref={chatContainerRef} className="flex max-h-[52vh] min-h-[38vh] flex-col gap-4 overflow-y-auto bg-slate-50 p-4">
          {projectChatMessages.length ? projectChatMessages.map((message) => {
            const isMe = message.senderRole === 'worker';
            return (
              <div key={message.id || `${message.createdAt}-${message.sender}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[86%] rounded-2xl p-3 text-sm shadow-sm ${isMe ? 'rounded-tr-sm bg-blue-700 text-white' : 'rounded-tl-sm border border-slate-200 bg-white text-slate-700'}`}>
                  {!isMe ? <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">{message.sender}</div> : null}
                  {message.audioUrl ? <audio controls src={message.audioUrl} className="max-w-[220px]" /> : message.text}
                </div>
                <span className="mt-1 px-1 text-[10px] text-slate-400">{message.time || formatTime(message.createdAt || Date.now(), locale)}</span>
              </div>
            );
          }) : <EmptyState label={localCopy.chatEmpty} />}
        </div>
        <div className="border-t border-slate-200 bg-white p-3">
          {chatError ? <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{chatError}</div> : null}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatDraft}
              onChange={(event) => {
                setChatDraft(event.target.value);
                if (chatError) setChatError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSendChatMessage();
                }
              }}
              placeholder={pickText(t, 'chat_placeholder', 'Type message...')}
              disabled={chatBusy}
              className="h-11 flex-1 rounded-full bg-slate-100 px-4 text-sm outline-none ring-0 focus:bg-slate-200"
            />
            <button
              type="button"
              onClick={handleSendChatMessage}
              disabled={chatBusy || !String(chatDraft || '').trim()}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${chatBusy || !String(chatDraft || '').trim() ? 'bg-slate-100 text-slate-300' : 'bg-blue-700 text-white'}`}
              aria-label={localCopy.chatSendAction}
            >
              {chatBusy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
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
          <MetricCard label={pickText(t, 'worker_sync_queue', 'Sync queue')} value={`${photoReports.filter((entry) => entry.status === 'draft').length}`} />
        </div>
      </div>
      <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="mb-3 text-base font-semibold text-slate-900">{pickText(t, 'worker_submitted_items', 'Submitted items')}</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label={pickText(t, 'worker_photo', 'Photo')} value={`${photoReports.reduce((total, entry) => total + Number(entry.photoCount || entry.photos?.length || 0), 0)}`} compact />
          <MetricCard label={pickText(t, 'worker_material', 'Material')} value={`${latestRequests.length}`} compact />
          <MetricCard label={pickText(t, 'worker_sos', 'SOS')} value={`${latestIssues.length}`} compact />
          <MetricCard label={localCopy.voiceTitle} value={`${latestVoiceNotes.length}`} compact />
          <MetricCard label={localCopy.quickPaymentTitle} value={`${latestPaymentRequests.length}`} compact />
          <MetricCard label={localCopy.quickMilestoneTitle} value={`${latestMilestones.length}`} compact />
        </div>
      </div>
      <DataSaverCard settings={settings} setSettings={setSettings} t={t} />
    </div>
  );

  const renderPhotoScreen = () => {
    const batchReadyForPhotos = Boolean(photoBatchForm.projectId && photoBatchForm.taskCategory && photoBatchForm.areaZone);
    const batchStatusLabel = photoBatchForm.voiceNote
      ? `${localCopy.batchVoiceAttachedCount}: ${formatDuration(photoBatchForm.voiceNote.durationMs || 0)}`
      : localCopy.batchVoiceMissing;

    return (
      <SinglePurposeScreen
        title={pickText(t, 'worker_photo_screen_title', 'Submit Work Photo')}
        subtitle={localCopy.photoDesc}
        onBack={goBack}
        t={t}
      >
        <FormCard>
          <div className={`rounded-[1.3rem] border px-4 py-3 text-sm ${isProjectBatchOptionsLoading ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
            {isProjectBatchOptionsLoading ? localCopy.batchProjectDataLoading : localCopy.photoFlowHelper}
          </div>
          <div className="mt-3 rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{pickText(t, 'label_name', 'Project')}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{photoBatchForm.projectName || siteName}</div>
          </div>
          <div className="mt-4 space-y-4">
            <CompactSelectCreateField
              label={localCopy.taskCategoryLabel}
              value={photoBatchForm.taskCategory}
              onSelect={handleTaskCategoryChange}
              options={taskCategoryOptions}
              selectPlaceholder={localCopy.taskCategoryPlaceholder}
              createLabel={localCopy.addTaskCategoryLabel}
              createValue={newTaskCategory}
              onCreateValueChange={setNewTaskCategory}
              onCreate={() => addTaskCategoryOption()}
              createPlaceholder={localCopy.customInputPlaceholder}
              actionLabel={localCopy.compactAddSave}
              cancelLabel={localCopy.compactAddCancel}
              helperText={localCopy.editableSelectedHelper}
              accent="blue"
              addOpen={openAddField === 'photo-task-category'}
              onToggleAdd={() => toggleCompactAdd('photo-task-category')}
            />
            <CompactSelectCreateField
              label={localCopy.workSubcategoryLabel}
              value={photoBatchForm.workSubcategory}
              onSelect={handleWorkSubcategoryChange}
              options={workSubcategoryOptions}
              selectPlaceholder={localCopy.workSubcategoryPlaceholder}
              createLabel={localCopy.addWorkSubcategoryLabel}
              createValue={newWorkSubcategory}
              onCreateValueChange={setNewWorkSubcategory}
              onCreate={addWorkSubcategoryOption}
              createPlaceholder={localCopy.customInputPlaceholder}
              actionLabel={localCopy.compactAddSave}
              cancelLabel={localCopy.compactAddCancel}
              helperText={photoBatchForm.taskCategory ? localCopy.editableSelectedHelper : localCopy.subcategoryHelper}
              accent="blue"
              addOpen={openAddField === 'photo-work-subcategory'}
              onToggleAdd={() => toggleCompactAdd('photo-work-subcategory')}
              disabled={!photoBatchForm.taskCategory}
            />
            <CompactSelectCreateField
              label={localCopy.areaZoneLabel}
              value={photoBatchForm.areaZone}
              onSelect={handleAreaZoneChange}
              options={areaZoneOptions}
              selectPlaceholder={localCopy.areaZonePlaceholder}
              createLabel={localCopy.addAreaZoneLabel}
              createValue={newAreaZone}
              onCreateValueChange={setNewAreaZone}
              onCreate={() => addAreaZoneOption()}
              createPlaceholder={localCopy.customInputPlaceholder}
              actionLabel={localCopy.compactAddSave}
              cancelLabel={localCopy.compactAddCancel}
              helperText={localCopy.editableSelectedHelper}
              accent="emerald"
              addOpen={openAddField === 'photo-area-zone'}
              onToggleAdd={() => toggleCompactAdd('photo-area-zone')}
            />
            <CompactSelectCreateField
              label={localCopy.standardPhrasesLabel}
              value={photoBatchForm.standardPhrase || ''}
              onSelect={(value) => applyStandardPhrase(setPhotoBatchForm, value, 'notes')}
              options={standardPhraseOptions}
              selectPlaceholder={localCopy.standardPhrasesPlaceholder}
              createLabel={localCopy.addStandardPhraseLabel}
              createValue={newStandardPhrase}
              onCreate={() => addStandardPhraseOption(setPhotoBatchForm, 'notes')}
              onCreateValueChange={setNewStandardPhrase}
              createPlaceholder={localCopy.customInputPlaceholder}
              actionLabel={localCopy.compactAddSave}
              cancelLabel={localCopy.compactAddCancel}
              helperText={localCopy.phraseHelper}
              accent="emerald"
              addOpen={openAddField === 'photo-standard-phrase'}
              onToggleAdd={() => toggleCompactAdd('photo-standard-phrase')}
            />
            <AttachmentComposer
              value={{
                photos: photoBatchForm.photos.map((photo) => ({
                  ...photo,
                  imageMeta: photo.imageMeta || photo.imageStats || {},
                })),
                voiceNote: photoBatchForm.voiceNote,
                note: photoBatchForm.notes,
              }}
              onChange={(nextDraft) => {
                setPhotoBatchForm((current) => ({
                  ...current,
                  photos: nextDraft.photos.map((photo) => ({
                    ...photo,
                    imageStats: photo.imageMeta || photo.imageStats || {},
                  })),
                  voiceNote: nextDraft.voiceNote,
                  notes: nextDraft.note,
                  status: 'draft',
                }));
              }}
              settings={settings}
              disabled={!batchReadyForPhotos}
              photoLabel={pickText(t, 'worker_report_photo', 'Photos')}
              photoHelperText={batchReadyForPhotos ? localCopy.batchPhotoHelp : localCopy.batchSelectionHelp}
              photoCameraLabel={localCopy.photoTakeAction}
              photoGalleryLabel={localCopy.photoChooseAction}
              photoRemoveLabel={localCopy.photoRemove}
              photoCountLabel={localCopy.photoBatchCount}
              voiceTitle={localCopy.batchInlineVoice}
              voiceStatusLabel={batchStatusLabel}
              voiceStartLabel={localCopy.batchVoiceStart}
              voiceStopLabel={localCopy.batchVoiceStop}
              voiceDeleteLabel={localCopy.batchVoiceDelete}
              voiceReadyLabel={localCopy.batchVoiceReady}
                voiceAttachedLabel={localCopy.batchVoiceAttachedCount}
                voiceProcessingLabel={localCopy.batchVoiceProcessing}
                voiceRecordingLabel={localCopy.batchVoiceRecording}
                voiceErrorMap={{
                  voice_not_supported: localCopy.voiceFallback,
                  voice_permission_denied: localCopy.voicePermission,
                  voice_processing_failed: localCopy.batchVoiceProcessing,
                  default: '',
                }}
              noteLabel={localCopy.attachmentNoteLabel}
              notePlaceholder={pickText(t, 'worker_report_details', 'Details')}
              previewTitle={localCopy.attachmentPreviewTitle}
              previewEmptyLabel={localCopy.attachmentPreviewEmpty}
              previewPhotoLabel={localCopy.attachmentPreviewPhoto}
              previewVoiceLabel={localCopy.attachmentPreviewVoice}
              previewNoteLabel={localCopy.attachmentPreviewNote}
              previewRemoveLabel={localCopy.attachmentPreviewRemove}
              dataSaverTitle={pickText(t, 'worker_auto_data_saver', 'The app automatically optimizes files to save data')}
              originalSizeLabel={localCopy.originalSizeLabel}
              compressedSizeLabel={localCopy.compressedSizeLabel}
              onPhotoCaptured={() => setToast(localCopy.photoCaptured)}
              onPhotoRemoved={() => setToast(localCopy.photoRemoved)}
              onVoiceSaved={() => {
                setToast(localCopy.batchVoiceSaved);
              }}
              onVoiceRemoved={() => {
                setToast(localCopy.batchVoiceRemoved);
              }}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button onClick={() => submitPhotoBatch('draft')} disabled={!batchReadyForPhotos || busyAction === 'photo-draft' || busyAction === 'photo-submit'} className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                {busyAction === 'photo-draft' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
                {localCopy.batchDraftAction}
              </button>
              <button onClick={() => submitPhotoBatch('submitted')} disabled={!batchReadyForPhotos || !photoBatchForm.photos.length || busyAction === 'photo-draft' || busyAction === 'photo-submit'} className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300">
                {busyAction === 'photo-submit' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {localCopy.batchSubmitAction}
              </button>
            </div>
          </div>
        </FormCard>

        <FormCard title={localCopy.batchRecent}>
          <HistoryList
            items={latestPhotoReports}
            emptyLabel={localCopy.batchEmpty}
            renderItem={(item) => (
              <PhotoBatchCard
                item={item}
                updatedLabel={localCopy.batchUpdated}
                statusLabel={formatBatchStatusLabel(item.status, language)}
                emptyNoteLabel={pickText(t, 'worker_no_data', 'No data yet')}
                locale={locale}
                countLabel={localCopy.photoBatchCount}
                voiceLabel={localCopy.batchVoiceAttachedCount}
              />
            )}
          />
        </FormCard>
      </SinglePurposeScreen>
    );
  };

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
            <button onClick={startVoiceRecording} disabled={!canOpenWorkerTools || !canRecordVoice || isRecordingVoice || isVoiceProcessing} className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
              <Mic className="h-4 w-4" />
              {localCopy.voiceStart}
            </button>
            <button onClick={stopVoiceRecording} disabled={!isRecordingVoice} className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-200">
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
      title={requestScreenTitle}
      subtitle={requestScreenDesc}
      onBack={goBack}
      t={t}
    >
      <FormCard title={requestScreenTitle}>
        <div className="rounded-[1.3rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {photoBatchForm.projectName || siteName} • {localCopy.editableSelectedHelper}
        </div>
        <div className="mt-4 space-y-4">
          <CompactSelectCreateField
            label={localCopy.taskCategoryLabel}
            value={requestForm.taskCategory}
            onSelect={(value) => setRequestForm((current) => ({ ...current, taskCategory: value }))}
            options={taskCategoryOptions}
            selectPlaceholder={localCopy.taskCategoryPlaceholder}
            createLabel={localCopy.addTaskCategoryLabel}
            createValue={newTaskCategory}
            onCreateValueChange={setNewTaskCategory}
            onCreate={() => addTaskCategoryOption((value) => setRequestForm((current) => ({ ...current, taskCategory: value })))}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.compactAddSave}
            cancelLabel={localCopy.compactAddCancel}
            helperText={localCopy.editableSelectedHelper}
            accent="blue"
            addOpen={openAddField === 'request-task-category'}
            onToggleAdd={() => toggleCompactAdd('request-task-category')}
          />
          <CompactSelectCreateField
            label={localCopy.areaZoneLabel}
            value={requestForm.areaZone}
            onSelect={(value) => setRequestForm((current) => ({ ...current, areaZone: value }))}
            options={areaZoneOptions}
            selectPlaceholder={localCopy.areaZonePlaceholder}
            createLabel={localCopy.addAreaZoneLabel}
            createValue={newAreaZone}
            onCreateValueChange={setNewAreaZone}
            onCreate={() => addAreaZoneOption((value) => setRequestForm((current) => ({ ...current, areaZone: value })))}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.compactAddSave}
            cancelLabel={localCopy.compactAddCancel}
            helperText={localCopy.editableSelectedHelper}
            accent="emerald"
            addOpen={openAddField === 'request-area-zone'}
            onToggleAdd={() => toggleCompactAdd('request-area-zone')}
          />
          <input
            value={requestForm.itemName}
            onChange={(event) => setRequestForm((current) => ({ ...current, itemName: event.target.value }))}
            placeholder={localCopy.requestItemPlaceholder}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="1"
              value={requestForm.quantity}
              onChange={(event) => setRequestForm((current) => ({ ...current, quantity: event.target.value }))}
              placeholder={localCopy.requestQuantityPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
            />
            <input
              value={requestForm.unit}
              onChange={(event) => setRequestForm((current) => ({ ...current, unit: event.target.value }))}
              placeholder={localCopy.requestUnitPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
            />
          </div>
          <CompactSelectCreateField
            label={localCopy.standardPhrasesLabel}
            value={requestForm.standardPhrase || ''}
            onSelect={(value) => applyStandardPhrase(setRequestForm, value)}
            options={standardPhraseOptions}
            selectPlaceholder={localCopy.standardPhrasesPlaceholder}
            createLabel={localCopy.addStandardPhraseLabel}
            createValue={newStandardPhrase}
            onCreate={() => addStandardPhraseOption(setRequestForm)}
            onCreateValueChange={setNewStandardPhrase}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.compactAddSave}
            cancelLabel={localCopy.compactAddCancel}
            helperText={localCopy.phraseHelper}
            accent="emerald"
            addOpen={openAddField === 'request-standard-phrase'}
            onToggleAdd={() => toggleCompactAdd('request-standard-phrase')}
          />
          <textarea
            value={requestForm.note}
            onChange={(event) => setRequestForm((current) => ({ ...current, note: event.target.value }))}
            placeholder={localCopy.requestNotePlaceholder}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
          />
        </div>
        <FilePicker imageData={requestForm.imageData} onChange={(event) => handleFileChange(event, setRequestForm)} onRemove={() => clearImageForm(setRequestForm)} label={pickText(t, 'worker_req_photo_cta', 'Attach photo')} helperText={localCopy.requestPhotoHelper} cameraLabel={localCopy.photoTakeAction} galleryLabel={localCopy.photoChooseAction} removeLabel={localCopy.photoRemove} loading={busyAction === 'photo-upload'} optional t={t} />
        <button onClick={submitRequest} className="mt-4 min-h-14 w-full rounded-[1.2rem] bg-orange-500 px-4 py-4 text-base font-semibold text-white touch-manipulation">{requestSubmitLabel}</button>
      </FormCard>
      <FormCard title={localCopy.requestRecentTitle}>
        <HistoryList
          items={requestRecentItems}
          emptyLabel={pickText(t, 'worker_no_data', 'No data yet')}
          renderItem={(item) => (
            <HistoryCard
              title={`${item.itemName} • ${item.quantity} ${item.unit}`}
              detail={`${item.taskCategory || '-'} • ${item.areaZone || '-'} • ${formatDateTime(item.requestedAt, locale)}`}
              status={item.status}
              imageData={item.imageData}
            />
          )}
        />
      </FormCard>
    </SinglePurposeScreen>
  );

  const renderPaymentScreen = () => (
    <SinglePurposeScreen
      title={localCopy.paymentScreenTitle}
      subtitle={localCopy.paymentScreenDesc}
      onBack={goBack}
      t={t}
    >
      <FormCard title={localCopy.paymentScreenTitle}>
        <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {photoBatchForm.projectName || siteName} • {localCopy.editableSelectedHelper}
        </div>
        <div className="mt-4 space-y-4">
          <CompactSelectCreateField
            label={localCopy.taskCategoryLabel}
            value={paymentForm.taskCategory}
            onSelect={(value) => setPaymentForm((current) => ({ ...current, taskCategory: value }))}
            options={taskCategoryOptions}
            selectPlaceholder={localCopy.taskCategoryPlaceholder}
            createLabel={localCopy.addTaskCategoryLabel}
            createValue={newTaskCategory}
            onCreateValueChange={setNewTaskCategory}
            onCreate={() => addTaskCategoryOption((value) => setPaymentForm((current) => ({ ...current, taskCategory: value })))}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.compactAddSave}
            cancelLabel={localCopy.compactAddCancel}
            helperText={localCopy.editableSelectedHelper}
            accent="blue"
            addOpen={openAddField === 'payment-task-category'}
            onToggleAdd={() => toggleCompactAdd('payment-task-category')}
          />
          <CompactSelectCreateField
            label={localCopy.areaZoneLabel}
            value={paymentForm.areaZone}
            onSelect={(value) => setPaymentForm((current) => ({ ...current, areaZone: value }))}
            options={areaZoneOptions}
            selectPlaceholder={localCopy.areaZonePlaceholder}
            createLabel={localCopy.addAreaZoneLabel}
            createValue={newAreaZone}
            onCreateValueChange={setNewAreaZone}
            onCreate={() => addAreaZoneOption((value) => setPaymentForm((current) => ({ ...current, areaZone: value })))}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.compactAddSave}
            cancelLabel={localCopy.compactAddCancel}
            helperText={localCopy.editableSelectedHelper}
            accent="emerald"
            addOpen={openAddField === 'payment-area-zone'}
            onToggleAdd={() => toggleCompactAdd('payment-area-zone')}
          />
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">{localCopy.paymentAmountLabel}</div>
            <input
              type="number"
              min="0"
              value={paymentForm.amount}
              onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
              placeholder={localCopy.paymentAmountPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
            />
          </div>
          <CompactSelectCreateField
            label={localCopy.standardPhrasesLabel}
            value={paymentForm.standardPhrase || ''}
            onSelect={(value) => applyStandardPhrase(setPaymentForm, value)}
            options={standardPhraseOptions}
            selectPlaceholder={localCopy.standardPhrasesPlaceholder}
            createLabel={localCopy.addStandardPhraseLabel}
            createValue={newStandardPhrase}
            onCreate={() => addStandardPhraseOption(setPaymentForm)}
            onCreateValueChange={setNewStandardPhrase}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.compactAddSave}
            cancelLabel={localCopy.compactAddCancel}
            helperText={localCopy.phraseHelper}
            accent="emerald"
            addOpen={openAddField === 'payment-standard-phrase'}
            onToggleAdd={() => toggleCompactAdd('payment-standard-phrase')}
          />
          <textarea
            value={paymentForm.note}
            onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))}
            placeholder={localCopy.requestNotePlaceholder}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
          />
        </div>
        <button onClick={submitPaymentRequest} className="mt-4 min-h-14 w-full rounded-[1.2rem] bg-emerald-600 px-4 py-4 text-base font-semibold text-white touch-manipulation">
          {localCopy.paymentSubmitAction}
        </button>
      </FormCard>
      <FormCard title={localCopy.paymentRecentTitle}>
        <HistoryList
          items={latestPaymentRequests}
          emptyLabel={pickText(t, 'worker_no_data', 'No data yet')}
          renderItem={(item) => (
            <HistoryCard
              title={`${item.amount} • ${item.taskCategory || '-'}`}
              detail={`${item.areaZone || '-'} • ${item.note || '-'} • ${formatDateTime(item.requestedAt, locale)}`}
              status={item.status}
            />
          )}
        />
      </FormCard>
    </SinglePurposeScreen>
  );

  const renderMilestoneScreen = () => (
    <SinglePurposeScreen
      title={localCopy.milestoneScreenTitle}
      subtitle={localCopy.milestoneScreenDesc}
      onBack={goBack}
      t={t}
    >
      <FormCard title={localCopy.milestoneScreenTitle}>
        <div className="rounded-[1.3rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {photoBatchForm.projectName || siteName} • {localCopy.editableSelectedHelper}
        </div>
        <div className="mt-4 space-y-4">
          <CompactSelectCreateField
            label={localCopy.taskCategoryLabel}
            value={milestoneForm.taskCategory}
            onSelect={(value) => setMilestoneForm((current) => ({ ...current, taskCategory: value }))}
            options={taskCategoryOptions}
            selectPlaceholder={localCopy.taskCategoryPlaceholder}
            createLabel={localCopy.addTaskCategoryLabel}
            createValue={newTaskCategory}
            onCreateValueChange={setNewTaskCategory}
            onCreate={() => addTaskCategoryOption((value) => setMilestoneForm((current) => ({ ...current, taskCategory: value })))}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.compactAddSave}
            cancelLabel={localCopy.compactAddCancel}
            helperText={localCopy.editableSelectedHelper}
            accent="blue"
            addOpen={openAddField === 'milestone-task-category'}
            onToggleAdd={() => toggleCompactAdd('milestone-task-category')}
          />
          <CompactSelectCreateField
            label={localCopy.areaZoneLabel}
            value={milestoneForm.areaZone}
            onSelect={(value) => setMilestoneForm((current) => ({ ...current, areaZone: value }))}
            options={areaZoneOptions}
            selectPlaceholder={localCopy.areaZonePlaceholder}
            createLabel={localCopy.addAreaZoneLabel}
            createValue={newAreaZone}
            onCreateValueChange={setNewAreaZone}
            onCreate={() => addAreaZoneOption((value) => setMilestoneForm((current) => ({ ...current, areaZone: value })))}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.compactAddSave}
            cancelLabel={localCopy.compactAddCancel}
            helperText={localCopy.editableSelectedHelper}
            accent="emerald"
            addOpen={openAddField === 'milestone-area-zone'}
            onToggleAdd={() => toggleCompactAdd('milestone-area-zone')}
          />
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">{localCopy.milestoneProgressLabel}</div>
            <input
              type="number"
              min="0"
              max="100"
              value={milestoneForm.progress}
              onChange={(event) => setMilestoneForm((current) => ({ ...current, progress: event.target.value }))}
              placeholder={localCopy.milestoneProgressPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
            />
          </div>
          <CompactSelectCreateField
            label={localCopy.standardPhrasesLabel}
            value={milestoneForm.standardPhrase || ''}
            onSelect={(value) => applyStandardPhrase(setMilestoneForm, value)}
            options={standardPhraseOptions}
            selectPlaceholder={localCopy.standardPhrasesPlaceholder}
            createLabel={localCopy.addStandardPhraseLabel}
            createValue={newStandardPhrase}
            onCreate={() => addStandardPhraseOption(setMilestoneForm)}
            onCreateValueChange={setNewStandardPhrase}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.compactAddSave}
            cancelLabel={localCopy.compactAddCancel}
            helperText={localCopy.phraseHelper}
            accent="emerald"
            addOpen={openAddField === 'milestone-standard-phrase'}
            onToggleAdd={() => toggleCompactAdd('milestone-standard-phrase')}
          />
          <textarea
            value={milestoneForm.note}
            onChange={(event) => setMilestoneForm((current) => ({ ...current, note: event.target.value }))}
            placeholder={localCopy.requestNotePlaceholder}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
          />
        </div>
        <div className="mt-4">
          <MultiPhotoPicker
            photos={milestoneForm.photos}
            onChange={handleMilestonePhotoChange}
            onRemove={removeMilestonePhoto}
            label={pickText(t, 'worker_report_photo', 'Photos')}
            helperText={localCopy.quickMilestoneHelper}
            cameraLabel={localCopy.photoTakeAction}
            galleryLabel={localCopy.photoChooseAction}
            removeLabel={localCopy.photoRemove}
            countLabel={localCopy.photoBatchCount}
            loading={busyAction === 'milestone-upload'}
            disabled={false}
          />
        </div>
        <button onClick={submitMilestone} className="mt-4 min-h-14 w-full rounded-[1.2rem] bg-slate-900 px-4 py-4 text-base font-semibold text-white touch-manipulation">
          {localCopy.milestoneSubmitAction}
        </button>
      </FormCard>
      <FormCard title={localCopy.milestoneRecentTitle}>
        <HistoryList
          items={latestMilestones}
          emptyLabel={pickText(t, 'worker_no_data', 'No data yet')}
          renderItem={(item) => (
            <HistoryCard
              title={`${item.progress}% • ${item.taskCategory || '-'}`}
              detail={`${item.areaZone || '-'} • ${item.note || '-'} • ${formatDateTime(item.submittedAt, locale)}`}
              status={item.status}
              imageData={item.photos?.[0]?.imageData}
            />
          )}
        />
      </FormCard>
    </SinglePurposeScreen>
  );

  const renderIssueScreen = () => {
    return (
      <SinglePurposeScreen
        title={siteTicketLabels.title}
        subtitle={siteTicketLabels.subtitle}
        onBack={goBack}
        t={t}
      >
        <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-amber-800">{siteTicketLabels.title}</div>
              <div className="mt-1 text-sm text-amber-700">
                {currentWorker.role === 'owner' ? siteTicketLabels.ownerReadOnlyHint : siteTicketLabels.workerReadOnlyHint}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setTicketScreenTab('list');
              setIsEditingTicket(false);
            }}
            className={`min-h-12 rounded-[1.2rem] px-4 py-3 text-sm font-semibold ${ticketScreenTab === 'list' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
          >
            {siteTicketLabels.listTab}
          </button>
          <button
            onClick={openTicketCreate}
            className={`min-h-12 rounded-[1.2rem] px-4 py-3 text-sm font-semibold ${ticketScreenTab === 'create' ? 'bg-amber-500 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
          >
            {siteTicketLabels.createTab}
          </button>
        </div>

        {ticketScreenTab === 'list' ? (
          <div className="mt-4 space-y-4">
            <SiteTicketFilters
              labels={siteTicketLabels}
              filters={ticketFilters}
              projectOptions={siteTicketProjectOptions}
              statusOptions={ticketStatusOptions}
              priorityOptions={ticketPriorityOptions}
              assigneeOptions={siteTicketAssigneeFilterOptions}
              onChange={handleTicketFilterChange}
            />
            <SiteTicketList
              tickets={filteredSiteTickets}
              labels={siteTicketLabels}
              language={language}
              summary={ticketSummary}
              onSelect={openTicketDetail}
              onCreate={openTicketCreate}
            />
          </div>
        ) : null}

        {ticketScreenTab === 'create' ? (
          <div className="mt-4">
            <SiteTicketForm
              labels={siteTicketLabels}
              language={language}
              role={currentWorker.role}
              mode="create"
              form={createTicketForm.form}
              errors={createTicketForm.errors}
              projectOptions={siteTicketProjectFormOptions}
              assigneeOptions={siteTicketAssigneeOptions}
              onFieldChange={createTicketForm.setField}
              onAttachmentChange={createTicketForm.setAttachmentDraft}
              onSubmit={submitSiteTicket}
              onCancel={() => setTicketScreenTab('list')}
            />
          </div>
        ) : null}

        {ticketScreenTab === 'detail' ? (
          <div className="mt-4">
            <SiteTicketDetail
              ticket={selectedSiteTicket}
              labels={siteTicketLabels}
              language={language}
              role={currentWorker.role}
              projectOptions={siteTicketProjectFormOptions}
              assigneeOptions={siteTicketAssigneeOptions}
              editing={isEditingTicket}
              form={editTicketForm.form}
              errors={editTicketForm.errors}
              onFieldChange={editTicketForm.setField}
              onAttachmentChange={editTicketForm.setAttachmentDraft}
              onEdit={startTicketEdit}
              onSubmit={updateSiteTicket}
              onCancel={() => setIsEditingTicket(false)}
              onBack={() => {
                setIsEditingTicket(false);
                setTicketScreenTab('list');
              }}
            />
          </div>
        ) : null}

        <FormCard title={pickText(t, 'worker_recent_issues', 'Recent Issues')}>
          <HistoryList
            items={roleVisibleTickets.slice(0, 4)}
            emptyLabel={pickText(t, 'worker_no_data', 'No data yet')}
            renderItem={(item) => (
              <HistoryCard
                title={`${item.title} • ${item.priority}`}
                detail={`${item.locationText || '-'} • ${formatDateTime(item.updatedAt || item.createdAt, locale)}`}
                status={item.status}
                imageData={item.attachments?.find((entry) => entry.kind === 'photo')?.imageData || ''}
                danger={item.priority === 'critical'}
              />
            )}
          />
        </FormCard>
      </SinglePurposeScreen>
    );
  };

  const renderDailyReportScreen = () => {
    const activeReportForm = isEditingDailyReport ? editDailyReportForm : createDailyReportForm;
    const activeProjectId = activeReportForm.form.projectId || (currentProject?.id ? String(currentProject.id) : '');
    const activeReportDate = activeReportForm.form.reportDate || today;
    const selectableTickets = sortSiteTickets(roleVisibleTickets.filter((ticket) => {
      const sameProject = !activeProjectId || String(ticket.projectId || '') === String(activeProjectId);
      const updatedAt = Number(ticket.updatedAt || ticket.createdAt || 0);
      const sameDate = !activeReportDate || (updatedAt && new Date(updatedAt).toISOString().split('T')[0] === activeReportDate);
      return sameProject && sameDate;
    }));
    const activeTicketSnapshot = buildDailyReportTicketInsights(roleVisibleTickets, {
      projectId: activeProjectId,
      reportDate: activeReportDate,
    });
    const selectedReportTickets = selectedDailyReport
      ? roleVisibleTickets.filter((ticket) => selectedDailyReport.relatedTicketIds?.includes(ticket.id))
      : [];

    return (
      <SinglePurposeScreen
        title={dailyReportLabels.title}
        subtitle={dailyReportLabels.subtitle}
        onBack={goBack}
        t={t}
      >
        <div className="rounded-[1.6rem] border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-blue-100 p-2 text-blue-700">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-blue-800">{dailyReportLabels.title}</div>
              <div className="mt-1 text-sm text-blue-700">
                {currentWorker.role === 'owner' ? dailyReportLabels.ownerReadOnlyHint : dailyReportLabels.workerReadOnlyHint}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setDailyReportScreenTab('list');
              setIsEditingDailyReport(false);
            }}
            className={`min-h-12 rounded-[1.2rem] px-4 py-3 text-sm font-semibold ${dailyReportScreenTab === 'list' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
          >
            {dailyReportLabels.listTab}
          </button>
          <button
            onClick={openDailyReportCreate}
            className={`min-h-12 rounded-[1.2rem] px-4 py-3 text-sm font-semibold ${dailyReportScreenTab === 'create' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
          >
            {dailyReportLabels.createTab}
          </button>
        </div>

        {dailyReportScreenTab === 'list' ? (
          <div className="mt-4 space-y-4">
            <DailyReportFilters
              labels={dailyReportLabels}
              filters={dailyReportFilters}
              projectOptions={dailyReportProjectOptions}
              onChange={handleDailyReportFilterChange}
            />
            <DailyReportList
              reports={filteredDailyReports}
              labels={dailyReportLabels}
              summary={dailyReportSummary}
              onSelect={openDailyReportDetail}
              onCreate={openDailyReportCreate}
            />
          </div>
        ) : null}

        {dailyReportScreenTab === 'create' ? (
          <div className="mt-4">
            <DailyReportForm
              labels={dailyReportLabels}
              language={language}
              role={currentWorker.role}
              mode="create"
              form={createDailyReportForm.form}
              errors={createDailyReportForm.errors}
              projectOptions={dailyReportProjectFormOptions}
              relatedTickets={selectableTickets}
              ticketSnapshot={activeTicketSnapshot}
              onFieldChange={createDailyReportForm.setField}
              onAttachmentChange={createDailyReportForm.setAttachmentDraft}
              onToggleTicket={createDailyReportForm.toggleRelatedTicket}
              onSubmit={submitDailyReport}
              onCancel={() => setDailyReportScreenTab('list')}
            />
          </div>
        ) : null}

        {dailyReportScreenTab === 'detail' ? (
          <div className="mt-4">
            <DailyReportDetail
              report={selectedDailyReport}
              labels={dailyReportLabels}
              language={language}
              role={currentWorker.role}
              editing={isEditingDailyReport}
              form={editDailyReportForm.form}
              errors={editDailyReportForm.errors}
              projectOptions={dailyReportProjectFormOptions}
              relatedTickets={isEditingDailyReport ? selectableTickets : selectedReportTickets}
              ticketSnapshot={activeTicketSnapshot}
              onFieldChange={editDailyReportForm.setField}
              onAttachmentChange={editDailyReportForm.setAttachmentDraft}
              onToggleTicket={editDailyReportForm.toggleRelatedTicket}
              onEdit={startDailyReportEdit}
              onSubmit={updateDailyReport}
              onCancel={() => setIsEditingDailyReport(false)}
              onBack={() => {
                setIsEditingDailyReport(false);
                setDailyReportScreenTab('list');
              }}
            />
          </div>
        ) : null}

        <FormCard title={dailyReportLabels.listTodaySummary}>
          <HistoryList
            items={latestDailyReports}
            emptyLabel={pickText(t, 'worker_no_data', 'No data yet')}
            renderItem={(item) => (
              <HistoryCard
                title={`${item.area || '-'} • ${item.workerCount || 0}`}
                detail={`${item.projectName || '-'} • ${item.reportDate || '-'} • ${formatDateTime(item.updatedAt || item.createdAt, locale)}`}
                status="submitted"
                imageData={item.attachments?.find((entry) => entry.kind === 'photo')?.imageData || ''}
              />
            )}
          />
        </FormCard>
      </SinglePurposeScreen>
    );
  };
  const renderBody = () => {
    if (activeScreen === SCREEN_WORK_REPORTS) return renderWorkReportsScreen();
    if (activeScreen === SCREEN_PHOTO) return renderPhotoScreen();
    if (activeScreen === SCREEN_VOICE) return renderVoiceScreen();
    if (activeScreen === SCREEN_DELIVERY) return renderRequestScreen();
    if (activeScreen === SCREEN_REQUEST) return renderRequestScreen();
    if (activeScreen === SCREEN_PAYMENT) return renderPaymentScreen();
    if (activeScreen === SCREEN_MILESTONE) return renderMilestoneScreen();
    if (activeScreen === SCREEN_DAILY_REPORT) return renderDailyReportScreen();
    if (activeScreen === SCREEN_ISSUE) return renderIssueScreen();
    if (activeScreen === SCREEN_CHAT) return renderChatScreen();
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
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => openScreen(SCREEN_PROFILE)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/90 active:scale-95" aria-label={pickText(t, 'worker_profile_title', 'Profile')}>
                <UserCircle2 className="h-5 w-5" />
              </button>
              <button onClick={() => onNavigate('landing')} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/90 active:scale-95">×</button>
            </div>
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

        <div className="pointer-events-auto relative z-0 flex-1 overflow-y-auto px-4 pb-6 pt-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8rem)' }}>
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

        <div className="pointer-events-auto sticky bottom-0 z-40 border-t border-slate-200 bg-white/98 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.95rem)] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/90">
          <div className="grid grid-cols-4 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeTab && activeScreen === activeTab;
              return (
                <button key={item.id} type="button" onClick={() => setTabScreen(item.id)} className={`min-h-16 rounded-2xl px-2 py-3 text-center touch-manipulation ${active ? 'bg-blue-700 text-white' : 'text-slate-500'}`}>
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
        <button type="button" aria-label={pickText(t, 'common_back', 'Back')} onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-[0.98]">
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
      {title ? <div className="mb-3 text-base font-semibold text-slate-900">{title}</div> : null}
      {children}
    </div>
  );
}

function ActionListCard({ title, helper, icon: Icon, tone = 'blue', onClick }) {
  const toneClass = tone === 'emerald'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : tone === 'slate'
        ? 'border-slate-200 bg-slate-50 text-slate-900'
        : 'border-blue-200 bg-blue-50 text-blue-900';
  const iconClass = tone === 'emerald'
    ? 'bg-emerald-600 text-white'
    : tone === 'amber'
      ? 'bg-amber-500 text-slate-950'
      : tone === 'slate'
        ? 'bg-slate-900 text-white'
        : 'bg-blue-700 text-white';

  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-4 rounded-[1.5rem] border p-4 text-left shadow-sm transition hover:shadow-md active:scale-[0.99] ${toneClass}`}>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold leading-tight">{title}</div>
        <div className="mt-1 text-sm leading-6 text-slate-600">{helper}</div>
      </div>
    </button>
  );
}

function MobileSelectField({
  value,
  onChange,
  options,
  placeholder = '',
  disabled = false,
  compact = false,
  allowEmpty = true,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => String(option.value) === String(value)) || null;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const triggerClassName = compact
    ? 'worker-locale-safe worker-mobile-dropdown-trigger worker-mobile-dropdown-trigger-compact'
    : 'worker-locale-safe worker-mobile-dropdown-trigger';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-disabled={disabled}
        data-selected-value={value || ''}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={triggerClassName}
      >
        <span className={`worker-locale-safe block min-w-0 flex-1 truncate text-left ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled ? (
        <div id={listboxId} role="listbox" className="worker-mobile-dropdown-panel absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-[1.25rem] border border-slate-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
          {allowEmpty ? (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              data-selected={!value ? 'true' : 'false'}
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="worker-locale-safe worker-mobile-dropdown-option"
            >
              {placeholder}
            </button>
          ) : null}
          {options.map((option) => {
            const active = String(option.value) === String(value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                data-selected={active ? 'true' : 'false'}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="worker-locale-safe worker-mobile-dropdown-option"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CompactSelectCreateField({
  label,
  value,
  onSelect,
  options,
  selectPlaceholder,
  createLabel,
  createValue,
  onCreateValueChange,
  onCreate,
  createPlaceholder,
  actionLabel,
  cancelLabel,
  helperText = '',
  accent = 'blue',
  addOpen = false,
  onToggleAdd,
  disabled = false,
}) {
  const toneClasses = accent === 'emerald'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : accent === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';
  const selectOptions = options.map((option) => ({ value: option, label: option }));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="worker-locale-safe text-sm font-semibold text-slate-700">{label}</div>
        <button
          type="button"
          onClick={onToggleAdd}
          className={`worker-mobile-chip inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-[0_6px_16px_rgba(15,23,42,0.08)] touch-manipulation ${toneClasses}`}
          aria-label={`Add ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <MobileSelectField
        value={value}
        onChange={onSelect}
        options={selectOptions}
        placeholder={selectPlaceholder}
        disabled={disabled}
      />
      {helperText ? <div className="worker-locale-safe mt-2 px-1 text-[12px] text-slate-500">{helperText}</div> : null}
      {addOpen ? (
        <div className="mt-3 rounded-[1.2rem] border border-slate-200 bg-slate-50/95 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div className="worker-locale-safe text-xs font-semibold text-slate-500">{createLabel}</div>
          <div className="mt-3 flex flex-col gap-2">
          <input
            value={createValue}
            onChange={(event) => onCreateValueChange(event.target.value)}
            placeholder={createPlaceholder}
            className="worker-locale-safe worker-mobile-input min-h-12 flex-1 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCreate}
              className={`worker-locale-safe min-h-12 rounded-2xl border px-4 py-2.5 text-sm font-semibold touch-manipulation ${toneClasses}`}
            >
              {actionLabel}
            </button>
            <button
              type="button"
              onClick={onToggleAdd}
              className="worker-locale-safe min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 touch-manipulation"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
        </div>
      ) : null}
    </div>
  );
}

function SelectorPillGroup({ label, options, value, onChange, emptyLabel, disabled = false }) {
  return (
    <div>
      <div className="worker-locale-safe mb-2 text-sm font-semibold text-slate-700">{label}</div>
      {options.length ? (
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option.value)}
                className={`worker-locale-safe worker-mobile-pill rounded-2xl border px-3 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed touch-manipulation ${active ? 'border-blue-600 bg-blue-700 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400'}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className={`worker-locale-safe rounded-2xl border px-4 py-3 text-sm ${disabled ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

function MultiPhotoPicker({
  photos,
  onChange,
  onRemove,
  label,
  helperText,
  cameraLabel,
  galleryLabel,
  removeLabel,
  countLabel,
  loading = false,
  disabled = false,
}) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  return (
    <div className={`rounded-[1.3rem] border border-dashed p-4 ${disabled ? 'border-slate-200 bg-slate-100' : 'border-slate-300 bg-slate-50'}`}>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" multiple data-testid="batch-camera-input" />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={onChange} className="hidden" multiple data-testid="batch-gallery-input" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="worker-locale-safe text-sm font-semibold text-slate-800">{label}</div>
          <div className="worker-locale-safe mt-1 text-xs text-slate-500">{helperText}</div>
        </div>
        <div className={`worker-mobile-chip worker-locale-safe rounded-full px-3 py-1 text-xs font-semibold ${photos.length ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500'}`}>
          {countLabel}: {photos.length}
        </div>
      </div>
      {photos.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white">
              <img src={photo.imageData} alt={`${label} ${index + 1}`} className="h-28 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0 text-xs text-slate-500">#{index + 1}</div>
                <button type="button" onClick={() => onRemove(photo.id)} className="worker-locale-safe inline-flex min-h-10 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                  {removeLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-center rounded-[1.2rem] bg-white px-4 py-8 text-slate-400">
          <Camera className="h-8 w-8" />
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={loading || disabled}
          onClick={() => cameraInputRef.current?.click()}
          className="worker-photo-action worker-locale-safe inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {cameraLabel}
        </button>
        <button
          type="button"
          disabled={loading || disabled}
          onClick={() => galleryInputRef.current?.click()}
          className="worker-photo-action worker-locale-safe inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          <FileImage className="h-4 w-4" />
          {galleryLabel}
        </button>
      </div>
    </div>
  );
}

function PhotoBatchCard({ item, updatedLabel, statusLabel, emptyNoteLabel, locale, countLabel, voiceLabel }) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{item.batchTitle || item.workType || '-'}</div>
          <div className="mt-1 text-sm text-slate-600">{item.projectName || '-'} • {item.roomName || '-'}</div>
          <div className="mt-1 text-xs text-slate-500">{item.workSubcategory || item.tradeTeam || '-'}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBatchCardTone(item.status)}`}>{statusLabel}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="rounded-xl bg-white px-3 py-2">
          <div>{item.workType || '-'}</div>
          <div className="mt-1 font-semibold text-slate-900">{item.photoCount || item.photos?.length || 0} {countLabel}</div>
        </div>
        <div className="rounded-xl bg-white px-3 py-2">
          <div>{updatedLabel}</div>
          <div className="mt-1 font-semibold text-slate-900">{formatDateTime(item.updatedAt || item.submittedAt, locale)}</div>
        </div>
      </div>
      <div className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-500">
        <div>{voiceLabel}</div>
        <div className="mt-1 font-semibold text-slate-900">{item.voiceNote ? formatDuration(item.voiceNote.durationMs || 0) : '-'}</div>
      </div>
      <div className="mt-3 text-sm text-slate-600">{item.notes ? item.notes.slice(0, 96) : emptyNoteLabel}</div>
      {item.photos?.length ? <img src={item.photos[0].imageData} alt={item.batchTitle || item.workType || 'batch'} className="mt-3 h-28 w-full rounded-2xl object-cover" /> : null}
      {item.voiceNote?.audioData ? <audio controls src={item.voiceNote.audioData} className="mt-3 w-full" /> : null}
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

function FilePicker({ imageData, onChange, onRemove, label, helperText, cameraLabel, galleryLabel, removeLabel, loading = false, optional = false, t, testIdPrefix = 'file-picker' }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  return (
    <div className="mt-3 rounded-[1.3rem] border border-dashed border-slate-300 bg-slate-50 p-4">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" data-testid={`${testIdPrefix}-camera-input`} />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={onChange} className="hidden" data-testid={`${testIdPrefix}-gallery-input`} />
      {imageData ? <img src={imageData} alt={label} className="mx-auto mb-3 max-h-44 w-full rounded-2xl object-cover" /> : <Camera className="mx-auto h-8 w-8 text-slate-400" />}
      <div className="worker-locale-safe text-center text-sm font-medium text-slate-700">{label}</div>
      <div className="worker-locale-safe mt-1 text-center text-xs text-slate-500">{helperText || (optional ? pickText(t, 'worker_optional_label', 'Optional') : pickText(t, 'worker_required_label', 'Required'))}</div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" disabled={loading} onClick={() => cameraInputRef.current?.click()} className="worker-photo-action worker-locale-safe inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {cameraLabel}
        </button>
        <button type="button" disabled={loading} onClick={() => galleryInputRef.current?.click()} className="worker-photo-action worker-locale-safe inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
          <FileImage className="h-4 w-4" />
          {galleryLabel}
        </button>
      </div>
      <button type="button" disabled={!imageData || loading} onClick={onRemove} className="worker-photo-action worker-locale-safe mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400">
        {removeLabel}
      </button>
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
    <button onClick={onClick} disabled={disabled || loading} className={`min-h-[92px] rounded-[1.35rem] border px-4 py-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed touch-manipulation ${className}`}>
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

















