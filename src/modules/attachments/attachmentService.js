import { compressImageFile } from '../../imageDataSaver';
import {
  createPhotoAttachment,
  createVoiceAttachment,
  normalizeAttachmentDraft,
} from './attachmentModel';

export async function processAttachmentImageFiles(files = [], settings = {}) {
  const nextFiles = Array.from(files || []).filter(Boolean);
  const photos = [];

  for (const file of nextFiles) {
    const { imageData, stats } = await compressImageFile(file, settings);
    photos.push(createPhotoAttachment({
      imageData,
      imageMeta: stats,
      originalName: file.name || '',
      capturedAt: Date.now(),
    }));
  }

  return photos;
}

export function summarizeAttachmentCompression(photos = []) {
  return (Array.isArray(photos) ? photos : []).reduce((summary, photo) => ({
    originalBytes: summary.originalBytes + Number(photo?.imageMeta?.originalBytes || 0),
    compressedBytes: summary.compressedBytes + Number(photo?.imageMeta?.compressedBytes || 0),
  }), { originalBytes: 0, compressedBytes: 0 });
}

export function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function buildVoiceAttachmentFromBlob({
  blob,
  startedAt = Date.now(),
  mimeType = 'audio/webm',
} = {}) {
  const audioData = await readBlobAsDataUrl(blob);
  return createVoiceAttachment({
    audioData,
    durationMs: Math.max(0, Date.now() - Number(startedAt || Date.now())),
    mimeType,
    recordedAt: Date.now(),
  });
}

export function getAttachmentPreviewItems(draft = {}) {
  const normalized = normalizeAttachmentDraft(draft);
  const photoItems = normalized.photos.map((photo, index) => ({
    id: photo.id,
    kind: photo.kind,
    title: `${index + 1}`,
    imageData: photo.imageData,
    audioData: '',
    text: '',
  }));
  const voiceItems = normalized.voiceNote ? [{
    id: normalized.voiceNote.id,
    kind: normalized.voiceNote.kind,
    title: '',
    imageData: '',
    audioData: normalized.voiceNote.audioData,
    text: '',
  }] : [];
  const noteItems = normalized.note.trim() ? [{
    id: 'note-preview',
    kind: 'note',
    title: '',
    imageData: '',
    audioData: '',
    text: normalized.note.trim(),
  }] : [];

  return [...photoItems, ...voiceItems, ...noteItems];
}
