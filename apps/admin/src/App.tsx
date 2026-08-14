import { Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import { getToken } from './api';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Users from './pages/Users';
import Artisans from './pages/Artisans';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import Payments from './pages/Payments';
import Reviews from './pages/Reviews';
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
      <Route path="/login" element={getToken() ? <Navigate to="/overview" replace /> : <Login onLogin={refresh} />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout onLogout={refresh}>
              <Routes>
                <Route path="overview" element={<Overview />} />
                <Route path="users" element={<Users />} />
                <Route path="artisans" element={<Artisans />} />
                <Route path="requests" element={<Requests />} />
                <Route path="requests/:id" element={<RequestDetail />} />
                <Route path="payments" element={<Payments />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="disputes" element={<Disputes />} />
                <Route path="*" element={<Navigate to="/overview" replace />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
