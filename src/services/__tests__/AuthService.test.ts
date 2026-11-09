import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { getToken, getUser, login, logout, storeToken, storeUser } from '../AuthService';

vi.mock('nprogress', () => ({ default: { start: vi.fn(), done: vi.fn() } }));

const USER = { id: 1, name: 'Cashier', email: 'cashier@example.test' } as never;

describe('AuthService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    localStorage.clear();
    sessionStorage.clear();
    delete api.defaults.headers.common['Authorization'];
  });

  afterEach(() => {
    mock.restore();
  });

  describe('login', () => {
    it('posts the identifier and password to /login', async () => {
      mock.onPost('/login').reply((config) => {
        // AuthService builds FormData, but the axios instance forces
        // `Content-Type: application/json`, so it goes over the wire as JSON. Assert the payload
        // that actually reaches the API rather than the object the service happened to build.
        // The API takes `identifier` (email or phone), not `email`.
        const body = JSON.parse(config.data as string);
        expect(body.identifier).toBe('cashier@example.test');
        expect(body.password).toBe('secret');
        return [200, { token: 'tok', user: USER }];
      });

      await expect(login('cashier@example.test', 'secret')).resolves.toEqual({
        token: 'tok',
        user: USER,
      });
    });

    it('propagates a rejected login', async () => {
      mock.onPost('/login').reply(401, { message: 'Invalid credentials' });

      await expect(login('cashier@example.test', 'wrong')).rejects.toBeTruthy();
    });
  });

  describe('token storage', () => {
    it('stores in sessionStorage by default and sets the auth header', async () => {
      await storeToken('tok');

      expect(sessionStorage.getItem('token')).toBe('tok');
      expect(localStorage.getItem('token')).toBeNull();
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer tok');
    });

    it('stores in localStorage when asked to persist', async () => {
      await storeToken('tok', true);

      expect(localStorage.getItem('token')).toBe('tok');
      expect(sessionStorage.getItem('token')).toBeNull();
    });

    it('prefers the persistent token when both exist', async () => {
      sessionStorage.setItem('token', 'session-tok');
      localStorage.setItem('token', 'local-tok');

      await expect(getToken()).resolves.toBe('local-tok');
    });

    it('returns null when nothing is stored', async () => {
      await expect(getToken()).resolves.toBeNull();
    });
  });

  describe('user storage', () => {
    it('round-trips the user through session storage', () => {
      storeUser(USER);

      expect(getUser()).toEqual(USER);
    });

    it('prefers the session user over the persisted one', () => {
      storeUser({ ...USER, name: 'Persisted' } as never, true);
      storeUser({ ...USER, name: 'Session' } as never);

      expect(getUser().name).toBe('Session');
    });

    it('returns null when no user is stored', () => {
      expect(getUser()).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears both stores and the auth header', async () => {
      mock.onPost('/logout').reply(200, {});
      await storeToken('tok', true);
      storeUser(USER, true);

      await logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('still clears local state when the server call fails', async () => {
      mock.onPost('/logout').reply(500);
      await storeToken('tok', true);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await logout();

      // A cashier must not stay logged in locally because the network was down.
      expect(localStorage.getItem('token')).toBeNull();
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('does not call the server when there is no token', async () => {
      let called = false;
      mock.onPost('/logout').reply(() => {
        called = true;
        return [200, {}];
      });

      await logout();

      expect(called).toBe(false);
    });
  });
});
