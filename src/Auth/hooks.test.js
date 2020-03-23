import React from 'react';
import { render } from '@testing-library/react';
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

describe('Auth0ContextProvider', () => {
  let utils;
  beforeEach(() => {
    mockAuth0.mockClear();
    utils = render(
      <AuthContextProvider {...config}>Hello</AuthContextProvider>
    );
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
    utils.getByText('Hello');
  });
});
