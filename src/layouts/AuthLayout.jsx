import BrandPanel from '@/components/BrandPanel';

import '@/styles/auth.css';

/** Split card shared by every auth screen: brand panel left, form pane right. */
export function AuthLayout({ children }) {
  return (
    <main className="auth">
      <div className="auth__card">
        <BrandPanel />
        {children}
      </div>
    </main>
  );
}

export default AuthLayout;
