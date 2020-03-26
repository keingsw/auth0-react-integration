import React, { useState, useEffect } from 'react';
import { useAuthContext } from 'Auth';
export default () => {
  const { getCurrentToken, login, logout, getCurrentUserId } = useAuthContext();
  const [currentToken, setCurrentToken] = useState(null);

  useEffect(
    () => {
      const getToken = async () => {
        const token = await getCurrentToken();
        setCurrentToken(token);
      };
      getToken();
    },
    // eslint-disable-next-line
    []
  );

  return (
    <div data-testid="homepage-component">
      {currentToken
        ? <React.Fragment>
            <button onClick={logout}>Logout</button>
            <div data-testid="user-info-component">
              user_id: {getCurrentUserId()}
            </div>
          </React.Fragment>
        : <button onClick={login}>Login</button>}
    </div>
  );
};
