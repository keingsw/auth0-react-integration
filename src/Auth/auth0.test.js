import Auth0 from './auth0';
import { WebAuth } from 'auth0-js';

jest.mock('auth0-js');

describe('Auth0', () => {
  let auth0;

  const audience = 'http://localhost:3000/api';
  const domain = 'keingsw.auth0.com';
  const clientId = '123';
  const redirectUri = 'http://localhost:3000/auth/callback';
  const scope = 'openid profile email';
  const logoutRedirectUri = 'http://localhost:3000/';

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
    auth0 = new Auth0({
      audience,
      domain,
      clientId,
      redirectUri,
      scope,
      logoutRedirectUri,
    });
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
        clientID: clientId,
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

  describe('renewSession()', () => {
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
      const mockLogout = jest.fn();
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
        auth0.logout = mockLogout;
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

      test('calls logout', async () => {
        expect.assertions(1);
        try {
          await auth0.renewSession();
        } catch (error) {
          expect(mockLogout).toHaveBeenCalledWith();
        }
      });
    });
  });

  describe('logout()', () => {
    const logout = jest.fn();
    const mockLogoutImplementation = authError => {
      return (o, cb) => cb(authError);
    };

    beforeEach(() => {
      mockWebAuth.mockImplementationOnce(() => {
        return {
          parseHash: mockParseHashImplementation(
            successfulAuthError,
            successfulAuthResult
          ),
          logout,
        };
      });

      initializeAuth0();
      auth0.handleAuthentication();
    });

    test('performs a log-out from auth0 providing redirect URI', () => {
      auth0.logout();
      expect(logout).toHaveBeenCalledWith(
        { returnTo: logoutRedirectUri },
        expect.any(Function)
      );
    });

    test('resets accessToken', () => {
      expect(auth0.accessToken).toBe('abc');
      auth0.logout();
      expect(auth0.accessToken).toBe(undefined);
    });

    test('resets expiresAt', () => {
      expect(auth0.expiresAt).toBeTruthy();
      auth0.logout();
      expect(auth0.expiresAt).toBe(undefined);
    });

    test('resets userInfo', () => {
      expect(auth0.userInfo).toEqual({
        email: 'test@example.com',
        email_verified: true,
      });
      auth0.logout();
      expect(auth0.userInfo).toBe(undefined);
    });

    describe('on success', () => {
      beforeEach(() => {
        mockWebAuth.mockImplementationOnce(() => {
          return {
            logout: mockLogoutImplementation(),
          };
        });
        initializeAuth0();
      });

      test('calls a success callback when provided', () => {
        const onSuccess = jest.fn();
        auth0.logout(onSuccess);
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    describe('on error', () => {
      beforeEach(() => {
        mockWebAuth.mockImplementationOnce(() => {
          return {
            logout: mockLogoutImplementation(failedAuthError),
          };
        });
        initializeAuth0();
      });

      test('logs an error', () => {
        auth0.logout();
        expect(console.error).toHaveBeenCalledWith(
          '[Auth0] error logging out',
          failedAuthError
        );
      });

      test('does not call a success callback when provided', () => {
        const onSuccess = jest.fn();
        auth0.logout(onSuccess);
        expect(onSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('helpers', () => {
    let mutableAuth0;

    beforeEach(() => {
      mutableAuth0 = auth0;
    });

    describe('isTokenExpired()', () => {
      test('returns true when expiryAt is in the past', () => {
        mutableAuth0.expiresAt = Date.now() - 24 * 60 * 60 * 1000;
        expect(mutableAuth0.isTokenExpired()).toBe(true);
      });
      test('returns false when expiryAt is in the future', () => {
        mutableAuth0.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        expect(mutableAuth0.isTokenExpired()).toBe(false);
      });
    });
    describe('hasValidToken()', () => {
      test('returns false if there is no token', () => {
        mutableAuth0.accessToken = undefined;
        expect(mutableAuth0.hasValidToken()).toBe(false);
      });

      test('returns false if there is a token but it is expired', () => {
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() - 24 * 60 * 60 * 1000;
        expect(mutableAuth0.hasValidToken()).toBe(false);
      });

      test('return true if there is a valid token', () => {
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        expect(mutableAuth0.hasValidToken()).toBe(true);
      });
    });
    describe('hasExpiredToken()', () => {
      test('returns false if there is no token', () => {
        mutableAuth0.accessToken = undefined;
        expect(mutableAuth0.hasValidToken()).toBe(false);
      });
      test('return false if there is a valid token', () => {
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        expect(mutableAuth0.hasValidToken()).toBe(true);
      });
      test('returns true if there is a token and it is expired', () => {
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() - 24 * 60 * 60 * 1000;
        expect(mutableAuth0.hasValidToken()).toBe(false);
      });
    });
    describe('isAuthenticated()', () => {
      test('returns false if there is no token', () => {
        mutableAuth0.accessToken = undefined;
        expect(mutableAuth0.isAuthenticated()).toBe(false);
      });

      test('returns false if there is a token but it is expired', () => {
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() - 24 * 60 * 60 * 1000;
        expect(mutableAuth0.isAuthenticated()).toBe(false);
      });

      test('returns false if there is a valid token but no userInfo', () => {
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        mutableAuth0.userInfo = undefined;
        expect(mutableAuth0.isAuthenticated()).toBe(false);
      });

      test('return strue if there is a valid token and userInfo', () => {
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        mutableAuth0.userInfo = {
          email: 'test@example.com',
          email_verified: true,
        };
        expect(mutableAuth0.isAuthenticated()).toBe(true);
      });
    });
  });
});
