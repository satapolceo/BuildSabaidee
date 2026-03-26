import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManagerDashboard, OwnerDashboardPortal } from '../src/App.jsx';

const FIXED_REVIEWED_AT = Date.parse('2026-03-26T08:30:00Z');

const translationMap = {
  manager_menu_payment_requests: 'Payment Requests',
  manager_menu_milestone_submissions: 'Milestone Submissions',
  payment_requests_title: 'Worker Payment Requests',
  payment_requests_intro: 'Review shared worker payment requests and update their status on the same Firestore records.',
  payment_requests_search_placeholder: 'Search requester, project, or note...',
  payment_requests_filter_all_statuses: 'All statuses',
  payment_requests_filter_all_projects: 'All projects',
  payment_requests_filter_all_requesters: 'All requesters',
  payment_requests_empty: 'No payment requests yet',
  payment_requests_stat_total: 'Total Requests',
  payment_requests_stat_pending: 'Pending Review',
  payment_requests_stat_approved: 'Approved',
  payment_requests_stat_rejected: 'Rejected',
  payment_requests_amount: 'Amount',
  payment_requests_requested_at: 'Requested Date',
  payment_requests_detail: 'Request Detail',
  payment_requests_work_scope: 'Work Scope',
  payment_requests_review_note: 'Review Note',
  payment_requests_review_note_placeholder: 'Add a note for approval, rejection, or follow-up',
  payment_requests_note_empty: 'No extra note was submitted',
  payment_requests_review_meta: 'Latest Reviewer',
  milestone_submissions_title: 'Milestone Submission Review',
  milestone_submissions_intro: 'Review shared milestone submissions and evidence from the same Firestore-backed records.',
  milestone_submissions_search_placeholder: 'Search worker, milestone, zone, or note...',
  milestone_submissions_filter_all_statuses: 'All statuses',
  milestone_submissions_filter_all_projects: 'All projects',
  milestone_submissions_filter_all_workers: 'All workers',
  milestone_submissions_filter_all_milestones: 'All milestones',
  milestone_submissions_empty: 'No milestone submissions yet',
  milestone_submissions_stat_total: 'Total Submissions',
  milestone_submissions_stat_submitted: 'Submitted',
  milestone_submissions_stat_approved: 'Approved',
  milestone_submissions_stat_rejected: 'Rejected',
  milestone_submissions_detail: 'Submission Detail',
  milestone_submissions_progress: 'Progress',
  milestone_submissions_worker: 'Submitted By',
  milestone_submissions_submitted_at: 'Submitted Date',
  milestone_submissions_area: 'Area',
  milestone_submissions_photo_count: 'Photos',
  milestone_submissions_evidence: 'Evidence Photos',
  milestone_submissions_review_note: 'Review Note',
  milestone_submissions_review_note_placeholder: 'Add guidance or a review note for this submission',
  milestone_submissions_note_empty: 'No extra note was submitted',
  milestone_submissions_review_meta: 'Latest Reviewer',
  review_status_pending: 'Pending Review',
  review_status_submitted: 'Submitted',
  review_status_approved: 'Approved',
  review_status_rejected: 'Rejected',
  review_action_mark_pending: 'Mark Pending',
  review_action_save_note: 'Save Note',
  btn_approve: 'Approve',
  btn_reject: 'Reject',
  table_project: 'Project',
  requests_unspecified: 'Unspecified',
  owner_menu_budget_payments: 'Budget & Payments',
  owner_menu_approvals: 'Approvals',
  owner_payment_requests_title: 'Site Payment Requests',
  owner_payment_requests_desc: 'Show the latest worker payment requests and their review state in a simple owner view.',
  owner_payment_requests_pending: 'Pending Review',
  owner_payment_requests_approved: 'Approved',
  owner_payment_requests_empty: 'No payment requests are available for this project yet.',
  owner_approvals_title: 'Site Approval Activity',
  owner_approvals_desc: 'A clear owner-facing view for payment requests and milestone submissions from the site team.',
  owner_approvals_pending_payments: 'Pending Payments',
  owner_approvals_submitted_milestones: 'Submitted Milestones',
  owner_approvals_approved_milestones: 'Approved Milestones',
  owner_approvals_rejected_milestones: 'Rejected Milestones',
  owner_approvals_payment_queue: 'Payment Request Queue',
  owner_approvals_milestones: 'Milestone Submissions',
  owner_project_select_label: 'Project',
  owner_metric_no_project: 'No project selected',
  owner_budget_summary_title: 'Budget and Payments Summary',
  owner_budget_summary_desc: 'Show key amounts from quotations, agreements, and billing records in a simple homeowner view.',
  owner_budget_quoted_amount: 'Quoted Amount',
  owner_budget_agreed_amount: 'Agreed Amount',
  owner_budget_billed_amount: 'Billed Amount',
  owner_budget_paid_amount: 'Paid Amount',
  owner_budget_pending_amount: 'Pending Amount',
  owner_budget_outstanding_amount: 'Outstanding Amount',
  owner_project_overview_card: 'Project Overview',
  owner_project_location: 'Location',
  owner_project_timeline: 'Timeline',
  owner_project_stage_summary: 'Stage',
  owner_project_main_contact: 'Main Contact',
  owner_project_dates_missing: 'Dates missing',
  owner_project_contact_missing: 'Contact missing',
  owner_budget_project_value_fallback: 'If no agreement amount exists yet, the project value is used as the reference amount.',
  owner_budget_recent_records: 'Recent Billing Records',
  owner_budget_no_records: 'No billing or payment records are available for this project yet.',
  owner_section_budget_payments_desc: 'Budget and payments section.',
  owner_section_approvals_desc: 'Approvals section.',
  owner_dashboard_title: 'Owner Dashboard',
  owner_overview_summary_desc: 'Overview summary',
  owner_progress_section_title: 'Project Progress',
  owner_progress_section_desc: 'Project progress section',
  owner_menu_overview: 'Overview',
  owner_menu_project_progress: 'Project Progress',
  owner_menu_documents: 'Documents',
  owner_menu_messages: 'Messages',
  owner_menu_profile: 'Profile',
  owner_section_documents_desc: 'Documents section',
  owner_section_messages_desc: 'Messages section',
  owner_section_profile_desc: 'Profile section',
  nav_owner_portal: 'Owner Portal',
  owner_portal_isolated_notice: 'Read-only owner view',
  project_current_milestone: 'Current Status',
  owner_stage_handover: 'Handover',
  owner_stage_finishing: 'Finishing',
  owner_stage_systems: 'Systems',
  owner_stage_structure: 'Structure',
  owner_stage_planning: 'Planning',
  owner_back_home: 'Back',
  auth_loading: 'Processing...',
  auth_generic_error: 'This action could not be completed. Please try again.',
  review_permission_denied: 'You do not have permission to review this item.',
  review_invalid_transition: 'This review status can no longer be changed from its current state.',
};

