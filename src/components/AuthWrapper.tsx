import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AppRouter from '../router';
import TenantSetup from './tenant/TenantSetup';

const AuthWrapper = () => {
  const { isAuthenticated, loading } = useAuth();
  const [tenant, setTenant] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('tenant');
    setTenant(stored);
  }, []);

  if (!tenant) {
    return <TenantSetup onSuccess={(t) => {
      localStorage.setItem('tenant', t);
      setTenant(t);
    }} />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AppRouter isAuthenticated={isAuthenticated} />;
};

export default AuthWrapper;
