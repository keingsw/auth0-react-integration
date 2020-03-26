import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { AuthContext } from 'Auth';
import HomePage from './HomePage';

describe('HomePage component', () => {
  const setUp = async (options = {}) => {
    const {
      mockLogin = jest.fn(),
      mockLogout = jest.fn(),
      mockGetCurrentToken = jest.fn().mockResolvedValue(),
      mockGetCurrentUserId = jest.fn().mockReturnValue(),
    } = options;
    let wrapper;
    await act(async () => {
      wrapper = render(
        <WrappedHomePage
          login={mockLogin}
          logout={mockLogout}
          getCurrentToken={mockGetCurrentToken}
          getCurrentUserId={mockGetCurrentUserId}
        />
      );
    });

    return {
      ...wrapper,
      mockLogin,
      mockLogout,
      mockGetCurrentToken,
      mockGetCurrentUserId,
    };
  };

  const setUpNoValidTokenCase = async () => {
    const mockGetCurrentToken = jest.fn().mockResolvedValue(null);
    const reuslt = await setUp({ mockGetCurrentToken });
    return { ...reuslt };
  };

  const setUpValidTokenCase = async () => {
    const mockGetCurrentToken = jest.fn().mockResolvedValue('abc');
    const mockGetCurrentUserId = jest.fn().mockReturnValue('456');
    const result = await setUp({ mockGetCurrentToken, mockGetCurrentUserId });
    return { ...result };
  };

  const WrappedHomePage = ({
    login,
    logout,
    getCurrentToken,
    getCurrentUserId,
  }) => {
    return (
      <AuthContext.Provider
        value={{ login, logout, getCurrentToken, getCurrentUserId }}
      >
        <HomePage />
      </AuthContext.Provider>
    );
  };

  test('renders without crash', async () => {
    const { getByTestId } = await setUp();
    await waitFor(() =>
      expect(getByTestId('homepage-component')).toBeInTheDocument()
    );
  });

  describe('when there is no valid token', () => {
    test('renders login button', async () => {
      const { getByText } = await setUpNoValidTokenCase();
      await waitFor(() => expect(getByText(/login/i)).toBeTruthy());
    });
    test('does not render logout button', async () => {
      const { queryByText } = await setUpNoValidTokenCase();
      await waitFor(() => expect(queryByText(/logout/i)).toBeNull());
    });
    test('does not render user info', async () => {
      const { queryByTestId } = await setUpNoValidTokenCase();
      await waitFor(() =>
        expect(queryByTestId('user-info-component')).toBeNull()
      );
    });
  });

  describe('when there is a valid token', () => {
    test('renders logout button', async () => {
      const { getByText } = await setUpValidTokenCase();
      await waitFor(() => expect(getByText(/logout/i)).toBeTruthy());
    });
    test('does not render login button', async () => {
      const { queryByText } = await setUpValidTokenCase();
      await waitFor(() => expect(queryByText(/login/i)).toBeNull());
    });
    test('renders user info', async () => {
      const { getByTestId } = await setUpValidTokenCase();
      const userInfoComponent = getByTestId('user-info-component');
      await waitFor(() => {
        expect(userInfoComponent).toBeTruthy();
        expect(userInfoComponent.textContent).toBe('user_id: 456');
      });
    });
  });

  describe('login button', () => {
    test('calls login() from AuthContext', async () => {
      const { getByText, mockLogin } = await setUpNoValidTokenCase();
      const loginButton = getByText(/login/i);
      act(() => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('logout button', () => {
    test('calls logout() from AuthContext', async () => {
      const { getByText, mockLogout } = await setUpValidTokenCase();
      const logoutButton = getByText(/logout/i);
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });
});
