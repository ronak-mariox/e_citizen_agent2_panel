import LoginForm from '@/components/LoginForm';
import AuthLayout from '@/layouts/AuthLayout';

export function LoginPage() {
  // TODO: call the auth service, then redirect to the dashboard once that
  // screen exists.
  async function handleSubmit(credentials) {
    console.info('login submitted', { employeeId: credentials.employeeId });
  }

  return (
    <AuthLayout>
      <LoginForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}

export default LoginPage;
