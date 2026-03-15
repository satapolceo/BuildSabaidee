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
    setTimeout(() => this.onstop?.(), 0);
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

function getQuickActionButton(pattern) {
  return screen.getAllByRole('button').find((button) => pattern.test(button.textContent || ''));
}

async function openPhotoScreen(user) {
  const photoButton = getQuickActionButton(/Update Submission|Submit Work|Upload Photo|อัปเดตส่งงาน|ອັບເດດສົ່ງງານ/i);
  if (!photoButton) throw new Error('Photo quick action not found');
  await waitFor(() => expect(photoButton).toBeEnabled());
  await user.click(photoButton);
  await waitFor(() => expect(screen.getByText('Submit Work Photo')).toBeInTheDocument());
}

async function checkIn(user) {
  const checkInButton = getQuickActionButton(/Check In/i);
  if (!checkInButton) throw new Error('Check In quick action not found');
  await user.click(checkInButton);
  await waitFor(() => expect(checkInButton).toBeDisabled());
}

async function checkInAndOpenPhoto(user) {
  await checkIn(user);
  await openPhotoScreen(user);
}

function getPhotoFormSelects() {
  const selects = screen.getAllByRole('combobox');
  return {
    project: selects[0],
    taskCategory: selects[1],
    workSubcategory: selects[2],
    areaZone: selects[3],
    standardPhrase: selects[4],
  };
}

function getSelectedComboboxValue(combobox) {
  return combobox.getAttribute('data-selected-value') || '';
}

async function getDropdownOptionLabels(user, combobox) {
  await user.click(combobox);
  const listbox = screen.getByRole('listbox');
  const labels = within(listbox).getAllByRole('option').map((option) => (option.textContent || '').trim());
  await user.click(combobox);
  return labels;
}

async function selectDropdownOption(user, combobox, label) {
  await user.click(combobox);
  await user.click(screen.getByRole('option', { name: label }));
}

async function openDropdown(user, combobox) {
  await user.click(combobox);
  return screen.getByRole('listbox');
}


async function openCompactAdd(user, label) {
  await user.click(screen.getByRole('button', { name: `Add ${label}` }));
}

async function saveCompactAdd(user, label, value) {
  await openCompactAdd(user, label);
  const input = screen.getByPlaceholderText('Type a new option');
  await user.clear(input);
  await user.type(input, value);
  await user.click(screen.getByRole('button', { name: /^Save$/i }));
}

function createImageFile(name, size = 2048) {
  return new File([new Uint8Array(size)], name, { type: 'image/jpeg' });
}

function getBatchPhotoInputs(container) {
  const camera = container.querySelector('input[data-testid="batch-camera-input"]');
  const gallery = container.querySelector('input[data-testid="batch-gallery-input"]');
  if (!camera || !gallery) throw new Error('Batch photo inputs not found');
  return { camera, gallery };
}

async function uploadBatchPhotos(user, container, files) {
  await user.upload(getBatchPhotoInputs(container).gallery, files);
}

async function uploadBatchCameraPhoto(user, container, file) {
  await user.upload(getBatchPhotoInputs(container).camera, [file]);
}

