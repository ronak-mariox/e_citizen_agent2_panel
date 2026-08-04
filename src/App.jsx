import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';
import { CasesProvider } from './context/CasesContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export function App() {
  return (
    <BrowserRouter>
      {/* inside the router so the guards can redirect */}
      <AuthProvider>
        {/* Case outcomes are read by the nav, the dashboard and the closing
            tabs, so they sit above the routes. */}
        <CasesProvider>
          <AppRoutes />
        </CasesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
