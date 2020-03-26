import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthContext } from 'Auth';

export default () => {
  const history = useHistory();
  const { handleAuthCallback } = useAuthContext();
  useEffect(
    () => {
      const authCallback = async () => {
        try {
          await handleAuthCallback();
          history.push('/');
        } catch (e) {
          console.log(e);
        }
      };
      authCallback();
    },
    // eslint-disable-next-line
    []
  );
  return <div data-testid="callback-component">Loading...</div>;
};
