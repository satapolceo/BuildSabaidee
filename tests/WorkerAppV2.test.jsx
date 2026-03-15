import React from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkerAppV2 from '../src/WorkerAppV2.jsx';

const mockState = vi.hoisted(() => ({
  compressionPaused: false,
  compressionResolvers: [],
  compressionCalls: 0,
}));

vi.mock('../src/imageDataSaver.js', () => ({
  DATA_SAVER_DEFAULTS: {
    dataSaverMode: true,
    uploadQuality: 'medium',
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.8,
  },
  compressImageFile: vi.fn(async (file) => {
    mockState.compressionCalls += 1;
    if (mockState.compressionPaused) {
      await new Promise((resolve) => {
        mockState.compressionResolvers.push(resolve);
      });
    }

    return {
      imageData: `data:image/jpeg;base64,${btoa(file.name)}`,
      stats: {
        originalBytes: file.size || 1024,
        compressedBytes: Math.max(256, Math.floor((file.size || 1024) / 2)),
      },
    };
  }),
  formatBytes: (value) => `${value} B`,
}));

const featureResults = [];
const projectsList = [
  { id: 'p1', name: 'Sky Tower' },
  { id: 'p2', name: 'Garden Villa' },
];
const workersList = [
  { id: 'w1', name: 'Somchai', assignedSiteId: 'p1' },
];

function createMediaStream() {
  return {
    getTracks: () => [{ stop: vi.fn() }],
  };
}

class MockMediaRecorder {
  constructor(stream) {
    this.stream = stream;
    this.state = 'inactive';
    this.mimeType = 'audio/webm';
    this.ondataavailable = null;
    this.onstop = null;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    const blob = new Blob(['mock-audio'], { type: this.mimeType });
    this.ondataavailable?.({ data: blob, size: blob.size });
    setTimeout(() => {
      this.onstop?.();
    }, 0);
  }
}

const t = (key) => key;
const onNavigate = vi.fn();

function renderWorkerApp(language = 'EN') {
  return render(
    <WorkerAppV2
      onNavigate={onNavigate}
      t={t}
      language={language}
      workersList={workersList}
      projectsList={projectsList}
    />
  );
}

function getQuickActionButton(pattern) {
  return screen.getAllByRole('button').find((button) => pattern.test(button.textContent || ''));
}

function getProjectSelect() {
  return screen.getAllByRole('combobox').find((element) => element.querySelector('option[value="p1"]'));
}

async function openPhotoScreen(user) {
  const photoButton = getQuickActionButton(/Update Submission|Submit Work|Upload Photo/i);
  if (!photoButton) throw new Error('Photo quick action not found');
  await waitFor(() => expect(photoButton).toBeEnabled());
  await user.click(photoButton);
  await waitFor(() => expect(screen.getByText('Submit Work Photo')).toBeInTheDocument());
}

async function checkInAndOpenPhoto(user) {
  const checkInButton = getQuickActionButton(/Check In/i);
  const checkOutButton = getQuickActionButton(/Check Out/i);
  if (!checkInButton || !checkOutButton) throw new Error('Attendance quick actions not found');

  await user.click(checkInButton);
  expect(checkInButton).toBeDisabled();
  await waitFor(() => expect(checkOutButton).toBeEnabled());
  await openPhotoScreen(user);
}

async function selectTowerBatch(user) {
  const projectSelect = getProjectSelect();
  if (!projectSelect) throw new Error('Project select not found');
  await user.selectOptions(projectSelect, 'p1');
  await waitFor(() => expect(screen.getByRole('button', { name: 'MEP' })).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: 'MEP' }));
  await user.click(screen.getByRole('button', { name: 'MEP Rough-in Team' }));
  await user.click(screen.getByRole('button', { name: 'Level 12 Corridor' }));
}

function getBatchPhotoInput(container) {
  const input = container.querySelector('input[type="file"][multiple]');
  if (!input) throw new Error('Batch photo input not found');
  return input;
}

function createImageFile(name, size = 2048) {
  return new File([new Uint8Array(size)], name, { type: 'image/jpeg' });
}

async function uploadBatchPhotos(user, container, files) {
  const input = getBatchPhotoInput(container);
  await user.upload(input, files);
}

async function recordInlineVoice(user) {
  await user.click(screen.getByRole('button', { name: /Record in batch/i }));
  expect(screen.getAllByText('Recording inside this batch...').length).toBeGreaterThan(0);
  await user.click(screen.getByRole('button', { name: /Stop recording/i }));
  await waitFor(() => expect(screen.getAllByText(/Voice attached/i).length).toBeGreaterThan(0));
}

function printResult(feature, status, details) {
  console.log(`[${status}] ${feature}${details ? `: ${details}` : ''}`);
}

