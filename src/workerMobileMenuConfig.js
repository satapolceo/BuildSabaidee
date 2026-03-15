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
export const SCREEN_DELIVERY = 'delivery';
export const SCREEN_PAYMENT = 'payment';
export const SCREEN_MILESTONE = 'milestone';

export const workerNavItemDefs = [
  { id: TAB_HOME, labelKey: 'worker_nav_home', fallback: 'Home', icon: 'home' },
  { id: TAB_TASKS, labelKey: 'worker_nav_tasks', fallback: 'My Tasks', icon: 'tasks' },
  { id: TAB_ACTIVITY, labelKey: 'worker_activity_title', fallback: 'Recent Activity', icon: 'activity' },
  { id: TAB_PROFILE, labelKey: 'worker_nav_chat', fallback: 'Profile', icon: 'profile' },
];

const sameLabel = (value) => ({ TH: value, LA: value, EN: value });

export const constructionTaskCategoryDefs = [
  { value: 'งานเตรยมพนท', labels: sameLabel('งานเตรยมพนท') },
  { value: 'งานโครงสราง', labels: sameLabel('งานโครงสราง') },
  { value: 'งานกออฐฉาบปน', labels: sameLabel('งานกออฐฉาบปน') },
  { value: 'งานหลงคา', labels: sameLabel('งานหลงคา') },
  { value: 'งานฝาเพดาน', labels: sameLabel('งานฝาเพดาน') },
  { value: 'งานพน', labels: sameLabel('งานพน') },
  { value: 'งานผนง', labels: sameLabel('งานผนง') },
  { value: 'งานประตหนาตาง', labels: sameLabel('งานประตหนาตาง') },
  { value: 'งานไฟฟา', labels: sameLabel('งานไฟฟา') },
  { value: 'งานประปา', labels: sameLabel('งานประปา') },
  { value: 'งานสขภณฑ', labels: sameLabel('งานสขภณฑ') },
  { value: 'งานแอรและระบายอากาศ', labels: sameLabel('งานแอรและระบายอากาศ') },
  { value: 'งานส', labels: sameLabel('งานส') },
  { value: 'งานบวทอน', labels: sameLabel('งานบวทอน') },
  { value: 'งานครว', labels: sameLabel('งานครว') },
  { value: 'งานภายนอกอาคาร', labels: sameLabel('งานภายนอกอาคาร') },
  { value: 'งานรวและประต', labels: sameLabel('งานรวและประต') },
  { value: 'งานภมทศน', labels: sameLabel('งานภมทศน') },
  { value: 'งานทำความสะอาด', labels: sameLabel('งานทำความสะอาด') },
  { value: 'งานแกไข/เกบงาน', labels: sameLabel('งานแกไข/เกบงาน') },
  { value: 'งานตรวจรบ', labels: sameLabel('งานตรวจรบ') },
];

