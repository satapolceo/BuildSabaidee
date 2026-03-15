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

  return [
    {
      id: 'checkin',
      label: pickText(t, 'worker_checkin_cta', 'Check In'),
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
      label: pickText(t, 'worker_checkout_cta', 'Check Out'),
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
      label: pickText(t, 'worker_photo', 'Upload Photo'),
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
      active: activeScreen === screenPhoto || todayPhotoCount > 0,
      onClick: handlers.onPhoto,
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
                ? `${localCopy.active} • ${roomName}`
                : localCopy.batchFilterRoom,
      icon: icons.voice,
      tone: 'amber',
      disabled: !canOpenWorkerTools,
      loading: Boolean(state.isVoiceProcessing),
      active: activeScreen === screenVoice || isRecordingVoice || todayVoiceCount > 0,
      onClick: handlers.onVoice,
    },
  ];
}
