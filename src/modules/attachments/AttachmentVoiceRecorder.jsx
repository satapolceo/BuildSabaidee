import React from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

function AttachmentVoiceRecorder({
  voiceNote,
  statusLabel,
  title,
  startLabel,
  stopLabel,
  deleteLabel,
  readyLabel,
  attachedLabel,
  processingLabel,
  recordingLabel,
  errorText = '',
  isRecording = false,
  isProcessing = false,
  canRecordVoice = false,
  disabled = false,
  onStart,
  onStop,
  onDelete,
  formatDuration,
}) {
  const pillText = isRecording
    ? recordingLabel
    : isProcessing
      ? processingLabel
      : voiceNote
        ? attachedLabel
        : readyLabel;

  return (
    <div className={`rounded-[1.3rem] border p-4 ${isRecording ? 'border-rose-300 bg-rose-50 shadow-[0_0_0_1px_rgba(244,63,94,0.14)]' : voiceNote ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-2xl p-3 ${isRecording ? 'bg-rose-100 text-rose-700' : voiceNote ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
          <Mic className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{statusLabel}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isRecording ? 'bg-rose-100 text-rose-700' : isProcessing ? 'bg-amber-100 text-amber-800' : voiceNote ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {pillText}
            </span>
            {voiceNote?.durationMs ? (
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                {formatDuration(voiceNote.durationMs)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button onClick={onStart} disabled={disabled || !canRecordVoice || isRecording || isProcessing} className={`inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed ${isRecording ? 'bg-rose-500' : 'bg-slate-900'} disabled:bg-slate-300`}>
          <Mic className="h-4 w-4" />
          {startLabel}
        </button>
        <button onClick={onStop} disabled={!isRecording} className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-200">
          <Square className="h-4 w-4" />
          {stopLabel}
        </button>
      </div>
      {voiceNote ? <audio controls src={voiceNote.audioData} className="mt-3 w-full" /> : null}
      <button onClick={onDelete} disabled={!voiceNote || isRecording || isProcessing} className="mt-3 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
        <Trash2 className="h-4 w-4" />
        {deleteLabel}
      </button>
      {errorText ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{errorText}</div> : null}
    </div>
  );
}

export default AttachmentVoiceRecorder;
