import { useLocation, useNavigate } from 'react-router-dom';

import LoginForm from '@/components/LoginForm';
import ROUTES from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  // Set by ProtectedRoute when a guard bounced the agent here, so a re-login
  // returns them to the page they actually wanted.
  const from = location.state?.from ?? ROUTES.DASHBOARD;

  async function handleSubmit({ employeeId, password }) {
    // signIn stores the session and throws an Error with a readable message;
    // LoginForm catches it and shows it above the submit button.
    await signIn({ employeeId, password });

    navigate(from, { replace: true });
  }

  return (
    <AuthLayout>
      <LoginForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}

export default LoginPage;
