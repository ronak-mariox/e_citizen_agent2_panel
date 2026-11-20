import { useId, useState } from 'react';

import { savePayoutAccount } from '../../api/profile.js';
import { getErrorMessage } from '../../api/client.js';
import { setPayoutAccount, usePayoutAccount } from '../../hooks/usePayoutAccount.js';

/* Where the company sends this agent's share through RazorpayX — a bank
   account, a UPI ID, or both (the bank account is used when both are there).
   The saved account number never comes back; it shows masked, and leaving
   the field empty keeps it. */

const FIELDS = [
  { name: 'accountHolderName', label: 'Account Holder Name', placeholder: 'As printed on the passbook' },
  { name: 'accountNumber', label: 'Account Number', placeholder: '9 to 18 digits', inputMode: 'numeric' },
  { name: 'ifsc', label: 'IFSC Code', placeholder: 'e.g. HDFC0001234' },
  { name: 'bankName', label: 'Bank Name', placeholder: 'e.g. HDFC Bank (optional)' },
  { name: 'upiId', label: 'UPI ID', placeholder: 'e.g. name@okhdfc (optional with a bank account)' },
];

const formFrom = (account) => ({
  accountHolderName: account?.accountHolderName ?? '',
  accountNumber: '',
  ifsc: account?.ifsc ?? '',
  bankName: account?.bankName ?? '',
  upiId: account?.upiId ?? '',
});

export function PayoutPanel() {
  const fieldPrefix = useId();
  const saved = usePayoutAccount();
  const [values, setValues] = useState(() => formFrom(saved));
  // Refill when the saved account arrives or changes — during render, not in an effect.
  const [filledFrom, setFilledFrom] = useState(saved);
  if (saved !== filledFrom) {
    setFilledFrom(saved);
    if (saved) setValues(formFrom(saved));
  }
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  function handleChange(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function validate(trimmed) {
    const next = {};
    const wantsBank = Boolean(trimmed.accountHolderName || trimmed.accountNumber || trimmed.ifsc);

    if (wantsBank) {
      if (!trimmed.accountHolderName) next.accountHolderName = 'Enter the account holder name.';
      if (!trimmed.accountNumber && !saved?.hasBankAccount) next.accountNumber = 'Enter the account number.';
      else if (trimmed.accountNumber && !/^\d{9,18}$/.test(trimmed.accountNumber)) {
        next.accountNumber = 'Account number must be 9 to 18 digits.';
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(trimmed.ifsc.toUpperCase())) next.ifsc = 'Enter a valid IFSC code.';
    }
    if (trimmed.upiId && !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(trimmed.upiId)) {
      next.upiId = 'Enter a valid UPI ID, like name@okhdfc.';
    }
    if (!wantsBank && !trimmed.upiId) next.upiId = 'Add a bank account or a UPI ID.';

    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSavedNotice('');

    const trimmed = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
    const nextErrors = validate(trimmed);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const account = await savePayoutAccount({
        accountHolderName: trimmed.accountHolderName || undefined,
        accountNumber: trimmed.accountNumber || undefined,
        ifsc: trimmed.ifsc.toUpperCase() || undefined,
        bankName: trimmed.bankName || undefined,
        upiId: trimmed.upiId || undefined,
      });
      setPayoutAccount(account);
      setSavedNotice('Saved. Company payments will be sent here.');
    } catch (error) {
      const fieldErrors = error?.response?.data?.errors ?? [];
      if (fieldErrors.length) {
        setErrors(Object.fromEntries(fieldErrors.map((one) => [one.field, one.message])));
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-column">
        <h2 className="settings-card__title">Payout Account</h2>
        <p className="settings-card__lead">
          Your service amount is sent here by the company through RazorpayX. A bank account is used when you give
          both.
          {saved?.hasBankAccount &&
            ` Saved account: ${saved.accountNumberMasked} · ${saved.ifsc} — leave the number empty to keep it.`}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="settings-stack">
            {FIELDS.map((field) => {
              const fieldId = `${fieldPrefix}-${field.name}`;
              const error = errors[field.name];

              return (
                <div className="settings-field" key={field.name}>
                  <label className="settings-field__label" htmlFor={fieldId}>
                    {field.label}
                  </label>

                  <div className="settings-field__control">
                    <input
                      id={fieldId}
                      className="settings-field__input"
                      name={field.name}
                      inputMode={field.inputMode}
                      autoComplete="off"
                      placeholder={
                        field.name === 'accountNumber' && saved?.hasBankAccount
                          ? `${saved.accountNumberMasked} (saved)`
                          : field.placeholder
                      }
                      value={values[field.name]}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `${fieldId}-error` : undefined}
                    />
                  </div>

                  {error && (
                    <p className="settings-field__error" id={`${fieldId}-error`}>
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button className="settings-save settings-save--wide" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Payout Account'}
          </button>

          {formError && (
            <p className="settings-field__error" role="alert">
              {formError}
            </p>
          )}
          {savedNotice && (
            <p className="settings-card__lead" role="status">
              {savedNotice}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

export default PayoutPanel;