const t = (key) => translationMap[key] || key;

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const projectsList = [
  { id: 'p1', name: 'Riverside Villa', progress: 68, status: 'active', location: 'Vientiane', startDate: '2026-03-01', endDate: '2026-09-30', value: 4800000 },
];

const workersList = [
  { id: 'w1', name: 'Noy Supervisor', role: 'supervisor', assignedSiteId: 'p1', status: 'active' },
  { id: 'w2', name: 'Kham Worker', role: 'worker', assignedSiteId: 'p1', status: 'active' },
];

const paymentRequestsList = [
  { id: 'pay-1', projectId: 'p1', projectName: 'Riverside Villa', workerId: 'w2', workerName: 'Kham Worker', amount: 18500, taskCategory: 'Tiling', areaZone: 'Lobby', note: 'Advance needed for replacement tiles', requestedAt: Date.parse('2026-03-24T08:00:00Z'), status: 'pending' },
  { id: 'pay-2', projectId: 'p1', projectName: 'Riverside Villa', workerId: 'w1', workerName: 'Noy Supervisor', amount: 9200, taskCategory: 'Lighting', areaZone: 'Porch', note: 'Lantern fitting adjustment completed', requestedAt: Date.parse('2026-03-23T09:00:00Z'), status: 'approved', reviewNote: 'Approved for March progress', reviewedBy: 'Manager One', reviewedAt: Date.parse('2026-03-23T12:00:00Z') },
];

