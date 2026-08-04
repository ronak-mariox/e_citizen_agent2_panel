import { useState } from 'react';

import { GOVERNMENT_VISITS } from '../../constants/visits.js';
import { CASE_DETAILS } from '../../constants/caseDetail.js';
import dialogPin from '../../assets/icons/agent2/visits/dialog-pin.svg';
import dialogClose from '../../assets/icons/agent2/visits/dialog-close.svg';
import dialogSubmit from '../../assets/icons/agent2/visits/dialog-submit.svg';

/* Booking or amending a counter appointment.

   One form for both: scheduling starts blank, editing starts on the visit that
   was clicked. Only the heading and the confirm label differ, because the
   questions asked are identical either way. */

/** Offices already in use, so the list reflects where this agent actually goes. */
const OFFICES = [...new Set(GOVERNMENT_VISITS.map((visit) => visit.office))];

const blank = {
  caseId: '',
  office: '',
  officer: '',
  date: '',
  time: '',
  purpose: '',
};

export function VisitFormDialog({ visit, onCancel, onSave }) {
  const editing = Boolean(visit);
  const [form, setForm] = useState(() => (visit ? { ...blank, ...visit } : blank));

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const ready = form.caseId && form.office && form.officer && form.date && form.time && form.purpose;

  function handleSubmit(event) {
    event.preventDefault();
    if (!ready) return;

    onSave(form);
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
              Application ID <span className="visit-field__required">*</span>
            </span>
            <select
              className="visit-field__input"
              value={form.caseId}
              onChange={(event) => set('caseId', event.target.value)}
            >
              <option value="">–Select Application–</option>
              {Object.values(CASE_DETAILS).map((record) => (
                <option value={record.id} key={record.id}>
                  {record.id} · {record.name}
                </option>
              ))}
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
                <option value="">BBMP Head Office</option>
                {OFFICES.map((office) => (
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
                placeholder="e.g. D.K. Rao"
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
                value={form.date}
                placeholder="DD/MM/YYYY"
                onChange={(event) => set('date', event.target.value)}
              />
            </label>

            <label className="visit-field">
              <span className="visit-field__label">
                Visit Time <span className="visit-field__required">*</span>
              </span>
              <input
                className="visit-field__input"
                value={form.time}
                placeholder="-- : --"
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
              placeholder="e.g. Property Tax Submission"
              onChange={(event) => set('purpose', event.target.value)}
            />
          </label>

          <div className="visit-dialog__actions">
            <button className="visit-dialog__cancel" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="visit-dialog__submit" type="submit" disabled={!ready}>
              <img src={dialogSubmit} alt="" width="11.247" height="11.247" />
              {editing ? 'Save Visit' : 'Schedule Visit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default VisitFormDialog;