export const constructionSubcategoryPresetMap = {
  'งานเตรยมพนท': ['เคลยรพนท', 'ขนยายวสด', 'ตงแนว', 'วดระยะ', 'เตรยมจดทำงาน'],
  'งานโครงสราง': ['ขดฐานราก', 'ผกเหลก', 'ตงแบบ', 'เทคอนกรต', 'เสา', 'คาน', 'พนคอนกรต', 'บนได'],
  'งานกออฐฉาบปน': ['กอผนง', 'ฉาบผนง', 'ซอมฉาบ', 'ปรบระดบ', 'อดรอย'],
  'งานหลงคา': ['โครงหลงคา', 'มงหลงคา', 'ครอบสน', 'รางนำ', 'กนซม'],
  'งานฝาเพดาน': ['โครงฝา', 'ปดฝา', 'ซอมฝา', 'เกบรอยตอ'],
  'งานพน': ['ปกระเบอง', 'เทพน', 'ปรบระดบพน', 'ยาแนว', 'ซอมพน'],
  'งานผนง': ['กรผนง', 'ตกแตงผนง', 'ซอมผนง', 'เกบผว'],
  'งานประตหนาตาง': ['ตดตงวงกบ', 'ตดตงบานประต', 'ตดตงหนาตาง', 'ปรบตง', 'เกบซลโคน'],
  'งานไฟฟา': ['เดนทอ', 'เดนสาย', 'ตดตงปลก', 'ตดตงสวตช', 'ตดตงโคมไฟ', 'ตดตงตไฟ', 'ทดสอบระบบ'],
  'งานประปา': ['เดนทอนำด', 'เดนทอนำทง', 'ตดตงสขภณฑ', 'ตดตงปมนำ', 'ตดตงแทงกนำ', 'ทดสอบรวซม'],
  'งานสขภณฑ': ['ตดตงชกโครก', 'ตดตงอางลางหนา', 'ตดตงกอกนำ', 'ตดตงฝกบว', 'เกบซลโคน'],
  'งานแอรและระบายอากาศ': ['ตดตงแอร', 'เดนทอนำยา', 'เดนทอนำทง', 'ตดตงพดลมดดอากาศ', 'ทดสอบระบบ'],
  'งานส': ['ขดผว', 'โปว', 'รองพน', 'ทาสจรง', 'เกบงานส'],
  'งานบวทอน': ['ตดตงต', 'ตดตงชน', 'ตดตงหนาบาน', 'ปรบตง', 'เกบรายละเอยด'],
  'งานครว': ['ตดตงเคานเตอร', 'ตดตงซงก', 'ตดตงเตา', 'ตดตงฮด', 'เกบซลโคน'],
  'งานภายนอกอาคาร': ['ฉาบภายนอก', 'ทาสภายนอก', 'ปพนภายนอก', 'ตดตงกนสาด', 'เกบงานภายนอก'],
  'งานรวและประต': ['ตงเสารว', 'กอรว', 'ตดตงประตรว', 'เชอม', 'ทาส'],
  'งานภมทศน': ['ปรบดน', 'ปหญา', 'ปลกตนไม', 'วางทางเดน', 'ตดตงระบบนำ'],
  'งานทำความสะอาด': ['เกบเศษวสด', 'ลางพน', 'เชดกระจก', 'ทำความสะอาดสงมอบ'],
  'งานแกไข/เกบงาน': ['แกงาน', 'เกบรายละเอยด', 'ตรวจจดบกพรอง', 'ซอมซำ', 'สงตรวจซำ'],
  'งานตรวจรบ': ['ตรวจคณภาพ', 'ตรวจแบบ', 'ตรวจระบบ', 'ทดสอบใชงาน', 'สงมอบงาน'],
};

export const constructionAreaZoneDefs = [
  'หนาบาน',
  'หลงบาน',
  'ดานซายอาคาร',
  'ดานขวาอาคาร',
  'ทจอดรถ',
  'สวน',
  'รวหนา',
  'รวขาง',
  'ทางเดนรอบบาน',
  'ลานซกลาง',
  'จดปมนำ/แทงกนำ',
  'โถงทางเขา',
  'หองนงเลน',
  'หองรบแขก',
  'พนททานอาหาร',
  'หองครว',
  'ครวไทย',
  'ครวแพนทร',
  'หองนำชนลาง',
  'หองเกบของ',
  'หองนอนชนลาง',
  'หองแมบาน',
  'หองซกรด',
  'บนได',
  'โถงบนได',
  'โถงชนบน',
  'หองนอนใหญ',
  'หองนำหองนอนใหญ',
  'หองแตงตว',
  'หองนอน 1',
  'หองนอน 2',
  'หองนอน 3',
  'หองนำรวม',
  'ระเบยง',
  'มมนงเลนชนบน',
  'ใตหลงคา',
  'ฝาเพดาน',
  'หองเครอง',
  'ตไฟหลก',
  'จดเมนประปา',
  'จดแอร',
  'จดกลองวงจรปด',
  'จดอนเทอรเนต',
].map((value) => ({ value, labels: sameLabel(value) }));

export const standardConstructionPhraseDefs = [
  'เรมงานแลว',
  'เขางานเรยบรอย',
  'งานคบหนาตามแผน',
  'งานเสรจแลว',
  'สงรปความคบหนาแลว',
  'รอตรวจ',
  'ผานตรวจ',
  'ไมผานตรวจ',
  'รอวสด',
  'รอแบบ',
  'พนทยงไมพรอม',
  'พบปญหาหนางาน',
  'แกไขแลว',
  'ตองแกไขเพมเตม',
  'ทดสอบแลว',
  'ฝนตกทำงานตอไมได',
  'ขออนมตงานตอ',
  'ขออนมตวสดเพม',
].map((value) => ({ value, labels: sameLabel(value) }));

export function getLocalizedConstructionTaskCategoryOptions(language = 'EN') {
  return constructionTaskCategoryDefs.map((item) => item.labels[language] || item.labels.EN || item.value);
}

export function getLocalizedConstructionAreaZoneOptions(language = 'EN') {
  return constructionAreaZoneDefs.map((item) => item.labels[language] || item.labels.EN || item.value);
}

export function getLocalizedConstructionSubcategoryOptions(category, language = 'EN') {
  if (!category) return [];
  return (constructionSubcategoryPresetMap[category] || []).map((value) => sameLabel(value)[language] || value);
}

