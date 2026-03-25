import React from 'react';
import { formatBytes } from '../../imageDataSaver';
import AttachmentNoteField from './AttachmentNoteField';
import AttachmentPhotoPicker from './AttachmentPhotoPicker';
import AttachmentPreviewList from './AttachmentPreviewList';
import AttachmentVoiceRecorder from './AttachmentVoiceRecorder';
import { useAttachmentComposer } from './useAttachmentComposer';

function AttachmentComposer({
  value,
  onChange,
  settings,
  disabled = false,
  photoLabel,
  photoHelperText,
  photoCameraLabel,
  photoGalleryLabel,
  photoRemoveLabel,
  photoCountLabel,
  voiceTitle,
  voiceStatusLabel,
  voiceStartLabel,
  voiceStopLabel,
  voiceDeleteLabel,
  voiceReadyLabel,
  voiceAttachedLabel,
  voiceProcessingLabel,
  voiceRecordingLabel,
  voiceErrorMap = {},
  noteLabel,
  notePlaceholder,
  previewTitle,
  previewEmptyLabel,
  previewPhotoLabel,
  previewVoiceLabel,
  previewNoteLabel,
  previewRemoveLabel,
  dataSaverTitle,
  originalSizeLabel,
  compressedSizeLabel,
  onPhotoCaptured,
  onPhotoRemoved,
  onVoiceSaved,
  onVoiceRemoved,
}) {
  const {
    draft,
    isPhotoProcessing,
    isVoiceRecording,
    isVoiceProcessing,
    voiceError,
    canRecordVoice,
    compressionSummary,
    setNote,
    addPhotos,
    removePhoto,
    startVoiceRecording,
    stopVoiceRecording,
    removeVoiceNote,
  } = useAttachmentComposer({ value, onChange, settings, disabled });

  const resolvedVoiceError = voiceError ? (voiceErrorMap[voiceError] || voiceErrorMap.default || '') : '';

  const handleFilesSelected = async (files) => {
    const result = await addPhotos(files);
    if (result?.ok) onPhotoCaptured?.();
  };

  const handleRemovePhoto = (photoId) => {
    removePhoto(photoId);
    onPhotoRemoved?.();
  };

  const handleStartVoice = async () => {
    const started = await startVoiceRecording();
    if (!started && voiceErrorMap.voice_not_supported) {
      return false;
    }
    return started;
  };

  const handleRemoveVoice = () => {
    removeVoiceNote();
    onVoiceRemoved?.();
  };

  React.useEffect(() => {
    if (draft.voiceNote) onVoiceSaved?.();
  }, [draft.voiceNote, onVoiceSaved]);

  return (
    <div className="space-y-4">
      <AttachmentPhotoPicker
        photos={draft.photos}
        onFilesSelected={handleFilesSelected}
        onRemove={handleRemovePhoto}
        label={photoLabel}
        helperText={photoHelperText}
        cameraLabel={photoCameraLabel}
        galleryLabel={photoGalleryLabel}
        removeLabel={photoRemoveLabel}
        countLabel={photoCountLabel}
        loading={isPhotoProcessing}
        disabled={disabled}
      />

      {draft.photos.length ? (
        <div className="rounded-[1.2rem] bg-blue-50 p-3 text-sm text-blue-900">
          <div className="font-semibold">{dataSaverTitle}</div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-white px-3 py-2">
              <div className="text-slate-500">{originalSizeLabel}</div>
              <div className="mt-1 font-semibold text-slate-900">{formatBytes(compressionSummary.originalBytes)}</div>
            </div>
            <div className="rounded-xl bg-white px-3 py-2">
              <div className="text-slate-500">{compressedSizeLabel}</div>
              <div className="mt-1 font-semibold text-slate-900">{formatBytes(compressionSummary.compressedBytes)}</div>
            </div>
          </div>
        </div>
      ) : null}

      <AttachmentVoiceRecorder
        voiceNote={draft.voiceNote}
        statusLabel={voiceStatusLabel}
        title={voiceTitle}
        startLabel={voiceStartLabel}
        stopLabel={voiceStopLabel}
        deleteLabel={voiceDeleteLabel}
        readyLabel={voiceReadyLabel}
        attachedLabel={voiceAttachedLabel}
        processingLabel={voiceProcessingLabel}
        recordingLabel={voiceRecordingLabel}
        errorText={resolvedVoiceError}
        isRecording={isVoiceRecording}
        isProcessing={isVoiceProcessing}
        canRecordVoice={canRecordVoice}
        disabled={disabled}
        onStart={handleStartVoice}
        onStop={stopVoiceRecording}
        onDelete={handleRemoveVoice}
        formatDuration={(value) => {
          const seconds = Math.max(0, Math.round(Number(value || 0) / 1000));
          const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
          const remainingSeconds = String(seconds % 60).padStart(2, '0');
          return `${minutes}:${remainingSeconds}`;
        }}
      />

      <AttachmentNoteField
        value={draft.note}
        onChange={setNote}
        label={noteLabel}
        placeholder={notePlaceholder}
      />

      <AttachmentPreviewList
        draft={draft}
        title={previewTitle}
        emptyLabel={previewEmptyLabel}
        photoLabel={previewPhotoLabel}
        voiceLabel={previewVoiceLabel}
        noteLabel={previewNoteLabel}
        removeLabel={previewRemoveLabel}
        onRemovePhoto={handleRemovePhoto}
        onRemoveVoice={handleRemoveVoice}
        onClearNote={() => setNote('')}
      />
    </div>
  );
}

export default AttachmentComposer;
