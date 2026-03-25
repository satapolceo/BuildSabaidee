export const ATTACHMENT_KIND = {
  photo: 'photo',
  voice: 'voice',
  note: 'note',
};

export function createAttachmentId(prefix = 'attachment') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createPhotoAttachment({
  id = createAttachmentId('attachment_photo'),
  imageData = '',
  imageMeta = {},
  originalName = '',
  capturedAt = Date.now(),
  source = 'mobile_composer',
} = {}) {
  return {
    id,
    kind: ATTACHMENT_KIND.photo,
    imageData,
    imageMeta,
    originalName,
    capturedAt,
    source,
  };
}

export function createVoiceAttachment({
  id = createAttachmentId('attachment_voice'),
  audioData = '',
  durationMs = 0,
  mimeType = 'audio/webm',
  recordedAt = Date.now(),
  source = 'mobile_composer',
} = {}) {
  return {
    id,
    kind: ATTACHMENT_KIND.voice,
    audioData,
    durationMs,
    mimeType,
    recordedAt,
    source,
  };
}

export function createNoteAttachment({
  id = createAttachmentId('attachment_note'),
  text = '',
  updatedAt = Date.now(),
  source = 'mobile_composer',
} = {}) {
  return {
    id,
    kind: ATTACHMENT_KIND.note,
    text: String(text || ''),
    updatedAt,
    source,
  };
}

export function createAttachmentDraft({
  photos = [],
  voiceNote = null,
  note = '',
  linkedType = 'generic',
  status = 'draft',
} = {}) {
  return {
    linkedType,
    status,
    photos,
    voiceNote,
    note: String(note || ''),
  };
}

export function normalizeAttachmentDraft(input = {}) {
  const normalizedPhotos = Array.isArray(input.photos)
    ? input.photos.filter((item) => item?.imageData)
    : [];

  return createAttachmentDraft({
    photos: normalizedPhotos,
    voiceNote: input.voiceNote?.audioData ? input.voiceNote : null,
    note: input.note || '',
    linkedType: input.linkedType || 'generic',
    status: input.status === 'submitted' ? 'submitted' : 'draft',
  });
}

export function buildAttachmentPayload({
  projectId = '',
  linkedType = 'generic',
  linkedId = '',
  createdBy = null,
  draft = {},
} = {}) {
  const normalized = normalizeAttachmentDraft({ ...draft, linkedType });
  const noteAttachment = normalized.note.trim()
    ? createNoteAttachment({ text: normalized.note })
    : null;

  const attachments = [
    ...normalized.photos,
    ...(normalized.voiceNote ? [normalized.voiceNote] : []),
    ...(noteAttachment ? [noteAttachment] : []),
  ];

  return {
    projectId,
    linkedType,
    linkedId,
    createdBy,
    attachmentCount: attachments.length,
    photoCount: normalized.photos.length,
    hasVoiceNote: Boolean(normalized.voiceNote),
    hasNote: Boolean(noteAttachment),
    attachments,
    createdAt: Date.now(),
  };
}
