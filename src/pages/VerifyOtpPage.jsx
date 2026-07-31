import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { resendResetOtp, verifyResetOtp } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import OtpForm from '@/components/OtpForm';
import ROUTES from '@/constants/routes';
import AuthLayout from '@/layouts/AuthLayout';

export function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const employeeId = location.state?.employeeId ?? '';
  const mobile = location.state?.mobile ?? '';
  const devOtp = location.state?.devOtp ?? '';

  // Landing here directly (refresh, bookmark) means no code was ever sent.
  if (!employeeId) {
    return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;
  }

  async function handleSubmit({ code }) {
    try {
      // A verified code only unlocks the reset step — the agent still signs in
      // afterwards. `resetToken` is what authorises that next call, and the OTP
      // is spent here so it never travels further.
      const { resetToken } = await verifyResetOtp({ employeeId, otp: code });

      navigate(ROUTES.RESET_PASSWORD, { replace: true, state: { resetToken } });
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }

  async function handleResend() {
    try {
      // returned so the form can refresh its dev hint with the new code
      const data = await resendResetOtp({ employeeId });

      return data.devOtp;
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }

  return (
    <AuthLayout>
      <OtpForm
        destination={mobile}
        devOtp={devOtp}
        onSubmit={handleSubmit}
        onResend={handleResend}
      />
    </AuthLayout>
  );
}

export default VerifyOtpPage;
