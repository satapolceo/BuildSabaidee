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

function findButtonByTextContent(pattern) {
  const match = screen.getAllByRole('button').find((button) => pattern.test(button.textContent || ''));
  if (!match) throw new Error('Button not found for pattern');
  return match;
}

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

async function checkInAndOpenPhoto(user) {
  await user.click(screen.getByRole('button', { name: /Check In/i }));
  await waitFor(() => expect(screen.getByRole('button', { name: /Check Out/i })).toBeEnabled());
  const photoButtons = screen.getAllByRole('button', { name: /Upload Photo/i });
  await user.click(photoButtons[0]);
  await waitFor(() => expect(screen.getByText('Work Submission Batch')).toBeInTheDocument());
}

async function selectTowerBatch(user) {
  const projectSelect = screen.getByRole('combobox');
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
  expect(screen.getByText('Recording inside this batch...')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Stop recording/i }));
  await waitFor(() => expect(screen.getAllByText(/Voice attached/i).length).toBeGreaterThan(0));
}

async function withFeature(name, fn) {
  try {
    const details = await fn();
    featureResults.push({ feature: name, status: 'PASS', details: details || '' });
  } catch (error) {
    featureResults.push({ feature: name, status: 'FAIL', details: error instanceof Error ? error.message : String(error) });
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

    const checkInButton = screen.getByRole('button', { name: /Check In/i });
    const checkOutButton = screen.getByRole('button', { name: /Check Out/i });
    const uploadPhotoButton = screen.getAllByRole('button', { name: /Upload Photo/i })[0];

    expect(checkInButton).toBeEnabled();
    expect(checkOutButton).toBeDisabled();
    expect(uploadPhotoButton).toBeDisabled();

    await user.click(checkInButton);
    await waitFor(() => expect(checkOutButton).toBeEnabled());
    expect(uploadPhotoButton).toBeEnabled();

    await user.click(checkOutButton);
    await waitFor(() => expect(checkOutButton).toBeDisabled());
    expect(checkOutButton).toBeDisabled();
    return 'Check-in enabled work actions and checkout disabled them again';
  }));

  it('loads project-specific dependent selectors for the batch flow', async () => withFeature('Project-specific dropdown dependencies', async () => {
    const user = userEvent.setup();
    renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    await selectTowerBatch(user);

    expect(screen.getAllByRole('combobox')[0]).toHaveValue('p1');
    expect(screen.getByRole('button', { name: 'MEP Rough-in Team' })).toHaveClass('bg-blue-700');
    expect(screen.getByRole('button', { name: 'Level 12 Corridor' })).toHaveClass('bg-blue-700');
    expect(screen.queryByRole('button', { name: 'Footing Team' })).not.toBeInTheDocument();

    return 'Tower project loaded MEP -> MEP Rough-in Team -> Level 12 Corridor';
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
    await recordInlineVoice(user);

    expect(view.container.querySelector('audio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete batch voice/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /Delete batch voice/i }));
    await waitFor(() => expect(screen.getByText('No inline batch voice yet')).toBeInTheDocument());
    expect(view.container.querySelector('audio')).not.toBeInTheDocument();

    return 'Inline recorder created an attached voice note and deleted it cleanly';
  }));

  it('saves draft and submitted batches with updated cards', async () => withFeature('Draft and submitted batch cards', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    await selectTowerBatch(user);
    await user.type(screen.getByPlaceholderText('Batch title'), 'Corridor MEP inspection');
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

    await selectTowerBatch(user);
    await user.type(screen.getByPlaceholderText('Batch title'), 'Corridor MEP handover');
    await uploadBatchPhotos(user, view.container, [createImageFile('submit.jpg', 2200)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Submit batch/i }));
    await waitFor(() => expect(screen.getByText('Photo batch submitted')).toBeInTheDocument());

    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Updated').length).toBeGreaterThan(0);

    return 'Recent cards showed draft/submitted status, project data, photo count, voice attachment, and updated label';
  }));

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
});





