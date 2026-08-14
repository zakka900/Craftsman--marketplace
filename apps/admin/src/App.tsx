import { Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import { getToken } from './api';
import Login from './pages/Login';
import Disputes from './pages/Disputes';
import Layout from './components/Layout';

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  // Forza un re-render dell'intero albero dopo login/logout (il token vive fuori da React, in localStorage).
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n) => n + 1);

  return (
    <Routes>
      <Route path="/login" element={getToken() ? <Navigate to="/disputes" replace /> : <Login onLogin={refresh} />} />
      <Route
        path="/disputes"
        element={
          <RequireAuth>
            <Layout onLogout={refresh}>
              <Disputes />
            </Layout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={getToken() ? '/disputes' : '/login'} replace />} />
    </Routes>
  );
}
