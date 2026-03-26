import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { docMock, updateDocMock } = vi.hoisted(() => ({
  docMock: vi.fn((firestoreDb, collectionName, documentId) => ({ firestoreDb, collectionName, documentId })),
  updateDocMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: docMock,
    updateDoc: updateDocMock,
  };
});

import {
  default as App,
  getReviewUpdateErrorKey,
  updatePaymentRequestReviewInFirestore,
  updateMilestoneSubmissionReviewInFirestore,
} from '../src/App.jsx';

const FIXED_UPDATED_AT = Date.parse('2026-03-26T09:00:00Z');

describe('App review update handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_UPDATED_AT);
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('writes payment request approve, reject, pending, and note-save payloads through the Firestore update boundary', async () => {
    const firestoreDb = { name: 'db' };
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    await updatePaymentRequestReviewInFirestore(firestoreDb, 'pay-1', {
      status: 'approved',
      reviewNote: 'Approved for payout',
      reviewedBy: 'Manager One',
      reviewerRole: 'manager',
    });

    expect(docMock).toHaveBeenNthCalledWith(1, firestoreDb, 'paymentRequests', 'pay-1');
    expect(updateDocMock).toHaveBeenNthCalledWith(1,
      { firestoreDb, collectionName: 'paymentRequests', documentId: 'pay-1' },
      expect.objectContaining({
        status: 'approved',
        reviewNote: 'Approved for payout',
        reviewedBy: 'Manager One',
        reviewerRole: 'manager',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );

    await updatePaymentRequestReviewInFirestore(firestoreDb, 'pay-1', {
      status: 'rejected',
      reviewNote: 'Need supporting invoice',
      reviewedBy: 'Manager One',
      reviewerRole: 'manager',
    });

    expect(updateDocMock).toHaveBeenNthCalledWith(2,
      { firestoreDb, collectionName: 'paymentRequests', documentId: 'pay-1' },
      expect.objectContaining({
        status: 'rejected',
        reviewNote: 'Need supporting invoice',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );

    await updatePaymentRequestReviewInFirestore(firestoreDb, 'pay-1', {
      status: 'pending',
      reviewNote: 'Waiting for receipt image',
      reviewedBy: 'Manager One',
      reviewerRole: 'manager',
    });

    expect(updateDocMock).toHaveBeenNthCalledWith(3,
      { firestoreDb, collectionName: 'paymentRequests', documentId: 'pay-1' },
      expect.objectContaining({
        status: 'pending',
        reviewNote: 'Waiting for receipt image',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );

    await updatePaymentRequestReviewInFirestore(firestoreDb, 'pay-1', {
      reviewNote: 'Need invoice image before release',
      reviewedAt: FIXED_UPDATED_AT,
      reviewedBy: 'Manager One',
      reviewerRole: 'manager',
    });

    expect(updateDocMock).toHaveBeenNthCalledWith(4,
      { firestoreDb, collectionName: 'paymentRequests', documentId: 'pay-1' },
      expect.objectContaining({
        reviewNote: 'Need invoice image before release',
        reviewedAt: FIXED_UPDATED_AT,
        reviewedBy: 'Manager One',
        reviewerRole: 'manager',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('writes milestone submission approve, reject, submitted-reset, and note-save payloads through the Firestore update boundary', async () => {
    const firestoreDb = { name: 'db' };
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    await updateMilestoneSubmissionReviewInFirestore(firestoreDb, 'mile-1', {
      status: 'approved',
      reviewNote: 'Ready for owner walkthrough',
      reviewedBy: 'Admin One',
      reviewerRole: 'admin',
    });

    expect(docMock).toHaveBeenNthCalledWith(1, firestoreDb, 'milestoneSubmissions', 'mile-1');
    expect(updateDocMock).toHaveBeenNthCalledWith(1,
      { firestoreDb, collectionName: 'milestoneSubmissions', documentId: 'mile-1' },
      expect.objectContaining({
        status: 'approved',
        reviewNote: 'Ready for owner walkthrough',
        reviewedBy: 'Admin One',
        reviewerRole: 'admin',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );

    await updateMilestoneSubmissionReviewInFirestore(firestoreDb, 'mile-1', {
      status: 'rejected',
      reviewNote: 'Need one more close-up photo',
      reviewedBy: 'Admin One',
      reviewerRole: 'admin',
    });

    expect(updateDocMock).toHaveBeenNthCalledWith(2,
      { firestoreDb, collectionName: 'milestoneSubmissions', documentId: 'mile-1' },
      expect.objectContaining({
        status: 'rejected',
        reviewNote: 'Need one more close-up photo',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );

    await updateMilestoneSubmissionReviewInFirestore(firestoreDb, 'mile-1', {
      status: 'submitted',
      reviewNote: 'Returned to pending review',
      reviewedBy: 'Admin One',
      reviewerRole: 'admin',
    });

    expect(updateDocMock).toHaveBeenNthCalledWith(3,
      { firestoreDb, collectionName: 'milestoneSubmissions', documentId: 'mile-1' },
      expect.objectContaining({
        status: 'submitted',
        reviewNote: 'Returned to pending review',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );

    await updateMilestoneSubmissionReviewInFirestore(firestoreDb, 'mile-1', {
      reviewNote: 'Need one more photo from the entry gate',
      reviewedAt: FIXED_UPDATED_AT,
      reviewedBy: 'Admin One',
      reviewerRole: 'admin',
    });

    expect(updateDocMock).toHaveBeenNthCalledWith(4,
      { firestoreDb, collectionName: 'milestoneSubmissions', documentId: 'mile-1' },
      expect.objectContaining({
        reviewNote: 'Need one more photo from the entry gate',
        reviewedAt: FIXED_UPDATED_AT,
        reviewedBy: 'Admin One',
        reviewerRole: 'admin',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('propagates payment request review update failures from the Firestore boundary without localStorage fallback', async () => {
    const firestoreDb = { name: 'db' };
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const permissionError = new Error('permission-denied');
    updateDocMock.mockRejectedValueOnce(permissionError);

    await expect(updatePaymentRequestReviewInFirestore(firestoreDb, 'pay-1', {
      status: 'approved',
      reviewNote: 'Approved for payout',
      reviewedBy: 'Manager One',
      reviewerRole: 'manager',
    })).rejects.toThrow('permission-denied');

    expect(docMock).toHaveBeenCalledWith(firestoreDb, 'paymentRequests', 'pay-1');
    expect(updateDocMock).toHaveBeenCalledWith(
      { firestoreDb, collectionName: 'paymentRequests', documentId: 'pay-1' },
      expect.objectContaining({
        status: 'approved',
        reviewNote: 'Approved for payout',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('propagates milestone submission review update failures from the Firestore boundary without localStorage fallback', async () => {
    const firestoreDb = { name: 'db' };
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const genericError = new Error('write-failed');
    updateDocMock.mockRejectedValueOnce(genericError);

    await expect(updateMilestoneSubmissionReviewInFirestore(firestoreDb, 'mile-1', {
      status: 'rejected',
      reviewNote: 'Need one more close-up photo',
      reviewedBy: 'Admin One',
      reviewerRole: 'admin',
    })).rejects.toThrow('write-failed');

    expect(docMock).toHaveBeenCalledWith(firestoreDb, 'milestoneSubmissions', 'mile-1');
    expect(updateDocMock).toHaveBeenCalledWith(
      { firestoreDb, collectionName: 'milestoneSubmissions', documentId: 'mile-1' },
      expect.objectContaining({
        status: 'rejected',
        reviewNote: 'Need one more close-up photo',
        updatedAt: FIXED_UPDATED_AT,
      }),
    );
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not call the Firestore update boundary when payment request id is missing', async () => {
    const firestoreDb = { name: 'db' };

    await expect(updatePaymentRequestReviewInFirestore(firestoreDb, '', {
      status: 'approved',
      reviewNote: 'Should not write',
    })).resolves.toBe(false);

    expect(docMock).not.toHaveBeenCalled();
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('does not call the Firestore update boundary when milestone submission id is missing', async () => {
    const firestoreDb = { name: 'db' };

    await expect(updateMilestoneSubmissionReviewInFirestore(firestoreDb, null, {
      status: 'submitted',
      reviewNote: 'Should not write',
    })).resolves.toBe(false);

    expect(docMock).not.toHaveBeenCalled();
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('rejects invalid payment request status transitions before calling Firestore', async () => {
    const firestoreDb = { name: 'db' };

    await expect(updatePaymentRequestReviewInFirestore(firestoreDb, 'pay-1', {
      status: 'approved',
      currentStatus: 'approved',
      reviewNote: 'Already approved',
    })).rejects.toMatchObject({ reviewErrorKey: 'review_invalid_transition' });

    expect(docMock).not.toHaveBeenCalled();
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('rejects invalid milestone submission status transitions before calling Firestore', async () => {
    const firestoreDb = { name: 'db' };

    await expect(updateMilestoneSubmissionReviewInFirestore(firestoreDb, 'mile-1', {
      status: 'submitted',
      currentStatus: 'submitted',
      reviewNote: 'Already pending review',
    })).rejects.toMatchObject({ reviewErrorKey: 'review_invalid_transition' });

    expect(docMock).not.toHaveBeenCalled();
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('classifies permission and transition review errors for inline panel feedback', () => {
    expect(getReviewUpdateErrorKey(new Error('permission-denied'))).toBe('review_permission_denied');
    expect(getReviewUpdateErrorKey(Object.assign(new Error('write failed'), { code: 'permission-denied' }))).toBe('review_permission_denied');
    expect(getReviewUpdateErrorKey(new Error('invalid-status-transition'))).toBe('review_invalid_transition');
    expect(getReviewUpdateErrorKey(new Error('something else'))).toBe('auth_generic_error');
  });

  it('still writes minimal payment request payloads the same way the current app does', async () => {
    const firestoreDb = { name: 'db' };

    await expect(updatePaymentRequestReviewInFirestore(firestoreDb, 'pay-2', {})).resolves.toBe(true);

    expect(updateDocMock).toHaveBeenCalledWith(
      { firestoreDb, collectionName: 'paymentRequests', documentId: 'pay-2' },
      { updatedAt: FIXED_UPDATED_AT },
    );
  });


  it('opens worker sign-in from landing and keeps worker-mobile-test out of public UI', async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(screen.queryByText('worker-mobile-test')).not.toBeInTheDocument();

    const workerEntry = screen.getByRole('button', {
      name: /View Worker App|ดูแอปสำหรับคนงาน|ເບິ່ງແອັບຄົນງານ/i,
    });

    await user.click(workerEntry);

    expect((await screen.findAllByText(/Technician \/ Worker|ช่าง \/ คนงาน|ຊ່າງ \/ ຄົນງານ/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Open the worker app to see assigned projects|เข้าสู่ Worker App เพื่อดูโครงการที่ได้รับมอบหมาย|ເຂົ້າ worker app/i)).toBeInTheDocument();
  });
});

