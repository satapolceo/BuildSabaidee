import { useEffect, useMemo, useRef, useState } from 'react';
import { createAttachmentDraft } from './attachmentModel';
import {
  buildVoiceAttachmentFromBlob,
  processAttachmentImageFiles,
  summarizeAttachmentCompression,
} from './attachmentService';

export function useAttachmentComposer({
  value,
  onChange,
  settings,
  disabled = false,
} = {}) {
  const [draft, setDraft] = useState(() => createAttachmentDraft(value));
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);

  const canRecordVoice = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined';

  useEffect(() => {
    setDraft(createAttachmentDraft(value));
  }, [value]);

  useEffect(() => () => {
    mediaRecorderRef.current?.stream?.getTracks?.().forEach((track) => track.stop());
    mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
  }, []);

  const updateDraft = (updater) => {
    setDraft((current) => {
      const nextDraft = typeof updater === 'function' ? updater(current) : updater;
      if (onChange) onChange(nextDraft);
      return nextDraft;
    });
  };

  const addPhotos = async (files = []) => {
    if (disabled) return;
    setIsPhotoProcessing(true);
    try {
      const nextPhotos = await processAttachmentImageFiles(files, settings);
      updateDraft((current) => ({
        ...current,
        photos: [...current.photos, ...nextPhotos],
        status: 'draft',
      }));
      return { ok: true, photos: nextPhotos };
    } finally {
      setIsPhotoProcessing(false);
    }
  };

  const removePhoto = (photoId) => {
    updateDraft((current) => ({
      ...current,
      photos: current.photos.filter((photo) => photo.id !== photoId),
      status: 'draft',
    }));
  };

  const setNote = (note) => {
    updateDraft((current) => ({
      ...current,
      note,
      status: 'draft',
    }));
  };

  const removeVoiceNote = () => {
    updateDraft((current) => ({
      ...current,
      voiceNote: null,
      status: 'draft',
    }));
    setVoiceError('');
  };

  const startVoiceRecording = async () => {
    if (disabled) return false;
    if (!canRecordVoice) {
      setVoiceError('voice_not_supported');
      return false;
    }

    setVoiceError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setIsVoiceRecording(false);
        setIsVoiceProcessing(true);

        try {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const voiceNote = await buildVoiceAttachmentFromBlob({
            blob: audioBlob,
            startedAt: recordingStartedAtRef.current,
            mimeType,
          });

          updateDraft((current) => ({
            ...current,
            voiceNote,
            status: 'draft',
          }));
        } catch (error) {
          setVoiceError('voice_processing_failed');
        } finally {
          setIsVoiceProcessing(false);
          stream.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
        }
      };

      recorder.start();
      setIsVoiceRecording(true);
      return true;
    } catch (error) {
      setVoiceError('voice_permission_denied');
      setIsVoiceRecording(false);
      return false;
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const compressionSummary = useMemo(
    () => summarizeAttachmentCompression(draft.photos),
    [draft.photos]
  );

  return {
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
  };
}
