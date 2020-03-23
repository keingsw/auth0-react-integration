import React from 'react';
import { AuthContextProvider } from 'Auth';

function App() {
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
      <div>app</div>
    </AuthContextProvider>
  );
}

export default App;
