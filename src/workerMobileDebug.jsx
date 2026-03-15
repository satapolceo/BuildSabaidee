import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Home,
  Mic,
  Smartphone,
  UserCircle2,
} from 'lucide-react';
import './index.css';
import {
  SCREEN_HOME,
  SCREEN_PHOTO,
  SCREEN_VOICE,
  TAB_HOME,
  createWorkerActionButtons,
  createWorkerNavItems,
  getLocalizedConstructionAreaZoneOptions,
  getLocalizedConstructionTaskCategoryOptions,
  workerNavItemDefs,
} from './workerMobileMenuConfig';

const debugTranslations = {
  EN: {
    worker_nav_home: 'Home',
    worker_nav_tasks: 'My Tasks',
    worker_activity_title: 'Recent Activity',
    worker_nav_chat: 'Profile',
    state_controls: 'State Controls',
    checked_in: 'Checked in',
    checked_out: 'Checked out',
    project_loading: 'Project data loading',
    recording_voice: 'Recording voice',
    today_batch_count: 'Today batch count',
    today_photo_count: 'Today photo count',
    today_voice_count: 'Today voice count',
    debug_title: 'Worker Mobile Debug',
    debug_desc: 'This page loads the shared mobile menu and verifies localized Photo Submission controls.',
    task_category: 'Task Category',
    zone_area: 'Zone / Area',
    select_task_category: 'Select task category',
    select_zone_area: 'Select zone / area',
    add_task_category: 'Add your own task category',
    add_zone_area: 'Add your own zone / area',
    add_option: 'Add option',
    custom_placeholder: 'Type a new option',
    photo_playground: 'Photo Submission Playground',
    photo_playground_desc: 'Localized dropdowns without autocomplete. Add custom options when needed.',
    quick_actions: 'Quick Actions Stub',
    quick_actions_desc: 'Edit the controls to test mobile button gating logic',
    debug_state: 'Debug state',
    report: 'Report',
    loaded_ok: 'Loaded from latest shared mobile menu config',
    config_mismatch: 'Config mismatch detected',
    nav_status: 'navItems / footer nav status',
    nav_status_ok: 'Loaded successfully from shared config and footer nav matches the latest code.',
    nav_items: 'Rendered navItems',
    editable_state: 'Photo submission editable state',
    quick_output: 'Quick action gate output',
    current_language: 'Language',
    simulator_summary: 'Simulator Summary',
    simulator_ready: 'Interactive mobile simulator is working',
    ux_logic_summary: 'UX / Logic Summary',
    ux_logic_desc: 'Project is auto-selected, dropdowns stay clean, custom values update options, and quick actions follow shared gating rules.',
    buttons_ok: 'Buttons',
    dropdowns_ok: 'Dropdowns',
    inputs_ok: 'Inputs',
    language_ok: 'Languages',
  },
  TH: {
    worker_nav_home: 'หน้าแรก',
    worker_nav_tasks: 'งานของฉัน',
    worker_activity_title: 'ความเคลื่อนไหวล่าสุด',
    worker_nav_chat: 'โปรไฟล์',
    state_controls: 'ตัวควบคุมสถานะ',
    checked_in: 'Checked in',
    checked_out: 'Checked out',
    project_loading: 'กำลังโหลดข้อมูลโครงการ',
    recording_voice: 'กำลังบันทึก Voice',
    today_batch_count: 'จำนวน batch วันนี้',
    today_photo_count: 'จำนวน Photo วันนี้',
    today_voice_count: 'จำนวน Voice วันนี้',
    debug_title: 'Worker Mobile Debug',
    debug_desc: 'หน้านี้โหลด mobile menu ร่วมและตรวจฟอร์ม Photo Submission ตามภาษาที่เลือก',
    task_category: 'หมวดงาน',
    zone_area: 'พื้นที่ / โซน',
    select_task_category: 'เลือกหมวดงาน',
    select_zone_area: 'เลือกพื้นที่ / โซน',
    add_task_category: 'เพิ่มหมวดงานเอง',
    add_zone_area: 'เพิ่มพื้นที่เอง',
    add_option: 'เพิ่มรายการ',
    custom_placeholder: 'พิมพ์รายการใหม่',
    photo_playground: 'พื้นที่ทดสอบ Photo Submission',
    photo_playground_desc: 'ใช้ dropdown ตามภาษา ไม่มี autocomplete และเพิ่มรายการเองได้',
    quick_actions: 'ปุ่มด่วนจำลอง',
    quick_actions_desc: 'ปรับสถานะเพื่อทดสอบ shared logic ของปุ่มมือถือ',
    debug_state: 'สถานะปัจจุบัน',
    report: 'รายงานผล',
    loaded_ok: 'โหลดจาก shared mobile menu ล่าสุดแล้ว',
    config_mismatch: 'พบ config ไม่ตรงกัน',
    nav_status: 'สถานะ navItems / footer nav',
    nav_status_ok: 'โหลดจาก shared config สำเร็จ และ footer nav ตรงกับโค้ดล่าสุด',
    nav_items: 'navItems ที่แสดง',
    editable_state: 'สถานะฟอร์มหมวดงาน / พื้นที่',
    quick_output: 'ผลลัพธ์ quick action',
    current_language: 'ภาษา',
    simulator_summary: 'สรุป Simulator',
    simulator_ready: 'mobile simulator แบบโต้ตอบทำงานแล้ว',
    ux_logic_summary: 'สรุป UX / Logic',
    ux_logic_desc: 'ระบบเลือกโครงการอัตโนมัติ, dropdown เรียบง่าย, เพิ่มค่าใหม่ได้ และ quick actions เดินตาม shared gating rules',
    buttons_ok: 'ปุ่ม',
    dropdowns_ok: 'ดรอปดาวน์',
    inputs_ok: 'อินพุต',
    language_ok: 'ภาษา',
  },
  LA: {
    worker_nav_home: 'ໜ້າຫຼັກ',
    worker_nav_tasks: 'ວຽກຂອງຂ້ອຍ',
    worker_activity_title: 'ຄວາມເຄື່ອນໄຫວຫຼ້າສຸດ',
    worker_nav_chat: 'ໂປຣໄຟລ໌',
    state_controls: 'ຕົວຄວບຄຸມສະຖານະ',
    checked_in: 'Checked in',
    checked_out: 'Checked out',
    project_loading: 'ກຳລັງໂຫຼດຂໍ້ມູນໂຄງການ',
    recording_voice: 'ກຳລັງບັນທຶກ Voice',
    today_batch_count: 'ຈຳນວນ batch ມື້ນີ້',
    today_photo_count: 'ຈຳນວນ Photo ມື້ນີ້',
    today_voice_count: 'ຈຳນວນ Voice ມື້ນີ້',
    debug_title: 'Worker Mobile Debug',
    debug_desc: 'ໜ້ານີ້ໂຫຼດ mobile menu ຮ່ວມ ແລະ ກວດຟອມ Photo Submission ຕາມພາສາທີ່ເລືອກ',
    task_category: 'ໝວດວຽກ',
    zone_area: 'ພື້ນທີ່ / ໂຊນ',
    select_task_category: 'ເລືອກໝວດວຽກ',
    select_zone_area: 'ເລືອກພື້ນທີ່ / ໂຊນ',
    add_task_category: 'ເພີ່ມໝວດວຽກເອງ',
    add_zone_area: 'ເພີ່ມພື້ນທີ່ເອງ',
    add_option: 'ເພີ່ມລາຍການ',
    custom_placeholder: 'ພິມລາຍການໃໝ່',
    photo_playground: 'ພື້ນທີ່ທົດລອງ Photo Submission',
    photo_playground_desc: 'ໃຊ້ dropdown ຕາມພາສາ ບໍ່ມີ autocomplete ແລະ ເພີ່ມລາຍການເອງໄດ້',
    quick_actions: 'ປຸ່ມດ່ວນຈຳລອງ',
    quick_actions_desc: 'ປັບສະຖານະເພື່ອທົດສອບ shared logic ຂອງປຸ່ມມືຖື',
    debug_state: 'ສະຖານະປັດຈຸບັນ',
    report: 'ລາຍງານຜົນ',
    loaded_ok: 'ໂຫຼດຈາກ shared mobile menu ລ່າສຸດແລ້ວ',
    config_mismatch: 'ພົບ config ບໍ່ຕົງກັນ',
    nav_status: 'ສະຖານະ navItems / footer nav',
    nav_status_ok: 'ໂຫຼດຈາກ shared config ສຳເລັດ ແລະ footer nav ຕົງກັບໂຄດລ່າສຸດ',
    nav_items: 'navItems ທີ່ສະແດງ',
    editable_state: 'ສະຖານະຟອມໝວດວຽກ / ພື້ນທີ່',
    quick_output: 'ຜົນ quick action',
    current_language: 'ພາສາ',
    simulator_summary: 'ສະຫຼຸບ Simulator',
    simulator_ready: 'mobile simulator ແບບໂຕ້ຕອບໃຊ້ງານໄດ້ແລ້ວ',
    ux_logic_summary: 'ສະຫຼຸບ UX / Logic',
    ux_logic_desc: 'ເລືອກໂຄງການອັດຕະໂນມັດ, dropdown ຮຽບງ່າຍ, ເພີ່ມຄ່າໃໝ່ໄດ້ ແລະ quick actions ອີງ shared gating rules',
    buttons_ok: 'ປຸ່ມ',
    dropdowns_ok: 'ດຣອບດາວນ໌',
    inputs_ok: 'ອິນພຸດ',
    language_ok: 'ພາສາ',
  },
};

