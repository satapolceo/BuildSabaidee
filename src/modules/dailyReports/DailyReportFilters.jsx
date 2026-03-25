import React from 'react';

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function DailyReportFilters({ labels, filters, projectOptions, onChange }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <label className="block">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{labels.listTab}</div>
        <input
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder={labels.searchPlaceholder}
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
        />
      </label>
      <div className="mt-4 grid grid-cols-1 gap-3">
        <FilterSelect label={labels.filterProject} value={filters.projectId} options={projectOptions} onChange={(value) => onChange('projectId', value)} />
        <label className="block">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{labels.filterDate}</div>
          <input
            type="date"
            value={filters.reportDate}
            onChange={(event) => onChange('reportDate', event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400"
          />
        </label>
      </div>
    </div>
  );
}

export default DailyReportFilters;
