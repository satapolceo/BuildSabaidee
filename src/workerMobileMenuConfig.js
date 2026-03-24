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
  { value: 'งานเตรียมพื้นที่', labels: sameLabel('งานเตรียมพื้นที่') },
  { value: 'งานโครงสร้าง', labels: sameLabel('งานโครงสร้าง') },
  { value: 'งานก่ออิฐฉาบปูน', labels: sameLabel('งานก่ออิฐฉาบปูน') },
  { value: 'งานหลังคา', labels: sameLabel('งานหลังคา') },
  { value: 'งานฝ้าเพดาน', labels: sameLabel('งานฝ้าเพดาน') },
  { value: 'งานพื้น', labels: sameLabel('งานพื้น') },
  { value: 'งานผนัง', labels: sameLabel('งานผนัง') },
  { value: 'งานประตูหน้าต่าง', labels: sameLabel('งานประตูหน้าต่าง') },
  { value: 'งานไฟฟ้า', labels: sameLabel('งานไฟฟ้า') },
  { value: 'งานประปา', labels: sameLabel('งานประปา') },
  { value: 'งานสุขภัณฑ์', labels: sameLabel('งานสุขภัณฑ์') },
  { value: 'งานแอร์และระบายอากาศ', labels: sameLabel('งานแอร์และระบายอากาศ') },
  { value: 'งานสี', labels: sameLabel('งานสี') },
  { value: 'งานบิวท์อิน', labels: sameLabel('งานบิวท์อิน') },
  { value: 'งานครัว', labels: sameLabel('งานครัว') },
  { value: 'งานภายนอกอาคาร', labels: sameLabel('งานภายนอกอาคาร') },
  { value: 'งานรั้วและประตู', labels: sameLabel('งานรั้วและประตู') },
  { value: 'งานภูมิทัศน์', labels: sameLabel('งานภูมิทัศน์') },
  { value: 'งานทำความสะอาด', labels: sameLabel('งานทำความสะอาด') },
  { value: 'งานแก้ไข/เก็บงาน', labels: sameLabel('งานแก้ไข/เก็บงาน') },
  { value: 'งานตรวจรับ', labels: sameLabel('งานตรวจรับ') },
];

export const constructionSubcategoryPresetMap = {
  'งานเตรียมพื้นที่': ['เคลียร์พื้นที่', 'ขนย้ายวัสดุ', 'ตั้งแนว', 'วัดระยะ', 'เตรียมจุดทำงาน'],
  'งานโครงสร้าง': ['ขุดฐานราก', 'ผูกเหล็ก', 'ตั้งแบบ', 'เทคอนกรีต', 'เสา', 'คาน', 'พื้นคอนกรีต', 'บันได'],
  'งานก่ออิฐฉาบปูน': ['ก่อผนัง', 'ฉาบผนัง', 'ซ่อมฉาบ', 'ปรับระดับ', 'อุดรอย'],
  'งานหลังคา': ['โครงหลังคา', 'มุงหลังคา', 'ครอบสัน', 'รางน้ำ', 'กันซึม'],
  'งานฝ้าเพดาน': ['โครงฝ้า', 'ปิดฝ้า', 'ซ่อมฝ้า', 'เก็บรอยต่อ'],
  'งานพื้น': ['ปูกระเบื้อง', 'เทพื้น', 'ปรับระดับพื้น', 'ยาแนว', 'ซ่อมพื้น'],
  'งานผนัง': ['กรุผนัง', 'ตกแต่งผนัง', 'ซ่อมผนัง', 'เก็บผิว'],
  'งานประตูหน้าต่าง': ['ติดตั้งวงกบ', 'ติดตั้งบานประตู', 'ติดตั้งหน้าต่าง', 'ปรับตั้ง', 'เก็บซิลิโคน'],
  'งานไฟฟ้า': ['เดินท่อ', 'เดินสาย', 'ติดตั้งปลั๊ก', 'ติดตั้งสวิตช์', 'ติดตั้งโคมไฟ', 'ติดตั้งตู้ไฟ', 'ทดสอบระบบ'],
  'งานประปา': ['เดินท่อน้ำดี', 'เดินท่อน้ำทิ้ง', 'ติดตั้งสุขภัณฑ์', 'ติดตั้งปั๊มน้ำ', 'ติดตั้งแท็งก์น้ำ', 'ทดสอบรั่วซึม'],
  'งานสุขภัณฑ์': ['ติดตั้งชักโครก', 'ติดตั้งอ่างล้างหน้า', 'ติดตั้งก๊อกน้ำ', 'ติดตั้งฝักบัว', 'เก็บซิลิโคน'],
  'งานแอร์และระบายอากาศ': ['ติดตั้งแอร์', 'เดินท่อน้ำยา', 'เดินท่อน้ำทิ้ง', 'ติดตั้งพัดลมดูดอากาศ', 'ทดสอบระบบ'],
  'งานสี': ['ขัดผิว', 'โป๊ว', 'รองพื้น', 'ทาสีจริง', 'เก็บงานสี'],
  'งานบิวท์อิน': ['ติดตั้งตู้', 'ติดตั้งชั้น', 'ติดตั้งหน้าบาน', 'ปรับตั้ง', 'เก็บรายละเอียด'],
  'งานครัว': ['ติดตั้งเคาน์เตอร์', 'ติดตั้งซิงก์', 'ติดตั้งเตา', 'ติดตั้งฮูด', 'เก็บซิลิโคน'],
  'งานภายนอกอาคาร': ['ฉาบภายนอก', 'ทาสีภายนอก', 'ปูพื้นภายนอก', 'ติดตั้งกันสาด', 'เก็บงานภายนอก'],
  'งานรั้วและประตู': ['ตั้งเสารั้ว', 'ก่อรั้ว', 'ติดตั้งประตูรั้ว', 'เชื่อม', 'ทาสี'],
  'งานภูมิทัศน์': ['ปรับดิน', 'ปูหญ้า', 'ปลูกต้นไม้', 'วางทางเดิน', 'ติดตั้งระบบน้ำ'],
  'งานทำความสะอาด': ['เก็บเศษวัสดุ', 'ล้างพื้น', 'เช็ดกระจก', 'ทำความสะอาดส่งมอบ'],
  'งานแก้ไข/เก็บงาน': ['แก้งาน', 'เก็บรายละเอียด', 'ตรวจจุดบกพร่อง', 'ซ่อมซ้ำ', 'ส่งตรวจซ้ำ'],
  'งานตรวจรับ': ['ตรวจคุณภาพ', 'ตรวจแบบ', 'ตรวจระบบ', 'ทดสอบใช้งาน', 'ส่งมอบงาน'],
};