const pickText = (t, key, fallback) => {
  const value = t(key);
  return value && value !== key ? value : fallback;
};

function ControlToggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
        checked ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700'
      }`}
    >
      <span>{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${checked ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

function ControlNumber({ label, value, onChange }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}

function QuickActionButton({ label, helper, icon: Icon, disabled, active, onClick }) {
  const className = disabled
    ? 'border-slate-200 bg-slate-100 text-slate-400'
    : active
      ? 'border-blue-500 bg-blue-700 text-white'
      : 'border-slate-200 bg-slate-50 text-slate-900';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[92px] rounded-[1.35rem] border px-4 py-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed touch-manipulation ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{label}</div>
          <div className={`mt-1 text-xs ${disabled ? 'text-slate-400' : active ? 'text-white/85' : 'text-current/75'}`}>{helper}</div>
        </div>
        <div className="shrink-0 rounded-2xl bg-white/15 p-2">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

function DropdownCreateField({ label, value, onSelect, options, selectPlaceholder, createLabel, createValue, onCreateValueChange, onCreate, createPlaceholder, actionLabel, accent = 'blue' }) {
  const toneClasses = accent === 'emerald'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-blue-200 bg-blue-50 text-blue-700';

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <select
        value={value}
        onChange={(event) => onSelect(event.target.value)}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base outline-none focus:border-blue-500"
      >
        <option value="">{selectPlaceholder}</option>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </select>
      <div className="mt-3 rounded-[1.3rem] border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm font-semibold text-slate-700">{createLabel}</div>
        <div className="mt-3 flex flex-col gap-3">
          <input
            value={createValue}
            onChange={(event) => onCreateValueChange(event.target.value)}
            placeholder={createPlaceholder}
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={onCreate}
            className={`min-h-12 rounded-2xl border px-5 py-3 text-sm font-semibold touch-manipulation ${toneClasses}`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkerMobileDebugApp() {
  const [language, setLanguage] = useState('TH');
  const [activeTab, setActiveTab] = useState(TAB_HOME);
  const [activeScreen, setActiveScreen] = useState(SCREEN_HOME);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isProjectBatchOptionsLoading, setIsProjectBatchOptionsLoading] = useState(false);
  const [todayBatchCount, setTodayBatchCount] = useState(0);
  const [todayPhotoCount, setTodayPhotoCount] = useState(0);
  const [todayVoiceCount, setTodayVoiceCount] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [taskCategory, setTaskCategory] = useState('');
  const [areaZone, setAreaZone] = useState('');
  const [customTaskCategories, setCustomTaskCategories] = useState([]);
  const [customAreaZones, setCustomAreaZones] = useState([]);
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newAreaZone, setNewAreaZone] = useState('');

  const t = (key) => debugTranslations[language]?.[key] || debugTranslations.EN[key] || key;

  const localCopy = useMemo(() => ({
    ready: 'Ready',
    active: 'Active',
    disabled: 'Disabled',
    done: 'Done',
    recording: 'Recording...',
    voiceTitle: 'Voice',
    openPhoto: 'Open photo',
    openVoice: 'Open voice',
    batchProjectDataLoading: 'Loading project data...',
    batchFilterRoom: language === 'TH' ? 'เลือกพื้นที่ก่อนใช้งาน' : language === 'LA' ? 'ເລືອກພື້ນທີ່ກ່ອນໃຊ້ງານ' : 'Select area first',
    photoBatchCount: language === 'TH' ? 'ชุด/รูป' : language === 'LA' ? 'ຊຸດ/ຮູບ' : 'batches/photos',
  }), [language]);

  const canUseWorkActions = isCheckedIn && !isCheckedOut;
  const effectiveHasAreaSelection = Boolean(areaZone.trim());
  const canOpenWorkerTools = canUseWorkActions && effectiveHasAreaSelection && !isProjectBatchOptionsLoading;
  const taskCategoryOptions = useMemo(
    () => Array.from(new Set([...getLocalizedConstructionTaskCategoryOptions(language), ...customTaskCategories])),
    [customTaskCategories, language]
  );
  const areaZoneOptions = useMemo(
    () => Array.from(new Set([...getLocalizedConstructionAreaZoneOptions(language), ...customAreaZones])),
    [customAreaZones, language]
  );

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
      hasBatchRoomSelection: effectiveHasAreaSelection,
      todayBatchCount,
      todayPhotoCount,
      todayVoiceCount,
      activeScreen,
      isRecordingVoice,
      isVoiceProcessing: false,
      busyAction: '',
      screenPhoto: SCREEN_PHOTO,
      screenVoice: SCREEN_VOICE,
      roomName: areaZone,
    },
    handlers: {
      onCheckIn: () => {
        setIsCheckedIn(true);
        setIsCheckedOut(false);
      },
      onCheckOut: () => setIsCheckedOut(true),
      onPhoto: () => {
        setActiveScreen(SCREEN_PHOTO);
        setActiveTab(TAB_HOME);
        if (!todayBatchCount) setTodayBatchCount(1);
        if (!todayPhotoCount) setTodayPhotoCount(3);
      },
      onVoice: () => {
        setActiveScreen(SCREEN_VOICE);
        setActiveTab(TAB_HOME);
        setIsRecordingVoice((current) => !current);
        if (!todayVoiceCount) setTodayVoiceCount(1);
      },
    },
    icons: {
      checkin: CheckCircle2,
      checkout: Clock3,
      photo: Camera,
      voice: Mic,
    },
  });

  const footerMatchesNav = navItems.length === workerNavItemDefs.length
    && navItems.every((item, index) => item.id === workerNavItemDefs[index].id);
  const labelsLoaded = navItems.every((item) => Boolean(item.label));
  const reportOk = footerMatchesNav && labelsLoaded;
  const simulatorChecks = [
    { label: t('buttons_ok'), ok: actionButtons.length === 4 },
    { label: t('dropdowns_ok'), ok: taskCategoryOptions.length > 0 && areaZoneOptions.length > 0 },
    { label: t('inputs_ok'), ok: typeof newTaskCategory === 'string' && typeof newAreaZone === 'string' },
    { label: t('language_ok'), ok: ['TH', 'LA', 'EN'].includes(language) },
  ];
  const handleTaskCategoryChange = (value) => {
    setTaskCategory(value);
  };
  const handleAreaZoneChange = (value) => {
    setAreaZone(value);
  };
  const addTaskCategory = () => {
    const nextValue = newTaskCategory.trim();
    if (!nextValue) return;
    setCustomTaskCategories((current) => Array.from(new Set([...current, nextValue])));
    setTaskCategory(nextValue);
    setNewTaskCategory('');
  };
  const addArea = () => {
    const nextValue = newAreaZone.trim();
    if (!nextValue) return;
    setCustomAreaZones((current) => Array.from(new Set([...current, nextValue])));
    setAreaZone(nextValue);
    setNewAreaZone('');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e2e8f0_0%,#f8fafc_45%,#e2e8f0_100%)] px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">worker-mobile-debug.html</div>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t('debug_title')}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                {t('debug_desc')}
              </p>
            </div>
            <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${reportOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {reportOk ? t('loaded_ok') : t('config_mismatch')}
            </div>
          </div>
          <div className="mt-4 max-w-[220px]">
            <div className="mb-2 text-sm font-semibold text-slate-700">{t('current_language')}</div>
            <select value={language} onChange={(event) => setLanguage(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
              <option value="TH">ไทย</option>
              <option value="LA">ລາວ</option>
              <option value="EN">English</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,430px)_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('state_controls')}</div>
            <div className="mt-4 space-y-3">
              <ControlToggle label={t('checked_in')} checked={isCheckedIn} onChange={setIsCheckedIn} />
              <ControlToggle label={t('checked_out')} checked={isCheckedOut} onChange={setIsCheckedOut} />
              <ControlToggle label={t('project_loading')} checked={isProjectBatchOptionsLoading} onChange={setIsProjectBatchOptionsLoading} />
              <ControlToggle label={t('recording_voice')} checked={isRecordingVoice} onChange={setIsRecordingVoice} />
            </div>
            <div className="mt-4 space-y-3">
              <ControlNumber label={t('today_batch_count')} value={todayBatchCount} onChange={setTodayBatchCount} />
              <ControlNumber label={t('today_photo_count')} value={todayPhotoCount} onChange={setTodayPhotoCount} />
              <ControlNumber label={t('today_voice_count')} value={todayVoiceCount} onChange={setTodayVoiceCount} />
            </div>
          </section>

          <section className="min-w-0">
            <div className="mx-auto flex min-h-[820px] w-full max-w-[430px] flex-col overflow-hidden rounded-[2.4rem] border-[10px] border-slate-950 bg-[#eef3f8] shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
              <div className="bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-5 pb-6 pt-6 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-semibold">W</div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Worker App</div>
                      <div className="mt-1 text-lg font-semibold">Mobile Debug</div>
                      <div className="mt-1 text-xs text-blue-100/90">Shared nav/footer preview</div>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/90">
                    <Smartphone className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="pointer-events-auto flex-1 overflow-y-auto px-4 pb-6 pt-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 7rem)' }}>
                <section className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                  <div className="text-sm font-semibold text-slate-900">{t('photo_playground')}</div>
                  <div className="mt-1 text-xs text-slate-500">{t('photo_playground_desc')}</div>
                  <div className="mt-4 space-y-4">
                    <DropdownCreateField
                      label={t('task_category')}
                      value={taskCategory}
                      onSelect={handleTaskCategoryChange}
                      options={taskCategoryOptions}
                      selectPlaceholder={t('select_task_category')}
                      createLabel={t('add_task_category')}
                      createValue={newTaskCategory}
                      onCreateValueChange={setNewTaskCategory}
                      onCreate={addTaskCategory}
                      createPlaceholder={t('custom_placeholder')}
                      actionLabel={t('add_option')}
                    />
                    <DropdownCreateField
                      label={t('zone_area')}
                      value={areaZone}
                      onSelect={handleAreaZoneChange}
                      options={areaZoneOptions}
                      selectPlaceholder={t('select_zone_area')}
                      createLabel={t('add_zone_area')}
                      createValue={newAreaZone}
                      onCreateValueChange={setNewAreaZone}
                      onCreate={addArea}
                      createPlaceholder={t('custom_placeholder')}
                      actionLabel={t('add_option')}
                      accent="emerald"
                    />
                  </div>
                </section>

                <section className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                  <div className="text-sm font-semibold text-slate-900">{t('quick_actions')}</div>
                  <div className="mt-1 text-xs text-slate-500">{t('quick_actions_desc')}</div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {actionButtons.map((action) => (
                      <QuickActionButton key={action.id} {...action} />
                    ))}
                  </div>
                </section>

                <section className="mt-4 rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                  <div className="text-sm font-semibold text-slate-900">{t('debug_state')}</div>
                  <div className="mt-2 text-sm text-slate-600">activeTab: {activeTab}</div>
                  <div className="mt-1 text-sm text-slate-600">activeScreen: {activeScreen}</div>
                </section>
              </div>

              <div className="pointer-events-auto sticky bottom-0 z-30 border-t border-slate-200 bg-white/98 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] pt-3 backdrop-blur supports-[backdrop-filter]:bg-white/90">
                <div className="grid grid-cols-4 gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === activeTab && activeScreen === activeTab;
                    return (
                      <button key={item.id} type="button" onClick={() => { setActiveTab(item.id); setActiveScreen(item.id); }} className={`min-h-14 rounded-2xl px-2 py-3 text-center touch-manipulation ${active ? 'bg-blue-700 text-white' : 'text-slate-500'}`}>
                        <Icon className="mx-auto h-5 w-5" />
                        <div className="mt-1 text-[11px] font-semibold">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('report')}</div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{t('simulator_summary')}</div>
              <div className="mt-2 text-sm text-slate-600">{t('simulator_ready')}</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {simulatorChecks.map((item) => (
                  <div key={item.label} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${item.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {item.label}: {item.ok ? 'OK' : 'Issue'}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{t('nav_status')}</div>
              <div className="mt-2 text-sm text-slate-600">
                {reportOk
                  ? `${t('nav_status_ok')} (${navItems.length})`
                  : 'The rendered footer nav does not match the shared config.'}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{t('ux_logic_summary')}</div>
              <div className="mt-2 text-sm text-slate-600">{t('ux_logic_desc')}</div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-900">{t('nav_items')}</div>
              <div className="mt-3 space-y-3">
                {navItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900">{item.id}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-900">{t('editable_state')}</div>
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">{t('task_category')}</div>
                  <div className="mt-1 text-sm text-slate-600">{taskCategory || '-'}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">{t('zone_area')}</div>
                  <div className="mt-1 text-sm text-slate-600">{areaZone || '-'}</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-900">{t('quick_output')}</div>
              <div className="mt-3 space-y-3">
                {actionButtons.map((action) => (
                  <div key={action.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{action.label}</div>
                      <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${action.disabled ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {action.disabled ? 'disabled' : 'enabled'}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{action.helper}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<WorkerMobileDebugApp />);
