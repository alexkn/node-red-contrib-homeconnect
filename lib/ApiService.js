const request = require('request');

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
    
                body = JSON.parse(body);
                let token = {
                    access_token: body.access_token,
                    refresh_token: body.refresh_token,
                    expires_at: Math.floor(Date.now() / 1000) + body.expires_in
                };
    
                resolve(token);
            });
        });
    }
};