const milestoneSubmissionsList = [
  { id: 'mile-1', projectId: 'p1', projectName: 'Riverside Villa', workerId: 'w1', workerName: 'Noy Supervisor', taskCategory: 'Exterior Paint', areaZone: 'Front facade', progress: '85%', note: 'Facade coat complete and ready for inspection', submittedAt: Date.parse('2026-03-24T10:00:00Z'), status: 'submitted', photoCount: 1, photos: [{ id: 'mp-1', imageData: 'data:image/jpeg;base64,abc', originalName: 'facade.jpg' }] },
  { id: 'mile-2', projectId: 'p1', projectName: 'Riverside Villa', workerId: 'w2', workerName: 'Kham Worker', taskCategory: 'Cabinet Install', areaZone: 'Kitchen', progress: '100%', note: 'Kitchen cabinet handover ready', submittedAt: Date.parse('2026-03-22T10:00:00Z'), status: 'approved', reviewNote: 'Ready for owner walkthrough', reviewedBy: 'Admin One', reviewedAt: Date.parse('2026-03-22T13:00:00Z'), photoCount: 0, photos: [] },
];

const docsList = [
  { id: 'd1', projectId: 'p1', type: 'quotation', title: 'Main quotation', amount: 5000000, status: 'approved', createdAt: Date.parse('2026-03-01T08:00:00Z') },
  { id: 'd2', projectId: 'p1', type: 'agreement', title: 'Signed agreement', amount: 4800000, status: 'approved', createdAt: Date.parse('2026-03-05T08:00:00Z') },
  { id: 'd3', projectId: 'p1', type: 'invoice', title: 'Progress billing 1', amount: 250000, status: 'pending', createdAt: Date.parse('2026-03-21T08:00:00Z') },
];

const quotationDraft = {
  items: [{ id: 'q1', description: 'Work item', quantity: 1, unitPrice: 1000 }],
  notes: '',
  paymentTerms: '',
  discount: 0,
  tax: 0,
};

const agreementDraft = {
  paymentTerms: '',
  warrantyTerms: '',
  changeOrderTerms: '',
  terminationTerms: '',
};

const documentTemplateSettings = {
  EN: {
    quotationHeading: 'Quotation',
    quotationNotes: 'Quotation notes',
    paymentTerms: 'Payment terms',
    agreementStandardClauses: 'Standard clauses',
    signatureClientLabel: 'Client',
    signatureContractorLabel: 'Contractor',
    defaultDocumentWording: 'Document wording',
  },
  TH: {
    quotationHeading: 'ใบเสนอราคา',
    quotationNotes: 'หมายเหตุใบเสนอราคา',
    paymentTerms: 'เงื่อนไขการชำระเงิน',
    agreementStandardClauses: 'ข้อกำหนดมาตรฐาน',
    signatureClientLabel: 'ลูกค้า',
    signatureContractorLabel: 'ผู้รับเหมา',
    defaultDocumentWording: 'ถ้อยคำเอกสาร',
  },
  LA: {
    quotationHeading: 'ໃບສະເໜີລາຄາ',
    quotationNotes: 'ໝາຍເຫດໃບສະເໜີລາຄາ',
    paymentTerms: 'ເງື່ອນໄຂການຊຳລະ',
    agreementStandardClauses: 'ຂໍ້ກຳນົດມາດຕະຖານ',
    signatureClientLabel: 'ລູກຄ້າ',
    signatureContractorLabel: 'ຜູ້ຮັບເໝົາ',
    defaultDocumentWording: 'ຂໍ້ຄວາມເອກະສານ',
  },
};

function createManagerProps(overrides = {}) {
  return {
    onNavigate: vi.fn(),
    t,
    language: 'EN',
    isKioskMode: false,
    onToggleKioskMode: vi.fn(),
    dashboardRole: 'user',
    adminNavOnly: false,
    authSession: { role: 'user', displayName: 'Manager One' },
    projectsList,
    workersList,
    docsList,
    inventoryList: [],
    globalRequests: [],
    globalIssues: [],
    globalChats: [],
    paymentRequestsList,
    milestoneSubmissionsList,
    onUpdatePaymentRequestReview: vi.fn(),
    onUpdateMilestoneSubmissionReview: vi.fn(),
    companyProfile: {},
    setCompanyProfile: vi.fn(),
    quotationDraft,
    setQuotationDraft: vi.fn(),
    agreementDraft,
    setAgreementDraft: vi.fn(),
    documentTemplateSettings,
    setDocumentTemplateSettings: vi.fn(),
    supplierDirectory: [],
    setSupplierDirectory: vi.fn(),
    purchaseOrders: [],
    setPurchaseOrders: vi.fn(),
    supplierCategories: [],
    setSupplierCategories: vi.fn(),
    supplierAgreements: [],
    setSupplierAgreements: vi.fn(),
    commissionBillingRecords: [],
    setCommissionBillingRecords: vi.fn(),
    settlementRecords: [],
    setSettlementRecords: vi.fn(),
    adminPlatformSettings: {},
    setAdminPlatformSettings: vi.fn(),
    pricingPackages: [],
    setPricingPackages: vi.fn(),
    ...overrides,
  };
}

