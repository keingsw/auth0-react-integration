import Auth0 from './auth0';
import { WebAuth } from 'auth0-js';

jest.mock('auth0-js');

describe('Auth0', () => {
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

  const initializeAuth0 = () => {
    return new Auth0({
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

  const setUp = (mockWebAuth = WebAuth) => {
    mockWebAuth.mockClear();

    const auth0 = initializeAuth0();

    console.error = jest.fn();
    console.debug = jest.fn();
    console.warn = jest.fn();

    return { mockWebAuth, auth0 };
  };

  describe('constructor', () => {
    test('initializes WebAuth with the right params', () => {
      const { mockWebAuth } = setUp();
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
      const { auth0 } = setUp();
      auth0.login();
      expect(console.debug).toHaveBeenCalledWith('[Auth0] login');
    });

    test('initiates authrozation redirect with auth0', () => {
      const { auth0, mockWebAuth } = setUp();
      auth0.login();
      expect(mockWebAuth.mock.instances[0].authorize).toHaveBeenCalledWith();
    });
  });

  describe('handleAuthentication()', () => {
    test('logs a debug message', () => {
      const { auth0 } = setUp();

      auth0.handleAuthentication();
      expect(console.debug).toHaveBeenCalledWith(
        '[Auth0] received auth callback'
      );
    });
    test('parses the hash', () => {
      const { auth0, mockWebAuth } = setUp();
      auth0.handleAuthentication();
      expect(mockWebAuth.mock.instances[0].parseHash).toHaveBeenCalled();
    });

    describe('on success', () => {
      const setUpSuccessfulLoginCase = () => {
        const mockWebAuth = WebAuth;
        mockWebAuth.mockImplementationOnce(() => {
          return {
            parseHash: mockParseHashImplementation(
              successfulAuthError,
              successfulAuthResult
            ),
          };
        });

        return { ...setUp(mockWebAuth) };
      };

      test('logs a debug message', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulLoginCase();
        await auth0.handleAuthentication();
        expect(console.debug).toHaveBeenCalledWith(
          '[Auth0] logged in successfully'
        );
      });

      test('sets accessToken', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulLoginCase();
        await auth0.handleAuthentication();
        expect(auth0.accessToken).toBe('abc');
      });

      test('calculates and sets expiresAt', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulLoginCase();
        await auth0.handleAuthentication();
        expect(auth0.expiresAt).toBeTruthy();
      });

      test('logs a debug message with the token expiry time', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulLoginCase();
        await auth0.handleAuthentication();
        expect(console.debug).toHaveBeenCalledWith(
          '[Auth0] token expires in 86400 seconds'
        );
      });

      test('sets userInfo', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulLoginCase();
        await auth0.handleAuthentication();
        expect(auth0.userInfo).toEqual({
          email: 'test@example.com',
          email_verified: true,
        });
      });

      test('resolves and provides the auth result', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulLoginCase();
        await expect(auth0.handleAuthentication()).resolves.toBe(
          successfulAuthResult
        );
      });
    });

    describe('on error', () => {
      const setUpFailedLoginCase = () => {
        const mockWebAuth = WebAuth;
        mockWebAuth.mockImplementationOnce(() => {
          return {
            parseHash: mockParseHashImplementation(
              failedAuthError,
              failedAuthResult
            ),
          };
        });

        return { ...setUp(mockWebAuth) };
      };

      test('rejects and provides the auth error', async () => {
        expect.assertions(1);
        const { auth0 } = setUpFailedLoginCase();
        await expect(auth0.handleAuthentication()).rejects.toBe(
          failedAuthError
        );
      });

      test('logs an error', async () => {
        expect.assertions(1);

        const { auth0 } = setUpFailedLoginCase();
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
      const { auth0, mockWebAuth } = setUp();
      auth0.renewSession();
      expect(mockWebAuth.mock.instances[0].checkSession).toHaveBeenCalled();
    });
    test('logs debug message', () => {
      const { auth0 } = setUp();
      auth0.renewSession();
      expect(console.debug).toHaveBeenCalledWith('[Auth0] renew session');
    });

    describe('on success', () => {
      const setUpSuccessfulRenewSessionCase = () => {
        const mockWebAuth = WebAuth;
        mockWebAuth.mockImplementationOnce(() => {
          return {
            checkSession: mockCheckSessionImplementation(
              successfulAuthError,
              successfulAuthResult
            ),
          };
        });

        return { ...setUp(mockWebAuth) };
      };

      test('logs debug message', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulRenewSessionCase();
        await auth0.renewSession();
        expect(console.debug).toHaveBeenCalledWith(
          '[Auth0] renewed session successfully'
        );
      });

      test('sets accessToken', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulRenewSessionCase();
        await auth0.renewSession();
        expect(auth0.accessToken).toBe('abc');
      });

      test('calculates and sets expiresAt', async () => {
        expect.assertions(2);

        const { auth0 } = setUpSuccessfulRenewSessionCase();
        expect(auth0.expiresAt).toBe(undefined);
        await auth0.renewSession();
        expect(auth0.expiresAt).toBeTruthy();
      });

      test('logs debug message with the token expiry time', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulRenewSessionCase();
        await auth0.renewSession();
        expect(console.debug).toHaveBeenCalledWith(
          '[Auth0] token expires in 86400 seconds'
        );
      });

      test('sets userInfo', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulRenewSessionCase();
        await auth0.renewSession();
        expect(auth0.userInfo).toEqual({
          email: 'test@example.com',
          email_verified: true,
        });
      });

      test('resolves and provides the auth result', async () => {
        expect.assertions(1);

        const { auth0 } = setUpSuccessfulRenewSessionCase();
        await expect(auth0.renewSession()).resolves.toBe(successfulAuthResult);
      });
    });

    describe('on error', () => {
      const mockLogout = jest.fn();
      const setUpFailedRenewSessionCase = () => {
        const mockWebAuth = WebAuth;
        mockWebAuth.mockImplementationOnce(() => {
          return {
            checkSession: mockCheckSessionImplementation(
              failedAuthError,
              failedAuthResult
            ),
          };
        });

        const setUpResult = setUp(mockWebAuth);
        setUpResult.auth0.logout = mockLogout;

        return { ...setUpResult, mockLogout };
      };

      test('rejects adn provides the auth error', async () => {
        expect.assertions(1);

        const { auth0 } = setUpFailedRenewSessionCase();
        await expect(auth0.renewSession()).rejects.toBe(failedAuthError);
      });

      test('logs an error', async () => {
        expect.assertions(1);

        const { auth0 } = setUpFailedRenewSessionCase();
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

        const { auth0, mockLogout } = setUpFailedRenewSessionCase();
        try {
          await auth0.renewSession();
        } catch (error) {
          expect(mockLogout).toHaveBeenCalledWith();
        }
      });
    });
  });

  describe('logout()', () => {
    const mockLogoutImplementation = authError => {
      return (o, cb) => cb(authError);
    };
    const setUpLogoutCase = (mockLogout = jest.fn()) => {
      const mockWebAuth = WebAuth;
      mockWebAuth.mockImplementationOnce(() => {
        return {
          parseHash: mockParseHashImplementation(
            successfulAuthError,
            successfulAuthResult
          ),
          logout: mockLogout,
        };
      });

      const setUpResult = setUp(mockWebAuth);
      setUpResult.auth0.handleAuthentication();

      return { ...setUpResult, mockLogout };
    };

    test('performs a log-out from auth0 providing redirect URI', () => {
      const { auth0, mockLogout } = setUpLogoutCase();
      auth0.logout();
      expect(mockLogout).toHaveBeenCalledWith(
        { returnTo: logoutRedirectUri },
        expect.any(Function)
      );
    });

    test('resets accessToken', () => {
      const { auth0 } = setUpLogoutCase();
      expect(auth0.accessToken).toBe('abc');
      auth0.logout();
      expect(auth0.accessToken).toBe(undefined);
    });

    test('resets expiresAt', () => {
      const { auth0 } = setUpLogoutCase();
      expect(auth0.expiresAt).toBeTruthy();
      auth0.logout();
      expect(auth0.expiresAt).toBe(undefined);
    });

    test('resets userInfo', () => {
      const { auth0 } = setUpLogoutCase();
      expect(auth0.userInfo).toEqual({
        email: 'test@example.com',
        email_verified: true,
      });
      auth0.logout();
      expect(auth0.userInfo).toBe(undefined);
    });

    describe('on success', () => {
      const setUpSuccessfulLogoutCase = () => {
        const mockLogout = mockLogoutImplementation();
        return { ...setUpLogoutCase(mockLogout) };
      };

      test('calls a success callback when provided', () => {
        const { auth0 } = setUpSuccessfulLogoutCase();
        const onSuccess = jest.fn();
        auth0.logout(onSuccess);
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    describe('on error', () => {
      const setUpFailedLogoutCase = () => {
        const mockLogout = mockLogoutImplementation(failedAuthError);
        return { ...setUpLogoutCase(mockLogout) };
      };

      test('logs an error', () => {
        const { auth0 } = setUpFailedLogoutCase();
        auth0.logout();
        expect(console.error).toHaveBeenCalledWith(
          '[Auth0] error logging out',
          failedAuthError
        );
      });

      test('does not call a success callback when provided', () => {
        const { auth0 } = setUpFailedLogoutCase();
        const onSuccess = jest.fn();
        auth0.logout(onSuccess);
        expect(onSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('helpers', () => {
    const setUpForHelpers = () => {
      const { auth0: mutableAuth0 } = setUp();
      return { mutableAuth0 };
    };

    describe('isTokenExpired()', () => {
      test('returns true when expiryAt is in the past', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.expiresAt = Date.now() - 24 * 60 * 60 * 1000;
        expect(mutableAuth0.isTokenExpired()).toBe(true);
      });
      test('returns false when expiryAt is in the future', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        expect(mutableAuth0.isTokenExpired()).toBe(false);
      });
    });
    describe('hasValidToken()', () => {
      test('returns false if there is no token', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.accessToken = undefined;
        expect(mutableAuth0.hasValidToken()).toBe(false);
      });

      test('returns false if there is a token but it is expired', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() - 24 * 60 * 60 * 1000;
        expect(mutableAuth0.hasValidToken()).toBe(false);
      });

      test('return true if there is a valid token', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        expect(mutableAuth0.hasValidToken()).toBe(true);
      });
    });
    describe('hasExpiredToken()', () => {
      test('returns false if there is no token', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.accessToken = undefined;
        expect(mutableAuth0.hasValidToken()).toBe(false);
      });
      test('return false if there is a valid token', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        expect(mutableAuth0.hasValidToken()).toBe(true);
      });
      test('returns true if there is a token and it is expired', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() - 24 * 60 * 60 * 1000;
        expect(mutableAuth0.hasValidToken()).toBe(false);
      });
    });
    describe('isAuthenticated()', () => {
      test('returns false if there is no token', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.accessToken = undefined;
        expect(mutableAuth0.isAuthenticated()).toBe(false);
      });

      test('returns false if there is a token but it is expired', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() - 24 * 60 * 60 * 1000;
        expect(mutableAuth0.isAuthenticated()).toBe(false);
      });

      test('returns false if there is a valid token but no userInfo', () => {
        const { mutableAuth0 } = setUpForHelpers();
        mutableAuth0.accessToken = '123';
        mutableAuth0.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        mutableAuth0.userInfo = undefined;
        expect(mutableAuth0.isAuthenticated()).toBe(false);
      });

      test('return strue if there is a valid token and userInfo', () => {
        const { mutableAuth0 } = setUpForHelpers();
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

  describe('accessors', () => {
    const setUpForAccessors = () => {
      const { auth0: mutableAuth0 } = setUp();
      return { mutableAuth0 };
    };
    describe('getAccessToken()', () => {
      test('returns the accessToken', () => {
        const { mutableAuth0 } = setUpForAccessors();
        mutableAuth0.accessToken = 'abc';
        expect(mutableAuth0.getAccessToken()).toBe('abc');
      });
      test('returns null when there is no accessToken', () => {
        const { mutableAuth0 } = setUpForAccessors();
        mutableAuth0.accessToken = undefined;
        expect(mutableAuth0.getAccessToken()).toBe(null);
      });
    });

    describe('getUserId()', () => {
      test('returns the user_id from userInfo', () => {
        const { mutableAuth0 } = setUpForAccessors();
        mutableAuth0.userInfo = { email: 'test@example.com', sub: 'xyz' };
        expect(mutableAuth0.getUserId()).toBe('xyz');
      });
      test('returns null when there is no userInfo', () => {
        const { mutableAuth0 } = setUpForAccessors();
        mutableAuth0.userInfo = undefined;
        expect(mutableAuth0.getUserId()).toBe(null);
      });
    });

    describe('getPermissions()', () => {
      test('returns the permissions from userInfo', () => {
        const { mutableAuth0 } = setUpForAccessors();
        mutableAuth0.userInfo = {
          email: 'test@example.com',
          user_id: 'xyz',
          permissions: ['get:xxx'],
        };
        expect(mutableAuth0.getPermissions()).toEqual(['get:xxx']);
      });
      test('returns empty array when there is no userInfo', () => {
        const { mutableAuth0 } = setUpForAccessors();
        mutableAuth0.userInfo = {
          email: 'test@example.com',
          user_id: 'xyz',
        };
        expect(mutableAuth0.getPermissions()).toEqual([]);
      });
    });
  });
});
