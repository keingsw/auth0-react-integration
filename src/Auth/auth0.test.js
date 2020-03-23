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

  const successfulAuthError = null;
  const successfulAuthResult = {
    accessToken: 'abc',
    idToken: 'def',
    idTokenPayload: {
      email: 'test@example.com',
      email_verified: true,
    },
    expiresIn: 24 * 60 * 60,
  };

  const failedAuthError = { error: 'Something went wrong' };
  const failedAuthResult = {};

  const mockWebAuth = WebAuth;

  const initializeAuth0 = () => {
    auth0 = new Auth0({ audience, domain, clientId, redirectUri, scope });
  };

  const mockParseHashImplementation = (error, result) => {
    return cb => {
      cb(error, result);
    };
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

  describe('handleAuthentication()', () => {
    test('logs a debug message', () => {
      auth0.handleAuthentication();
      expect(console.debug).toHaveBeenCalledWith(
        '[Auth0] received auth callback'
      );
    });
    test('parses the hash', () => {
      auth0.handleAuthentication();
      expect(mockWebAuth.mock.instances[0].parseHash).toHaveBeenCalled();
    });

    describe('on success', () => {
      beforeEach(() => {
        mockWebAuth.mockImplementationOnce(() => {
          return {
            parseHash: mockParseHashImplementation(
              successfulAuthError,
              successfulAuthResult
            ),
          };
        });
        initializeAuth0();
      });

      test('logs a debug message', async () => {
        expect.assertions(1);
        await auth0.handleAuthentication();
        expect(console.debug).toHaveBeenCalledWith(
          '[Auth0] logged in successfully'
        );
      });

      test('sets accessToken', async () => {
        expect.assertions(1);
        await auth0.handleAuthentication();
        expect(auth0.accessToken).toBe('abc');
      });

      test('calculates and sets expiresAt', async () => {
        expect.assertions(1);
        await auth0.handleAuthentication();
        expect(auth0.expiresAt).toBeTruthy();
      });

      test('logs a debug message with the token expiry time', async () => {
        expect.assertions(1);
        await auth0.handleAuthentication();
        expect(console.debug).toHaveBeenCalledWith(
          '[Auth0] token expires in 86400 seconds'
        );
      });

      test('sets userInfo', async () => {
        expect.assertions(1);
        await auth0.handleAuthentication();
        expect(auth0.userInfo).toEqual({
          email: 'test@example.com',
          email_verified: true,
        });
      });

      test('resolves and provides the auth result', async () => {
        expect.assertions(1);
        await expect(auth0.handleAuthentication()).resolves.toBe(
          successfulAuthResult
        );
      });
    });

    describe('on error', () => {
      beforeEach(() => {
        mockWebAuth.mockImplementationOnce(() => {
          return {
            parseHash: mockParseHashImplementation(
              failedAuthError,
              failedAuthResult
            ),
          };
        });
        initializeAuth0();
      });

      test('rejects and provides the auth error', async () => {
        expect.assertions(1);
        await expect(auth0.handleAuthentication()).rejects.toBe(
          failedAuthError
        );
      });

      test('logs an error', async () => {
        expect.assertions(1);
        try {
          await auth0.handleAuthentication();
        } catch (error) {
          expect(console.error).toHaveBeenCalledWith(
            '[Auth0] error logging in',
            failedAuthError
          );
        }
      });
    });
  });

  describe('renewSession', () => {
    const mockCheckSessionImplementation = (authError, authResult) => {
      return (o, cb) => {
        cb(authError, authResult);
      };
    };

    test('checks the session', () => {
      auth0.renewSession();
      expect(mockWebAuth.mock.instances[0].checkSession).toHaveBeenCalled();
    });
    test('logs debug message', () => {
      auth0.renewSession();
      expect(console.debug).toHaveBeenCalledWith('[Auth0] renew session');
    });

    describe('on success', () => {
      beforeEach(() => {
        mockWebAuth.mockImplementationOnce(() => {
          return {
            checkSession: mockCheckSessionImplementation(
              successfulAuthError,
              successfulAuthResult
            ),
          };
        });
        initializeAuth0();
      });

      test('logs debug message', async () => {
        expect.assertions(1);
        await auth0.renewSession();
        expect(console.debug).toHaveBeenCalledWith(
          '[Auth0] renewed session successfully'
        );
      });

      test('sets accessToken', async () => {
        expect.assertions(1);
        await auth0.renewSession();
        expect(auth0.accessToken).toBe('abc');
      });

      test('calculates and sets expiresAt', async () => {
        expect.assertions(2);
        expect(auth0.expiresAt).toBe(undefined);
        await auth0.renewSession();
        expect(auth0.expiresAt).toBeTruthy();
      });

      test('logs debug message with the token expiry time', async () => {
        expect.assertions(1);
        await auth0.renewSession();
        expect(console.debug).toHaveBeenCalledWith(
          '[Auth0] token expires in 86400 seconds'
        );
      });

      test('sets userInfo', async () => {
        expect.assertions(1);
        await auth0.renewSession();
        expect(auth0.userInfo).toEqual({
          email: 'test@example.com',
          email_verified: true,
        });
      });

      test('resolves and provides the auth result', async () => {
        expect.assertions(1);
        await expect(auth0.renewSession()).resolves.toBe(successfulAuthResult);
      });
    });

    describe('on error', () => {
      beforeEach(() => {
        mockWebAuth.mockImplementationOnce(() => {
          return {
            checkSession: mockCheckSessionImplementation(
              failedAuthError,
              failedAuthResult
            ),
          };
        });
        initializeAuth0();
      });

      test('rejects adn provides the auth error', async () => {
        expect.assertions(1);
        await expect(auth0.renewSession()).rejects.toBe(failedAuthError);
      });

      test('logs an error', async () => {
        expect.assertions(1);
        try {
          await auth0.renewSession();
        } catch (error) {
          expect(console.error).toHaveBeenCalledWith(
            '[Auth0] error renewing session',
            failedAuthError
          );
        }
      });
    });
  });
});
