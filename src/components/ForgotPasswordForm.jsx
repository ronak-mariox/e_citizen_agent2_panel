import { useId, useState } from 'react';
import { Link } from 'react-router-dom';

import ROUTES from '@/constants/routes';

import arrowLeftIcon from '@/assets/icons/arrow-left.svg';
import keyIcon from '@/assets/icons/key.svg';
import userIcon from '@/assets/icons/user.svg';
import sendIcon from '@/assets/icons/send.svg';

/**
 * Password recovery — step one of the OTP flow.
 *
 * `onSubmit` receives `{ employeeId }`. Agents have no email on their staff
 * record; the code goes to the mobile number held there.
 */
export function ForgotPasswordForm({ onSubmit }) {
  const fieldId = useId();

  const [employeeId, setEmployeeId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = employeeId.trim().length > 0 && !submitting;

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.({ employeeId: employeeId.trim() });
    } catch (error) {
      setFormError(error?.message || 'Unable to send the code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth__panel">
      <Link className="auth__back" to={ROUTES.LOGIN}>
        <img src={arrowLeftIcon} alt="" width="14" height="14" />
        Back to Login
      </Link>

      <header className="auth__intro">
        <span className="auth__icon-badge auth__icon-badge--amber">
          <img src={keyIcon} alt="" width="24" height="24" />
        </span>
        <h1 className="auth__title">Forgot password?</h1>
        <p className="auth__subtitle">
          Enter your Employee ID. We will send a one-time code to the mobile
          number on your staff record.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <label className="auth__label" htmlFor={fieldId}>
          Employee ID
        </label>
        <div className="auth__field">
          <img
            className="auth__field-icon"
            src={userIcon}
            alt=""
            width="16"
            height="16"
          />
          <input
            className="auth__input"
            id={fieldId}
            name="employeeId"
            type="text"
            autoComplete="username"
            placeholder="ECZ-A2-0007"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
          />
        </div>

        <button className="auth__submit" type="submit" disabled={!canSubmit}>
          <img src={sendIcon} alt="" width="16" height="16" />
          {submitting ? 'Sending…' : 'Send OTP'}
        </button>

        {formError && (
          <p className="auth__alert" role="alert">
            {formError}
          </p>
        )}
      </form>

      <div className="auth__note auth__note--muted auth__note--tight">
        <p className="auth__note-title">Don&apos;t have access to your email?</p>
        <p className="auth__note-line">
          Contact your department supervisor or IT helpdesk at{' '}
          <strong>1800-111-222</strong> (toll-free).
        </p>
      </div>
    </section>
  );
}

export default ForgotPasswordForm;
