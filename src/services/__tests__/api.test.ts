import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

vi.mock('nprogress', () => ({
  default: { start: vi.fn(), done: vi.fn() },
}));

const loadApi = async () => (await import('../api')).default;

describe('api client', () => {
  let mock: MockAdapter;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    const api = await loadApi();
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('attaches the bearer token when one is stored', async () => {
    localStorage.setItem('token', 'abc123');
    const api = await loadApi();
    const scoped = new MockAdapter(api);
    scoped.onGet('/items').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer abc123');
      return [200, { data: [] }];
    });

    await api.get('/items');
    scoped.restore();
  });

  it('sends no Authorization header when there is no token', async () => {
    const api = await loadApi();
    const scoped = new MockAdapter(api);
    scoped.onGet('/items').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, { data: [] }];
    });

    await api.get('/items');
    scoped.restore();
  });

  it('dispatches a logout event on a 401', async () => {
    const api = await loadApi();
    const scoped = new MockAdapter(api);
    scoped.onGet('/profile').reply(401);

    const onLogout = vi.fn();
    window.addEventListener('logout', onLogout);

    await expect(api.get('/profile')).rejects.toBeTruthy();
    expect(onLogout).toHaveBeenCalled();

    window.removeEventListener('logout', onLogout);
    scoped.restore();
  });

  it('does not dispatch logout when the logout call itself 401s', async () => {
    const api = await loadApi();
    const scoped = new MockAdapter(api);
    scoped.onGet('/logout').reply(401);

    const onLogout = vi.fn();
    window.addEventListener('logout', onLogout);

    await expect(api.get('/logout')).rejects.toBeTruthy();
    // Otherwise logging out would trigger a second logout, looping.
    expect(onLogout).not.toHaveBeenCalled();

    window.removeEventListener('logout', onLogout);
    scoped.restore();
  });

  it('rejects other errors without dispatching logout', async () => {
    const api = await loadApi();
    const scoped = new MockAdapter(api);
    scoped.onGet('/items').reply(500);

    const onLogout = vi.fn();
    window.addEventListener('logout', onLogout);

    await expect(api.get('/items')).rejects.toBeTruthy();
    expect(onLogout).not.toHaveBeenCalled();

    window.removeEventListener('logout', onLogout);
    scoped.restore();
  });

  /**
   * Characterisation test for a known gap, not an endorsement.
   *
   * The web frontend sends `X-Tenant` on every request; the desktop client does not, which is why
   * one build cannot yet serve multiple tenants (desktop tenant-awareness is a Phase 2 item in
   * DEVELOPMENT_PLAN.md). When that lands, this test should be replaced by one asserting the header
   * IS sent — its failure is the reminder.
   */
  it('does NOT yet send the X-Tenant header (known gap)', async () => {
    localStorage.setItem('token', 'abc123');
    const api = await loadApi();
    const scoped = new MockAdapter(api);
    scoped.onGet('/items').reply((config) => {
      expect(config.headers?.['X-Tenant']).toBeUndefined();
      return [200, { data: [] }];
    });

    await api.get('/items');
    scoped.restore();
  });
});