export function getLocalizedStandardConstructionPhraseOptions(language = 'EN') {
  return standardConstructionPhraseDefs.map((item) => item.labels[language] || item.labels.EN || item.value);
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
    isVoiceProcessing,
    isRecordingVoice,
    busyAction,
    screenPhoto,
    screenVoice,
    roomName,
  } = state;

  const photoHistoryHighlight = canOpenWorkerTools && todayPhotoCount > 0;
  const issueHistoryHighlight = canUseWorkActions && Boolean(state.todayIssueCount);
  const deliveryHistoryHighlight = canUseWorkActions && Boolean(state.todayDeliveryCount);
  const equipmentHistoryHighlight = canUseWorkActions && Boolean(state.todayEquipmentCount);
  const paymentHistoryHighlight = canUseWorkActions && Boolean(state.todayPaymentCount);
  const milestoneHistoryHighlight = canUseWorkActions && Boolean(state.todayMilestoneCount);

  return [
    {
      id: 'checkin',
      label: 'Check In',
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
      label: 'Check Out',
      helper: isCheckedOut ? localCopy.done : isCheckedIn ? localCopy.active : localCopy.disabled,
      icon: icons.checkout,
      tone: 'emerald',
      disabled: !isCheckedIn || isCheckedOut,
      loading: busyAction === 'checkout',
      active: isCheckedIn && !isCheckedOut,
      onClick: handlers.onCheckOut,
    },
    {
      id: 'submit',
      label: localCopy.quickSubmitTitle,
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
      label: 'Voice Notes',
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
      tone: 'slate',
      disabled: !canOpenWorkerTools,
      loading: isVoiceProcessing,
      active: activeScreen === screenVoice || isRecordingVoice || todayVoiceCount > 0,
      onClick: handlers.onVoice,
    },
    {
      id: 'issue',
      label: localCopy.quickIssueTitle,
      helper: state.todayIssueCount
        ? `${state.todayIssueCount} ${localCopy.done}`
        : !canUseWorkActions
          ? localCopy.disabled
          : localCopy.quickIssueHelper,
      icon: icons.issue,
      tone: 'amber',
      disabled: !canUseWorkActions,
      loading: busyAction === 'issue-submit',
      active: activeScreen === state.screenIssue || issueHistoryHighlight,
      onClick: handlers.onIssue,
    },
    {
      id: 'delivery',
      label: localCopy.quickDeliveryTitle,
      helper: state.todayDeliveryCount
        ? `${state.todayDeliveryCount} ${localCopy.done}`
        : !canUseWorkActions
          ? localCopy.disabled
          : localCopy.quickDeliveryHelper,
      icon: icons.delivery,
      tone: 'blue',
      disabled: !canUseWorkActions,
      loading: busyAction === 'delivery-submit',
      active: activeScreen === state.screenDelivery || deliveryHistoryHighlight,
      onClick: handlers.onDelivery,
    },
    {
      id: 'equipment',
      label: localCopy.quickEquipmentTitle,
      helper: state.todayEquipmentCount
        ? `${state.todayEquipmentCount} ${localCopy.done}`
        : !canUseWorkActions
          ? localCopy.disabled
          : localCopy.quickEquipmentHelper,
      icon: icons.equipment,
      tone: 'amber',
      disabled: !canUseWorkActions,
      loading: busyAction === 'equipment-submit',
      active: activeScreen === state.screenRequest || equipmentHistoryHighlight,
      onClick: handlers.onEquipment,
    },
    {
      id: 'payment',
      label: localCopy.quickPaymentTitle,
      helper: state.todayPaymentCount
        ? `${state.todayPaymentCount} ${localCopy.done}`
        : !canUseWorkActions
          ? localCopy.disabled
          : localCopy.quickPaymentHelper,
      icon: icons.payment,
      tone: 'emerald',
      disabled: !canUseWorkActions,
      loading: busyAction === 'payment-submit',
      active: activeScreen === state.screenPayment || paymentHistoryHighlight,
      onClick: handlers.onPayment,
    },
    {
      id: 'milestone',
      label: localCopy.quickMilestoneTitle,
      helper: state.todayMilestoneCount
        ? `${state.todayMilestoneCount} ${localCopy.done}`
        : !canOpenWorkerTools
          ? hasBatchRoomSelection
            ? localCopy.disabled
            : localCopy.batchFilterRoom
          : localCopy.quickMilestoneHelper,
      icon: icons.milestone,
      tone: 'slate',
      disabled: !canOpenWorkerTools,
      loading: busyAction === 'milestone-submit' || busyAction === 'milestone-upload',
      active: activeScreen === state.screenMilestone || milestoneHistoryHighlight,
      onClick: handlers.onMilestone,
    },
  ];
}
