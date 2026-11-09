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
   * Tenant routing. Without this header the API silently answers in the CENTRAL context rather
   * than failing, so a missing one is invisible until the data looks wrong.
   *
   * (This replaces an earlier characterisation test that recorded the header as missing — it was
   * added by the `feat:added multi tenancy` work on develop.)
   */
  it('sends the x-tenant header when a tenant is stored', async () => {
    localStorage.setItem('token', 'abc123');
    localStorage.setItem('tenant', 'acme');
    const api = await loadApi();
    const scoped = new MockAdapter(api);
    scoped.onGet('/items').reply((config) => {
      expect(config.headers?.['x-tenant']).toBe('acme');
      return [200, { data: [] }];
    });

    await api.get('/items');
    scoped.restore();
  });

  it('omits the tenant header when no tenant has been chosen', async () => {
    // Before tenant setup the client is legitimately central-context; it must not invent a tenant.
    const api = await loadApi();
    const scoped = new MockAdapter(api);
    scoped.onGet('/items').reply((config) => {
      expect(config.headers?.['x-tenant']).toBeUndefined();
      return [200, { data: [] }];
    });

    await api.get('/items');
    scoped.restore();
  });

  it('picks up a tenant chosen after the client was created', async () => {
    // TenantSetup writes to localStorage mid-session; the interceptor reads it per request, so a
    // switch must not need an app restart.
    const api = await loadApi();
    localStorage.setItem('tenant', 'globex');
    const scoped = new MockAdapter(api);
    scoped.onGet('/items').reply((config) => {
      expect(config.headers?.['x-tenant']).toBe('globex');
      return [200, { data: [] }];
    });

    await api.get('/items');
    scoped.restore();
  });
});
