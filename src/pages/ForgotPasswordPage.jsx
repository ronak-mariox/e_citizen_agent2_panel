import { useNavigate } from 'react-router-dom';

import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import ROUTES from '@/constants/routes';
import AuthLayout from '@/layouts/AuthLayout';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  // TODO: wire to the OTP request endpoint once the auth service is available.
  async function handleSubmit({ identifier }) {
    console.info('otp requested', { identifier });
    navigate(ROUTES.VERIFY_OTP, { state: { identifier } });
  }

  return (
    <AuthLayout>
      <ForgotPasswordForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
