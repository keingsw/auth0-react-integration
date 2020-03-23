import Auth0 from './auth0';
import { WebAuth } from 'auth0-js';

jest.mock('auth0-js');

describe('Auth0', () => {
  let auth0;

  const audience = 'http://localhost:3000/api';
  const domain = 'ollieorder-staging.auth0.com';
  const clientId = '123';
  const redirectUri = 'http://localhost:3000/auth/callback';
  const scope = 'openid profile email';

  const mockWebAuth = WebAuth;

  const initializeAuth0 = () => {
    auth0 = new Auth0({ audience, domain, clientId, redirectUri, scope });
  };

  beforeEach(() => {
    mockWebAuth.mockClear();

    console.error = jest.fn();
    console.debug = jest.fn();
    console.warn = jest.fn();

    initializeAuth0();
  });

  describe('constructor', () => {
    test('initializes WebAuth with the right params', () => {
      expect(mockWebAuth).toHaveBeenCalledWith({
        audience,
        domain,
        clientId: clientId,
        redirectUri: redirectUri,
        scope: scope,
        responseType: 'token id_token',
      });
    });
  });

  describe('login()', () => {
    test('logs a debug message', () => {
      auth0.login();
      expect(console.debug).toHaveBeenCalledWith('[Auth0] login');
    });

    test('initiates authrozation redirect with auth0', () => {
      auth0.login();
      expect(mockWebAuth.mock.instances[0].authorize).toHaveBeenCalledWith();
    });
  });
});
