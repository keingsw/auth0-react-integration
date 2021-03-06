import { WebAuth } from 'auth0-js';

export default class Auth0 {
  constructor({
    domain,
    audience,
    clientId,
    redirectUri,
    scope,
    logoutRedirectUri,
  }) {
    this.webAuth = new WebAuth({
      domain,
      audience,
      clientID: clientId,
      redirectUri,
      scope,
      responseType: 'token id_token',
    });
    this.logoutRedirectUri = logoutRedirectUri;
  }

  login() {
    console.debug('[Auth0] login');
    this.webAuth.authorize();
  }

  handleAuthentication() {
    console.debug('[Auth0] received auth callback');

    return new Promise((resolve, reject) => {
      this.webAuth.parseHash((authError, authResult) => {
        if (authError || !authResult.idToken || !authResult.accessToken) {
          console.error('[Auth0] error logging in', authError);
          reject(authError);
        }

        console.debug('[Auth0] logged in successfully');
        this.setSession(authResult);
        resolve(authResult);
      });
    });
  }

  renewSession() {
    console.debug('[Auth0] renew session');

    return new Promise((resolve, reject) => {
      this.webAuth.checkSession({}, (authError, authResult) => {
        if (authError || !authResult.idToken || !authResult.accessToken) {
          console.error('[Auth0] error renewing session', authError);
          reject(authError);
          this.logout();
        }

        console.debug('[Auth0] renewed session successfully');
        this.setSession(authResult);
        resolve(authResult);
      });
    });
  }

  logout(onSuccess) {
    delete this.accessToken;
    delete this.userInfo;
    delete this.expiresAt;

    this.webAuth.logout(
      {
        returnTo: this.logoutRedirectUri,
      },
      authError => {
        if (authError) {
          console.error('[Auth0] error logging out', authError);
          return;
        }

        if (onSuccess) {
          onSuccess();
        }
      }
    );
  }

  isTokenExpired() {
    return this.expiresAt < new Date().getTime();
  }

  hasValidToken() {
    return !!this.accessToken && !this.isTokenExpired();
  }

  hasExpiredToken() {
    return !!this.accessToken && this.isTokenExpired();
  }

  isAuthenticated() {
    return this.hasValidToken() && !!this.userInfo;
  }

  setSession({ accessToken, idTokenPayload, expiresIn }) {
    console.debug(`[Auth0] token expires in ${expiresIn} seconds`);
    this.accessToken = accessToken;
    this.userInfo = idTokenPayload;
    this.expiresAt = expiresIn * 1000 + new Date().getTime();
  }

  getAccessToken() {
    return !!this.accessToken ? this.accessToken : null;
  }

  getUserId() {
    return !!this.userInfo && !!this.userInfo.sub ? this.userInfo.sub : null;
  }

  getPermissions() {
    return !!this.userInfo && !!this.userInfo.permissions
      ? this.userInfo.permissions
      : [];
  }
}
