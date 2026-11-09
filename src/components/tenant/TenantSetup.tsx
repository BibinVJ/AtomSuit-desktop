import { useState } from 'react';
import api from '../../services/api';
import { ThemeToggleButton } from '../common/ThemeToggleButton';

interface TenantSetupProps {
  onSuccess: (tenant: string) => void;
}

const TenantSetup = ({ onSuccess }: TenantSetupProps) => {
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateTenant = async (tenantValue: string) => {
    setLoading(true);
    setError(null);
    try {
      // Validate by calling API directly using axios (same as sign-in), sending x-tenant header
      const res = await api.get('/', {
        headers: {
          'x-tenant': tenantValue,
          'Accept': 'application/json',
        },
        validateStatus: () => true,
      });
      if (!(res.status >= 200 && res.status < 300)) {
        throw new Error('Invalid tenant');
      }
      // Persist tenant and set header on axios for future requests
      localStorage.setItem('tenant', tenantValue);
      api.defaults.headers.common['x-tenant'] = tenantValue;
      onSuccess(tenantValue);
    } catch (e) {
      console.error('Tenant validation failed:', e);
      setError('Invalid subdomain. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = subdomain.trim().toLowerCase();
    if (!value) {
      setError('Please enter a subdomain');
      return;
    }
    await validateTenant(value);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggleButton />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Enter your subdomain</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subdomain
            </label>
            <input
              id="subdomain"
              type="text"
              className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:border-blue-300"
              placeholder="e.g., company"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Validating...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TenantSetup;