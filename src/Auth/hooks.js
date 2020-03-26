import React, { createContext, useContext, useRef } from 'react';
import Auth0 from './auth0';

export const AuthContext = createContext();
export const AuthContextProvider = ({ children, ...props }) => {
  const {
    domain,
    audience,
    clientId,
    redirectUri,
    scope,
    logoutRedirectUri,
  } = props;

  const auth = useRef(
    new Auth0({
      domain,
      audience,
      clientId,
      redirectUri,
      scope,
      logoutRedirectUri,
    })
  ).current;

  const getCurrentToken = async () => {
    if (auth.hasExpiredToken()) {
      await auth.renewSession();
      return auth.getAccessToken();
    }

    return auth.getAccessToken();
  };

  const getCurrentUserId = () => {
    return auth.hasValidToken() ? auth.getUserId() : null;
  };

  const login = async () => {
    auth.login();
  };

  const logout = async onSuccess => {
    auth.logout(onSuccess);
  };

  const handleAuthCallback = async () => {
    return await auth.handleAuthentication();
  };

  return (
    <AuthContext.Provider
      value={{
        getCurrentToken: getCurrentToken,
        getCurrentUserId: getCurrentUserId,
        login: login,
        logout: logout,
        handleAuthCallback: handleAuthCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuthContext = () => useContext(AuthContext);
