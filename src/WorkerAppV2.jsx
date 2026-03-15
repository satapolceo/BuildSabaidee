import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Camera,
  CheckCircle2,
  ClipboardCheck,
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
import { compressImageFile, DATA_SAVER_DEFAULTS, formatBytes } from './imageDataSaver';
import {
  TAB_HOME,
  TAB_TASKS,
  TAB_ACTIVITY,
  TAB_PROFILE,
  SCREEN_HOME,
  SCREEN_TASKS,
  SCREEN_ACTIVITY,
  SCREEN_PROFILE,
  SCREEN_PHOTO,
  SCREEN_VOICE,
  SCREEN_REQUEST,
  SCREEN_ISSUE,
  SCREEN_DELIVERY,
  SCREEN_PAYMENT,
  SCREEN_MILESTONE,
  createWorkerNavItems,
  createWorkerActionButtons,
  getLocalizedConstructionTaskCategoryOptions,
  getLocalizedConstructionAreaZoneOptions,
} from './workerMobileMenuConfig';

const defaultPhotoBatch = {
  projectId: '',
  projectName: '',
  taskCategory: '',
  areaZone: '',
  workType: '',
  tradeTeam: '',
  roomId: '',
  roomName: '',
  batchTitle: '',
  notes: '',
  photos: [],
  voiceNote: null,
  status: 'draft',
};
const defaultIssueForm = { category: 'safety', urgency: 'high', detail: '', imageData: '', imageStats: null, originalName: '' };
const defaultRequestForm = { itemName: '', quantity: '1', unit: 'piece', note: '', taskCategory: '', areaZone: '', imageData: '', imageStats: null, originalName: '' };
const defaultPaymentForm = { amount: '', taskCategory: '', areaZone: '', note: '' };
const defaultMilestoneForm = { taskCategory: '', areaZone: '', progress: '', note: '', photos: [] };

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
        areaZoneLabel: 'พื้นที่ / โซน',
        taskCategoryPlaceholder: 'เลือกหมวดงาน',
        areaZonePlaceholder: 'เลือกพื้นที่ / โซน',
        addTaskCategoryLabel: 'เพิ่มหมวดงานเอง',
        addAreaZoneLabel: 'เพิ่มพื้นที่เอง',
        addOptionAction: 'เพิ่มรายการ',
        customInputPlaceholder: 'พิมพ์แล้วเพิ่มเข้ารายการ',
        photoFlowHelper: 'โฟลว์มือถือแบบย่อ: เลือกหมวดงาน, พื้นที่, แนบรูป, ส่งงาน',
        projectAutoSelected: 'เลือกโครงการจากไซต์ที่รับผิดชอบให้อัตโนมัติ เพื่อลดขั้นตอนบนมือถือ',
        quickSubmitTitle: 'อัปเดตส่งงาน',
        quickIssueTitle: 'แจ้งปัญหาของขาด',
        quickDeliveryTitle: 'ส่งสินค้าเข้าไซต์งาน',
        quickEquipmentTitle: 'ขอเบิกอุปกรณ์ / เครื่องมือ',
        quickPaymentTitle: 'ขอเบิกเงิน',
        quickMilestoneTitle: 'ส่งงานงวดงาน',
        quickIssueHelper: 'แจ้งของขาดหรือปัญหาหน้างานทันที',
        quickDeliveryHelper: 'บันทึกรับสินค้าหรือของเข้าไซต์งาน',
        quickEquipmentHelper: 'ขอเบิกอุปกรณ์หรือเครื่องมือสำหรับงาน',
        quickPaymentHelper: 'ส่งคำขอเบิกเงินตามหมวดงานและพื้นที่',
        quickMilestoneHelper: 'ส่งความคืบหน้างวดงานพร้อมรูปและหมายเหตุ',
        editableUpdateAction: 'อัปเดตรายการที่เลือก',
        editableSelectedHelper: 'เลือกจากรายการ หรือพิมพ์ค่าใหม่เพื่อเพิ่ม/แก้ได้ทันที',
        requestItemPlaceholder: 'รายการหลัก',
        requestQuantityPlaceholder: 'จำนวน',
        requestUnitPlaceholder: 'หน่วย',
        requestNotePlaceholder: 'รายละเอียดเพิ่มเติม',
        requestPhotoHelper: 'แนบรูปประกอบได้เมื่อจำเป็น',
        requestSubmitAction: 'ส่งรายการ',
        requestRecentTitle: 'รายการล่าสุด',
        requestDeliveryScreenTitle: 'ส่งสินค้าเข้าไซต์งาน',
        requestDeliveryScreenDesc: 'บันทึกของเข้าไซต์พร้อมหมวดงานและพื้นที่จริง',
        requestEquipmentScreenTitle: 'ขอเบิกอุปกรณ์ / เครื่องมือ',
        requestEquipmentScreenDesc: 'ส่งคำขออุปกรณ์พร้อมหมวดงานและพื้นที่ใช้งาน',
        paymentScreenTitle: 'ขอเบิกเงิน',
        paymentScreenDesc: 'กรอกจำนวน หมวดงาน และพื้นที่ เพื่อส่งคำขอเบิกเงิน',
        paymentAmountLabel: 'จำนวนเงิน',
        paymentAmountPlaceholder: 'กรอกจำนวนเงิน',
        paymentSubmitAction: 'ส่งคำขอเบิกเงิน',
        paymentRecentTitle: 'ประวัติขอเบิกเงิน',
        paymentSaved: 'ส่งคำขอเบิกเงินแล้ว',
        milestoneScreenTitle: 'ส่งงานงวดงาน',
        milestoneScreenDesc: 'อัปเดตความคืบหน้า พร้อมรูป และหมายเหตุของงวดงาน',
        milestoneProgressLabel: 'ความคืบหน้า (%)',
        milestoneProgressPlaceholder: 'เช่น 45',
        milestoneSubmitAction: 'ส่งงวดงาน',
        milestoneRecentTitle: 'ประวัติส่งงวดงาน',
        milestoneSaved: 'ส่งงวดงานแล้ว',
        requestSavedDelivery: 'บันทึกรับสินค้าเข้าไซต์แล้ว',
        requestSavedEquipment: 'ส่งคำขออุปกรณ์ / เครื่องมือแล้ว',
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
          areaZoneLabel: 'ພື້ນທີ່ / ໂຊນ',
          taskCategoryPlaceholder: 'ເລືອກໝວດວຽກ',
          areaZonePlaceholder: 'ເລືອກພື້ນທີ່ / ໂຊນ',
          addTaskCategoryLabel: 'ເພີ່ມໝວດວຽກເອງ',
          addAreaZoneLabel: 'ເພີ່ມພື້ນທີ່ເອງ',
          addOptionAction: 'ເພີ່ມລາຍການ',
          customInputPlaceholder: 'ພິມແລ້ວເພີ່ມເຂົ້າລາຍການ',
          photoFlowHelper: 'ໂຟລວ໌ມືຖືແບບຍໍ້: ເລືອກໝວດວຽກ, ພື້ນທີ່, ແນບຮູບ, ສົ່ງງານ',
          projectAutoSelected: 'ເລືອກໂຄງການໃຫ້ອັດຕະໂນມັດຈາກໄຊທ໌ທີ່ຮັບຜິດຊອບ ເພື່ອຫຼຸດຂັ້ນຕອນໃນມືຖື',
          quickSubmitTitle: 'ອັບເດດສົ່ງງານ',
          quickIssueTitle: 'ແຈ້ງບັນຫາຂອງຂາດ',
          quickDeliveryTitle: 'ສົ່ງສິນຄ້າເຂົ້າໄຊງານ',
          quickEquipmentTitle: 'ຂໍເບີກອຸປະກອນ / ເຄື່ອງມື',
          quickPaymentTitle: 'ຂໍເບີກເງິນ',
          quickMilestoneTitle: 'ສົ່ງວຽກຕາມງວດ',
          quickIssueHelper: 'ແຈ້ງຂອງຂາດ ຫຼື ບັນຫາໜ້າງານໄດ້ທັນທີ',
          quickDeliveryHelper: 'ບັນທຶກການຮັບສິນຄ້າເຂົ້າໄຊງານ',
          quickEquipmentHelper: 'ຂໍເບີກອຸປະກອນ ຫຼື ເຄື່ອງມືສຳລັບວຽກ',
          quickPaymentHelper: 'ສົ່ງຄຳຂໍເບີກເງິນຕາມໝວດວຽກ ແລະ ພື້ນທີ່',
          quickMilestoneHelper: 'ສົ່ງຄວາມຄືບໜ້າຕາມງວດພ້ອມຮູບ ແລະ ໝາຍເຫດ',
          editableUpdateAction: 'ອັບເດດລາຍການທີ່ເລືອກ',
          editableSelectedHelper: 'ເລືອກຈາກລາຍການ ຫຼື ພິມຄ່າໃໝ່ເພື່ອເພີ່ມ/ແກ້ໄຂໄດ້ທັນທີ',
          requestItemPlaceholder: 'ລາຍການຫຼັກ',
          requestQuantityPlaceholder: 'ຈຳນວນ',
          requestUnitPlaceholder: 'ໜ່ວຍ',
          requestNotePlaceholder: 'ລາຍລະອຽດເພີ່ມ',
          requestPhotoHelper: 'ສາມາດແນບຮູບເພີ່ມເມື່ອຈຳເປັນ',
          requestSubmitAction: 'ສົ່ງລາຍການ',
          requestRecentTitle: 'ລາຍການຫຼ້າສຸດ',
          requestDeliveryScreenTitle: 'ສົ່ງສິນຄ້າເຂົ້າໄຊງານ',
          requestDeliveryScreenDesc: 'ບັນທຶກຂອງເຂົ້າໄຊພ້ອມໝວດວຽກ ແລະ ພື້ນທີ່ຈິງ',
          requestEquipmentScreenTitle: 'ຂໍເບີກອຸປະກອນ / ເຄື່ອງມື',
          requestEquipmentScreenDesc: 'ສົ່ງຄຳຂໍອຸປະກອນພ້ອມໝວດວຽກ ແລະ ພື້ນທີ່ໃຊ້ງານ',
          paymentScreenTitle: 'ຂໍເບີກເງິນ',
          paymentScreenDesc: 'ກອກຈຳນວນ ໝວດວຽກ ແລະ ພື້ນທີ່ ເພື່ອສົ່ງຄຳຂໍເບີກເງິນ',
          paymentAmountLabel: 'ຈຳນວນເງິນ',
          paymentAmountPlaceholder: 'ກອກຈຳນວນເງິນ',
          paymentSubmitAction: 'ສົ່ງຄຳຂໍເບີກເງິນ',
          paymentRecentTitle: 'ປະຫວັດຂໍເບີກເງິນ',
          paymentSaved: 'ສົ່ງຄຳຂໍເບີກເງິນແລ້ວ',
          milestoneScreenTitle: 'ສົ່ງວຽກຕາມງວດ',
          milestoneScreenDesc: 'ອັບເດດຄວາມຄືບໜ້າພ້ອມຮູບ ແລະ ໝາຍເຫດຂອງງວດງານ',
          milestoneProgressLabel: 'ຄວາມຄືບໜ້າ (%)',
          milestoneProgressPlaceholder: 'ຕົວຢ່າງ 45',
          milestoneSubmitAction: 'ສົ່ງງວດງານ',
          milestoneRecentTitle: 'ປະຫວັດສົ່ງງວດງານ',
          milestoneSaved: 'ສົ່ງງວດງານແລ້ວ',
          requestSavedDelivery: 'ບັນທຶກສິນຄ້າເຂົ້າໄຊແລ້ວ',
          requestSavedEquipment: 'ສົ່ງຄຳຂໍອຸປະກອນ / ເຄື່ອງມືແລ້ວ',
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
          areaZoneLabel: 'Zone / Area',
          taskCategoryPlaceholder: 'Select task category',
          areaZonePlaceholder: 'Select zone / area',
          addTaskCategoryLabel: 'Add your own task category',
          addAreaZoneLabel: 'Add your own zone / area',
          addOptionAction: 'Add option',
          customInputPlaceholder: 'Type a new option',
          photoFlowHelper: 'Simplified mobile flow: choose task category, area, attach photos, submit',
          projectAutoSelected: 'The assigned project is selected automatically to reduce mobile steps',
          quickSubmitTitle: 'Update Submission',
          quickIssueTitle: 'Report Missing Items',
          quickDeliveryTitle: 'Send Goods To Site',
          quickEquipmentTitle: 'Request Equipment / Tools',
          quickPaymentTitle: 'Request Payment',
          quickMilestoneTitle: 'Submit Work by Milestone',
          quickIssueHelper: 'Report shortages or on-site issues right away',
          quickDeliveryHelper: 'Log goods and stock moving into the site',
          quickEquipmentHelper: 'Request equipment or tools needed for work',
          quickPaymentHelper: 'Submit a payment request by task category and work zone',
          quickMilestoneHelper: 'Send milestone progress with photos and notes',
          editableUpdateAction: 'Update selected option',
          editableSelectedHelper: 'Pick from the list or type a new value to add/update it instantly',
          requestItemPlaceholder: 'Main item',
          requestQuantityPlaceholder: 'Quantity',
          requestUnitPlaceholder: 'Unit',
          requestNotePlaceholder: 'Extra details',
          requestPhotoHelper: 'Attach a supporting photo when needed',
          requestSubmitAction: 'Send entry',
          requestRecentTitle: 'Recent entries',
          requestDeliveryScreenTitle: 'Send Goods To Site',
          requestDeliveryScreenDesc: 'Log incoming goods with the real task category and work area',
          requestEquipmentScreenTitle: 'Request Equipment / Tools',
          requestEquipmentScreenDesc: 'Send equipment requests with the real task category and work area',
          paymentScreenTitle: 'Request Payment',
          paymentScreenDesc: 'Enter amount, task category, and zone before submitting the payment request',
          paymentAmountLabel: 'Amount',
          paymentAmountPlaceholder: 'Enter amount',
          paymentSubmitAction: 'Submit payment request',
          paymentRecentTitle: 'Recent payment requests',
          paymentSaved: 'Payment request submitted',
          milestoneScreenTitle: 'Submit Work by Milestone',
          milestoneScreenDesc: 'Update milestone progress with photos and notes',
          milestoneProgressLabel: 'Progress (%)',
          milestoneProgressPlaceholder: 'Example 45',
          milestoneSubmitAction: 'Submit milestone',
          milestoneRecentTitle: 'Recent milestone submissions',
          milestoneSaved: 'Milestone submitted',
          requestSavedDelivery: 'Goods received at site',
          requestSavedEquipment: 'Equipment / tools request sent',
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
  const [batchVoiceError, setBatchVoiceError] = useState('');
  const [isBatchRecordingVoice, setIsBatchRecordingVoice] = useState(false);
  const [isBatchVoiceProcessing, setIsBatchVoiceProcessing] = useState(false);
  const [projectBatchOptions, setProjectBatchOptions] = useState({ workTypes: [], tradeTeams: [], rooms: [] });
  const [isProjectBatchOptionsLoading, setIsProjectBatchOptionsLoading] = useState(false);
  const [customTaskCategories, setCustomTaskCategories] = useState([]);
  const [customAreaZones, setCustomAreaZones] = useState([]);
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newAreaZone, setNewAreaZone] = useState('');

  const [attendanceRecords, setAttendanceRecords] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.attendance, []));
  const [photoReports, setPhotoReports] = useState(() =>
    loadFromStorage(WORKER_STORAGE_KEYS.photoReports, []).map(normalizePhotoSubmissionBatch).filter(Boolean)
  );
  const [voiceNotes, setVoiceNotes] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.voiceNotes, []));
  const [issues, setIssues] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.issues, []));
  const [materialRequests, setMaterialRequests] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.materialRequests, []));
  const [paymentRequests, setPaymentRequests] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.paymentRequests, []));
  const [milestoneSubmissions, setMilestoneSubmissions] = useState(() => loadFromStorage(WORKER_STORAGE_KEYS.milestoneSubmissions, []));
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
  const [requestMode, setRequestMode] = useState('equipment');
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const recordingModeRef = useRef('voice-screen');
  const canRecordVoice = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined';

  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.attendance, attendanceRecords), [attendanceRecords]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.photoReports, photoReports), [photoReports]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.voiceNotes, voiceNotes), [voiceNotes]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.issues, issues), [issues]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.materialRequests, materialRequests), [materialRequests]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.paymentRequests, paymentRequests), [paymentRequests]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.milestoneSubmissions, milestoneSubmissions), [milestoneSubmissions]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => saveToStorage(WORKER_STORAGE_KEYS.tasks, tasks), [tasks]);

  useEffect(() => {
    setPhotoReports((current) => current.map(normalizePhotoSubmissionBatch).filter(Boolean));
  }, []);

  useEffect(() => {
    setTasks(getWorkerTasks(loadFromStorage(WORKER_STORAGE_KEYS.tasks, []), currentWorker.id, siteName));
  }, [currentWorker.id, siteName]);

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
  }, [projectBatchOptions, projectsList]);

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
    return Array.from(new Set([...getLocalizedConstructionTaskCategoryOptions(language), ...projectCategories, ...customTaskCategories]));
  }, [customTaskCategories, language, workTypeOptions]);
  const areaZoneOptions = useMemo(() => {
    const projectAreas = roomOptions.map((option) => option.label).filter(Boolean);
    return Array.from(new Set([...getLocalizedConstructionAreaZoneOptions(language), ...projectAreas, ...customAreaZones]));
  }, [customAreaZones, language, roomOptions]);

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
  }, [attendanceRecords, currentWorker.id, latestIssues, latestMilestones, latestPaymentRequests, latestPhotoReports, latestRequests, latestVoiceNotes, locale, localCopy.quickMilestoneTitle, localCopy.quickPaymentTitle, localCopy.voiceSaved, siteName, t]);

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

  const setPhotoBatchField = (field, value) => {
    setPhotoBatchForm((current) => ({ ...current, [field]: value, status: 'draft' }));
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
      workType: nextValue,
      tradeTeam: current.tradeTeam || 'General Crew',
      status: 'draft',
    }));
    setRequestForm((current) => ({ ...current, taskCategory: nextValue }));
    setPaymentForm((current) => ({ ...current, taskCategory: nextValue }));
    setMilestoneForm((current) => ({ ...current, taskCategory: nextValue }));
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

  const addTaskCategoryOption = () => {
    const nextValue = newTaskCategory.trim();
    if (!nextValue) return;
    setCustomTaskCategories((current) => Array.from(new Set([...current, nextValue])));
    handleTaskCategoryChange(nextValue);
    setNewTaskCategory('');
  };

  const updateTaskCategoryOption = () => {
    const nextValue = newTaskCategory.trim();
    const currentValue = photoBatchForm.taskCategory.trim();
    if (!nextValue || !currentValue) return;
    setCustomTaskCategories((current) => {
      const filtered = current.filter((option) => option !== currentValue);
      return Array.from(new Set([...filtered, nextValue]));
    });
    handleTaskCategoryChange(nextValue);
    setNewTaskCategory('');
  };

  const addAreaZoneOption = () => {
    const nextValue = newAreaZone.trim();
    if (!nextValue) return;
    setCustomAreaZones((current) => Array.from(new Set([...current, nextValue])));
    handleAreaZoneChange(nextValue);
    setNewAreaZone('');
  };

  const updateAreaZoneOption = () => {
    const nextValue = newAreaZone.trim();
    const currentValue = photoBatchForm.areaZone.trim();
    if (!nextValue || !currentValue) return;
    setCustomAreaZones((current) => {
      const filtered = current.filter((option) => option !== currentValue);
      return Array.from(new Set([...filtered, nextValue]));
    });
    handleAreaZoneChange(nextValue);
    setNewAreaZone('');
  };

  const handleBatchPhotoChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    await withBusyAction('photo-upload', async () => {
      const nextPhotos = [];
      for (const file of files) {
        const { imageData, stats } = await compressImageFile(file, settings);
        nextPhotos.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          imageData,
          imageStats: stats,
          originalName: file.name || '',
          capturedAt: Date.now(),
        });
      }

      setPhotoBatchForm((current) => ({
        ...current,
        photos: [...current.photos, ...nextPhotos],
        status: 'draft',
      }));
      setToast(localCopy.photoCaptured);
    });

    event.target.value = '';
  };

  const removeBatchPhoto = (photoId) => {
    setPhotoBatchForm((current) => ({
      ...current,
      photos: current.photos.filter((photo) => photo.id !== photoId),
      status: 'draft',
    }));
    setToast(localCopy.photoRemoved);
  };

  const resetPhotoBatchForm = () => {
    setPhotoBatchForm(createDefaultPhotoBatchForm(getPreferredProject(projectsList, currentProject)));
    setBatchVoiceError('');
    setIsBatchRecordingVoice(false);
    setIsBatchVoiceProcessing(false);
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
      setPhotoReports((current) => [...current, record]);
      resetPhotoBatchForm();
      setToast(nextStatus === 'draft' ? localCopy.photoBatchSaved : localCopy.photoBatchSubmitted);
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

    setMaterialRequests((current) => [...current, record]);
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
      projectName: photoBatchForm.projectName || siteName,
      amount: Number(paymentForm.amount),
      taskCategory: paymentForm.taskCategory,
      areaZone: paymentForm.areaZone,
      note: paymentForm.note,
    });

    setPaymentRequests((current) => [...current, record]);
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

      setMilestoneSubmissions((current) => [...current, record]);
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

  const startAudioRecording = async (mode = 'voice-screen') => {
    setValidationError('');
    if (mode === 'batch') {
      setBatchVoiceError('');
    } else {
      setVoiceError('');
    }
    if (!canUseWorkActions) {
      setValidationError(localCopy.gateHelper);
      return;
    }
    if (!canRecordVoice) {
      if (mode === 'batch') setBatchVoiceError(localCopy.voiceFallback);
      else setVoiceError(localCopy.voiceFallback);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      recordingModeRef.current = mode;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const activeMode = recordingModeRef.current;
        setIsRecordingVoice(false);
        setIsBatchRecordingVoice(false);
        if (activeMode === 'batch') setIsBatchVoiceProcessing(true);
        else setIsVoiceProcessing(true);

        try {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioData = await readBlobAsDataUrl(audioBlob);
          const durationMs = Date.now() - recordingStartedAtRef.current;

          if (activeMode === 'batch') {
            setPhotoBatchForm((current) => ({
              ...current,
              voiceNote: {
                id: `batch_voice_${Date.now()}`,
                audioData,
                durationMs,
                mimeType,
                recordedAt: Date.now(),
                source: 'inline',
              },
              status: 'draft',
            }));
            setToast(localCopy.batchVoiceSaved);
          } else {
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
          }
        } catch (error) {
          console.error('Voice note processing failed:', error);
          if (activeMode === 'batch') setBatchVoiceError(localCopy.batchVoiceProcessing);
          else setVoiceError(localCopy.voiceProcessing);
        } finally {
          if (activeMode === 'batch') setIsBatchVoiceProcessing(false);
          else setIsVoiceProcessing(false);
          stream.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
          recordingModeRef.current = 'voice-screen';
        }
      };

      recorder.start();
      if (mode === 'batch') setIsBatchRecordingVoice(true);
      else setIsRecordingVoice(true);
    } catch (error) {
      console.error('Voice recording failed:', error);
      if (mode === 'batch') {
        setBatchVoiceError(localCopy.voicePermission);
        setIsBatchRecordingVoice(false);
      } else {
        setVoiceError(localCopy.voicePermission);
        setIsRecordingVoice(false);
      }
    }
  };

  const startVoiceRecording = () => startAudioRecording('voice-screen');
  const startBatchVoiceRecording = () => startAudioRecording('batch');

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const deleteBatchVoiceNote = () => {
    setPhotoBatchForm((current) => ({ ...current, voiceNote: null, status: 'draft' }));
    setBatchVoiceError('');
    setToast(localCopy.batchVoiceRemoved);
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
      profile: UserCircle2,
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
      activeScreen,
      isRecordingVoice,
      isVoiceProcessing,
      busyAction,
      screenPhoto: SCREEN_PHOTO,
      screenVoice: SCREEN_VOICE,
      screenIssue: SCREEN_ISSUE,
      screenDelivery: SCREEN_DELIVERY,
      screenRequest: SCREEN_REQUEST,
      screenPayment: SCREEN_PAYMENT,
      screenMilestone: SCREEN_MILESTONE,
      roomName: photoBatchForm.areaZone || photoBatchForm.roomName,
    },
    handlers: {
      onCheckIn: () => handleAttendance('checkin'),
      onCheckOut: () => handleAttendance('checkout'),
      onPhoto: () => openScreen(SCREEN_PHOTO, localCopy.openPhoto),
      onVoice: () => openScreen(SCREEN_VOICE, localCopy.openVoice),
      onIssue: () => openScreen(SCREEN_ISSUE),
      onDelivery: () => openRequestScreen('delivery'),
      onEquipment: () => openRequestScreen('equipment'),
      onPayment: openPaymentScreen,
      onMilestone: openMilestoneScreen,
    },
    icons: {
      checkin: CheckCircle2,
      checkout: Clock3,
      photo: Camera,
      voice: Mic,
      issue: AlertTriangle,
      delivery: Package,
      equipment: ClipboardList,
      payment: Banknote,
      milestone: ClipboardCheck,
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
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
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
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {isCheckedOut ? localCopy.doneHelper : isCheckedIn ? localCopy.readyHelper : localCopy.gateHelper}
          </div>
        </div>
      </section>

      <section className="pointer-events-auto sticky bottom-4 z-20 -mx-1 rounded-[1.8rem] border border-slate-200/80 bg-white/95 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
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
    const totalOriginalBytes = photoBatchForm.photos.reduce((total, photo) => total + Number(photo.imageStats?.originalBytes || 0), 0);
    const totalCompressedBytes = photoBatchForm.photos.reduce((total, photo) => total + Number(photo.imageStats?.compressedBytes || 0), 0);
    const batchStatusLabel = isBatchRecordingVoice
      ? localCopy.batchVoiceRecording
      : isBatchVoiceProcessing
        ? localCopy.batchVoiceProcessing
        : photoBatchForm.voiceNote
          ? `${localCopy.batchVoiceAttachedCount} • ${formatDuration(photoBatchForm.voiceNote.durationMs || 0)}`
          : localCopy.batchVoiceMissing;

    return (
      <SinglePurposeScreen
        title={pickText(t, 'worker_photo_screen_title', 'Submit Work Photo')}
        subtitle={localCopy.photoDesc}
        onBack={goBack}
        t={t}
      >
        <DataSaverCard settings={settings} setSettings={setSettings} t={t} compact />
        <FormCard title={pickText(t, 'worker_photo_batch_setup', 'Work Submission Batch')}>
          <div className={`rounded-[1.3rem] border px-4 py-3 text-sm ${isProjectBatchOptionsLoading ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
            {isProjectBatchOptionsLoading ? localCopy.batchProjectDataLoading : localCopy.photoFlowHelper}
          </div>
          {(photoBatchForm.taskCategory || photoBatchForm.areaZone) ? (
            <div className="mt-3 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {photoBatchForm.projectName || '-'} • {photoBatchForm.taskCategory || '-'} • {photoBatchForm.areaZone || '-'}
            </div>
          ) : null}
          <div className="mt-4 space-y-4">
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{pickText(t, 'label_name', 'Project')}</div>
              <div className="mt-2 text-base font-semibold text-slate-900">{photoBatchForm.projectName || siteName}</div>
              <div className="mt-1 text-sm text-slate-500">{localCopy.projectAutoSelected}</div>
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">{pickText(t, 'label_name', 'Project')}</div>
              <select
                value={photoBatchForm.projectId}
                onChange={(event) => handleBatchProjectChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none focus:border-blue-500"
              >
                {projectsList.map((project) => (
                  <option key={project.id} value={String(project.id)}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <SelectorPillGroup
              label={pickText(t, 'worker_work_type', 'Work Type')}
              options={workTypeOptions}
              value={photoBatchForm.workType}
              onChange={(value) => handleBatchOptionChange('workType', value)}
              emptyLabel={localCopy.batchNoProjectData}
              disabled={isProjectBatchOptionsLoading}
            />
            <SelectorPillGroup
              label={pickText(t, 'worker_trade_team', 'Team')}
              options={tradeTeamOptions}
              value={photoBatchForm.tradeTeam}
              onChange={(value) => handleBatchOptionChange('tradeTeam', value)}
              emptyLabel={photoBatchForm.workType ? localCopy.batchNoProjectData : localCopy.batchFilterTrade}
              disabled={isProjectBatchOptionsLoading || !photoBatchForm.workType}
            />
            <SelectorPillGroup
              label={pickText(t, 'worker_room', 'Room')}
              options={roomOptions}
              value={photoBatchForm.roomId}
              onChange={(value) => handleBatchOptionChange('roomId', value)}
              emptyLabel={photoBatchForm.tradeTeam ? localCopy.batchNoProjectData : localCopy.batchFilterRoom}
              disabled={isProjectBatchOptionsLoading || !photoBatchForm.tradeTeam}
            />
            <DropdownCreateField
              label={localCopy.taskCategoryLabel}
              value={photoBatchForm.taskCategory}
              onSelect={handleTaskCategoryChange}
              options={taskCategoryOptions}
              selectPlaceholder={localCopy.taskCategoryPlaceholder}
              createLabel={localCopy.addTaskCategoryLabel}
              createValue={newTaskCategory}
              onCreateValueChange={setNewTaskCategory}
              onCreate={addTaskCategoryOption}
              onUpdate={updateTaskCategoryOption}
              createPlaceholder={localCopy.customInputPlaceholder}
              actionLabel={localCopy.addOptionAction}
              updateLabel={localCopy.editableUpdateAction}
              helperText={localCopy.editableSelectedHelper}
              accent="blue"
            />
            <DropdownCreateField
              label={localCopy.areaZoneLabel}
              value={photoBatchForm.areaZone}
              onSelect={handleAreaZoneChange}
              options={areaZoneOptions}
              selectPlaceholder={localCopy.areaZonePlaceholder}
              createLabel={localCopy.addAreaZoneLabel}
              createValue={newAreaZone}
              onCreateValueChange={setNewAreaZone}
              onCreate={addAreaZoneOption}
              onUpdate={updateAreaZoneOption}
              createPlaceholder={localCopy.customInputPlaceholder}
              actionLabel={localCopy.addOptionAction}
              updateLabel={localCopy.editableUpdateAction}
              helperText={localCopy.editableSelectedHelper}
              accent="emerald"
            />
            <input
              value={photoBatchForm.batchTitle}
              onChange={(event) => setPhotoBatchField('batchTitle', event.target.value)}
              placeholder={pickText(t, 'worker_batch_title', 'Short title (optional)')}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
            />
            <textarea
              value={photoBatchForm.notes}
              onChange={(event) => setPhotoBatchField('notes', event.target.value)}
              placeholder={pickText(t, 'worker_report_details', 'Details')}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
            />
          </div>
        </FormCard>

        <FormCard title={pickText(t, 'worker_report_photo', 'Photos')}>
          <MultiPhotoPicker
            photos={photoBatchForm.photos}
            onChange={handleBatchPhotoChange}
            onRemove={removeBatchPhoto}
            label={pickText(t, 'worker_report_photo', 'Photos')}
            helperText={batchReadyForPhotos ? localCopy.batchPhotoHelp : localCopy.batchSelectionHelp}
            actionLabel={localCopy.photoPick}
            retakeLabel={localCopy.photoRetake}
            removeLabel={localCopy.photoRemove}
            countLabel={localCopy.photoBatchCount}
            loading={busyAction === 'photo-upload'}
            disabled={!batchReadyForPhotos}
          />
          {photoBatchForm.photos.length ? (
            <div className="mt-3 rounded-[1.2rem] bg-blue-50 p-3 text-sm text-blue-900">
              <div className="font-semibold">{pickText(t, 'worker_auto_data_saver', 'The app automatically optimizes files to save data')}</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white px-3 py-2">
                  <div className="text-slate-500">{pickText(t, 'worker_original_file_size', 'Original file size')}</div>
                  <div className="mt-1 font-semibold text-slate-900">{formatBytes(totalOriginalBytes)}</div>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <div className="text-slate-500">{pickText(t, 'worker_compressed_file_size', 'Compressed size')}</div>
                  <div className="mt-1 font-semibold text-slate-900">{formatBytes(totalCompressedBytes)}</div>
                </div>
              </div>
            </div>
          ) : null}
          <div className={`mt-3 rounded-[1.3rem] border p-4 ${isBatchRecordingVoice ? 'border-rose-300 bg-rose-50 shadow-[0_0_0_1px_rgba(244,63,94,0.14)]' : photoBatchForm.voiceNote ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start gap-3">
              <div className={`rounded-2xl p-3 ${isBatchRecordingVoice ? 'bg-rose-100 text-rose-700' : photoBatchForm.voiceNote ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                <Mic className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{localCopy.batchInlineVoice}</div>
                <div className="mt-1 text-sm text-slate-600">{batchStatusLabel}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isBatchRecordingVoice ? 'bg-rose-100 text-rose-700' : isBatchVoiceProcessing ? 'bg-amber-100 text-amber-800' : photoBatchForm.voiceNote ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {isBatchRecordingVoice ? localCopy.recording : isBatchVoiceProcessing ? localCopy.batchVoiceProcessing : photoBatchForm.voiceNote ? localCopy.batchVoiceAttachedCount : localCopy.batchVoiceReady}
                  </span>
                  {photoBatchForm.voiceNote?.durationMs ? (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                      {formatDuration(photoBatchForm.voiceNote.durationMs)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button onClick={startBatchVoiceRecording} disabled={!canOpenWorkerTools || !canRecordVoice || isBatchRecordingVoice || isBatchVoiceProcessing} className={`inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed ${isBatchRecordingVoice ? 'bg-rose-500' : 'bg-slate-900'} disabled:bg-slate-300`}>
                <Mic className="h-4 w-4" />
                {localCopy.batchVoiceStart}
              </button>
              <button onClick={stopVoiceRecording} disabled={!isBatchRecordingVoice} className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-200">
                <Square className="h-4 w-4" />
                {localCopy.batchVoiceStop}
              </button>
            </div>
            {photoBatchForm.voiceNote ? <audio controls src={photoBatchForm.voiceNote.audioData} className="mt-3 w-full" /> : null}
            <button onClick={deleteBatchVoiceNote} disabled={!photoBatchForm.voiceNote || isBatchRecordingVoice || isBatchVoiceProcessing} className="mt-3 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
              <Trash2 className="h-4 w-4" />
              {localCopy.batchVoiceDelete}
            </button>
            {batchVoiceError ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{batchVoiceError}</div> : null}
          </div>
        </FormCard>

        <FormCard title={pickText(t, 'worker_batch_preview', 'Batch Preview')}>
          <PhotoBatchCard
            item={{
              id: 'draft-preview',
              batchTitle: photoBatchForm.batchTitle || `${localCopy.batchTitleAuto} • ${photoBatchForm.taskCategory || '-'}`,
              projectName: photoBatchForm.projectName || getProjectNameById(projectsList, photoBatchForm.projectId) || '-',
              workType: photoBatchForm.taskCategory,
              tradeTeam: photoBatchForm.tradeTeam || 'General Crew',
              roomName: photoBatchForm.areaZone,
              notes: photoBatchForm.notes,
              photoCount: photoBatchForm.photos.length,
              status: photoBatchForm.status,
              voiceNote: photoBatchForm.voiceNote,
              updatedAt: Date.now(),
            }}
            updatedLabel={localCopy.batchUpdated}
            statusLabel={formatBatchStatusLabel(photoBatchForm.status, language)}
            emptyNoteLabel={pickText(t, 'worker_no_data', 'No data yet')}
            locale={locale}
            countLabel={localCopy.photoBatchCount}
            voiceLabel={localCopy.batchVoiceAttachedCount}
          />
          {(isBatchRecordingVoice || isBatchVoiceProcessing) ? (
            <div className={`mt-3 rounded-[1.2rem] border px-4 py-3 text-sm ${isBatchRecordingVoice ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {isBatchRecordingVoice ? localCopy.batchVoiceRecording : localCopy.batchVoiceProcessing}
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button onClick={() => submitPhotoBatch('draft')} disabled={!batchReadyForPhotos || busyAction === 'photo-draft' || busyAction === 'photo-submit'} className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
              {busyAction === 'photo-draft' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
              {localCopy.batchDraftAction}
            </button>
            <button onClick={() => submitPhotoBatch('submitted')} disabled={!batchReadyForPhotos || !photoBatchForm.photos.length || busyAction === 'photo-draft' || busyAction === 'photo-submit'} className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300">
              {busyAction === 'photo-submit' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {localCopy.batchSubmitAction}
            </button>
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
          <DropdownCreateField
            label={localCopy.taskCategoryLabel}
            value={requestForm.taskCategory}
            onSelect={(value) => setRequestForm((current) => ({ ...current, taskCategory: value }))}
            options={taskCategoryOptions}
            selectPlaceholder={localCopy.taskCategoryPlaceholder}
            createLabel={localCopy.addTaskCategoryLabel}
            createValue={newTaskCategory}
            onCreateValueChange={setNewTaskCategory}
            onCreate={addTaskCategoryOption}
            onUpdate={updateTaskCategoryOption}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.addOptionAction}
            updateLabel={localCopy.editableUpdateAction}
            helperText={localCopy.editableSelectedHelper}
            accent="blue"
          />
          <DropdownCreateField
            label={localCopy.areaZoneLabel}
            value={requestForm.areaZone}
            onSelect={(value) => setRequestForm((current) => ({ ...current, areaZone: value }))}
            options={areaZoneOptions}
            selectPlaceholder={localCopy.areaZonePlaceholder}
            createLabel={localCopy.addAreaZoneLabel}
            createValue={newAreaZone}
            onCreateValueChange={setNewAreaZone}
            onCreate={addAreaZoneOption}
            onUpdate={updateAreaZoneOption}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.addOptionAction}
            updateLabel={localCopy.editableUpdateAction}
            helperText={localCopy.editableSelectedHelper}
            accent="emerald"
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
          <textarea
            value={requestForm.note}
            onChange={(event) => setRequestForm((current) => ({ ...current, note: event.target.value }))}
            placeholder={localCopy.requestNotePlaceholder}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
          />
        </div>
        <FilePicker imageData={requestForm.imageData} onChange={(event) => handleFileChange(event, setRequestForm)} onRemove={() => clearImageForm(setRequestForm)} label={pickText(t, 'worker_req_photo_cta', 'Attach photo')} helperText={localCopy.requestPhotoHelper} actionLabel={localCopy.photoPick} retakeLabel={localCopy.photoRetake} removeLabel={localCopy.photoRemove} loading={busyAction === 'photo-upload'} optional t={t} />
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
          <DropdownCreateField
            label={localCopy.taskCategoryLabel}
            value={paymentForm.taskCategory}
            onSelect={(value) => setPaymentForm((current) => ({ ...current, taskCategory: value }))}
            options={taskCategoryOptions}
            selectPlaceholder={localCopy.taskCategoryPlaceholder}
            createLabel={localCopy.addTaskCategoryLabel}
            createValue={newTaskCategory}
            onCreateValueChange={setNewTaskCategory}
            onCreate={addTaskCategoryOption}
            onUpdate={updateTaskCategoryOption}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.addOptionAction}
            updateLabel={localCopy.editableUpdateAction}
            helperText={localCopy.editableSelectedHelper}
            accent="blue"
          />
          <DropdownCreateField
            label={localCopy.areaZoneLabel}
            value={paymentForm.areaZone}
            onSelect={(value) => setPaymentForm((current) => ({ ...current, areaZone: value }))}
            options={areaZoneOptions}
            selectPlaceholder={localCopy.areaZonePlaceholder}
            createLabel={localCopy.addAreaZoneLabel}
            createValue={newAreaZone}
            onCreateValueChange={setNewAreaZone}
            onCreate={addAreaZoneOption}
            onUpdate={updateAreaZoneOption}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.addOptionAction}
            updateLabel={localCopy.editableUpdateAction}
            helperText={localCopy.editableSelectedHelper}
            accent="emerald"
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
          <DropdownCreateField
            label={localCopy.taskCategoryLabel}
            value={milestoneForm.taskCategory}
            onSelect={(value) => setMilestoneForm((current) => ({ ...current, taskCategory: value }))}
            options={taskCategoryOptions}
            selectPlaceholder={localCopy.taskCategoryPlaceholder}
            createLabel={localCopy.addTaskCategoryLabel}
            createValue={newTaskCategory}
            onCreateValueChange={setNewTaskCategory}
            onCreate={addTaskCategoryOption}
            onUpdate={updateTaskCategoryOption}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.addOptionAction}
            updateLabel={localCopy.editableUpdateAction}
            helperText={localCopy.editableSelectedHelper}
            accent="blue"
          />
          <DropdownCreateField
            label={localCopy.areaZoneLabel}
            value={milestoneForm.areaZone}
            onSelect={(value) => setMilestoneForm((current) => ({ ...current, areaZone: value }))}
            options={areaZoneOptions}
            selectPlaceholder={localCopy.areaZonePlaceholder}
            createLabel={localCopy.addAreaZoneLabel}
            createValue={newAreaZone}
            onCreateValueChange={setNewAreaZone}
            onCreate={addAreaZoneOption}
            onUpdate={updateAreaZoneOption}
            createPlaceholder={localCopy.customInputPlaceholder}
            actionLabel={localCopy.addOptionAction}
            updateLabel={localCopy.editableUpdateAction}
            helperText={localCopy.editableSelectedHelper}
            accent="emerald"
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
            actionLabel={localCopy.photoPick}
            retakeLabel={localCopy.photoRetake}
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
    if (activeScreen === SCREEN_DELIVERY) return renderRequestScreen();
    if (activeScreen === SCREEN_REQUEST) return renderRequestScreen();
    if (activeScreen === SCREEN_PAYMENT) return renderPaymentScreen();
    if (activeScreen === SCREEN_MILESTONE) return renderMilestoneScreen();
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
      <div className="mb-3 text-base font-semibold text-slate-900">{title}</div>
      {children}
    </div>
  );
}

function DropdownCreateField({
  label,
  value,
  onSelect,
  options,
  selectPlaceholder,
  createLabel,
  createValue,
  onCreateValueChange,
  onCreate,
  onUpdate,
  createPlaceholder,
  actionLabel,
  updateLabel,
  helperText = '',
  accent = 'blue',
}) {
  const toneClasses = accent === 'emerald'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-blue-200 bg-blue-50 text-blue-700';

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>
      <select
        value={value}
        onChange={(event) => onSelect(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none focus:border-blue-500"
      >
        <option value="">{selectPlaceholder}</option>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </select>
      {helperText ? <div className="mt-2 text-xs text-slate-500">{helperText}</div> : null}
      <div className="mt-3 rounded-[1.3rem] border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm font-semibold text-slate-700">{createLabel}</div>
        <div className="mt-3 flex flex-col gap-3">
          <input
            value={createValue}
            onChange={(event) => onCreateValueChange(event.target.value)}
            placeholder={createPlaceholder}
            className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-blue-500"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCreate}
              className={`min-h-12 rounded-2xl border px-5 py-3 text-sm font-semibold touch-manipulation ${toneClasses}`}
            >
              {actionLabel}
            </button>
            <button
              type="button"
              onClick={onUpdate}
              disabled={!value}
              className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 touch-manipulation disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {updateLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectorPillGroup({ label, options, value, onChange, emptyLabel, disabled = false }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>
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
                className={`min-h-12 rounded-2xl border px-3 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed touch-manipulation ${active ? 'border-blue-600 bg-blue-700 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400'}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${disabled ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
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
  actionLabel,
  retakeLabel,
  removeLabel,
  countLabel,
  loading = false,
  disabled = false,
}) {
  const inputRef = useRef(null);

  return (
    <div className={`rounded-[1.3rem] border border-dashed p-4 ${disabled ? 'border-slate-200 bg-slate-100' : 'border-slate-300 bg-slate-50'}`}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" multiple />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">{label}</div>
          <div className="mt-1 text-xs text-slate-500">{helperText}</div>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${photos.length ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500'}`}>
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
                <button type="button" onClick={() => onRemove(photo.id)} className="inline-flex min-h-10 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
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
      <button
        type="button"
        disabled={loading || disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-4 inline-flex min-h-12 w-full touch-manipulation items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : photos.length ? retakeLabel : actionLabel}
      </button>
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
          <div className="mt-1 text-xs text-slate-500">{item.tradeTeam || '-'}</div>
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
