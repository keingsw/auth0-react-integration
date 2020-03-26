import React from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import Auth0 from './auth0';
import { AuthContextProvider, useAuthContext } from './hooks';

jest.mock('./auth0');

const audience = 'http://localhost:3000/api';
const domain = 'keingsw.auth0.com';
const clientId = '123';
const redirectUri = 'http://localhost:3000/auth/callback';
const scope = 'openid profile email';
const logoutRedirectUri = 'http://localhost:3000/';

const config = {
  domain,
  audience,
  clientId,
  redirectUri,
  logoutRedirectUri,
  scope,
};

const renderAuthContextProvider = () => {
  return render(<AuthContextProvider {...config}>Hello</AuthContextProvider>);
};

const renderAuthContextProviderHooks = () => {
  const wrapper = ({ children }) =>
    <AuthContextProvider {...config}>
      {children}
    </AuthContextProvider>;
  const { result } = renderHook(() => useAuthContext(), { wrapper });
  return result;
};

const setUp = () => {
  const mockAuth0 = Auth0;
  mockAuth0.mockClear();

  const wrapper = render(
    <AuthContextProvider {...config}>Hello</AuthContextProvider>
  );
  return { ...wrapper, mockAuth0 };
};

const setUpHooks = mockAuth0Implementation => {
  const mockAuth0 = Auth0;
  mockAuth0.mockClear();
  if (!!mockAuth0Implementation) {
    mockAuth0.mockImplementationOnce(() => ({
      ...mockAuth0Implementation,
    }));
  }

  const wrapper = ({ children }) =>
    <AuthContextProvider {...config}>
      {children}
    </AuthContextProvider>;
  const { result } = renderHook(() => useAuthContext(), { wrapper });

  return { ...result, mockAuth0 };
};

describe('Auth0ContextProvider', () => {
  test('initializes an Auth0 instance', () => {
    const { mockAuth0 } = setUp();
    expect(mockAuth0).toHaveBeenCalledWith({
      audience,
      domain,
      clientId,
      redirectUri,
      logoutRedirectUri,
      scope,
    });
  });

  test('renders with children', () => {
    const { getByText } = setUp();
    expect(getByText('Hello'));
  });
});

describe('value', () => {
  describe('getCurrentToken()', () => {
    const mockRenewSession = jest.fn();
    const getMockAuth0Implementation = ({
      hasExpiredTokenResult,
      accessToken,
    }) => ({
      hasExpiredToken: jest.fn().mockReturnValue(hasExpiredTokenResult),
      accessToken,
      getAccessToken: jest.fn(() => (accessToken ? accessToken : null)),
      renewSession: mockRenewSession,
    });

    describe('without a token', () => {
      test('returns null without calling renewSession', async () => {
        expect.assertions(2);

        const hasExpiredTokenResult = false;
        const mockAuth0Implementation = getMockAuth0Implementation({
          hasExpiredTokenResult,
        });
        const { current } = setUpHooks(mockAuth0Implementation);
        await expect(current.getCurrentToken()).resolves.toBe(null);
        expect(mockRenewSession).not.toHaveBeenCalled();
      });
    });

    describe('with a valid token', () => {
      test('returns the token without calling renewSession', async () => {
        expect.assertions(2);

        const accessToken = '456';
        const hasExpiredTokenResult = false;
        const mockAuth0Implementation = getMockAuth0Implementation({
          hasExpiredTokenResult,
          accessToken,
        });

        const { current } = setUpHooks(mockAuth0Implementation);
        await expect(current.getCurrentToken()).resolves.toBe('456');
        expect(mockRenewSession).not.toHaveBeenCalled();
      });
    });

    describe('with expired token', () => {
      test('returns a new token after calling renewSession', async () => {
        expect.assertions(2);

        const accessToken = '456';
        const hasExpiredTokenResult = true;
        const mockAuth0Implementation = getMockAuth0Implementation({
          hasExpiredTokenResult,
          accessToken,
        });

        const { current } = setUpHooks(mockAuth0Implementation);
        await expect(current.getCurrentToken()).resolves.toBe('456');
        expect(mockRenewSession).toHaveBeenCalled();
      });
    });
  });

  describe('login()', () => {
    test('performs auth login', async () => {
      const mockLogin = jest.fn();
      const { current } = setUpHooks({
        login: mockLogin,
      });
      await current.login();
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  describe('logout()', () => {
    test('performs auth login', async () => {
      const mockLogout = jest.fn();
      const { current } = setUpHooks({
        logout: mockLogout,
      });
      await current.logout();
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('handleAuthentication()', () => {
    test('performs handleAuthentication', async () => {
      const mockHandleAuthentication = jest.fn();
      const { current } = setUpHooks({
        handleAuthentication: mockHandleAuthentication,
        userInfo: { user_id: 'xyz' },
      });

      await current.handleAuthCallback();
      expect(mockHandleAuthentication).toHaveBeenCalled();
    });
  });

  describe('getCurrentUserId()', () => {
    const getMockAuth0Implementation = ({ userInfo, hasValidTokenResult }) => ({
      userInfo,
      getUserId: jest.fn(
        () => (!!userInfo && !!userInfo.sub ? userInfo.sub : null)
      ),
      hasValidToken: jest.fn().mockReturnValue(hasValidTokenResult),
    });

    describe('without a valid token', () => {
      test('returns null', async () => {
        expect.assertions(1);

        const hasValidTokenResult = false;
        const mockAuth0Implementation = getMockAuth0Implementation({
          hasValidTokenResult,
        });

        const { current } = setUpHooks(mockAuth0Implementation);
        await expect(current.getCurrentUserId()).toBe(null);
      });
    });

    describe('with a valid token', () => {
      test('returns the token without calling renewSession', async () => {
        expect.assertions(1);

        const userInfo = { sub: '456' };
        const hasValidTokenResult = true;
        const mockAuth0Implementation = getMockAuth0Implementation({
          hasValidTokenResult,
          userInfo,
        });

        const { current } = setUpHooks(mockAuth0Implementation);
        await expect(current.getCurrentUserId()).toBe('456');
      });
    });
  });
});
