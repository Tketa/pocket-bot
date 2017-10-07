const Pocket = require('pocket-api');
const Q = require('q');

class PocketHelper {
  constructor(consumerKey) {
    this.consumerKey = consumerKey;
    this.redirectUri = `${process.env.HOSTNAME}/callback`;
  }

  getLoginUrl(senderId) {
    const deferred = Q.defer();
    const params = {
      consumer_key: this.consumerKey,
    };
    Pocket.getRequestToken(null, params, (err, data) => {
      if (err) deferred.reject(err);
      params.request_token = data.code;
      params.redirect_uri = `${this.redirectUri}?senderId=${senderId},requestToken=${params.request_token}`;
      Pocket.generateURL(null, params, (errUrl, url) => {
        if (errUrl) deferred.reject(errUrl);
        deferred.resolve(url);
      });
    });
    return deferred.promise;
  }

  getAccessToken(senderId, requestToken) {
    const deferred = Q.defer();
    const params = {
      consumer_key: this.consumerKey,
      request_token: requestToken,
    };
    Pocket.getAccessToken(null, params, (err, data) => {
      if (err) deferred.reject(err);
      deferred.resolve(data);
    });
    return deferred.promise;
  }

  getPocketPostParams(accessToken, url) {
    return {
      consumer_key: this.consumerKey,
      access_token: accessToken,
      tags: 'pocket-bot',
      url,
    };
  }

  static getLoginMessage(loginURL) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: 'Pocket',
            subtitle: 'You need to log in to Pocket',
            image_url: 'https://aadityapurani.files.wordpress.com/2015/10/getpocket.jpg',
            buttons: [{
              type: 'web_url', url: loginURL, title: 'Log In',
            }],
          }],
        },
      },
    };
  }
}
module.exports = PocketHelper;
