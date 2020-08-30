const request = require('request');

/**
 * @param {boolean} simulation_mode 
 * @returns {string}
 */
const getHost = (simulation_mode) => {
    if(simulation_mode) {
        return 'https://simulator.home-connect.com';
    } else {
        return 'https://api.home-connect.com';
    }
};

/**
 * @typedef {Object} Token
 * @property {string} access_token
 * @property {string} refresh_token
 * @property {number} expires_at
 */

/** 
 * @param {string} body 
 * @returns {Token}
 */
const parseToken = (body) => {
    let tokens = JSON.parse(body);

    return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in
    };
};

module.exports = {
    /**
     * @param {boolean} simulation_mode
     * @return {string} URL
     */
    getHost: getHost,

    /**
     * @param {boolean} simulation_mode
     * @param {string} client_secret
     * @param {string} refresh_token
     * @param {string} client_id
     * @returns {Promise<Token>}
     */
    refreshToken: (simulation_mode, client_secret, refresh_token, client_id) => {
        let formBody = {
            'grant_type': 'refresh_token',
            'client_secret': client_secret,
            'refresh_token': refresh_token
        };

        // The Simulator currently expects the client_id
        // TODO: remove when fixed
        if(simulation_mode) {
            formBody.client_id = client_id;
        }

        return new Promise((resolve, reject) => { 
            request.post({
                url: getHost(simulation_mode) + '/security/oauth/token',
                form: formBody
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    reject('refreshTokens failed: ' + body);
                    return;
                }
 
                resolve(parseToken(body));
            });
        });
    },

    /**
     * @param {boolean} simulation_mode
     * @param {string} authCode
     * @param {string} client_id
     * @param {string} client_secret
     * @param {string} callback_url
     * @returns {Promise<Token>}
     */
    requestToken: (simulation_mode, authCode, client_id, client_secret, callback_url) => {
        let formBody = {
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'client_secret': client_secret,
            'code': authCode,
            'redirect_uri': callback_url
        };

        return new Promise((resolve, reject) => {
            request.post({
                url: getHost(simulation_mode) + '/security/oauth/token',
                form: formBody 
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    reject('requestToken failed: ' + body);
                }

                resolve(parseToken(body));
            });
        });
    },

    /**
     * @param {boolean} simulation_mode
     * @param {string} client_id
     * @param {string} callback_url
     * @param {string} scope
     */
    buildAuthorizationUrl: (simulation_mode, client_id, callback_url, scope) => {
        return getHost(simulation_mode) + '/security/oauth/authorize' +
        '?client_id=' + encodeURIComponent(client_id) +
        '&response_type=code' +
        '&redirect_uri=' + encodeURIComponent(callback_url) +
        (scope ? '&scope=' + encodeURIComponent(scope) : '');
    }
};
