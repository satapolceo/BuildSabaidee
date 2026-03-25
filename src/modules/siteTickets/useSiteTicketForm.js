import { useEffect, useState } from 'react';
import { buildTicketFormFromTicket } from './siteTicketService';
import { createDefaultSiteTicketForm } from './siteTicketModel';

function createErrors() {
  return {
    projectId: '',
    title: '',
    description: '',
    locationText: '',
  };
}

export function useSiteTicketForm({
  initialProjectId = '',
  initialProjectName = '',
  currentUser = null,
  initialTicket = null,
} = {}) {
  const [form, setForm] = useState(() => (
    initialTicket
      ? buildTicketFormFromTicket(initialTicket, currentUser)
      : createDefaultSiteTicketForm({
          projectId: initialProjectId,
          projectName: initialProjectName,
          currentUser,
        })
  ));
  const [errors, setErrors] = useState(createErrors);

  useEffect(() => {
    if (initialTicket) {
      setForm(buildTicketFormFromTicket(initialTicket, currentUser));
      setErrors(createErrors());
      return;
    }

    setForm((current) => ({
      ...current,
      projectId: current.projectId || String(initialProjectId || ''),
      projectName: current.projectName || String(initialProjectName || ''),
      createdBy: current.createdBy || currentUser,
    }));
  }, [currentUser, initialProjectId, initialProjectName, initialTicket]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const setAttachmentDraft = (nextDraft) => {
    setForm((current) => ({ ...current, attachmentsDraft: nextDraft }));
  };

  const validate = () => {
    const nextErrors = createErrors();
    if (!String(form.projectId || '').trim()) nextErrors.projectId = 'required';
    if (!String(form.title || '').trim()) nextErrors.title = 'required';
    if (!String(form.description || '').trim()) nextErrors.description = 'required';
    if (!String(form.locationText || '').trim()) nextErrors.locationText = 'required';
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const reset = ({ projectId = initialProjectId, projectName = initialProjectName } = {}) => {
    setForm(createDefaultSiteTicketForm({
      projectId,
      projectName,
      currentUser,
    }));
    setErrors(createErrors());
  };

  return {
    form,
    errors,
    setField,
    setForm,
    setAttachmentDraft,
    reset,
    validate,
  };
}

export default useSiteTicketForm;
