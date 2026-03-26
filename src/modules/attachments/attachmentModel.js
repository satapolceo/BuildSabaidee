export const ATTACHMENT_KIND = {
  photo: 'photo',
  voice: 'voice',
  file: 'file',
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

export function createFileAttachment({
  id = createAttachmentId('attachment_file'),
  fileData = '',
  mimeType = 'application/octet-stream',
  originalName = '',
  fileSize = 0,
  uploadedAt = Date.now(),
  source = 'mobile_composer',
} = {}) {
  return {
    id,
    kind: ATTACHMENT_KIND.file,
    fileData,
    mimeType,
    originalName,
    fileSize,
    uploadedAt,
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
  files = [],
  note = '',
  linkedType = 'generic',
  status = 'draft',
} = {}) {
  return {
    linkedType,
    status,
    photos,
    voiceNote,
    files,
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
    files: Array.isArray(input.files) ? input.files.filter((item) => item?.fileData) : [],
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
    ...normalized.files,
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
    fileCount: normalized.files.length,
    hasVoiceNote: Boolean(normalized.voiceNote),
    hasNote: Boolean(noteAttachment),
    attachments,
    createdAt: Date.now(),
  };
}
