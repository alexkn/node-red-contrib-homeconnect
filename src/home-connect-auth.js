module.exports = function (RED) {
    const request = require('request');

    function OAuth2(config) {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.client_id = this.credentials.client_id;
        this.client_secret = this.credentials.client_secret;

        const auth = {
            tokenHost: 'https://simulator.home-connect.com',
            tokenPath: '/security/oauth/token',
            authorizePath: '/security/oauth/authorize'
        }

        const id = this.id;

        this.status({ fill: 'red', shape: 'ring', text: 'unauthorized' });

        const node = this;

        node.getAuthorizationUrl = (protocol, hostname, port, client_id) => {
            node.status({ fill: 'yellow', shape: 'ring', text: 'authorizing...' });

            let callbackUrl = protocol + '//' + hostname + (port ? ':' + port : '')
                + '/oauth2/auth/callback';

            node.context().set('callback_url', callbackUrl);

            return auth.tokenHost + auth.authorizePath + 
                '?client_id=' + client_id + 
                '&response_type=code&redirect_uri=' + callbackUrl;
        };

        node.getTokens = (authCode) => {
            let n = RED.nodes.getNode(id);
            request.post({
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                url: auth.tokenHost + auth.tokenPath,
                body: 'client_id=' + n.client_id + 
                    '&client_secret=' + n.client_secret + 
                    '&grant_type=authorization_code&code=' + authCode
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    return;
                }

                n.status({ fill: 'green', shape:'dot', text: 'authorized' });

                n.tokens = { ...JSON.parse(body), timestamp: Date.now() };
                n.send({
                    access_token: n.tokens
                });
            });
        }

        RED.httpAdmin.get('/oauth2/auth/callback', (req, res) => {
            let n = RED.nodes.getNode(id);
            n.getTokens(req.query.code);
            res.sendStatus(200);
        });
    }
    RED.nodes.registerType('OAuth2', OAuth2, {
        credentials: {
            client_id: { type: 'text' },
            client_secret: { type: 'text' }
        }
    });

    RED.httpAdmin.get('/oauth2/:id/auth/url', (req, res) => {
        if (!req.query.protocol || !req.query.hostname || !req.query.port) {
            res.sendStatus(400);
            return;
        }

        let node = RED.nodes.getNode(req.params.id);
        if (!node) {
            res.sendStatus(404);
            return;
        }

        let client_id = node.client_id;

        const url = node.getAuthorizationUrl(req.query.protocol, req.query.hostname, req.query.port, client_id);
        res.send({
            'url': url
        });
    });
}