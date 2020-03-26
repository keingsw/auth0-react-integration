import React from 'react';
import {
  render,
  fireEvent,
  act,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { AuthContext } from 'Auth';
import HomePage from './HomePage';

describe('HomePage', () => {
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();
  const mockGetCurrentToken = jest.fn().mockResolvedValue();
  const mockGetCurrentUserId = jest.fn().mockReturnValue();

  const WrappedHomePage = ({
    login = mockLogin,
    logout = mockLogout,
    getCurrentToken = mockGetCurrentToken,
    getCurrentUserId = mockGetCurrentUserId,
  }) => {
    return (
      <AuthContext.Provider
        value={{
          login,
          logout,
          getCurrentToken,
          getCurrentUserId,
        }}
      >
        <HomePage />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    mockLogin.mockClear();
    mockLogout.mockClear();
    mockGetCurrentToken.mockClear();
    mockGetCurrentUserId.mockClear();
  });

  test('renders without crash', async () => {
    let wrapper;
    act(() => {
      wrapper = render(<WrappedHomePage />);
    });
    await waitFor(() =>
      expect(wrapper.getByTestId('homepage-component')).toBeInTheDocument()
    );
  });

  describe('when there is no valid token', () => {
    let wrapper;
    beforeEach(() => {
      const mockGetCurrentToken = jest.fn().mockResolvedValue(null);
      act(() => {
        wrapper = render(
          <WrappedHomePage getCurrentToken={mockGetCurrentToken} />
        );
      });
    });

    test('renders login button', async () => {
      await waitFor(() => expect(wrapper.getByText(/login/i)).toBeTruthy());
    });
    test('does not render logout button', async () => {
      await waitFor(() => expect(wrapper.queryByText(/logout/i)).toBeNull());
    });
    test('does not render user info', async () => {
      await waitFor(() =>
        expect(wrapper.queryByTestId('user-info-component')).toBeNull()
      );
    });
  });

  describe('when there is a valid token', () => {
    let wrapper;
    beforeEach(async () => {
      const mockGetCurrentToken = jest.fn().mockResolvedValue('abc');
      const mockGetCurrentUserId = jest.fn().mockReturnValue('456');
      await act(async () => {
        wrapper = await render(
          <WrappedHomePage
            getCurrentToken={mockGetCurrentToken}
            getCurrentUserId={mockGetCurrentUserId}
          />
        );
      });
    });

    test('renders logout button', async () => {
      await waitFor(() => expect(wrapper.getByText(/logout/i)).toBeTruthy());
    });
    test('does not render login button', async () => {
      await waitFor(() => expect(wrapper.queryByText(/login/i)).toBeNull());
    });
    test('renders user info', async () => {
      const userInfoComponent = wrapper.getByTestId('user-info-component');
      await waitFor(() => {
        expect(userInfoComponent).toBeTruthy();
        expect(userInfoComponent.textContent).toBe('user_id: 456');
      });
    });
  });

  describe('login button', () => {
    let wrapper;
    beforeEach(() => {
      const mockGetCurrentToken = jest.fn().mockResolvedValue(null);
      act(() => {
        wrapper = render(
          <WrappedHomePage getCurrentToken={mockGetCurrentToken} />
        );
      });
    });

    test('calls login() from AuthContext', () => {
      const loginButton = wrapper.getByText(/login/i);
      fireEvent.click(loginButton);
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  describe('logout button', () => {
    let wrapper;
    beforeEach(async () => {
      const mockGetCurrentToken = jest.fn().mockResolvedValue('abc');
      await act(async () => {
        wrapper = render(
          <WrappedHomePage getCurrentToken={mockGetCurrentToken} />
        );
      });
    });

    test('calls logout() from AuthContext', () => {
      const logoutButton = wrapper.getByText(/logout/i);
      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
