import { useState } from 'react';

import { EXTENSION_DAYS, deadlineDaysLeft } from '../../constants/caseDetail.js';
import badgeClock from '../../assets/icons/agent2/case/extension/badge-clock.svg';
import closeIcon from '../../assets/icons/agent2/case/dialog/close.svg';
import submitIcon from '../../assets/icons/agent2/case/dialog/send.svg';

/* Asking for more time, raised from the case header.

   The request goes to Admin rather than to the department: an Agent 2 cannot
   move a government deadline, only ask for the internal one to be relaxed. That
   is why nothing about the case changes here — the notice says who decides. */
export function ExtensionRequestDialog({ record, onCancel, onSend }) {
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');

  const remaining = deadlineDaysLeft(record);

  // Both fields are starred in the design, so neither can be skipped.
  const ready = days !== '' && reason.trim().length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    if (!ready) return;

    onSend({ days: Number(days), reason: reason.trim() });
  }

  return (
    <div className="modal" role="presentation" onClick={onCancel}>
      <form
        className="dlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="extension-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="dlg__head">
          <div className="dlg__ident">
            <span className="dlg__badge dlg__badge--amber">
              <img src={badgeClock} alt="" width="14.992" height="14.992" />
            </span>

            <div>
              <p className="dlg__title" id="extension-title">
                Request Deadline Extension
              </p>
              <p className="dlg__case">
                {record.id} · {record.name}
              </p>
            </div>
          </div>

          <button className="dlg__close" type="button" aria-label="Close" onClick={onCancel}>
            <img src={closeIcon} alt="" width="14.992" height="14.992" />
          </button>
        </div>

        <div className="dlg__body">
          <p className="dlg__notice">
            Current deadline: <strong>{record.deadline}</strong>
            {remaining != null && ` (${remaining} days remaining)`}. Your request will be sent to
            Admin for approval and Agent 1 will be notified.
          </p>

          <label className="dlg__field">
            <span className="dlg__label">
              Extension Duration <span className="dlg__required">*</span>
            </span>
            <select
              className="dlg__input"
              value={days}
              required
              onChange={(event) => setDays(event.target.value)}
            >
              <option value="" disabled />
              {EXTENSION_DAYS.map((option) => (
                <option value={option} key={option}>
                  {option} days
                </option>
              ))}
            </select>
          </label>

          <label className="dlg__field">
            <span className="dlg__label">
              Reason for Extension <span className="dlg__required">*</span>
            </span>
            <textarea
              className="dlg__input dlg__input--area"
              value={reason}
              required
              placeholder="Explain why more time is needed (e.g. government office closed, additional docs required…)"
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        </div>

        <div className="dlg__actions">
          <button className="dlg__cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="dlg__submit dlg__submit--amber" type="submit" disabled={!ready}>
            <img src={submitIcon} alt="" width="13.12" height="13.12" />
            Submit to Admin
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExtensionRequestDialog;
