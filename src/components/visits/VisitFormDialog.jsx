import { useState } from 'react';

import dialogPin from '../../assets/icons/agent2/visits/dialog-pin.svg';
import dialogClose from '../../assets/icons/agent2/visits/dialog-close.svg';
import dialogSubmit from '../../assets/icons/agent2/visits/dialog-submit.svg';

/* Booking or amending a counter appointment.
 *
 * One form for both: scheduling starts blank, editing starts on the visit
 * that was clicked. Only the heading, the confirm label and whether the
 * application can still be changed differ.
 *
 * `visit` (editing) carries an `applicationId` a visit can never be moved off
 * of — the backend's PATCH is nested under the one case it already belongs
 * to (`/agent2/applications/:id/visits/:visitId`) — so the case picker locks
 * once one is set, rather than offering a choice the save call cannot honour.
 */

const blank = { applicationId: '', office: '', officer: '', date: '', time: '', purpose: '' };

/** `<input type="date">`/`type="time">` want `yyyy-mm-dd`/`HH:mm`. */
const dateOf = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
const timeOf = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export function VisitFormDialog({ visit, offices, cases = [], onCancel, onSave }) {
  const editing = Boolean(visit);
  const [form, setForm] = useState(() =>
    visit
      ? {
          applicationId: visit.applicationId,
          office: visit.office,
          officer: visit.officer ?? '',
          date: dateOf(visit.scheduledAt),
          time: timeOf(visit.scheduledAt),
          purpose: visit.purpose ?? '',
        }
      : blank
  );
  const [saving, setSaving] = useState(false);

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const ready =
    form.applicationId && form.office && form.officer && form.date && form.time && form.purpose;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!ready) return;

    const iso = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(iso.getTime())) return;

    setSaving(true);
    try {
      await onSave({
        applicationId: form.applicationId,
        office: form.office,
        officer: form.officer,
        purpose: form.purpose,
        scheduledAt: iso.toISOString(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal" role="presentation" onClick={onCancel}>
      <form
        className="visit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="visit-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="visit-dialog__head">
          <span className="visit-dialog__badge">
            <img src={dialogPin} alt="" width="14.992" height="14.992" />
          </span>

          <div className="visit-dialog__intro">
            <h2 className="visit-dialog__title" id="visit-dialog-title">
              {editing ? 'Edit Government Visit' : 'Schedule Government Visit'}
            </h2>
            <p className="visit-dialog__lead">
              {editing ? 'Update this visit entry' : 'Add a new visit entry'}
            </p>
          </div>

          <button className="visit-dialog__close" type="button" aria-label="Close" onClick={onCancel}>
            <img src={dialogClose} alt="" width="14.992" height="14.992" />
          </button>
        </div>

        <div className="visit-dialog__body">
          <label className="visit-field">
            <span className="visit-field__label">
              Application <span className="visit-field__required">*</span>
            </span>
            <select
              className="visit-field__input"
              value={form.applicationId}
              disabled={editing}
              onChange={(event) => set('applicationId', event.target.value)}
            >
              <option value="">–Select Application–</option>
              {cases.map((one) => (
                <option value={one.id} key={one.id}>
                  {one.applicationNumber} · {one.citizenName ?? 'Unknown'}
                </option>
              ))}
              {/* Editing a visit whose case is not in the current page of
                  cases still has to show something rather than a blank
                  selection. */}
              {editing && !cases.some((one) => one.id === form.applicationId) && (
                <option value={form.applicationId}>{visit.applicationNumber}</option>
              )}
            </select>
          </label>

          <div className="visit-dialog__row">
            <label className="visit-field">
              <span className="visit-field__label">
                Government Office <span className="visit-field__required">*</span>
              </span>
              <select
                className="visit-field__input"
                value={form.office}
                onChange={(event) => set('office', event.target.value)}
              >
                <option value="">Choose an office…</option>
                {offices.map((office) => (
                  <option value={office} key={office}>
                    {office}
                  </option>
                ))}
              </select>
            </label>

            <label className="visit-field">
              <span className="visit-field__label">
                Officer Name <span className="visit-field__required">*</span>
              </span>
              <input
                className="visit-field__input"
                value={form.officer}
                placeholder="Enter the officer's name"
                onChange={(event) => set('officer', event.target.value)}
              />
            </label>
          </div>

          <div className="visit-dialog__row">
            <label className="visit-field">
              <span className="visit-field__label">
                Visit Date <span className="visit-field__required">*</span>
              </span>
              <input
                className="visit-field__input"
                type="date"
                value={form.date}
                onChange={(event) => set('date', event.target.value)}
              />
            </label>

            <label className="visit-field">
              <span className="visit-field__label">
                Visit Time <span className="visit-field__required">*</span>
              </span>
              <input
                className="visit-field__input"
                type="time"
                value={form.time}
                onChange={(event) => set('time', event.target.value)}
              />
            </label>
          </div>

          <label className="visit-field visit-field--stacked">
            <span className="visit-field__label">
              Purpose <span className="visit-field__required">*</span>
            </span>
            <input
              className="visit-field__input"
              value={form.purpose}
              placeholder="Enter the purpose of the visit"
              onChange={(event) => set('purpose', event.target.value)}
            />
          </label>

          <div className="visit-dialog__actions">
            <button className="visit-dialog__cancel" type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button className="visit-dialog__submit" type="submit" disabled={!ready || saving}>
              <img src={dialogSubmit} alt="" width="11.247" height="11.247" />
              {saving ? 'Saving…' : editing ? 'Save Visit' : 'Schedule Visit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default VisitFormDialog;
