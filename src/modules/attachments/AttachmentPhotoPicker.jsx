import React, { useRef } from 'react';
import { Camera, FileImage, LoaderCircle } from 'lucide-react';

function AttachmentPhotoPicker({
  photos,
  onFilesSelected,
  onRemove,
  label,
  helperText,
  cameraLabel,
  galleryLabel,
  removeLabel,
  countLabel,
  disabled = false,
  loading = false,
}) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    await onFilesSelected(files);
    event.target.value = '';
  };

  return (
    <div className={`rounded-[1.3rem] border border-dashed p-4 ${disabled ? 'border-slate-200 bg-slate-100' : 'border-slate-300 bg-slate-50'}`}>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleChange} className="hidden" multiple data-testid="batch-camera-input" />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" multiple data-testid="batch-gallery-input" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="worker-locale-safe text-sm font-semibold text-slate-800">{label}</div>
          <div className="worker-locale-safe mt-1 text-xs text-slate-500">{helperText}</div>
        </div>
        <div className={`worker-mobile-chip worker-locale-safe rounded-full px-3 py-1 text-xs font-semibold ${photos.length ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500'}`}>
          {countLabel}: {photos.length}
        </div>
      </div>
      {photos.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white">
              <img src={photo.imageData} alt={`${label} ${index + 1}`} className="h-28 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0 text-xs text-slate-500">#{index + 1}</div>
                <button type="button" onClick={() => onRemove(photo.id)} className="worker-locale-safe inline-flex min-h-10 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                  {removeLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-center rounded-[1.2rem] bg-white px-4 py-8 text-slate-400">
          <Camera className="h-8 w-8" />
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={loading || disabled}
          onClick={() => cameraInputRef.current?.click()}
          className="worker-photo-action worker-locale-safe inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {cameraLabel}
        </button>
        <button
          type="button"
          disabled={loading || disabled}
          onClick={() => galleryInputRef.current?.click()}
          className="worker-photo-action worker-locale-safe inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          <FileImage className="h-4 w-4" />
          {galleryLabel}
        </button>
      </div>
    </div>
  );
}

export default AttachmentPhotoPicker;
