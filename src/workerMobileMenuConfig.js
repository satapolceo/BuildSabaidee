export const TAB_HOME = 'home';
export const TAB_TASKS = 'tasks';
export const TAB_ACTIVITY = 'activity';
export const TAB_PROFILE = 'profile';

export const SCREEN_HOME = 'home';
export const SCREEN_TASKS = 'tasks';
export const SCREEN_ACTIVITY = 'activity';
export const SCREEN_PROFILE = 'profile';
export const SCREEN_PHOTO = 'photo';
export const SCREEN_VOICE = 'voice';
export const SCREEN_REQUEST = 'request';
export const SCREEN_ISSUE = 'issue';

export const workerNavItemDefs = [
  { id: TAB_HOME, labelKey: 'worker_nav_home', fallback: 'Home', icon: 'home' },
  { id: TAB_TASKS, labelKey: 'worker_nav_tasks', fallback: 'My Tasks', icon: 'tasks' },
  { id: TAB_ACTIVITY, labelKey: 'worker_activity_title', fallback: 'Recent Activity', icon: 'activity' },
  { id: TAB_PROFILE, labelKey: 'worker_nav_chat', fallback: 'Profile', icon: 'profile' },
];

export const constructionTaskCategoryDefs = [
  { value: 'foundation', labels: { EN: 'Foundation', TH: 'ฐานราก', LA: 'ຖານຮາກ' } },
  { value: 'structure', labels: { EN: 'Structure', TH: 'โครงสร้าง', LA: 'ໂຄງສ້າງ' } },
  { value: 'concrete', labels: { EN: 'Concrete', TH: 'คอนกรีต', LA: 'ຄອນກຣີດ' } },
  { value: 'rebar', labels: { EN: 'Rebar', TH: 'เหล็กเสริม', LA: 'ເຫຼັກເສີມ' } },
  { value: 'formwork', labels: { EN: 'Formwork', TH: 'แบบหล่อ', LA: 'ແບບຫຼໍ່' } },
  { value: 'masonry', labels: { EN: 'Masonry', TH: 'งานก่อ', LA: 'ວຽກກໍ່' } },
  { value: 'electrical', labels: { EN: 'Electrical', TH: 'ไฟฟ้า', LA: 'ໄຟຟ້າ' } },
  { value: 'plumbing', labels: { EN: 'Plumbing', TH: 'ประปา', LA: 'ປະປາ' } },
  { value: 'hvac', labels: { EN: 'HVAC', TH: 'ปรับอากาศ', LA: 'ລະບົບອາກາດ' } },
  { value: 'waterproofing', labels: { EN: 'Waterproofing', TH: 'กันซึม', LA: 'ກັນຊຶມ' } },
  { value: 'ceiling', labels: { EN: 'Ceiling', TH: 'ฝ้าเพดาน', LA: 'ຝ້າເພດານ' } },
  { value: 'flooring', labels: { EN: 'Flooring', TH: 'พื้น', LA: 'ພື້ນ' } },
  { value: 'painting', labels: { EN: 'Painting', TH: 'ทาสี', LA: 'ທາສີ' } },
  { value: 'finishing', labels: { EN: 'Finishing', TH: 'เก็บงาน', LA: 'ເກັບງານ' } },
  { value: 'inspection', labels: { EN: 'Inspection', TH: 'ตรวจงาน', LA: 'ກວດງານ' } },
  { value: 'safety', labels: { EN: 'Safety', TH: 'ความปลอดภัย', LA: 'ຄວາມປອດໄພ' } },
];

export const constructionAreaZoneDefs = [
  { value: 'zone_a', labels: { EN: 'Zone A', TH: 'โซน A', LA: 'ໂຊນ A' } },
  { value: 'zone_b', labels: { EN: 'Zone B', TH: 'โซน B', LA: 'ໂຊນ B' } },
  { value: 'north_wing', labels: { EN: 'North Wing', TH: 'ปีกเหนือ', LA: 'ປີກເໜືອ' } },
  { value: 'south_wing', labels: { EN: 'South Wing', TH: 'ปีกใต้', LA: 'ປີກໃຕ້' } },
  { value: 'east_wing', labels: { EN: 'East Wing', TH: 'ปีกตะวันออก', LA: 'ປີກຕາເວັນອອກ' } },
  { value: 'west_wing', labels: { EN: 'West Wing', TH: 'ปีกตะวันตก', LA: 'ປີກຕາເວັນຕົກ' } },
  { value: 'basement', labels: { EN: 'Basement', TH: 'ชั้นใต้ดิน', LA: 'ຊັ້ນໃຕ້ດິນ' } },
  { value: 'ground_floor', labels: { EN: 'Ground Floor', TH: 'ชั้นล่าง', LA: 'ຊັ້ນລຸ່ມ' } },
  { value: 'level_1', labels: { EN: 'Level 1', TH: 'ชั้น 1', LA: 'ຊັ້ນ 1' } },
  { value: 'level_2', labels: { EN: 'Level 2', TH: 'ชั้น 2', LA: 'ຊັ້ນ 2' } },
  { value: 'roof', labels: { EN: 'Roof', TH: 'ดาดฟ้า', LA: 'ດາດຟ້າ' } },
  { value: 'lobby', labels: { EN: 'Lobby', TH: 'ล็อบบี้', LA: 'ລັອບບີ້' } },
];

