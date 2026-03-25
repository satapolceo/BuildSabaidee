import { useEffect, useState } from 'react';
import { buildDailyReportFormFromReport } from './dailyReportService';
import { createDefaultDailyReportForm } from './dailyReportModel';

function createErrors() {
  return {
    projectId: '',
    reportDate: '',
    area: '',
    workSummary: '',
    workerCount: '',
  };
}

export function useDailyReportForm({
  initialProjectId = '',
  initialProjectName = '',
  currentUser = null,
  initialReport = null,
  initialReportDate = '',
} = {}) {
  const [form, setForm] = useState(() => (
    initialReport
      ? buildDailyReportFormFromReport(initialReport, currentUser)
      : createDefaultDailyReportForm({
          projectId: initialProjectId,
          projectName: initialProjectName,
          currentUser,
          reportDate: initialReportDate,
        })
  ));
  const [errors, setErrors] = useState(createErrors);

  useEffect(() => {
    if (initialReport) {
      setForm(buildDailyReportFormFromReport(initialReport, currentUser));
      setErrors(createErrors());
      return;
    }

    setForm((current) => ({
      ...current,
      projectId: current.projectId || String(initialProjectId || ''),
      projectName: current.projectName || String(initialProjectName || ''),
      reportDate: current.reportDate || String(initialReportDate || ''),
      createdBy: current.createdBy || currentUser,
    }));
  }, [currentUser, initialProjectId, initialProjectName, initialReport, initialReportDate]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const toggleRelatedTicket = (ticketId) => {
    const normalizedId = String(ticketId || '');
    setForm((current) => ({
      ...current,
      relatedTicketIds: current.relatedTicketIds.includes(normalizedId)
        ? current.relatedTicketIds.filter((item) => item !== normalizedId)
        : [...current.relatedTicketIds, normalizedId],
    }));
  };

  const setAttachmentDraft = (nextDraft) => {
    setForm((current) => ({ ...current, attachmentsDraft: nextDraft }));
  };

  const validate = () => {
    const nextErrors = createErrors();
    if (!String(form.projectId || '').trim()) nextErrors.projectId = 'required';
    if (!String(form.reportDate || '').trim()) nextErrors.reportDate = 'required';
    if (!String(form.area || '').trim()) nextErrors.area = 'required';
    if (!String(form.workSummary || '').trim()) nextErrors.workSummary = 'required';
    if (!String(form.workerCount || '').trim() || Number(form.workerCount) <= 0) nextErrors.workerCount = 'required';
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const reset = ({ projectId = initialProjectId, projectName = initialProjectName, reportDate = initialReportDate } = {}) => {
    setForm(createDefaultDailyReportForm({
      projectId,
      projectName,
      currentUser,
      reportDate,
    }));
    setErrors(createErrors());
  };

  return {
    form,
    errors,
    setField,
    setForm,
    setAttachmentDraft,
    toggleRelatedTicket,
    reset,
    validate,
  };
}

export default useDailyReportForm;
