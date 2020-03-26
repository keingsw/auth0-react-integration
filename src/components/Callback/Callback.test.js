import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { AuthContext } from 'Auth';
import Callback from './Callback';

const WrappedCallback = ({ handleAuthCallback }) => {
  return (
    <AuthContext.Provider
      value={{
        handleAuthCallback,
      }}
    >
      <Callback />
    </AuthContext.Provider>
  );
};

const setUp = mockHandleAuthCallback => {
  let wrapper;
  const history = createMemoryHistory();
  history.push('/callback');

  act(() => {
    wrapper = render(
      <Router history={history}>
        <WrappedCallback handleAuthCallback={mockHandleAuthCallback} />
      </Router>
    );
  });

  return { ...wrapper, history };
};

const setUpSuccessfulCase = () => {
  const mockHandleAuthCallback = jest.fn().mockResolvedValue({
    accessToken: 'abc',
    idToken: 'def',
    idTokenPayload: {
      email: 'test@example.com',
      email_verified: true,
    },
    expiresIn: 24 * 60 * 60,
  });
  return {
    ...setUp(mockHandleAuthCallback),
    mockHandleAuthCallback: mockHandleAuthCallback,
  };
};

const setUpFailedCase = () => {
  const mockHandleAuthCallback = jest
    .fn()
    .mockRejectedValue({ error: 'something went wrong' });
  return {
    ...setUp(mockHandleAuthCallback),
    mockHandleAuthCallback: mockHandleAuthCallback,
  };
};

describe('Callback component', () => {
  test('renders without crash', () => {
    const wrapper = setUpSuccessfulCase();
    expect(wrapper.getByTestId('callback-component')).toBeInTheDocument();
  });

  test('redirects to homepage after successfully handled', () => {
    const { mockHandleAuthCallback, history } = setUpSuccessfulCase();
    console.error = jest.fn();

    expect(history.location.pathname).toBe('/callback');
    waitFor(() => {
      expect(mockHandleAuthCallback).resolves.toBeTruethy();
      expect(console.error).not.toHaveBeenCalled();
      expect(history.location.pathname).toBe('/');
    });
  });

  test('logs an error and does not redirect when failed to parse the token', () => {
    const { mockHandleAuthCallback, history } = setUpFailedCase();
    console.error = jest.fn();

    expect(history.location.pathname).toBe('/callback');
    waitFor(() => {
      expect(mockHandleAuthCallback).rejects.toEqual({
        error: 'something went wrong',
      });
      expect(console.error).toHaveBeenCalled();
      expect(history.location.pathname).toBe('/callback');
    });
  });
});
