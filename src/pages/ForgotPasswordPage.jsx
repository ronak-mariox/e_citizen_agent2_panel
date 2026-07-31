import { useNavigate } from 'react-router-dom';

import { forgotPassword } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import ROUTES from '@/constants/routes';
import AuthLayout from '@/layouts/AuthLayout';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  async function handleSubmit({ employeeId }) {
    try {
      // The reply is deliberately the same for an unknown employee ID, so this
      // screen always moves on — it cannot be used to probe for accounts.
      // `mobile` comes back masked, and `devOtp` only outside production.
      const data = await forgotPassword({ employeeId });

      navigate(ROUTES.VERIFY_OTP, {
        state: { employeeId, mobile: data.mobile, devOtp: data.devOtp },
      });
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }

  return (
    <AuthLayout>
      <ForgotPasswordForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
