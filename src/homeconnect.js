module.exports = function(RED) {
    const request = require('request');
    const SwaggerClient = require('swagger-client');
    const EventSource = require('eventsource');

    function HomeConnectCredsNode(config) {
        RED.nodes.createNode(this, config);

        this.client_id = this.credentials.client_id;
        this.client_secret = this.credentials.client_secret;
    }
    RED.nodes.registerType('HomeConnectCreds', HomeConnectCredsNode, {
        credentials: {
            client_id: { type: "text" },
            client_secret: { type: "text" }
        }
    });

    function HomeConnectNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;

        this.creds = RED.nodes.getNode(config.creds);

        const credentials = {
            client: {
                id: this.creds.client_id,
                secret: this.creds.client_secret
            },
            auth: {
                tokenHost: 'https://simulator.home-connect.com',
                tokenPath: '/security/oauth/token',
                authorizePath: '/security/oauth/authorize'
            }
        };

        const flowContext = this.context().flow;
        node.tokens = flowContext.get("homeconnect_creds");

        node.on('input', msg => {
            // TODO: eventsource
            // TODO: swagger api
        });

        node.getAuthorizationUrl = (protocol, hostname, port) => {
            let callbackUrl = protocol + '//' + hostname + (port ? ':' + port : '')
                + '/oauth2/' + node.id + '/auth/callback';
            node.context().set('callback_url', callbackUrl);
            return credentials.auth.tokenHost + credentials.auth.authorizePath + '?client_id=' + credentials.client.id + '&response_type=code&redirect_uri=' + callbackUrl;
        };

        node.getAuthorizationTokens = (authCode) => {
            request.post({
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                url: credentials.auth.tokenHost + credentials.auth.tokenPath,
                body: 'client_id=' + credentials.client.id + '&client_secret=' + credentials.client.secret + '&grant_type=authorization_code&code=' + authCode
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    return;
                }

                flowContext.set("homeconnect_creds", JSON.parse(body));
                node.tokens = JSON.parse(body);
                node.getSwaggerClient();
                // TODO: store tokens permanently
            });
        };

        node.getRefreshToken = function() {
            // TODO: get referesh token
        };

        node.getSwaggerClient = () => {
            if (node.tokens != undefined && node.tokens.access_token != undefined) {
                SwaggerClient({
                    url: 'https://apiclient.home-connect.com/hcsdk.yaml',
                    requestInterceptor: req => {
                        req.headers['accept'] = 'application/vnd.bsh.sdk.v1+json',
                        req.headers['authorization'] = 'Bearer ' + node.tokens.access_token
                    }
                })
                .then(client => {
                    node.client = client;
                    // TODO: Set node status to green
                });
            }
        };

        node.getSwaggerClient();
    }
    RED.nodes.registerType('HomeConnect', HomeConnectNode);

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

        if (!node.credentials.client_id || !node.credentials.client_secret) {
            res.sendStatus(400);
            return;
        }

        res.send({
            'url': node.getAuthorizationUrl(req.query.protocol, req.query.hostname, req.query.port)
        });
    });

    RED.httpAdmin.get('/oauth2/:id/auth/callback', (req, res) => {
        let node = RED.nodes.getNode(req.params.id);
        if (!node) {
            res.sendStatus(404);
            return;
        }
        node.getAuthorizationTokens(req.query.code);
        res.sendStatus(200);
    });
}