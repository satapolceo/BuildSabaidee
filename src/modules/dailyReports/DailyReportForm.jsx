import React from 'react';
import { CalendarDays, CheckCircle2, Clock3, ClipboardList, Paperclip, Users } from 'lucide-react';
import AttachmentComposer from '../attachments/AttachmentComposer';
import { canEditDailyReport, isOwnerDailyReportRole } from './dailyReportModel';
import { getSiteTicketStatusLabel } from '../siteTickets/siteTicketI18n';

function SelectField({ label, value, options, onChange, disabled = false, error = '' }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`min-h-12 w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function InputField({ label, value, onChange, type = 'text', disabled = false, error = '' }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`min-h-12 w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
      />
    </label>
  );
}

function TextareaField({ label, value, onChange, disabled = false, error = '', rows = 4 }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={rows}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
      />
    </label>
  );
}

function SnapshotCard({ icon: Icon, label, value, tone = 'slate' }) {
  const className = tone === 'emerald'
    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
    : tone === 'amber'
      ? 'border-amber-100 bg-amber-50 text-amber-700'
      : tone === 'rose'
        ? 'border-rose-100 bg-rose-50 text-rose-700'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className={`rounded-2xl border px-3 py-3 ${className}`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  );
}

function RelatedTicketSelector({ labels, language, tickets, selectedIds, disabled, onToggle }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.relatedTicketsTitle}</div>
      <div className="mt-3 space-y-2">
        {tickets.length ? tickets.map((ticket) => {
          const checked = selectedIds.includes(ticket.id);
          return (
            <label key={ticket.id} className={`flex items-start gap-3 rounded-2xl border px-3 py-3 ${checked ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'} ${disabled ? 'opacity-70' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(ticket.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">{ticket.title}</div>
                <div className="mt-1 text-xs text-slate-500">{ticket.locationText || '-'} • {getSiteTicketStatusLabel(ticket.status, language)}</div>
              </div>
            </label>
          );
        }) : (
          <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-500">{labels.noRelatedTickets}</div>
        )}
      </div>
    </div>
  );
}

function DailyReportForm({
  labels,
  language = 'EN',
  role = 'worker',
  mode = 'create',
  form,
  errors,
  projectOptions,
  relatedTickets = [],
  ticketSnapshot,
  onFieldChange,
  onAttachmentChange,
  onToggleTicket,
  onSubmit,
  onCancel,
}) {
  const canEdit = canEditDailyReport(role);
  const ownerMode = isOwnerDailyReportRole(role);
  const readOnly = ownerMode;
  const projectSelectOptions = projectOptions.length ? projectOptions : [{ value: '', label: '-' }];

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{mode === 'edit' ? labels.editReport : labels.newReport}</div>
        <div className="mt-1 text-sm text-slate-500">{ownerMode ? labels.ownerReadOnlyHint : labels.workerReadOnlyHint}</div>
      </div>

      <div className="space-y-4">
        <SelectField label={labels.projectLabel} value={form.projectId} options={projectSelectOptions} onChange={(value) => {
          const match = projectOptions.find((item) => item.value === value);
          onFieldChange('projectId', value);
          onFieldChange('projectName', match?.label || '');
        }} disabled={readOnly} error={errors.projectId} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label={labels.reportDateLabel} type="date" value={form.reportDate} onChange={(value) => onFieldChange('reportDate', value)} disabled={readOnly} error={errors.reportDate} />
          <InputField label={labels.workerCountLabel} type="number" value={form.workerCount} onChange={(value) => onFieldChange('workerCount', value)} disabled={readOnly} error={errors.workerCount} />
        </div>
        <InputField label={labels.areaLabel} value={form.area} onChange={(value) => onFieldChange('area', value)} disabled={readOnly} error={errors.area} />
        <TextareaField label={labels.workSummaryLabel} value={form.workSummary} onChange={(value) => onFieldChange('workSummary', value)} disabled={readOnly} error={errors.workSummary} />
        <TextareaField label={labels.materialSummaryLabel} value={form.materialSummary} onChange={(value) => onFieldChange('materialSummary', value)} disabled={readOnly} rows={3} />
        <TextareaField label={labels.issueSummaryLabel} value={form.issueSummary} onChange={(value) => onFieldChange('issueSummary', value)} disabled={readOnly} rows={3} />
        <TextareaField label={labels.tomorrowPlanLabel} value={form.tomorrowPlan} onChange={(value) => onFieldChange('tomorrowPlan', value)} disabled={readOnly} rows={3} />
      </div>

      <div className="mt-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.ticketSnapshotTitle}</div>
        <div className="grid grid-cols-2 gap-3">
          <SnapshotCard icon={ClipboardList} label={labels.ticketTotal} value={ticketSnapshot?.total || 0} />
          <SnapshotCard icon={CheckCircle2} label={labels.ticketCompleted} value={ticketSnapshot?.completed || 0} tone="emerald" />
          <SnapshotCard icon={Clock3} label={labels.ticketPendingApproval} value={ticketSnapshot?.pendingApproval || 0} tone="amber" />
          <SnapshotCard icon={CalendarDays} label={labels.ticketOverdue} value={ticketSnapshot?.overdue || 0} tone="rose" />
        </div>
      </div>

      <div className="mt-5">
        <RelatedTicketSelector labels={labels} language={language} tickets={relatedTickets} selectedIds={form.relatedTicketIds} disabled={readOnly || !canEdit} onToggle={onToggleTicket} />
      </div>

      <div className="mt-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{labels.attachmentSectionTitle}</div>
        <AttachmentComposer
          value={form.attachmentsDraft}
          onChange={onAttachmentChange}
          disabled={readOnly}
          photoLabel={labels.attachmentPhoto}
          photoHelperText={labels.attachmentSectionTitle}
          photoCameraLabel={language === 'TH' ? 'ถ่ายรูป' : language === 'LA' ? 'ຖ່າຍຮູບ' : 'Take Photo'}
          photoGalleryLabel={language === 'TH' ? 'เลือกรูป' : language === 'LA' ? 'ເລືອກຮູບ' : 'Choose Photo'}
          photoRemoveLabel={labels.attachmentRemove}
          photoCountLabel={language === 'TH' ? 'จำนวนรูป' : language === 'LA' ? 'ຈຳນວນຮູບ' : 'Photos'}
          voiceTitle={labels.attachmentVoice}
          voiceStatusLabel={language === 'TH' ? 'สถานะ' : language === 'LA' ? 'ສະຖານະ' : 'Status'}
          voiceStartLabel={language === 'TH' ? 'อัดเสียงในรายงาน' : language === 'LA' ? 'ອັດສຽງໃນລາຍງານ' : 'Record in report'}
          voiceStopLabel={language === 'TH' ? 'หยุดอัด' : language === 'LA' ? 'ຢຸດອັດ' : 'Stop recording'}
          voiceDeleteLabel={language === 'TH' ? 'ลบเสียง' : language === 'LA' ? 'ລົບສຽງ' : 'Delete voice'}
          voiceReadyLabel={language === 'TH' ? 'พร้อมแนบในรายงาน' : language === 'LA' ? 'ພ້ອມແນບໃນລາຍງານ' : 'Ready in report'}
          voiceAttachedLabel={language === 'TH' ? 'แนบเสียงแล้ว' : language === 'LA' ? 'ແນບສຽງແລ້ວ' : 'Voice attached'}
          voiceProcessingLabel={language === 'TH' ? 'กำลังเตรียมไฟล์เสียง...' : language === 'LA' ? 'ກຳລັງກຽມໄຟລ໌ສຽງ...' : 'Preparing audio...'}
          voiceRecordingLabel={language === 'TH' ? 'กำลังอัดเสียงในรายงาน...' : language === 'LA' ? 'ກຳລັງອັດສຽງໃນລາຍງານ...' : 'Recording inside this report...'}
          voiceErrorMap={{
            voice_not_supported: language === 'TH' ? 'อุปกรณ์นี้ยังไม่รองรับการอัดเสียง' : language === 'LA' ? 'ອຸປະກອນນີ້ຍັງບໍ່ຮອງຮັບການອັດສຽງ' : 'Voice recording is not supported',
            microphone_denied: language === 'TH' ? 'ไม่สามารถใช้ไมโครโฟนได้' : language === 'LA' ? 'ບໍ່ສາມາດໃຊ້ໄມໂຄຣໂຟນໄດ້' : 'Microphone access was denied',
            recording_failed: language === 'TH' ? 'เริ่มอัดเสียงไม่สำเร็จ' : language === 'LA' ? 'ເລີ່ມອັດສຽງບໍ່ສຳເລັດ' : 'Unable to start recording',
            default: language === 'TH' ? 'เกิดข้อผิดพลาดในการอัดเสียง' : language === 'LA' ? 'ການອັດສຽງເກີດຂໍ້ຜິດພາດ' : 'Voice recording failed',
          }}
          noteLabel={labels.attachmentNote}
          notePlaceholder={language === 'TH' ? 'พิมพ์โน้ตสั้นสำหรับรายงานนี้' : language === 'LA' ? 'ພິມໂນ້ດສັ້ນສຳລັບລາຍງານນີ້' : 'Type a short note for this report'}
          previewTitle={language === 'TH' ? 'ตัวอย่างก่อนบันทึก' : language === 'LA' ? 'ຕົວຢ່າງກ່ອນບັນທຶກ' : 'Preview before save'}
          previewEmptyLabel={labels.attachmentPreviewEmpty}
          previewPhotoLabel={labels.attachmentPhoto}
          previewVoiceLabel={labels.attachmentVoice}
          previewNoteLabel={labels.attachmentNote}
          previewRemoveLabel={labels.attachmentRemove}
          dataSaverTitle={language === 'TH' ? 'ประหยัดดาต้า' : language === 'LA' ? 'ປະຢັດດາຕ້າ' : 'Data Saver'}
          originalSizeLabel={language === 'TH' ? 'ขนาดเดิม' : language === 'LA' ? 'ຂະໜາດເດີມ' : 'Original size'}
          compressedSizeLabel={language === 'TH' ? 'ขนาดบีบอัด' : language === 'LA' ? 'ຂະໜາດບີບອັດ' : 'Compressed size'}
        />
      </div>

      {!readOnly ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="min-h-12 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
            {labels.backToList}
          </button>
          <button onClick={onSubmit} className="min-h-12 rounded-[1.2rem] bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
            {mode === 'edit' ? labels.updateReport : labels.saveReport}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default DailyReportForm;
