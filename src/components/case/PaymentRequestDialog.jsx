import { useState } from 'react';

import {
  PAYMENT_PRIORITIES,
  PAYMENT_REASONS,
  PAYMENT_REMARKS_LIMIT,
  formatRupees,
} from '../../constants/caseDetail.js';
import closeIcon from '../../assets/icons/application/query-close.svg';
import infoIcon from '../../assets/icons/application/decision-info.svg';
import sendIcon from '../../assets/icons/application/note-send.svg';

/* Asking the citizen for more money, raised from step 2.

   An Agent 2 has no contact with the citizen — Agent 1 does — so this does not
   collect a payment, it sends a request back down the chain. That is why the
   panel below the fields shows what the citizen will end up owing in total:
   it is the number Agent 1 will have to quote. */
export function PaymentRequestDialog({ record, onCancel, onSend }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(PAYMENT_REASONS[0]);
  const [remarks, setRemarks] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notify, setNotify] = useState(true);

  const paid = record.paidAmount ?? 0;
  const additional = Number(String(amount).replace(/,/g, '')) || 0;
  const chosen = PAYMENT_PRIORITIES.find((item) => item.value === priority);

  // Every starred field has to be answered before this can be sent on.
  const ready = additional > 0 && reason && remarks.trim().length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    if (!ready) return;

    onSend({ amount: additional, reason, remarks, priority, notify });
  }

  return (
    <div className="modal" role="presentation" onClick={onCancel}>
      <form
        className="modal__card modal__card--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="pay__head">
          <span className="pay__badge" aria-hidden="true">
            ₹
          </span>

          <div className="pay__intro">
            <h2 className="pay__title" id="payment-title">
              Request Additional Payment
            </h2>
            <p className="pay__lead">
              Request an additional payment from the applicant. This request will be sent to Agent
              1, who will notify the customer to complete the remaining payment.
            </p>
          </div>

          <button className="pay__close" type="button" aria-label="Close" onClick={onCancel}>
            <img src={closeIcon} alt="" width="14.992" height="14.992" />
          </button>
        </div>

        <div className="pay__grid">
          <label className="case-field">
            <span className="case-field__label">
              Additional Amount <span className="pay__required">*</span>
            </span>
            <span className="pay__amount">
              <span className="pay__currency" aria-hidden="true">
                ₹
              </span>
              <input
                className="case-field__input pay__amount-input"
                inputMode="decimal"
                value={amount}
                placeholder="1,200.00"
                onChange={(event) => setAmount(event.target.value)}
              />
            </span>
            <span className="case-field__hint">Enter the additional amount to be collected.</span>
          </label>

          <label className="case-field">
            <span className="case-field__label">
              Payment Reason <span className="pay__required">*</span>
            </span>
            <select
              className="case-field__input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              {PAYMENT_REASONS.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="case-field__hint">Select the reason for additional payment.</span>
          </label>
        </div>

        <label className="case-field case-field--stacked">
          <span className="case-field__label">
            Remarks <span className="pay__required">*</span>
          </span>
          <span className="pay__remarks">
            <textarea
              className="case-field__input case-field__input--area"
              rows={3}
              value={remarks}
              maxLength={PAYMENT_REMARKS_LIMIT}
              placeholder="Government registration charges have been revised as per the latest notification. The applicant must pay the remaining amount before final approval."
              onChange={(event) => setRemarks(event.target.value)}
            />
            <span className="pay__counter">
              {remarks.length}/{PAYMENT_REMARKS_LIMIT}
            </span>
          </span>
          <span className="case-field__hint">
            Provide details explaining why additional payment is required.
          </span>
        </label>

        {/* The sum, spelled out — an agent should not be doing this arithmetic
            at a counter. */}
        <div className="total">
          <p className="total__title">Updated Total Payable</p>

          <div className="total__row">
            <div className="total__part">
              <span className="total__label">Already Paid</span>
              <span className="total__value">{formatRupees(paid)}</span>
            </div>

            <span className="total__operator" aria-hidden="true">
              +
            </span>

            <div className="total__part">
              <span className="total__label">Additional Amount</span>
              <span className="total__value">{formatRupees(additional)}</span>
            </div>

            <span className="total__operator" aria-hidden="true">
              =
            </span>

            <div className="total__part">
              <span className="total__label total__label--sum">Updated Total Payable</span>
              <span className="total__value total__value--sum">{formatRupees(paid + additional)}</span>
            </div>
          </div>
        </div>

        <div className="pay__grid">
          <label className="case-field">
            <span className="case-field__label">
              Priority <span className="pay__optional">(Optional)</span>
            </span>
            <span className="pay__priority">
              <span className={`pay__dot pay__dot--${chosen?.tone ?? 'amber'}`} aria-hidden="true" />
              <select
                className="case-field__input pay__priority-input"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                {PAYMENT_PRIORITIES.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <div className="case-field">
            <span className="case-field__label">Notify Agent 1</span>
            <label className="check check--blue">
              <input
                className="check__input"
                type="checkbox"
                checked={notify}
                onChange={(event) => setNotify(event.target.checked)}
              />
              <span className="check__box" aria-hidden="true" />
              <span className="check__label check__label--sm">
                Send notification to Agent 1 immediately
              </span>
            </label>
            <span className="case-field__hint">Agent 1 will be notified about this request.</span>
          </div>
        </div>

        <p className="pay__note">
          <img src={infoIcon} alt="" width="14.992" height="14.992" />
          <span>
            After submitting this request, the application status will change to{' '}
            <strong>&quot;Waiting for Re-Payment&quot;</strong>. Agent 1 will receive a notification
            and request the applicant to complete the additional payment.
          </span>
        </p>

        <div className="pay__actions">
          <button className="pay__cancel" type="button" onClick={onCancel}>
            <img src={closeIcon} alt="" width="13.12" height="13.12" />
            Cancel
          </button>
          <button className="pay__send" type="submit" disabled={!ready}>
            <img src={sendIcon} alt="" width="13.12" height="13.12" />
            Send to Agent 1
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaymentRequestDialog;