function createOwnerProps(overrides = {}) {
  return {
    onNavigate: vi.fn(),
    t,
    language: 'EN',
    authSession: { role: 'owner', displayName: 'Owner Demo' },
    projectsList,
    workersList,
    docsList,
    globalChats: [],
    photoReportsList: [],
    paymentRequestsList,
    milestoneSubmissionsList,
    siteTicketsList: [],
    dailyReportsList: [],
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(Date, 'now').mockReturnValue(FIXED_REVIEWED_AT);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Dashboard review panels', () => {
  it('sends the correct payment request review payloads through the existing manager callback boundary', async () => {
    const user = userEvent.setup();
    const onUpdatePaymentRequestReview = vi.fn().mockResolvedValue(undefined);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(<ManagerDashboard {...createManagerProps({ onUpdatePaymentRequestReview })} />);

    await user.click(screen.getAllByRole('button', { name: 'Payment Requests' })[0]);

    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark Pending' })).toBeInTheDocument();
    
    setItemSpy.mockClear();

    const reviewNote = screen.getByPlaceholderText('Add a note for approval, rejection, or follow-up');
    await user.type(reviewNote, 'Need invoice image before release');

    await user.click(screen.getByRole('button', { name: 'Save Note' }));
    await waitFor(() => expect(onUpdatePaymentRequestReview).toHaveBeenCalledWith(
      'pay-1',
      expect.objectContaining({
        reviewNote: 'Need invoice image before release',
        reviewedAt: FIXED_REVIEWED_AT,
        reviewedBy: 'Manager One',
        reviewerRole: 'manager',
      }),
    ));

    onUpdatePaymentRequestReview.mockClear();
    await user.click(screen.getByRole('button', { name: 'Mark Pending' }));
    await waitFor(() => expect(onUpdatePaymentRequestReview).toHaveBeenCalledWith(
      'pay-1',
      expect.objectContaining({
        status: 'pending',
        reviewNote: 'Need invoice image before release',
        reviewedAt: FIXED_REVIEWED_AT,
        reviewedBy: 'Manager One',
        reviewerRole: 'manager',
      }),
    ));

    onUpdatePaymentRequestReview.mockClear();
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(onUpdatePaymentRequestReview).toHaveBeenCalledWith(
      'pay-1',
      expect.objectContaining({
        status: 'rejected',
        reviewNote: 'Need invoice image before release',
      }),
    ));

    onUpdatePaymentRequestReview.mockClear();
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(onUpdatePaymentRequestReview).toHaveBeenCalledWith(
      'pay-1',
      expect.objectContaining({
        status: 'approved',
        reviewNote: 'Need invoice image before release',
      }),
    ));

    expect(setItemSpy).not.toHaveBeenCalled();
  }, 15000);

  it('sends the correct milestone submission review payloads through the existing admin callback boundary', async () => {
    const user = userEvent.setup();
    const onUpdateMilestoneSubmissionReview = vi.fn().mockResolvedValue(undefined);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <ManagerDashboard
        {...createManagerProps({
          dashboardRole: 'platform_owner',
          adminNavOnly: true,
          authSession: { role: 'admin', displayName: 'Admin One' },
          onUpdateMilestoneSubmissionReview,
        })}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Milestone Submissions' })[0]);

    expect(screen.getAllByText('Milestone Submission Review').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark Pending' })).toBeInTheDocument();
    
    setItemSpy.mockClear();

    const reviewNote = screen.getByPlaceholderText('Add guidance or a review note for this submission');
    await user.type(reviewNote, 'Need one more close-up photo');

    await user.click(screen.getByRole('button', { name: 'Save Note' }));
    await waitFor(() => expect(onUpdateMilestoneSubmissionReview).toHaveBeenCalledWith(
      'mile-1',
      expect.objectContaining({
        reviewNote: 'Need one more close-up photo',
        reviewedAt: FIXED_REVIEWED_AT,
        reviewedBy: 'Admin One',
        reviewerRole: 'admin',
      }),
    ));

    onUpdateMilestoneSubmissionReview.mockClear();
    await user.click(screen.getByRole('button', { name: 'Mark Pending' }));
    await waitFor(() => expect(onUpdateMilestoneSubmissionReview).toHaveBeenCalledWith(
      'mile-1',
      expect.objectContaining({
        status: 'submitted',
        reviewNote: 'Need one more close-up photo',
        reviewedAt: FIXED_REVIEWED_AT,
      }),
    ));

    onUpdateMilestoneSubmissionReview.mockClear();
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(onUpdateMilestoneSubmissionReview).toHaveBeenCalledWith(
      'mile-1',
      expect.objectContaining({
        status: 'rejected',
        reviewNote: 'Need one more close-up photo',
      }),
    ));

    onUpdateMilestoneSubmissionReview.mockClear();
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(onUpdateMilestoneSubmissionReview).toHaveBeenCalledWith(
      'mile-1',
      expect.objectContaining({
        status: 'approved',
        reviewNote: 'Need one more close-up photo',
      }),
    ));

    expect(setItemSpy).not.toHaveBeenCalled();
  }, 15000);

  it('shows payment review loading state, disables actions, and renders inline error feedback before a successful retry', async () => {
    const user = userEvent.setup();
    const firstAttempt = createDeferred();
    const onUpdatePaymentRequestReview = vi.fn()
      .mockImplementationOnce(() => firstAttempt.promise)
      .mockRejectedValueOnce(new Error('permission-denied'))
      .mockResolvedValueOnce(undefined);

    render(<ManagerDashboard {...createManagerProps({ onUpdatePaymentRequestReview })} />);

    await user.click(screen.getAllByRole('button', { name: 'Payment Requests' })[0]);

    const approveButton = screen.getByRole('button', { name: 'Approve' });
    const rejectButton = screen.getByRole('button', { name: 'Reject' });
    const pendingButton = screen.getByRole('button', { name: 'Mark Pending' });
    const saveNoteButton = screen.getByRole('button', { name: 'Save Note' });
    const reviewNote = screen.getByPlaceholderText('Add a note for approval, rejection, or follow-up');

    const clickPromise = user.click(approveButton);
    expect((await screen.findAllByText('Processing...')).length).toBeGreaterThan(0);
    expect(approveButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
    expect(pendingButton).toBeDisabled();
    expect(saveNoteButton).toBeDisabled();
    expect(reviewNote).toBeDisabled();

    firstAttempt.resolve();
    await clickPromise;
    await waitFor(() => expect(screen.queryAllByText('Processing...').length).toBe(0));
    expect(approveButton).not.toBeDisabled();
    expect(saveNoteButton).not.toBeDisabled();

    await user.click(rejectButton);
    expect(await screen.findByText('You do not have permission to review this item.')).toBeInTheDocument();
    expect(approveButton).not.toBeDisabled();
    expect(saveNoteButton).not.toBeDisabled();

    await user.type(reviewNote, 'Retry after permission fix');
    await user.click(saveNoteButton);
    await waitFor(() => expect(screen.queryByText('You do not have permission to review this item.')).not.toBeInTheDocument());
    expect(onUpdatePaymentRequestReview).toHaveBeenLastCalledWith(
      'pay-1',
      expect.objectContaining({ reviewNote: 'Retry after permission fix' }),
    );
  }, 15000);

  it('shows milestone review loading state, disables actions, and renders inline error feedback before a successful retry', async () => {
    const user = userEvent.setup();
    const firstAttempt = createDeferred();
    const onUpdateMilestoneSubmissionReview = vi.fn()
      .mockImplementationOnce(() => firstAttempt.promise)
      .mockRejectedValueOnce(new Error('permission-denied'))
      .mockResolvedValueOnce(undefined);

    render(
      <ManagerDashboard
        {...createManagerProps({
          dashboardRole: 'platform_owner',
          adminNavOnly: true,
          authSession: { role: 'admin', displayName: 'Admin One' },
          onUpdateMilestoneSubmissionReview,
        })}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Milestone Submissions' })[0]);

    const approveButton = screen.getByRole('button', { name: 'Approve' });
    const rejectButton = screen.getByRole('button', { name: 'Reject' });
    const pendingButton = screen.getByRole('button', { name: 'Mark Pending' });
    const saveNoteButton = screen.getByRole('button', { name: 'Save Note' });
    const reviewNote = screen.getByPlaceholderText('Add guidance or a review note for this submission');

    const clickPromise = user.click(approveButton);
    expect((await screen.findAllByText('Processing...')).length).toBeGreaterThan(0);
    expect(approveButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
    expect(pendingButton).toBeDisabled();
    expect(saveNoteButton).toBeDisabled();
    expect(reviewNote).toBeDisabled();

    firstAttempt.resolve();
    await clickPromise;
    await waitFor(() => expect(screen.queryAllByText('Processing...').length).toBe(0));
    expect(approveButton).not.toBeDisabled();
    expect(saveNoteButton).not.toBeDisabled();

    await user.click(rejectButton);
    expect(await screen.findByText('You do not have permission to review this item.')).toBeInTheDocument();
    expect(approveButton).not.toBeDisabled();
    expect(saveNoteButton).not.toBeDisabled();

    await user.type(reviewNote, 'Retry with more evidence');
    await user.click(saveNoteButton);
    await waitFor(() => expect(screen.queryByText('You do not have permission to review this item.')).not.toBeInTheDocument());
    expect(onUpdateMilestoneSubmissionReview).toHaveBeenLastCalledWith(
      'mile-1',
      expect.objectContaining({ reviewNote: 'Retry with more evidence' }),
    );
  }, 15000);
  it('shows inline invalid-transition feedback for payment review actions and clears it after a valid retry', async () => {
    const user = userEvent.setup();
    const invalidTransitionError = Object.assign(new Error('invalid-status-transition'), { reviewErrorKey: 'review_invalid_transition' });
    const onUpdatePaymentRequestReview = vi.fn()
      .mockRejectedValueOnce(invalidTransitionError)
      .mockResolvedValueOnce(undefined);

    render(<ManagerDashboard {...createManagerProps({ onUpdatePaymentRequestReview })} />);

    await user.click(screen.getAllByRole('button', { name: 'Payment Requests' })[0]);

    const approveButton = screen.getByRole('button', { name: 'Approve' });
    const rejectButton = screen.getByRole('button', { name: 'Reject' });
    const pendingButton = screen.getByRole('button', { name: 'Mark Pending' });
    const saveNoteButton = screen.getByRole('button', { name: 'Save Note' });
    const reviewNote = screen.getByPlaceholderText('Add a note for approval, rejection, or follow-up');

    await user.click(approveButton);
    expect(await screen.findByText('This review status can no longer be changed from its current state.')).toBeInTheDocument();
    expect(approveButton).not.toBeDisabled();
    expect(rejectButton).not.toBeDisabled();
    expect(pendingButton).not.toBeDisabled();
    expect(saveNoteButton).not.toBeDisabled();
    expect(reviewNote).not.toBeDisabled();

    await user.type(reviewNote, 'Retry with note update');
    await user.click(saveNoteButton);
    await waitFor(() => expect(screen.queryByText('This review status can no longer be changed from its current state.')).not.toBeInTheDocument());
    expect(onUpdatePaymentRequestReview).toHaveBeenLastCalledWith(
      'pay-1',
      expect.objectContaining({ reviewNote: 'Retry with note update' }),
    );
  }, 15000);

  it('renders owner budget and approvals sections as read-only without triggering review updates', async () => {
    const user = userEvent.setup();
    const onUpdatePaymentRequestReview = vi.fn();
    const onUpdateMilestoneSubmissionReview = vi.fn();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <OwnerDashboardPortal
        {...createOwnerProps({
          onUpdatePaymentRequestReview,
          onUpdateMilestoneSubmissionReview,
        })}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Budget & Payments' })[0]);
    expect(screen.getByText('Site Payment Requests')).toBeInTheDocument();
    expect(screen.getByText('Advance needed for replacement tiles')).toBeInTheDocument();
    expect(screen.getAllByText('Pending Review').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: 'Approvals' })[0]);
    expect(screen.getByText('Site Approval Activity')).toBeInTheDocument();
    expect(screen.getByText('Payment Request Queue')).toBeInTheDocument();
    expect(screen.getByText('Milestone Submissions')).toBeInTheDocument();
    expect(screen.getByText('Facade coat complete and ready for inspection')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark Pending' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Note' })).not.toBeInTheDocument();
    expect(onUpdatePaymentRequestReview).not.toHaveBeenCalled();
    expect(onUpdateMilestoneSubmissionReview).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('keeps worker-only actions out of the owner approvals surface while showing milestone evidence details', async () => {
    const user = userEvent.setup();

    render(<OwnerDashboardPortal {...createOwnerProps()} />);

    await user.click(screen.getAllByRole('button', { name: 'Approvals' })[0]);

    expect(screen.getAllByText('Exterior Paint').length).toBeGreaterThan(0);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.queryByText('Create Report')).not.toBeInTheDocument();
    expect(screen.queryByText('New Ticket')).not.toBeInTheDocument();
  });
});