async function recordInlineVoice(user) {
  await user.click(screen.getByRole('button', { name: /Record in batch/i }));
  expect(screen.getAllByText('Recording inside this batch...').length).toBeGreaterThan(0);
  await user.click(screen.getByRole('button', { name: /Stop recording/i }));
  await waitFor(() => expect(screen.getAllByText(/Voice attached/i).length).toBeGreaterThan(0));
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
  it('keeps mobile check-in and quick action states responsive', async () => withFeature('Check In / Check Out states', async () => {
    const user = userEvent.setup();
    renderWorkerApp('EN');

    const checkInButton = getQuickActionButton(/Check In/i);
    const checkOutButton = getQuickActionButton(/Check Out/i);
    const photoButton = getQuickActionButton(/Update Submission|Submit Work|Upload Photo|อัปเดตส่งงาน|ອັບເດດສົ່ງງານ/i);
    const voiceButton = getQuickActionButton(/Voice Notes|Voice/i);

    expect(checkInButton).toBeEnabled();
    expect(checkOutButton).toBeDisabled();
    expect(photoButton).toBeDisabled();
    expect(voiceButton).toBeDisabled();

    await user.click(checkInButton);
    await waitFor(() => expect(checkOutButton).toBeEnabled());
    await waitFor(() => expect(photoButton).toBeEnabled());
    await waitFor(() => expect(voiceButton).toBeEnabled());

    await user.click(checkOutButton);
    await waitFor(() => expect(checkOutButton).toBeDisabled());
    expect(photoButton).toBeDisabled();
    expect(voiceButton).toBeDisabled();

    return 'Quick actions update immediately on tap and keep the mobile gate logic intact';
  }));


  it('adds custom main category, subcategory, zone, and standard phrase inline', async () => withFeature('Compact add preset flow', async () => {
    const user = userEvent.setup();
    renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);

    await saveCompactAdd(user, 'Task Category', 'Custom QA Category');
    let selects = getPhotoFormSelects();
    expect(getSelectedComboboxValue(selects.taskCategory)).toBe('Custom QA Category');
    expect((await getDropdownOptionLabels(user, selects.taskCategory))[1]).toBe('Custom QA Category');
    expect(screen.getAllByText(/Custom QA Category/).length).toBeGreaterThan(0);

    await saveCompactAdd(user, 'Work Subcategory', 'Custom QA Subcategory');
    selects = getPhotoFormSelects();
    expect(getSelectedComboboxValue(selects.workSubcategory)).toBe('Custom QA Subcategory');
    expect((await getDropdownOptionLabels(user, selects.workSubcategory))[1]).toBe('Custom QA Subcategory');

    await saveCompactAdd(user, 'Zone / Area', 'Roof Edge Test Zone');
    selects = getPhotoFormSelects();
    expect(getSelectedComboboxValue(selects.areaZone)).toBe('Roof Edge Test Zone');
    expect((await getDropdownOptionLabels(user, selects.areaZone))[1]).toBe('Roof Edge Test Zone');
    expect(screen.getAllByText(/Roof Edge Test Zone/).length).toBeGreaterThan(0);

    await saveCompactAdd(user, 'Standard Notes', 'Need final QC approval');
    selects = getPhotoFormSelects();
    expect(getSelectedComboboxValue(selects.standardPhrase)).toBe('Need final QC approval');
    expect((await getDropdownOptionLabels(user, selects.standardPhrase))[1]).toBe('Need final QC approval');
    expect(screen.getByPlaceholderText('Details')).toHaveValue('Need final QC approval');

    return 'Inline add controls insert new items first, refresh immediately, auto-select them, and reflect the result on screen';
  }), 15000);


  it('keeps the batch workflow working after the compact form redesign', async () => withFeature('Batch save and submit flow', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    await saveCompactAdd(user, 'Task Category', 'Mobile QA Category');
    await saveCompactAdd(user, 'Work Subcategory', 'Surface Inspection');
    await saveCompactAdd(user, 'Zone / Area', 'Showroom Entry');
    await saveCompactAdd(user, 'Standard Notes', 'Waiting for inspection sign-off');

    await user.type(screen.getByPlaceholderText('Short title (optional)'), 'Compact UI batch');
    await uploadBatchPhotos(user, view.container, [createImageFile('draft.jpg', 2200)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await recordInlineVoice(user);

    await user.click(screen.getByRole('button', { name: /Save draft/i }));
    await waitFor(() => expect(screen.getByText('Photo batch saved')).toBeInTheDocument());
    expect(screen.getAllByText('Compact UI batch').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);

    await user.type(screen.getByPlaceholderText('Short title (optional)'), 'Compact UI submit');
    await uploadBatchPhotos(user, view.container, [createImageFile('submit.jpg', 2400)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Submit batch/i }));
    await waitFor(() => expect(screen.getByText('Photo batch submitted')).toBeInTheDocument());
    expect(screen.getAllByText('Compact UI submit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0);

    return 'Photo draft and submit still work with the shorter form layout and compact add controls';
  }), 15000);

  it('keeps inline voice and mobile shell navigation working', async () => withFeature('Inline voice and mobile shell', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkIn(user);
    const voiceButton = getQuickActionButton(/Voice Notes|Voice/i);
    await waitFor(() => expect(voiceButton).toBeEnabled());
    await user.click(voiceButton);
    await waitFor(() => expect(screen.getByRole('button', { name: /Start recording/i })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: /Start recording/i }));
    expect(screen.getByText('Recording...')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Stop recording/i }));
    await waitFor(() => expect(view.container.querySelector('audio')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Back/i }));
    await openPhotoScreen(user);
    await recordInlineVoice(user);
    expect(screen.getByRole('button', { name: /Delete batch voice/i })).toBeEnabled();

    return 'Voice screen recording, inline batch recording, and return navigation still work on mobile';
  }));

  it('renders Thai dropdown labels and selected values without clipping', async () => withFeature('Thai dropdown rendering', async () => {
    const user = userEvent.setup();
    renderWorkerApp('TH');

    await checkInAndOpenPhoto(user);

    expect(screen.getByText('หมายเหตมาตรฐาน')).toBeInTheDocument();

    const selects = getPhotoFormSelects();
    expect(selects.taskCategory).toHaveClass('worker-mobile-dropdown-trigger');
    expect(selects.workSubcategory).toHaveClass('worker-mobile-dropdown-trigger');
    expect(selects.areaZone).toHaveClass('worker-mobile-dropdown-trigger');
    expect(selects.standardPhrase).toHaveClass('worker-mobile-dropdown-trigger');

    const taskLabels = await getDropdownOptionLabels(user, selects.taskCategory);
    expect(taskLabels).toContain('งานเตรียมพื้นที่');
    expect(taskLabels).toContain('งานไฟฟ้า');
    await selectDropdownOption(user, selects.taskCategory, 'งานไฟฟ้า');
    expect(getSelectedComboboxValue(selects.taskCategory)).toBe('งานไฟฟ้า');
    expect(selects.taskCategory).toHaveTextContent('งานไฟฟ้า');

    const subcategoryLabels = await getDropdownOptionLabels(user, selects.workSubcategory);
    expect(subcategoryLabels).toContain('ติดตั้งปลั๊ก');
    expect(subcategoryLabels).toContain('ติดตั้งสวิตช์');
    await selectDropdownOption(user, selects.workSubcategory, 'ติดตั้งปลั๊ก');
    expect(getSelectedComboboxValue(selects.workSubcategory)).toBe('ติดตั้งปลั๊ก');
    expect(selects.workSubcategory).toHaveTextContent('ติดตั้งปลั๊ก');

    const zoneLabels = await getDropdownOptionLabels(user, selects.areaZone);
    expect(zoneLabels).toContain('ห้องน้ำชั้นล่าง');
    expect(zoneLabels).toContain('โถงชั้นบน');
    await selectDropdownOption(user, selects.areaZone, 'ห้องน้ำชั้นล่าง');
    expect(getSelectedComboboxValue(selects.areaZone)).toBe('ห้องน้ำชั้นล่าง');
    expect(selects.areaZone).toHaveTextContent('ห้องน้ำชั้นล่าง');

    const phraseLabels = await getDropdownOptionLabels(user, selects.standardPhrase);
    expect(phraseLabels).toContain('พื้นที่ยังไม่พร้อม');
    expect(phraseLabels).toContain('งานคืบหน้าตามแผน');
    await selectDropdownOption(user, selects.standardPhrase, 'พื้นที่ยังไม่พร้อม');
    expect(getSelectedComboboxValue(selects.standardPhrase)).toBe('พื้นที่ยังไม่พร้อม');
    expect(selects.standardPhrase).toHaveTextContent('พื้นที่ยังไม่พร้อม');
    expect(screen.getByPlaceholderText('Details')).toHaveValue('พื้นที่ยังไม่พร้อม');

    return 'Thai dropdown options and selected values keep upper vowels and tone marks across task, zone, subcategory, and standard-note fields';
  }), 15000);

  it('renders full-row dropdown option backgrounds and selected states', async () => withFeature('Dropdown option row background', async () => {
    const user = userEvent.setup();
    renderWorkerApp('TH');

    await checkInAndOpenPhoto(user);

    const selects = getPhotoFormSelects();
    const listbox = await openDropdown(user, selects.standardPhrase);
    const option = within(listbox).getByRole('option', { name: 'พื้นที่ยังไม่พร้อม' });

    expect(option).toHaveClass('worker-mobile-dropdown-option');
    expect(option).toHaveAttribute('data-selected', 'false');

    await user.click(option);
    expect(getSelectedComboboxValue(selects.standardPhrase)).toBe('พื้นที่ยังไม่พร้อม');

    const reopenedListbox = await openDropdown(user, selects.standardPhrase);
    const selectedOption = within(reopenedListbox).getByRole('option', { name: 'พื้นที่ยังไม่พร้อม' });
    expect(selectedOption).toHaveClass('worker-mobile-dropdown-option');
    expect(selectedOption).toHaveAttribute('data-selected', 'true');

    return 'Dropdown options use a full-row container for the background and keep the selected state on the main option row';
  }), 15000);
  it('preserves Thai, Lao, and English labels with the new compact controls', async () => withFeature('Three-language labels', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    expect(screen.getByText('Standard Notes')).toBeInTheDocument();

    rerender(
      <WorkerAppV2
        onNavigate={onNavigate}
        t={t}
        language="TH"
        workersList={workersList}
        projectsList={projectsList}
      />
    );
    await waitFor(() => expect(screen.getByText('หมายเหตมาตรฐาน')).toBeInTheDocument());

    rerender(
      <WorkerAppV2
        onNavigate={onNavigate}
        t={t}
        language="LA"
        workersList={workersList}
        projectsList={projectsList}
      />
    );
    await waitFor(() => expect(screen.getByText('ປະໂຫຍກມາດຕະຖານ')).toBeInTheDocument());

    rerender(
      <WorkerAppV2
        onNavigate={onNavigate}
        t={t}
        language="EN"
        workersList={workersList}
        projectsList={projectsList}
      />
    );
    await waitFor(() => expect(screen.getByText('Standard Notes')).toBeInTheDocument());

    return 'Compact add labels and worker form labels still switch across EN / TH / LA with the renamed standard-note section';
  }));
});
