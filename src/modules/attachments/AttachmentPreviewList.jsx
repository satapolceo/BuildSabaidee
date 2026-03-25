import React from 'react';
import { Camera, FileText, Mic, Trash2 } from 'lucide-react';
import { ATTACHMENT_KIND } from './attachmentModel';
import { getAttachmentPreviewItems } from './attachmentService';

function AttachmentPreviewList({
  draft,
  title,
  emptyLabel,
  photoLabel,
  voiceLabel,
  noteLabel,
  removeLabel,
  onRemovePhoto,
  onRemoveVoice,
  onClearNote,
}) {
  const items = getAttachmentPreviewItems(draft);

  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {items.length ? (
        <div className="mt-3 space-y-3">
          {items.map((item) => {
            if (item.kind === ATTACHMENT_KIND.photo) {
              return (
                <div key={item.id} className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Camera className="h-4 w-4" />
                      {photoLabel} #{item.title}
                    </div>
                    <button type="button" onClick={() => onRemovePhoto(item.id)} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                      <Trash2 className="h-3.5 w-3.5" />
                      {removeLabel}
                    </button>
                  </div>
                  <img src={item.imageData} alt={`${photoLabel} ${item.title}`} className="h-32 w-full object-cover" />
                </div>
              );
            }

            if (item.kind === ATTACHMENT_KIND.voice) {
              return (
                <div key={item.id} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Mic className="h-4 w-4" />
                      {voiceLabel}
                    </div>
                    <button type="button" onClick={onRemoveVoice} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                      <Trash2 className="h-3.5 w-3.5" />
                      {removeLabel}
                    </button>
                  </div>
                  <audio controls src={item.audioData} className="mt-3 w-full" />
                </div>
              );
            }

            return (
              <div key={item.id} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <FileText className="h-4 w-4" />
                    {noteLabel}
                  </div>
                  <button type="button" onClick={onClearNote} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                    <Trash2 className="h-3.5 w-3.5" />
                    {removeLabel}
                  </button>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{item.text}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-[1.2rem] bg-slate-50 px-4 py-5 text-sm text-slate-500">{emptyLabel}</div>
      )}
    </div>
  );
}

export default AttachmentPreviewList;
