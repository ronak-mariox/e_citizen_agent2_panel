import { useId, useState } from 'react';

import eyeIcon from '@/assets/icons/eye.svg';
import eyeOffIcon from '@/assets/icons/eye-off.svg';
import keyWhiteIcon from '@/assets/icons/key-white.svg';
import lockGreenIcon from '@/assets/icons/lock-green.svg';
import lockIcon from '@/assets/icons/lock.svg';

const MIN_PASSWORD_LENGTH = 8;

/* The designed checklist is static grey; each rule reports whether it is met so
   the dot can fill in as the agent types. */
function checkRules(password, confirm) {
  return [
    {
      id: 'length',
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      met: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      id: 'mix',
      label: 'Mix of letters and numbers',
      met: /[a-z]/i.test(password) && /\d/.test(password),
    },
    {
      id: 'match',
      label: 'Passwords match',
      met: password.length > 0 && password === confirm,
    },
  ];
}

/**
 * Password recovery — final step.
 *
 * `onSubmit` receives `{ password }` — wire it to the auth API from the page
 * that renders this form.
 */
export function ResetPasswordForm({ onSubmit }) {
  const passwordFieldId = useId();
  const confirmFieldId = useId();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rules = checkRules(password, confirm);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const unmet = rules.find((rule) => !rule.met);

    if (unmet) {
      setFormError(`Password requirement not met: ${unmet.label.toLowerCase()}.`);
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.({ password });
    } catch (error) {
      setFormError(error?.message || 'Unable to reset the password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth__panel">
      <header className="auth__intro">
        <span className="auth__icon-badge auth__icon-badge--green">
          <img src={lockGreenIcon} alt="" width="24" height="24" />
        </span>
        <h1 className="auth__title">Set new password</h1>
        <p className="auth__subtitle">
          Choose a strong password to secure your account.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <label className="auth__label" htmlFor={passwordFieldId}>
          New Password
        </label>
        <div className="auth__field">
          <img
            className="auth__field-icon"
            src={lockIcon}
            alt=""
            width="16"
            height="16"
          />
          <input
            className="auth__input auth__input--password"
            id={passwordFieldId}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="auth__reveal"
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            <img src={showPassword ? eyeOffIcon : eyeIcon} alt="" width="16" height="16" />
          </button>
        </div>

        <label className="auth__label auth__label--spaced" htmlFor={confirmFieldId}>
          Confirm Password
        </label>
        <div className="auth__field">
          <img
            className="auth__field-icon"
            src={lockIcon}
            alt=""
            width="16"
            height="16"
          />
          <input
            className="auth__input"
            id={confirmFieldId}
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter new password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>

        <ul className="reset__rules">
          {rules.map((rule) => (
            <li
              className={rule.met ? 'reset__rule reset__rule--met' : 'reset__rule'}
              key={rule.id}
            >
              <span className="reset__dot" />
              {rule.label}
            </li>
          ))}
        </ul>

        <button className="auth__submit" type="submit" disabled={submitting}>
          <img src={keyWhiteIcon} alt="" width="16" height="16" />
          {submitting ? 'Resetting…' : 'Reset Password'}
        </button>

        {formError && (
          <p className="auth__alert" role="alert">
            {formError}
          </p>
        )}
      </form>
    </section>
  );
}

export default ResetPasswordForm;
