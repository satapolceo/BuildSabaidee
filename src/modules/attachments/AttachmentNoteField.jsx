import React from 'react';

function AttachmentNoteField({
  value,
  onChange,
  label,
  placeholder,
  rows = 3,
}) {
  return (
    <div>
      {label ? <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div> : null}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base"
      />
    </div>
  );
}

export default AttachmentNoteField;
