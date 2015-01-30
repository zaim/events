'use strict';

import Request from './Request';


/**
 * Fetches access tokens and refreshes it on expiration.
 *
 * @class
 * @augments ValueEmitter
 */

export default class AccessToken extends Request {

  /**
   * @constructor
   * @param {object} options Request options
   * @param {string} options.url access_token endpoint URL
   * @param {string} options.type grant type
   * @param {string} options.id client id
   * @param {string} options.secret client secret
   */

  constructor (options) {
    if (!options || !options.id || !options.secret) {
      throw new Error('AccessToken requires "id" and "secret" options');
    }
    super({
      method: 'post',
      url: options.url,
      auth: {
        username: options.id,
        password: options.secret
      },
      form: {
        grant_type: options.type || 'client_credentials'
      },
      interval: options.interval || 3600000,
      stopOnFail: true
    });
  }


  /**
   * @protected
   */

  validate () {
    return (
      this.options.auth.username &&
      this.options.auth.password
    );
  }


  /**
   * @protected
   */

  parse (body) {
    body = JSON.parse(body);
    this.options.interval = (body.expires_in || 3600) * 1000;
    return body;
  }

}
