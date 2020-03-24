import React from 'react';
import { render } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import Auth0 from './auth0';
import { AuthContextProvider } from './hooks';

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

const mockAuth0 = Auth0;

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

describe('Auth0ContextProvider', () => {
  let wrapper;
  beforeEach(() => {
    mockAuth0.mockClear();
    wrapper = renderAuthContextProvider();
  });

  test('initializes an Auth0 instance', () => {
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
    expect(wrapper.getByText('Hello'));
  });
});

describe('value', () => {
  beforeEach(() => {
    mockAuth0.mockClear();
  });

  describe('getCurrentToken()', () => {
    const mockRenewSession = jest.fn();

    const mockAuth0Implementation = ({ hasExpiredToken, accessToken }) => {
      mockAuth0.mockImplementationOnce(() => ({
        hasExpiredToken,
        accessToken,
        renewSession: mockRenewSession,
      }));
    };

    beforeEach(() => {
      mockRenewSession.mockClear();
    });

    describe('without a token', () => {
      test('returns undefined without calling renewSession', async () => {
        expect.assertions(2);

        const hasExpiredToken = () => false;
        mockAuth0Implementation({ hasExpiredToken });

        const result = renderAuthContextProviderHooks();
        await expect(result.current.getCurrentToken()).resolves.toBe(undefined);
        expect(mockRenewSession).not.toHaveBeenCalled();
      });
    });

    describe('with a valid token', () => {
      test('returns the token without calling renewSession', async () => {
        expect.assertions(2);

        const accessToken = '456';
        const hasExpiredToken = () => false;
        mockAuth0Implementation({ hasExpiredToken, accessToken });

        const result = renderAuthContextProviderHooks();
        await expect(result.current.getCurrentToken()).resolves.toBe('456');
        expect(mockRenewSession).not.toHaveBeenCalled();
      });
    });

    describe('with expired token', () => {
      test('returns a new token after calling renewSession', async () => {
        expect.assertions(2);

        const accessToken = '456';
        const hasExpiredToken = () => true;
        mockAuth0Implementation({ hasExpiredToken, accessToken });

        const result = renderAuthContextProviderHooks();
        await expect(result.current.getCurrentToken()).resolves.toBe('456');
        expect(mockRenewSession).toHaveBeenCalled();
      });
    });

  });
});