export const constructionAreaZoneDefs = [
  'หน้าบ้าน',
  'หลังบ้าน',
  'ด้านซ้ายอาคาร',
  'ด้านขวาอาคาร',
  'ที่จอดรถ',
  'สวน',
  'รั้วหน้า',
  'รั้วข้าง',
  'ทางเดินรอบบ้าน',
  'ลานซักล้าง',
  'จุดปั๊มน้ำ/แท็งก์น้ำ',
  'โถงทางเข้า',
  'ห้องนั่งเล่น',
  'ห้องรับแขก',
  'พื้นที่ทานอาหาร',
  'ห้องครัว',
  'ครัวไทย',
  'ครัวแพนทรี่',
  'ห้องน้ำชั้นล่าง',
  'ห้องเก็บของ',
  'ห้องนอนชั้นล่าง',
  'ห้องแม่บ้าน',
  'ห้องซักรีด',
  'บันได',
  'โถงบันได',
  'โถงชั้นบน',
  'ห้องนอนใหญ่',
  'ห้องน้ำห้องนอนใหญ่',
  'ห้องแต่งตัว',
  'ห้องนอน 1',
  'ห้องนอน 2',
  'ห้องนอน 3',
  'ห้องน้ำรวม',
  'ระเบียง',
  'มุมนั่งเล่นชั้นบน',
  'ใต้หลังคา',
  'ฝ้าเพดาน',
  'ห้องเครื่อง',
  'ตู้ไฟหลัก',
  'จุดเมนประปา',
  'จุดแอร์',
  'จุดกล้องวงจรปิด',
  'จุดอินเทอร์เน็ต',
].map((value) => ({ value, labels: sameLabel(value) }));

export const standardConstructionPhraseDefs = [
  'เริ่มงานแล้ว',
  'เข้างานเรียบร้อย',
  'งานคืบหน้าตามแผน',
  'งานเสร็จแล้ว',
  'ส่งรูปความคืบหน้าแล้ว',
  'รอตรวจ',
  'ผ่านตรวจ',
  'ไม่ผ่านตรวจ',
  'รอวัสดุ',
  'รอแบบ',
  'พื้นที่ยังไม่พร้อม',
  'พบปัญหาหน้างาน',
  'แก้ไขแล้ว',
  'ต้องแก้ไขเพิ่มเติม',
  'ทดสอบแล้ว',
  'ฝนตกทำงานต่อไม่ได้',
  'ขออนุมัติงานต่อ',
  'ขออนุมัติวัสดุเพิ่ม',
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
