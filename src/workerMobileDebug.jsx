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
  constructionAreaZoneOptions,
  constructionTaskCategoryOptions,
  workerNavItemDefs,
} from './workerMobileMenuConfig';

const debugTranslations = {
  worker_nav_home: 'Home',
  worker_nav_tasks: 'My Tasks',
  worker_activity_title: 'Recent Activity',
  worker_nav_chat: 'Profile',
  worker_checkin_cta: 'Check In',
  worker_checkout_cta: 'Check Out',
  worker_photo: 'Upload Photo',
  worker_voice: 'Voice',
};

const pickText = (t, key, fallback) => {
  const value = t(key);
  return value && value !== key ? value : fallback;
};

const t = (key) => debugTranslations[key] || key;

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

function EditableField({ label, value, onChange, options, placeholder, accent = 'blue' }) {
  const listId = `${label.replace(/\s+/g, '-').toLowerCase()}-debug-list`;
  const toneClasses = accent === 'emerald'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-blue-200 bg-blue-50 text-blue-700';

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <input
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base outline-none focus:border-blue-500"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.slice(0, 8).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold touch-manipulation ${value === option ? toneClasses : 'border-slate-200 bg-white text-slate-700'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkerMobileDebugApp() {
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
  const [taskCategory, setTaskCategory] = useState('Concrete');
  const [areaZone, setAreaZone] = useState('Zone A');
  const [customTaskCategories, setCustomTaskCategories] = useState([]);
  const [customAreaZones, setCustomAreaZones] = useState([]);

  const localCopy = useMemo(() => ({
    ready: 'Ready',
    active: 'Active',
    disabled: 'Disabled',
    done: 'Done',
    recording: 'Recording...',
    voiceTitle: pickText(t, 'worker_voice', 'Voice'),
    openPhoto: 'Open photo',
    openVoice: 'Open voice',
    batchProjectDataLoading: 'Loading project data...',
    batchFilterRoom: 'Select work type and room first',
    photoBatchCount: 'batches/photos',
  }), []);

  const canUseWorkActions = isCheckedIn && !isCheckedOut;
  const canOpenWorkerTools = canUseWorkActions && hasBatchRoomSelection && !isProjectBatchOptionsLoading;
  const taskCategoryOptions = useMemo(
    () => Array.from(new Set([...constructionTaskCategoryOptions, ...customTaskCategories])),
    [customTaskCategories]
  );
  const areaZoneOptions = useMemo(
    () => Array.from(new Set([...constructionAreaZoneOptions, ...customAreaZones])),
    [customAreaZones]
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
      hasBatchRoomSelection,
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
  const handleTaskCategoryChange = (value) => {
    setTaskCategory(value);
    if (value.trim()) setCustomTaskCategories((current) => Array.from(new Set([...current, value.trim()])));
  };
  const handleAreaZoneChange = (value) => {
    setAreaZone(value);
    if (value.trim()) setCustomAreaZones((current) => Array.from(new Set([...current, value.trim()])));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e2e8f0_0%,#f8fafc_45%,#e2e8f0_100%)] px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">worker-mobile-debug.html</div>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Worker Mobile Debug</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                หน้า debug นี้โหลด mobile menu จาก shared config เดียวกับ <code>src/WorkerAppV2.jsx</code> แล้วให้แก้ state เพื่อทดสอบปุ่มบนมือถือได้ทันที
              </p>
            </div>
            <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${reportOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {reportOk ? 'Loaded from latest shared mobile menu config' : 'Config mismatch detected'}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,430px)_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">State Controls</div>
            <div className="mt-4 space-y-3">
              <ControlToggle label="Checked in" checked={isCheckedIn} onChange={setIsCheckedIn} />
              <ControlToggle label="Checked out" checked={isCheckedOut} onChange={setIsCheckedOut} />
              <ControlToggle label="Project data loading" checked={isProjectBatchOptionsLoading} onChange={setIsProjectBatchOptionsLoading} />
              <ControlToggle label="Room selected" checked={hasBatchRoomSelection} onChange={setHasBatchRoomSelection} />
              <ControlToggle label="Recording voice" checked={isRecordingVoice} onChange={setIsRecordingVoice} />
            </div>
            <div className="mt-4 space-y-3">
              <ControlNumber label="Today batch count" value={todayBatchCount} onChange={setTodayBatchCount} />
              <ControlNumber label="Today photo count" value={todayPhotoCount} onChange={setTodayPhotoCount} />
              <ControlNumber label="Today voice count" value={todayVoiceCount} onChange={setTodayVoiceCount} />
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
                  <div className="text-sm font-semibold text-slate-900">Photo Submission Playground</div>
                  <div className="mt-1 text-xs text-slate-500">Editable dropdowns for task category and area / zone update instantly</div>
                  <div className="mt-4 space-y-4">
                    <EditableField
                      label="Task Category"
                      value={taskCategory}
                      onChange={handleTaskCategoryChange}
                      options={taskCategoryOptions}
                      placeholder="Select or type a task category"
                    />
                    <EditableField
                      label="Area / Zone"
                      value={areaZone}
                      onChange={handleAreaZoneChange}
                      options={areaZoneOptions}
                      placeholder="Select or type an area / zone"
                      accent="emerald"
                    />
                  </div>
                </section>

                <section className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                  <div className="text-sm font-semibold text-slate-900">Quick Actions Stub</div>
                  <div className="mt-1 text-xs text-slate-500">Edit the controls to test gating logic for mobile buttons</div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {actionButtons.map((action) => (
                      <QuickActionButton key={action.id} {...action} />
                    ))}
                  </div>
                </section>

                <section className="mt-4 rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                  <div className="text-sm font-semibold text-slate-900">Debug state</div>
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
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Report</div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">navItems / footer nav status</div>
              <div className="mt-2 text-sm text-slate-600">
                {reportOk
                  ? `Loaded successfully: ${navItems.length} nav items from shared config and footer nav matches latest code.`
                  : 'The rendered footer nav does not match the shared config.'}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-900">Rendered navItems</div>
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
              <div className="text-sm font-semibold text-slate-900">Photo submission editable state</div>
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">Task Category</div>
                  <div className="mt-1 text-sm text-slate-600">{taskCategory || '-'}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">Area / Zone</div>
                  <div className="mt-1 text-sm text-slate-600">{areaZone || '-'}</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-900">Quick action gate output</div>
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
