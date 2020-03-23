import { WebAuth } from 'auth0-js';

export default class Auth0 {
  constructor({ domain, audience, clientId, redirectUri, scope }) {
    this.webAuth = new WebAuth({
      domain,
      audience,
      clientId,
      redirectUri,
      scope,
      responseType: 'token id_token',
    });
  }

  login() {
    console.debug('[Auth0] login');
    this.webAuth.authorize();
  }
}
