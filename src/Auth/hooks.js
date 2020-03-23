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

  const getCurrentToken = () => {
    return auth.accessToken;
  };

  return (
    <AuthContext.Provider
      values={{
        getCurrentToken: getCurrentToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuthContext = () => useContext(AuthContext);
