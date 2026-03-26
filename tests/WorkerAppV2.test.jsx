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
const sharedChats = [
  { id: 'chat-1', sender: 'Manager Nok', senderRole: 'manager', text: 'Concrete delivery will arrive at 10:30.', time: '10:05', projectId: 'p1', createdAt: 1700000000000 },
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

function renderWorkerApp(language = 'EN', overrides = {}) {
  return render(
    <WorkerAppV2
      onNavigate={onNavigate}
      t={t}
      language={language}
      workersList={overrides.workersList || workersList}
      projectsList={overrides.projectsList || projectsList}
      sharedChats={overrides.sharedChats || sharedChats}
      onPersistChatMessage={overrides.onPersistChatMessage || vi.fn(async () => {})}
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
  const reportsButton = getQuickActionButton(/Work Reports|รายงานงาน|ລາຍງານວຽກ/i);
  if (!reportsButton) throw new Error('Work reports quick action not found');
  await waitFor(() => expect(reportsButton).toBeEnabled());
  await user.click(reportsButton);
  await waitFor(() => expect(screen.getByText('Work Reports')).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /Update Work|อัปเดตงาน|ອັບເດດວຽກ/i }));
  await waitFor(() => expect(screen.getByText('Submit Work Photo')).toBeInTheDocument());
}

async function openIssueScreen(user) {
  const issueButton = getQuickActionButton(/Issue|SOS|Report Issue|แจ้งปัญหา|ບັນຫາ/i);
  if (!issueButton) throw new Error('Issue quick action not found');
  await waitFor(() => expect(issueButton).toBeEnabled());
  await user.click(issueButton);
  await waitFor(() => expect(screen.getAllByText('Site Tickets / Issues / Defects').length).toBeGreaterThan(0));
}

async function openDailyReportScreen(user) {
  const reportsButton = getQuickActionButton(/Work Reports|รายงานงาน|ລາຍງານວຽກ/i);
  if (!reportsButton) throw new Error('Work reports quick action not found');
  await waitFor(() => expect(reportsButton).toBeEnabled());
  await user.click(reportsButton);
  await waitFor(() => expect(screen.getByText('Work Reports')).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /Daily Summary|สรุปรายวัน|ສະຫຼຸບປະຈຳວັນ/i }));
  await waitFor(() => expect(screen.getAllByText('Daily Report / Site Diary').length).toBeGreaterThan(0));
}