async function withFeature(name, fn) {
  try {
    const details = await fn();
    featureResults.push({ feature: name, status: 'PASS', details: details || '' });
    printResult(name, 'PASS', details || '');
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    featureResults.push({ feature: name, status: 'FAIL', details });
    printResult(name, 'FAIL', details);
    throw error;
  }
}

beforeAll(() => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
  Object.defineProperty(navigator, 'onLine', { writable: true, configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => createMediaStream()),
    },
  });
  Object.defineProperty(window, 'MediaRecorder', {
    writable: true,
    configurable: true,
    value: MockMediaRecorder,
  });
  Object.defineProperty(global, 'MediaRecorder', {
    writable: true,
    configurable: true,
    value: MockMediaRecorder,
  });
});

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
  onNavigate.mockReset();
  mockState.compressionPaused = false;
  mockState.compressionResolvers = [];
  mockState.compressionCalls = 0;
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  console.log('\nWorkerAppV2 mobile automation report');
  console.table(featureResults);
  const passed = featureResults.filter((entry) => entry.status === 'PASS').length;
  const failed = featureResults.filter((entry) => entry.status === 'FAIL').length;
  console.log(`Summary: ${passed} passed / ${failed} failed`);
});

describe('WorkerAppV2 mobile automation', () => {
  it('checks in and checks out with correct action states', async () => withFeature('Check In / Check Out states', async () => {
    const user = userEvent.setup();
    renderWorkerApp('EN');

    const checkInButton = getQuickActionButton(/Check In/i);
    const checkOutButton = getQuickActionButton(/Check Out/i);
    const uploadPhotoButton = getQuickActionButton(/Update Submission|Submit Work|Upload Photo/i);
    const voiceButton = getQuickActionButton(/Voice Notes|Voice/i);

    expect(checkInButton).toBeDefined();
    expect(checkOutButton).toBeDefined();
    expect(uploadPhotoButton).toBeDefined();
    expect(voiceButton).toBeDefined();
    expect(checkInButton).toBeEnabled();
    expect(checkOutButton).toBeDisabled();
    expect(uploadPhotoButton).toBeDisabled();
    expect(voiceButton).toBeDisabled();

    await user.click(checkInButton);
    expect(checkInButton).toBeDisabled();
    await waitFor(() => expect(checkOutButton).toBeEnabled());
    await waitFor(() => expect(uploadPhotoButton).toBeEnabled());
    await waitFor(() => expect(voiceButton).toBeEnabled());

    await user.click(checkOutButton);
    await waitFor(() => expect(checkOutButton).toBeDisabled());
    expect(uploadPhotoButton).toBeDisabled();
    expect(voiceButton).toBeDisabled();
    return 'Check-in updated immediately, enabled room-based work actions, and checkout disabled them again';
  }));

  it('loads project-specific dependent selectors for the batch flow', async () => withFeature('Project-specific dropdown dependencies', async () => {
    const user = userEvent.setup();
    renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    expect(getProjectSelect()).toHaveValue('p1');
    expect(screen.getByRole('button', { name: 'Structure' })).toHaveClass('bg-blue-700');
    expect(screen.getByRole('button', { name: 'Concrete Team' })).toHaveClass('bg-blue-700');
    expect(screen.getByRole('button', { name: 'Core Level 12' })).toHaveClass('bg-blue-700');
    expect(screen.getByRole('button', { name: /Save draft/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Take or choose photo/i })).toBeEnabled();

    await selectTowerBatch(user);

    expect(getProjectSelect()).toHaveValue('p1');
    expect(screen.getByRole('button', { name: 'MEP Rough-in Team' })).toHaveClass('bg-blue-700');
    expect(screen.getByRole('button', { name: 'Level 12 Corridor' })).toHaveClass('bg-blue-700');
    expect(screen.queryByRole('button', { name: 'Footing Team' })).not.toBeInTheDocument();

    return 'Default batch context loaded for the assigned project, then filtered MEP -> MEP Rough-in Team -> Level 12 Corridor';
  }));

  it('adds, removes, and re-adds batch photos with upload loading state', async () => withFeature('Multi-photo batch interactions', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    await selectTowerBatch(user);

    mockState.compressionPaused = true;
    const uploadPromise = uploadBatchPhotos(user, view.container, [
      createImageFile('a.jpg', 3000),
      createImageFile('b.jpg', 2500),
    ]);

    await waitFor(() => expect(view.container.querySelector('.animate-spin')).toBeTruthy());
    mockState.compressionResolvers.splice(0).forEach((resolve) => resolve());
    mockState.compressionPaused = false;
    await uploadPromise;

    await waitFor(() => expect(screen.getByText('Photos: 2')).toBeInTheDocument());
    expect(view.container.querySelectorAll('img').length).toBeGreaterThan(0);

    const removeButtons = screen.getAllByRole('button', { name: 'Remove photo' });
    await user.click(removeButtons[0]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());

    await uploadBatchPhotos(user, view.container, [createImageFile('c.jpg', 2100)]);
    await waitFor(() => expect(screen.getByText('Photos: 2')).toBeInTheDocument());

    return `Compression calls: ${mockState.compressionCalls}, final photo count: 2`;
  }));

  it('records, plays back, and deletes inline batch voice notes', async () => withFeature('Inline voice recording in batch', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    await selectTowerBatch(user);
    expect(screen.getByRole('button', { name: /Record in batch/i })).toBeEnabled();
    await recordInlineVoice(user);

    expect(view.container.querySelector('audio')).toBeInTheDocument();
    expect(screen.getAllByText(/Voice attached/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Delete batch voice/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /Delete batch voice/i }));
    await waitFor(() => expect(screen.getByText('No inline batch voice yet')).toBeInTheDocument());
    expect(view.container.querySelector('audio')).not.toBeInTheDocument();

    return 'Inline recorder created an attached voice note, showed its active state, and deleted it cleanly';
  }));

  it('saves draft and submitted batches with updated cards', async () => withFeature('Draft and submitted batch cards', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    await selectTowerBatch(user);
    await user.type(screen.getByPlaceholderText('Short title (optional)'), 'Corridor MEP inspection');
    await user.type(screen.getByPlaceholderText('Details'), 'Ceiling rough-in complete and ready for review');
    await uploadBatchPhotos(user, view.container, [createImageFile('draft.jpg', 1800)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await recordInlineVoice(user);

    await user.click(screen.getByRole('button', { name: /Save draft/i }));
    await waitFor(() => expect(screen.getByText('Photo batch saved')).toBeInTheDocument());

    expect(screen.getAllByText('Corridor MEP inspection').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sky Tower').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MEP').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MEP Rough-in Team').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Level 12 Corridor').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Voice attached/i).length).toBeGreaterThan(0);

    await selectTowerBatch(user);
    await user.type(screen.getByPlaceholderText('Short title (optional)'), 'Corridor MEP handover');
    await uploadBatchPhotos(user, view.container, [createImageFile('submit.jpg', 2200)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Submit batch/i }));
    await waitFor(() => expect(screen.getByText('Photo batch submitted')).toBeInTheDocument());

    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Updated').length).toBeGreaterThan(0);

    return 'Recent cards showed draft/submitted status, project data, photo count, voice attachment, and updated label';
  }), 15000);

  it('renders translated inline voice labels across Thai, Lao, and English', async () => withFeature('Three-language labels', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    expect(screen.getByText('Inline batch voice')).toBeInTheDocument();

    rerender(
      <WorkerAppV2
        onNavigate={onNavigate}
        t={t}
        language="TH"
        workersList={workersList}
        projectsList={projectsList}
      />
    );
    await waitFor(() => expect(screen.getByText('เสียงในชุดงาน')).toBeInTheDocument());

    rerender(
      <WorkerAppV2
        onNavigate={onNavigate}
        t={t}
        language="LA"
        workersList={workersList}
        projectsList={projectsList}
      />
    );
    await waitFor(() => expect(screen.getByText('ສຽງໃນຊຸດວຽກ')).toBeInTheDocument());

    rerender(
      <WorkerAppV2
        onNavigate={onNavigate}
        t={t}
        language="EN"
        workersList={workersList}
        projectsList={projectsList}
      />
    );
    await waitFor(() => expect(screen.getByText('Inline batch voice')).toBeInTheDocument());

    return 'Verified EN / TH / LA labels for the inline batch voice module';
  }));

  it('supports voice screen recording and batch submission from the mobile shell', async () => withFeature('Voice screen and submit flow', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    const checkInButton = getQuickActionButton(/Check In/i);
    const voiceAction = getQuickActionButton(/Voice Notes|Voice/i);
    expect(checkInButton).toBeDefined();
    expect(voiceAction).toBeDefined();

    await user.click(checkInButton);
    await waitFor(() => expect(voiceAction).toBeEnabled());
    await user.click(voiceAction);
    await waitFor(() => expect(screen.getByRole('button', { name: /Start recording/i })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: /Start recording/i }));
    expect(screen.getByText('Recording...')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Stop recording/i }));
    await waitFor(() => expect(view.container.querySelector('audio')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Back/i }));
    await openPhotoScreen(user);
    await user.type(screen.getByPlaceholderText('Short title (optional)'), 'Mobile shell submit');
    await uploadBatchPhotos(user, view.container, [createImageFile('mobile-shell.jpg', 2200)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Submit batch/i }));
    await waitFor(() => expect(screen.getByText('Photo batch submitted')).toBeInTheDocument());

    const recentCards = screen.getAllByText('Mobile shell submit');
    expect(recentCards.length).toBeGreaterThan(0);
    return 'Recorded from the voice screen, returned through the mobile shell, and submitted a batch';
  }), 15000);
});

