import { useId, useState } from 'react';
import { Link } from 'react-router-dom';

import ROUTES from '@/constants/routes';

import badgeCheckIcon from '@/assets/icons/badge-check.svg';
import eyeIcon from '@/assets/icons/eye.svg';
import eyeOffIcon from '@/assets/icons/eye-off.svg';
import lockIcon from '@/assets/icons/lock.svg';
import shieldCheckIcon from '@/assets/icons/shield-check.svg';
import userIcon from '@/assets/icons/user.svg';

const MIN_PASSWORD_LENGTH = 4;

/**
 * Agent 2 sign-in form.
 *
 * `onSubmit` receives `{ employeeId, password, remember }` — wire it to the
 * auth API from the page that renders this form.
 */
export function LoginForm({ onSubmit }) {
  const employeeFieldId = useId();
  const passwordFieldId = useId();

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};

    if (!employeeId.trim()) {
      next.employeeId = 'Employee ID is required.';
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.({ employeeId: employeeId.trim(), password, remember });
    } catch (error) {
      setFormError(error?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth__panel">
      <header className="auth__intro auth__intro--login">
        <span className="login__badge">
          <img src={badgeCheckIcon} alt="" width="14" height="14" />
          Agent 2 — Senior Review Portal
        </span>
        <h1 className="auth__title">Welcome back</h1>
        <p className="auth__subtitle">
          Sign in with your employee credentials to continue
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <label className="auth__label" htmlFor={employeeFieldId}>
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
            id={employeeFieldId}
            name="employeeId"
            type="text"
            autoComplete="username"
            placeholder="ECZ-A2-0018"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            aria-invalid={Boolean(errors.employeeId)}
            aria-describedby={errors.employeeId ? `${employeeFieldId}-error` : undefined}
          />
        </div>
        {errors.employeeId && (
          <p className="auth__error" id={`${employeeFieldId}-error`}>
            {errors.employeeId}
          </p>
        )}

        <label className="auth__label auth__label--spaced" htmlFor={passwordFieldId}>
          Password
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
            autoComplete="current-password"
            placeholder="pass1234"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? `${passwordFieldId}-error` : undefined}
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
        {errors.password && (
          <p className="auth__error" id={`${passwordFieldId}-error`}>
            {errors.password}
          </p>
        )}

        <div className="login__options">
          <label className="login__remember">
            <input
              className="login__checkbox"
              type="checkbox"
              name="remember"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Remember me
          </label>
          <Link className="login__forgot" to={ROUTES.FORGOT_PASSWORD}>
            Forgot password?
          </Link>
        </div>

        <button className="auth__submit" type="submit" disabled={submitting}>
          <img src={shieldCheckIcon} alt="" width="16" height="16" />
          {submitting ? 'Signing In…' : 'Sign In Securely'}
        </button>

        {formError && (
          <p className="auth__alert" role="alert">
            {formError}
          </p>
        )}
      </form>

      <div className="auth__note auth__note--success">
        <p className="auth__note-title">Demo credentials</p>
        <p className="auth__note-line">
          Employee ID: <code>ECZ-A2-0018</code>
        </p>
        <p className="auth__note-line auth__note-line--tight">
          Password: <code>any 4+ characters</code>
        </p>
      </div>

      <p className="login__support">
        Having trouble? Contact IT support at{' '}
        <span className="login__support-email">helpdesk@ecitizen.gov.in</span>
      </p>
    </section>
  );
}

export default LoginForm;
