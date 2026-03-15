import React, { useMemo, useState } from 'react';
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

const pickText = (t, key, fallback) => {
  const value = t(key);
  return value && value !== key ? value : fallback;
};

function StubToggle({ label, checked, onChange }) {
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

function WorkerQuickActionButton({ label, helper, icon: Icon, disabled, active, onClick }) {
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

export default function WorkerMobileTestPage({ onNavigate, t, language = 'TH' }) {
  const [activeTab, setActiveTab] = useState(TAB_HOME);
  const [activeScreen, setActiveScreen] = useState(SCREEN_HOME);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isProjectBatchOptionsLoading, setIsProjectBatchOptionsLoading] = useState(false);
  const [hasBatchRoomSelection, setHasBatchRoomSelection] = useState(false);
  const [todayBatchCount, setTodayBatchCount] = useState(0);
  const [todayPhotoCount, setTodayPhotoCount] = useState(0);
  const [todayVoiceCount, setTodayVoiceCount] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const localCopy = useMemo(() => ({
    ready: language === 'TH' ? 'พร้อมใช้งาน' : language === 'LA' ? 'ພ້ອມໃຊ້ງານ' : 'Ready',
    active: language === 'TH' ? 'กำลังใช้งาน' : language === 'LA' ? 'ກຳລັງໃຊ້ງານ' : 'Active',
    disabled: language === 'TH' ? 'ยังใช้ไม่ได้' : language === 'LA' ? 'ຍັງໃຊ້ບໍ່ໄດ້' : 'Disabled',
    done: language === 'TH' ? 'เสร็จแล้ว' : language === 'LA' ? 'ສຳເລັດແລ້ວ' : 'Done',
    recording: language === 'TH' ? 'กำลังอัดเสียง...' : language === 'LA' ? 'ກຳລັງອັດສຽງ...' : 'Recording...',
    voiceTitle: pickText(t, 'worker_voice', 'Voice'),
    openPhoto: language === 'TH' ? 'เปิดหน้าถ่ายรูป' : language === 'LA' ? 'ເປີດໜ້າຖ່າຍຮູບ' : 'Open photo',
    openVoice: language === 'TH' ? 'เปิดหน้าอัดเสียง' : language === 'LA' ? 'ເປີດໜ້າອັດສຽງ' : 'Open voice',
    batchProjectDataLoading: language === 'TH' ? 'กำลังโหลดรายการงานของโครงการ...' : language === 'LA' ? 'ກຳລັງໂຫຼດຂໍ້ມູນໂຄງການ...' : 'Loading project data...',
    batchFilterRoom: language === 'TH' ? 'เลือกประเภทงานและทีมก่อนจึงจะเลือกห้องได้' : language === 'LA' ? 'ເລືອກປະເພດວຽກແລະທີມກ່ອນ' : 'Select work type and team first',
    photoBatchCount: language === 'TH' ? 'ชุด/รูป' : language === 'LA' ? 'ຊຸດ/ຮູບ' : 'batches/photos',
    checkoutHelper: language === 'TH' ? 'stub logic สำหรับเช็กเงื่อนไขปุ่มเมนูด่วน' : language === 'LA' ? 'stub logic ສຳລັບກວດເງື່ອນໄຂປຸ່ມດ່ວນ' : 'Stub logic for quick action gating',
  }), [language, t]);

  const canUseWorkActions = isCheckedIn && !isCheckedOut;
  const canOpenWorkerTools = canUseWorkActions && hasBatchRoomSelection && !isProjectBatchOptionsLoading;

  const setTabScreen = (tab) => {
    setActiveTab(tab);
    setActiveScreen(tab);
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
      disabled: isCheckedIn,
      active: !isCheckedIn,
      onClick: () => {
        setIsCheckedIn(true);
        setIsCheckedOut(false);
      },
    },
    {
      id: 'checkout',
      label: pickText(t, 'worker_checkout_cta', 'Check Out'),
      helper: isCheckedOut ? localCopy.done : isCheckedIn ? localCopy.active : localCopy.disabled,
      icon: Clock3,
      disabled: !isCheckedIn || isCheckedOut,
      active: isCheckedIn && !isCheckedOut,
      onClick: () => setIsCheckedOut(true),
    },
    {
      id: 'photo',
      label: pickText(t, 'worker_photo', 'Upload Photo'),
      helper: todayPhotoCount > 0
        ? `${todayBatchCount} / ${todayPhotoCount} ${localCopy.photoBatchCount}`
        : !canUseWorkActions
          ? localCopy.disabled
          : isProjectBatchOptionsLoading
            ? localCopy.batchProjectDataLoading
            : hasBatchRoomSelection
              ? `${localCopy.active} • Room A-12`
              : localCopy.batchFilterRoom,
      icon: Camera,
      disabled: !canOpenWorkerTools,
      active: activeScreen === SCREEN_PHOTO || todayPhotoCount > 0,
      onClick: () => {
        setActiveScreen(SCREEN_PHOTO);
        setActiveTab(TAB_HOME);
        setTodayBatchCount((current) => current || 1);
        setTodayPhotoCount((current) => current || 3);
      },
    },
    {
      id: 'voice',
      label: localCopy.voiceTitle,
      helper: isRecordingVoice
        ? localCopy.recording
        : todayVoiceCount > 0
          ? `${todayVoiceCount} ${localCopy.done}`
          : !canUseWorkActions
            ? localCopy.disabled
            : isProjectBatchOptionsLoading
              ? localCopy.batchProjectDataLoading
              : hasBatchRoomSelection
                ? `${localCopy.active} • Room A-12`
                : localCopy.batchFilterRoom,
      icon: Mic,
      disabled: !canOpenWorkerTools,
      active: activeScreen === SCREEN_VOICE || isRecordingVoice || todayVoiceCount > 0,
      onClick: () => {
        setActiveScreen(SCREEN_VOICE);
        setActiveTab(TAB_HOME);
        setIsRecordingVoice((current) => !current);
        setTodayVoiceCount((current) => current || 1);
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[340px_minmax(0,430px)_minmax(0,1fr)]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Worker Mobile Test</div>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">worker-mobile-test</h1>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            หน้า test นี้ mirror `navItems`, footer nav และเงื่อนไข quick actions ล่าสุดจาก `src/WorkerAppV2.jsx`
          </p>

          <div className="mt-5 space-y-3">
            <StubToggle label="Checked in" checked={isCheckedIn} onChange={setIsCheckedIn} />
            <StubToggle label="Checked out" checked={isCheckedOut} onChange={setIsCheckedOut} />
            <StubToggle label="Project data loading" checked={isProjectBatchOptionsLoading} onChange={setIsProjectBatchOptionsLoading} />
            <StubToggle label="Room selected" checked={hasBatchRoomSelection} onChange={setHasBatchRoomSelection} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setTodayBatchCount(1); setTodayPhotoCount(3); }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              Seed photo state
            </button>
            <button type="button" onClick={() => { setTodayVoiceCount(1); setIsRecordingVoice(false); }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              Seed voice state
            </button>
            <button type="button" onClick={() => setIsRecordingVoice((current) => !current)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              Toggle recording
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCheckedIn(false);
                setIsCheckedOut(false);
                setIsProjectBatchOptionsLoading(false);
                setHasBatchRoomSelection(false);
                setTodayBatchCount(0);
                setTodayPhotoCount(0);
                setTodayVoiceCount(0);
                setIsRecordingVoice(false);
                setActiveTab(TAB_HOME);
                setActiveScreen(SCREEN_HOME);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Reset stub
            </button>
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
                    <div className="mt-1 text-lg font-semibold">Mobile Menu Test</div>
                    <div className="mt-1 text-xs text-blue-100/90">Latest nav + footer preview</div>
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/90">
                  <Smartphone className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="pointer-events-auto flex-1 overflow-y-auto px-4 pb-6 pt-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 7rem)' }}>
              <section className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                <div className="text-sm font-semibold text-slate-900">Quick Actions Stub</div>
                <div className="mt-1 text-xs text-slate-500">{localCopy.checkoutHelper}</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {actionButtons.map((action) => (
                    <WorkerQuickActionButton key={action.id} {...action} />
                  ))}
                </div>
              </section>

              <section className="mt-4 rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                <div className="text-sm font-semibold text-slate-900">Active screen</div>
                <div className="mt-2 text-sm text-slate-600">{activeScreen}</div>
              </section>
            </div>

            <div className="pointer-events-auto sticky bottom-0 z-30 border-t border-slate-200 bg-white/98 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] pt-3 backdrop-blur supports-[backdrop-filter]:bg-white/90">
              <div className="grid grid-cols-4 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.id === activeTab && activeScreen === activeTab;
                  return (
                    <button key={item.id} type="button" onClick={() => setTabScreen(item.id)} className={`min-h-14 rounded-2xl px-2 py-3 text-center touch-manipulation ${active ? 'bg-blue-700 text-white' : 'text-slate-500'}`}>
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
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Inspector</div>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Mirrored mobile menu config</h2>

          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-900">navItems</div>
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
            <div className="text-sm font-semibold text-slate-900">Quick action gates</div>
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
  );
}
