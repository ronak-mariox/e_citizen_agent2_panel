import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { resetPassword } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import ROUTES from '@/constants/routes';
import AuthLayout from '@/layouts/AuthLayout';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetToken = location.state?.resetToken ?? '';

  // The token is single-use and only ever arrives from the OTP screen.
  if (!resetToken) {
    return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;
  }

  async function handleSubmit({ password }) {
    try {
      await resetPassword({ resetToken, newPassword: password });

      // The reset revokes every session, so the agent must sign in again.
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }

  return (
    <AuthLayout>
      <ResetPasswordForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}

export default ResetPasswordPage;
