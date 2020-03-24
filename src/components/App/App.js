import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { AuthContextProvider } from 'Auth';
import HomePage from 'components/HomePage';
import Callback from 'components/Callback';

export default () => {
  const {
    REACT_APP_AUTH0_DOMAIN,
    REACT_APP_AUTH0_API_AUDIENCE,
    REACT_APP_AUTH0_CLIENT_ID,
    REACT_APP_AUTH0_REDIRECT_URI,
    REACT_APP_AUTH0_LOGOUT_REDIRECT_URI,
  } = process.env;

  return (
    <AuthContextProvider
      domain={REACT_APP_AUTH0_DOMAIN}
      audience={REACT_APP_AUTH0_API_AUDIENCE}
      clientId={REACT_APP_AUTH0_CLIENT_ID}
      redirectUri={REACT_APP_AUTH0_REDIRECT_URI}
      scope="openid profile email"
      logoutRedirectUri={REACT_APP_AUTH0_LOGOUT_REDIRECT_URI}
    >
      <div data-testid="app-component">
        <Switch>
          <Route path="/callback" component={Callback} />
          <Route exact path="/" component={HomePage} />
        </Switch>
      </div>
    </AuthContextProvider>
  );
};