export function getLocalizedConstructionTaskCategoryOptions(language = 'EN') {
  return constructionTaskCategoryDefs.map((item) => item.labels[language] || item.labels.EN);
}

export function getLocalizedConstructionAreaZoneOptions(language = 'EN') {
  return constructionAreaZoneDefs.map((item) => item.labels[language] || item.labels.EN);
}

export function createWorkerNavItems({ t, pickText, iconMap }) {
  return workerNavItemDefs.map((item) => ({
    id: item.id,
    label: pickText(t, item.labelKey, item.fallback),
    icon: iconMap[item.icon],
  }));
}

export function createWorkerActionButtons({
  t,
  pickText,
  localCopy,
  state,
  handlers,
  icons,
}) {
  const {
    isCheckedIn,
    isCheckedOut,
    canUseWorkActions,
    canOpenWorkerTools,
    isProjectBatchOptionsLoading,
    hasBatchRoomSelection,
    todayBatchCount,
    todayPhotoCount,
    todayVoiceCount,
    activeScreen,
    isRecordingVoice,
    busyAction,
    screenPhoto,
    screenVoice,
    roomName,
  } = state;

  const photoHistoryHighlight = canOpenWorkerTools && todayPhotoCount > 0;
  const voiceHistoryHighlight = canOpenWorkerTools && todayVoiceCount > 0;

  return [
    {
      id: 'checkin',
      label: 'Check-in',
      helper: isCheckedIn ? localCopy.done : localCopy.ready,
      icon: icons.checkin,
      tone: 'blue',
      disabled: isCheckedIn,
      loading: busyAction === 'checkin',
      active: !isCheckedIn,
      onClick: handlers.onCheckIn,
    },
    {
      id: 'checkout',
      label: 'Check-out',
      helper: isCheckedOut ? localCopy.done : isCheckedIn ? localCopy.active : localCopy.disabled,
      icon: icons.checkout,
      tone: 'emerald',
      disabled: !isCheckedIn || isCheckedOut,
      loading: busyAction === 'checkout',
      active: isCheckedIn && !isCheckedOut,
      onClick: handlers.onCheckOut,
    },
    {
      id: 'photo',
      label: 'Photo',
      helper: todayPhotoCount > 0
        ? `${todayBatchCount} / ${todayPhotoCount} ${localCopy.photoBatchCount}`
        : !canUseWorkActions
          ? localCopy.disabled
          : isProjectBatchOptionsLoading
            ? localCopy.batchProjectDataLoading
            : hasBatchRoomSelection
              ? `${localCopy.active} • ${roomName}`
              : localCopy.batchFilterRoom,
      icon: icons.photo,
      tone: 'slate',
      disabled: !canOpenWorkerTools,
      loading: busyAction === 'photo-upload' || busyAction === 'photo-submit' || busyAction === 'photo-draft',
      active: activeScreen === screenPhoto || photoHistoryHighlight,
      onClick: handlers.onPhoto,
    },
    {
      id: 'voice',
      label: 'Voice',
      helper: isRecordingVoice
        ? localCopy.recording
        : todayVoiceCount > 0
          ? `${todayVoiceCount} ${localCopy.done}`
          : !canUseWorkActions
            ? localCopy.disabled
            : isProjectBatchOptionsLoading
              ? localCopy.batchProjectDataLoading
              : hasBatchRoomSelection
                ? `${localCopy.active} • ${roomName}`
                : localCopy.batchFilterRoom,
      icon: icons.voice,
      tone: 'amber',
      disabled: !canOpenWorkerTools,
      loading: Boolean(state.isVoiceProcessing),
      active: activeScreen === screenVoice || isRecordingVoice || voiceHistoryHighlight,
      onClick: handlers.onVoice,
    },
  ];
}