async function settleUi(delay = 450) {
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function checkIn(user) {
  const checkInButton = getQuickActionButton(/Check In/i);
  if (!checkInButton) throw new Error('Check In quick action not found');
  await user.click(checkInButton);
  await waitFor(() => expect(checkInButton).toBeDisabled());
  await settleUi();
}

async function checkInAndOpenPhoto(user) {
  await checkIn(user);
  await openPhotoScreen(user);
}

function getPhotoFormSelects() {
  const selects = screen.getAllByRole('combobox');
  return {
    taskCategory: selects[0],
    workSubcategory: selects[1],
    areaZone: selects[2],
    standardPhrase: selects[3],
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

function getVisiblePhotoActionButtons() {
  const cameraButton = screen.getByRole('button', { name: 'ถ่ายรูป' });
  const galleryButton = screen.getByRole('button', { name: 'เลือกรูป' });
  return { cameraButton, galleryButton };
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
    const photoButton = getQuickActionButton(/Work Reports|รายงานงาน|ລາຍງານວຽກ/i);

    expect(checkInButton).toBeEnabled();
    expect(checkOutButton).toBeDisabled();
    expect(photoButton).toBeDisabled();
    expect(getQuickActionButton(/Voice Notes|Voice/i)).toBeUndefined();

    await user.click(checkInButton);
    await waitFor(() => expect(checkOutButton).toBeEnabled());
    await waitFor(() => expect(photoButton).toBeEnabled());
    expect(getQuickActionButton(/Voice Notes|Voice/i)).toBeUndefined();

    await user.click(checkOutButton);
    await waitFor(() => expect(checkOutButton).toBeDisabled());
    await settleUi();
    expect(photoButton).toBeDisabled();
    expect(getQuickActionButton(/Voice Notes|Voice/i)).toBeUndefined();

    return 'Quick actions update immediately on tap and keep the mobile gate logic intact';
  }));



  it('opens grouped work reports and the restored chat menu', async () => withFeature('Worker menu grouping and chat route', async () => {
    const user = userEvent.setup();
    const onPersistChatMessage = vi.fn(async () => {});
    renderWorkerApp('EN', { onPersistChatMessage });

    await checkIn(user);

    const reportsButton = getQuickActionButton(/Work Reports|รายงานงาน|ລາຍງານວຽກ/i);
    if (!reportsButton) throw new Error('Work reports quick action not found');
    await waitFor(() => expect(reportsButton).toBeEnabled());
    await user.click(reportsButton);
    await waitFor(() => expect(screen.getByText('Work Reports')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Update Work|อัปเดตงาน|ອັບເດດວຽກ/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Daily Summary|สรุปรายวัน|ສະຫຼຸບປະຈຳວັນ/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Milestone Progress|ส่งความคืบหน้างวดงาน|ສົ່ງຄວາມຄືບໜ້າຕາມງວດ/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Chat|แชท|ແຊັດ/i }));
    await waitFor(() => expect(screen.getByText('Project Chat')).toBeInTheDocument());
    expect(screen.getByText('Concrete delivery will arrive at 10:30.')).toBeInTheDocument();

    const chatInput = screen.getByPlaceholderText('Type message...');
    await user.type(chatInput, 'Need confirmation for tile delivery');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(onPersistChatMessage).toHaveBeenCalledTimes(1));
    expect(onPersistChatMessage.mock.calls[0][0]).toMatchObject({
      senderRole: 'worker',
      projectId: 'p1',
      text: 'Need confirmation for tile delivery',
    });

    return 'The worker home groups work reports into one hub and the chat nav opens the real project conversation flow';
  }), 15000);

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

    await user.type(screen.getByPlaceholderText('Details'), 'Draft note for simplified flow');
    await uploadBatchPhotos(user, view.container, [createImageFile('draft.jpg', 2200)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await recordInlineVoice(user);

    await user.click(screen.getByRole('button', { name: /Save draft/i }));
    await waitFor(() => expect(screen.getAllByText('Draft').length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Mobile QA Category/).length).toBeGreaterThan(0);

    await user.type(screen.getByPlaceholderText('Details'), 'Submit note for simplified flow');
    await uploadBatchPhotos(user, view.container, [createImageFile('submit.jpg', 2400)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Submit batch/i }));
    await waitFor(() => expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Showroom Entry/).length).toBeGreaterThan(0);

    return 'Photo draft and submit still work with the shorter form layout and compact add controls';
  }), 15000);


  it('shows preview items and allows removal before submit', async () => withFeature('Attachment preview and removal flow', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);
    await saveCompactAdd(user, 'Task Category', 'Preview QA Category');
    await saveCompactAdd(user, 'Work Subcategory', 'Preview QA Subcategory');
    await saveCompactAdd(user, 'Zone / Area', 'Preview QA Zone');

    await user.type(screen.getByPlaceholderText('Details'), 'Preview note before submit');
    await uploadBatchPhotos(user, view.container, [createImageFile('preview.jpg', 2100)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await recordInlineVoice(user);

    expect(screen.getByText('Preview before submit')).toBeInTheDocument();
    expect(screen.getAllByText('Preview note before submit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Voice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Short note').length).toBeGreaterThan(0);

    const previewRemoveButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(previewRemoveButtons[previewRemoveButtons.length - 1]);
    await waitFor(() => expect(screen.queryByText('Preview note before submit')).not.toBeInTheDocument());

    return 'The shared attachment composer previews photo, voice, and note items and lets the worker remove a note before submitting';
  }), 15000);

  it('creates a site ticket with shared attachments and searchable list results', async () => withFeature('Site ticket create flow', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkIn(user);
    await openIssueScreen(user);
    await user.click(screen.getByRole('button', { name: 'New Ticket' }));

    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Water leak at unit 1203');
    await user.type(textboxes[1], 'Leak found near the bathroom pipe sleeve.');
    await user.type(textboxes[2], 'Unit 1203 bathroom');
    await user.type(screen.getByPlaceholderText('Type a short note for this ticket'), 'Photo and voice attached for supervisor review');
    await uploadBatchPhotos(user, view.container, [createImageFile('ticket-photo.jpg', 2300)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Record in ticket/i }));
    await user.click(screen.getByRole('button', { name: /Stop recording/i }));
    await waitFor(() => expect(screen.getAllByText(/Voice attached/i).length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: 'Save Ticket' }));
    await waitFor(() => expect(screen.getByText('Water leak at unit 1203')).toBeInTheDocument());
    expect(screen.getAllByText('Photo and voice attached for supervisor review').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Back to list' }));
    const searchInput = screen.getByPlaceholderText('Search title, description, or assignee');
    await user.type(searchInput, 'Water leak');
    await waitFor(() => expect(screen.getByText('Water leak at unit 1203')).toBeInTheDocument());

    return 'Workers can create a real site ticket with the shared attachment composer and find it again from the list search';
  }), 20000);

  it('lets a supervisor update ticket status and add follow-up notes', async () => withFeature('Site ticket supervisor update flow', async () => {
    const user = userEvent.setup();
    const supervisorWorkers = [
      { id: 's1', name: 'Nok Supervisor', assignedSiteId: 'p1', role: 'supervisor' },
      { id: 'w1', name: 'Somchai', assignedSiteId: 'p1', role: 'worker' },
    ];
    renderWorkerApp('EN', { workersList: supervisorWorkers });

    await checkIn(user);
    await openIssueScreen(user);
    await user.click(screen.getByRole('button', { name: 'New Ticket' }));

    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Cracked tile at lobby entrance');
    await user.type(textboxes[1], 'Tile edge is cracked and needs replacement.');
    await user.type(textboxes[2], 'Lobby entrance');
    await user.click(screen.getByRole('button', { name: 'Save Ticket' }));
    await waitFor(() => expect(screen.getByText('Cracked tile at lobby entrance')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Edit Ticket' }));
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[3], 'w1');
    await user.selectOptions(selects[4], 'completed');
    await user.type(screen.getByPlaceholderText('Type an update note'), 'Supervisor checked the area and marked it completed.');
    await user.click(screen.getByRole('button', { name: 'Update Ticket' }));

    await waitFor(() => expect(screen.getAllByText('Completed').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Supervisor checked the area and marked it completed.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Somchai').length).toBeGreaterThan(0);
    expect(screen.getByText('Ticket Timeline')).toBeInTheDocument();
    expect(screen.getAllByText('Status changed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Assignee changed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Supervisor checked the area and marked it completed.').length).toBeGreaterThan(0);

    return 'Supervisors can assign a worker, change status, and save a follow-up note with visible timeline events on the same ticket';
  }), 20000);

  it('shows overdue state for open tickets past the due date', async () => withFeature('Site ticket overdue state', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await checkIn(user);
    await openIssueScreen(user);
    await user.click(screen.getByRole('button', { name: 'New Ticket' }));

    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Overdue waterproof check');
    await user.type(textboxes[1], 'Waterproof inspection has passed its due date.');
    await user.type(textboxes[2], 'Roof slab');
    const dueDateInput = view.container.querySelector('input[type="date"]');
    if (!dueDateInput) throw new Error('Due date input not found');
    await user.type(dueDateInput, yesterday);
    await user.click(screen.getByRole('button', { name: 'Save Ticket' }));

    await waitFor(() => expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0));
    expect(screen.getByText('Assignment and Status')).toBeInTheDocument();

    return 'Open tickets with past due dates show an overdue state in the detail and assignment panels';
  }), 20000);
  it('creates a daily report with shared attachments and linked tickets', async () => withFeature('Daily report create flow', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkIn(user);
    await openIssueScreen(user);
    await user.click(screen.getByRole('button', { name: 'New Ticket' }));
    let textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Daily report linked ticket');
    await user.type(textboxes[1], 'Ticket created for the report linkage test.');
    await user.type(textboxes[2], 'Zone C stair core');
    await user.click(screen.getByRole('button', { name: 'Save Ticket' }));
    await waitFor(() => expect(screen.getByText('Daily report linked ticket')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Back to list' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    await openDailyReportScreen(user);
    await user.click(screen.getByRole('button', { name: 'Create Report' }));

    const reportDateInput = view.container.querySelector('input[type="date"]');
    if (!reportDateInput) throw new Error('Daily report date input not found');
    await user.clear(reportDateInput);
    await user.type(reportDateInput, new Date().toISOString().split('T')[0]);

    textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Zone C stair core');
    await user.type(textboxes[1], 'Completed stair nosing checks and cleaned the landing area.');
    const workerCountInput = view.container.querySelector('input[type="number"]');
    if (!workerCountInput) throw new Error('Worker count input not found');
    await user.type(workerCountInput, '8');
    await user.type(textboxes[2], 'Used remaining cement board and ordered more sealant.');
    await user.type(textboxes[3], 'One cracked tile remains from the linked ticket.');
    await user.type(textboxes[4], 'Replace the cracked tile and close the stair core handover items.');
    await user.click(screen.getByRole('checkbox', { name: /Daily report linked ticket/i }));
    await user.type(screen.getByPlaceholderText('Type a short note for this report'), 'Voice and photo attached for the site diary.');
    await uploadBatchPhotos(user, view.container, [createImageFile('daily-report.jpg', 2400)]);
    await waitFor(() => expect(screen.getByText('Photos: 1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Record in report/i }));
    await user.click(screen.getByRole('button', { name: /Stop recording/i }));
    await waitFor(() => expect(screen.getAllByText(/Voice attached/i).length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: 'Save Report' }));

    await waitFor(() => expect(screen.getAllByText('Zone C stair core').length).toBeGreaterThan(0));
    expect(screen.getByText('Daily report linked ticket')).toBeInTheDocument();
    expect(screen.getAllByText('Voice and photo attached for the site diary.').length).toBeGreaterThan(0);

    return 'Workers can create a daily report with shared attachments and a linked site ticket from the same mobile app shell';
  }), 25000);

  it('updates a daily report and keeps the changed detail in report view', async () => withFeature('Daily report edit flow', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');

    await checkIn(user);
    await openDailyReportScreen(user);
    await user.click(screen.getByRole('button', { name: 'Create Report' }));

    let textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Tower lift lobby');
    await user.type(textboxes[1], 'Initial report before supervisor edit.');
    const workerCountInput = view.container.querySelector('input[type="number"]');
    if (!workerCountInput) throw new Error('Worker count input not found');
    await user.type(workerCountInput, '5');
    await user.type(textboxes[4], 'Paint touch-up on the door frame.');
    await user.click(screen.getByRole('button', { name: 'Save Report' }));
    await waitFor(() => expect(screen.getAllByText('Tower lift lobby').length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: 'Edit Report' }));
    textboxes = screen.getAllByRole('textbox');
    await user.clear(textboxes[4]);
    await user.type(textboxes[4], 'Paint touch-up and final cleaning for owner walk-through.');
    await user.click(screen.getByRole('button', { name: 'Update Report' }));

    await waitFor(() => expect(screen.getByText('Paint touch-up and final cleaning for owner walk-through.')).toBeInTheDocument());

    return 'Supervisors and workers can reopen a saved daily report, change the tomorrow plan, and keep the updated detail on the same report record';
  }), 20000);

  it('filters daily reports by project and date', async () => withFeature('Daily report filtering', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('EN');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await checkIn(user);
    await openDailyReportScreen(user);
    await user.click(screen.getByRole('button', { name: 'Create Report' }));
    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Sky Tower zone');
    await user.type(textboxes[1], 'Sky Tower report entry.');
    const workerCountInput = view.container.querySelector('input[type="number"]');
    if (!workerCountInput) throw new Error('Worker count input not found');
    await user.type(workerCountInput, '4');
    await user.click(screen.getByRole('button', { name: 'Save Report' }));
    await waitFor(() => expect(screen.getByText('Sky Tower zone')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Back to list' }));

    const filterProject = screen.getAllByRole('combobox')[0];
    await user.selectOptions(filterProject, 'p1');
    let filterDate = view.container.querySelector('input[type="date"]');
    if (!filterDate) throw new Error('Daily report filter date input not found');
    await user.clear(filterDate);
    await user.type(filterDate, today);

    await waitFor(() => expect(screen.getByText('Sky Tower zone')).toBeInTheDocument());

    await user.selectOptions(filterProject, 'p2');
    await waitFor(() => expect(screen.queryByText('Sky Tower zone')).not.toBeInTheDocument());

    filterDate = view.container.querySelector('input[type="date"]');
    if (!filterDate) throw new Error('Daily report filter date input not found');
    await user.clear(filterDate);
    await user.type(filterDate, tomorrow);

    await waitFor(() => expect(screen.queryByText('Sky Tower zone')).not.toBeInTheDocument());
    expect(screen.getByText('No reports match these filters')).toBeInTheDocument();

    return 'Daily reports can be narrowed by project and report date from the mobile list view';
  }), 25000);
  it('simplifies the submit screen to the short worker flow', async () => withFeature('Simplified submit flow', async () => {
    const user = userEvent.setup();
    renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);

    expect(screen.queryByText('Work Submission Batch')).not.toBeInTheDocument();
    expect(screen.queryByText('Batch Preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Work Type')).not.toBeInTheDocument();
    expect(screen.queryByText('Team')).not.toBeInTheDocument();
    expect(screen.queryByText('Room')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Short title (optional)')).not.toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(4);
    expect(screen.getByText('Inline batch voice')).toBeInTheDocument();

    const photosCard = screen.getByText('Photos').closest('div');
    const voiceCard = screen.getByText('Inline batch voice').closest('div');
    expect(photosCard).toBeTruthy();
    expect(voiceCard).toBeTruthy();

    return 'Submit screen removes work-type/team/room and keeps a shorter photo-to-voice-to-submit flow';
  }));

  it('keeps inline voice controls inside the photo section', async () => withFeature('Inline voice controls in photo form', async () => {
    const user = userEvent.setup();
    renderWorkerApp('EN');

    await checkInAndOpenPhoto(user);

    const photoSection = screen.getByText('Photos').closest('div');
    const voiceSection = screen.getByText('Inline batch voice').closest('div');
    expect(photoSection).toBeTruthy();
    expect(voiceSection).toBeTruthy();
    expect(photoSection.compareDocumentPosition(voiceSection)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    const noteTextarea = screen.getByPlaceholderText('Details');
    expect(voiceSection.compareDocumentPosition(noteTextarea)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    await recordInlineVoice(user);
    expect(screen.getByRole('button', { name: /Delete batch voice/i })).toBeEnabled();

    return 'Voice controls stay under the photo section and remain interactive on mobile';
  }));


  it('renders Thai dropdown labels and selected values without clipping', async () => withFeature('Thai dropdown rendering', async () => {
    const user = userEvent.setup();
    renderWorkerApp('TH');

    await checkInAndOpenPhoto(user);

    expect(screen.getByText('\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38\u0e21\u0e32\u0e15\u0e23\u0e10\u0e32\u0e19')).toBeInTheDocument();

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


  it('uses separate Thai camera and gallery actions with the existing batch workflow', async () => withFeature('Thai camera and gallery flow', async () => {
    const user = userEvent.setup();
    const view = renderWorkerApp('TH');

    await checkInAndOpenPhoto(user);

    const { cameraButton, galleryButton } = getVisiblePhotoActionButtons();
    expect(cameraButton).toBeInTheDocument();
    expect(galleryButton).toBeInTheDocument();

    const { camera, gallery } = getBatchPhotoInputs(view.container);
    expect(camera).toHaveAttribute('accept', 'image/*');
    expect(camera).toHaveAttribute('capture', 'environment');
    expect(gallery).toHaveAttribute('accept', 'image/*');
    expect(gallery).not.toHaveAttribute('capture');

    await uploadBatchCameraPhoto(user, view.container, createImageFile('camera-shot.jpg', 2100));
    await waitFor(() => expect(screen.getByText((_, element) => element?.textContent === 'จำนวนรูป: 1')).toBeInTheDocument());
    expect(view.container.querySelector('img')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ลบรูป' }));
    await waitFor(() => expect(screen.queryByText('จำนวนรูป: 1')).not.toBeInTheDocument());

    await uploadBatchPhotos(user, view.container, [createImageFile('gallery-shot.jpg', 2200)]);
    await waitFor(() => expect(screen.getByText((_, element) => element?.textContent === 'จำนวนรูป: 1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'บันทึกฉบับร่าง' }));
    await waitFor(() => expect(screen.getByText('บันทึกชุดรูปแล้ว')).toBeInTheDocument());

    return 'Thai camera and gallery buttons stay separate, keep dedicated inputs, and preserve preview, remove, and draft save flow';
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
    expect(option.querySelector('.worker-mobile-dropdown-option-label')).toBeNull();

    await user.click(option);
    expect(getSelectedComboboxValue(selects.standardPhrase)).toBe('พื้นที่ยังไม่พร้อม');

    const reopenedListbox = await openDropdown(user, selects.standardPhrase);
    const selectedOption = within(reopenedListbox).getByRole('option', { name: 'พื้นที่ยังไม่พร้อม' });
    expect(selectedOption).toHaveClass('worker-mobile-dropdown-option');
    expect(selectedOption).toHaveAttribute('data-selected', 'true');
    expect(selectedOption.querySelector('.worker-mobile-dropdown-option-label')).toBeNull();
    await user.click(selectedOption);

    const taskListbox = await openDropdown(user, selects.taskCategory);
    const taskOption = within(taskListbox).getByRole('option', { name: 'งานไฟฟ้า' });
    expect(taskOption).toHaveClass('worker-mobile-dropdown-option');
    expect(taskOption.querySelector('.worker-mobile-dropdown-option-label')).toBeNull();
    await user.click(taskOption);

    const zoneListbox = await openDropdown(user, selects.areaZone);
    const zoneOption = within(zoneListbox).getByRole('option', { name: 'ห้องน้ำชั้นล่าง' });
    expect(zoneOption).toHaveClass('worker-mobile-dropdown-option');
    expect(zoneOption.querySelector('.worker-mobile-dropdown-option-label')).toBeNull();

    return 'Dropdown options use a single full-row container for the background and selected state across multiple worker menus';
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
    await waitFor(() => expect(screen.getByText('\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38\u0e21\u0e32\u0e15\u0e23\u0e10\u0e32\u0e19')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '\u0e16\u0e48\u0e32\u0e22\u0e23\u0e39\u0e1b' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e23\u0e39\u0e1b' })).toBeInTheDocument();

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

















