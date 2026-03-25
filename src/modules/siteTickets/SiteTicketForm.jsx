import React from 'react';
import AttachmentComposer from '../attachments/AttachmentComposer';
import {
  canEditSiteTicket,
  isOwnerSiteTicketRole,
} from './siteTicketModel';
import {
  getSiteTicketCategoryOptions,
  getSiteTicketPriorityOptions,
  getSiteTicketStatusOptions,
} from './siteTicketI18n';

function SelectField({ label, value, options, onChange, disabled = false }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function InputField({ label, value, onChange, placeholder = '', type = 'text', disabled = false, error = '' }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`min-h-12 w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
      />
    </label>
  );
}

function TextareaField({ label, value, onChange, placeholder = '', disabled = false, error = '' }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        disabled={disabled}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
      />
    </label>
  );
}

function SiteTicketForm({
  labels,
  language = 'EN',
  role = 'worker',
  mode = 'create',
  form,
  errors,
  projectOptions,
  assigneeOptions,
  onFieldChange,
  onAttachmentChange,
  onSubmit,
  onCancel,
}) {
  const canEdit = canEditSiteTicket(role);
  const ownerMode = isOwnerSiteTicketRole(role);
  const readOnly = ownerMode;
  const categoryOptions = getSiteTicketCategoryOptions(language);
  const priorityOptions = getSiteTicketPriorityOptions(language);
  const statusOptions = getSiteTicketStatusOptions(language);
  const projectSelectOptions = projectOptions.length ? projectOptions : [{ value: '', label: '-' }];
  const assigneeSelectOptions = [{ value: '', label: labels.filterAll }, ...assigneeOptions];

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{mode === 'edit' ? labels.editTicket : labels.newTicket}</div>
          <div className="mt-1 text-sm text-slate-500">{ownerMode ? labels.ownerReadOnlyHint : labels.workerReadOnlyHint}</div>
        </div>
      </div>

      <div className="space-y-4">
        <SelectField label={labels.projectLabel} value={form.projectId} options={projectSelectOptions} onChange={(value) => {
          const match = projectOptions.find((item) => item.value === value);
          onFieldChange('projectId', value);
          onFieldChange('projectName', match?.label || '');
        }} disabled={readOnly} />
        <InputField label={labels.titleLabel} value={form.title} onChange={(value) => onFieldChange('title', value)} disabled={readOnly} error={errors.title} />
        <TextareaField label={labels.descriptionLabel} value={form.description} onChange={(value) => onFieldChange('description', value)} disabled={readOnly} error={errors.description} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label={labels.categoryLabel} value={form.category} options={categoryOptions} onChange={(value) => onFieldChange('category', value)} disabled={readOnly} />
          <SelectField label={labels.priorityLabel} value={form.priority} options={priorityOptions} onChange={(value) => onFieldChange('priority', value)} disabled={readOnly} />
        </div>
        <InputField label={labels.locationLabel} value={form.locationText} onChange={(value) => onFieldChange('locationText', value)} disabled={readOnly} error={errors.locationText} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label={labels.dueDateLabel} type="date" value={form.dueDate} onChange={(value) => onFieldChange('dueDate', value)} disabled={readOnly} />
          <SelectField label={labels.assigneeLabel} value={form.assigneeId} options={assigneeSelectOptions} onChange={(value) => {
            const match = assigneeOptions.find((item) => item.value === value);
            onFieldChange('assigneeId', value);
            onFieldChange('assigneeName', match?.label || '');
          }} disabled={readOnly || !canEdit} />
        </div>
        <SelectField label={labels.statusLabel} value={form.status} options={statusOptions} onChange={(value) => onFieldChange('status', value)} disabled={readOnly || !canEdit} />
        {mode === 'edit' ? (
          <TextareaField label={labels.notesLabel} value={form.updateNote} onChange={(value) => onFieldChange('updateNote', value)} placeholder={labels.notesPlaceholder} disabled={readOnly} />
        ) : null}
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
          voiceStartLabel={language === 'TH' ? 'อัดเสียงในตั๋ว' : language === 'LA' ? 'ອັດສຽງໃນບັດງານ' : 'Record in ticket'}
          voiceStopLabel={language === 'TH' ? 'หยุดอัด' : language === 'LA' ? 'ຢຸດອັດ' : 'Stop recording'}
          voiceDeleteLabel={language === 'TH' ? 'ลบเสียง' : language === 'LA' ? 'ລົບສຽງ' : 'Delete voice'}
          voiceReadyLabel={language === 'TH' ? 'พร้อมแนบในตั๋ว' : language === 'LA' ? 'ພ້ອມແນບໃນບັດງານ' : 'Ready in ticket'}
          voiceAttachedLabel={language === 'TH' ? 'แนบเสียงแล้ว' : language === 'LA' ? 'ແນບສຽງແລ້ວ' : 'Voice attached'}
          voiceProcessingLabel={language === 'TH' ? 'กำลังเตรียมไฟล์เสียง...' : language === 'LA' ? 'ກຳລັງກຽມໄຟລ໌ສຽງ...' : 'Preparing audio...'}
          voiceRecordingLabel={language === 'TH' ? 'กำลังอัดเสียงในตั๋ว...' : language === 'LA' ? 'ກຳລັງອັດສຽງໃນບັດງານ...' : 'Recording inside this ticket...'}
          voiceErrorMap={{
            voice_not_supported: language === 'TH' ? 'อุปกรณ์นี้ยังไม่รองรับการอัดเสียง' : language === 'LA' ? 'ອຸປະກອນນີ້ຍັງບໍ່ຮອງຮັບການອັດສຽງ' : 'Voice recording is not supported',
            microphone_denied: language === 'TH' ? 'ไม่สามารถใช้ไมโครโฟนได้' : language === 'LA' ? 'ບໍ່ສາມາດໃຊ້ໄມໂຄຣໂຟນໄດ້' : 'Microphone access was denied',
            recording_failed: language === 'TH' ? 'เริ่มอัดเสียงไม่สำเร็จ' : language === 'LA' ? 'ເລີ່ມອັດສຽງບໍ່ສຳເລັດ' : 'Unable to start recording',
            default: language === 'TH' ? 'เกิดข้อผิดพลาดในการอัดเสียง' : language === 'LA' ? 'ການອັດສຽງເກີດຂໍ້ຜິດພາດ' : 'Voice recording failed',
          }}
          noteLabel={labels.attachmentNote}
          notePlaceholder={language === 'TH' ? 'พิมพ์โน้ตสั้นสำหรับตั๋วนี้' : language === 'LA' ? 'ພິມໂນ້ດສັ້ນສຳລັບບັດງານນີ້' : 'Type a short note for this ticket'}
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
          <button onClick={onSubmit} className="min-h-12 rounded-[1.2rem] bg-amber-500 px-4 py-3 text-sm font-semibold text-white">
            {mode === 'edit' ? labels.updateTicket : labels.saveTicket}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default SiteTicketForm;
