import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';
import AppRoutes from '@/routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      {/* inside the router so the guards can redirect */}
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
