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

        this.creds = RED.nodes.getNode(config.creds);
        this.action = config.action;
        this.haid = config.haid;

        this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });

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
        this.tokens = flowContext.get("homeconnect_creds");

        const node = this;

        node.on('input', msg => {
            if (node.action == 'subscribe') {
                // TODO: eventsource
            } else {
                node.command(node.action, node.haid, node.body)
                .then(response => {
                    msg.payload = response.body;
                    node.send(msg);
                });
            }
        });

        node.command = (operationId, haid, body) => {
            if (node.client != undefined) {
                let tag;
                switch (operationId) {
                    case 'get_home_appliances':
                    case 'get_specific_appliance':
                        tag = 'default';
                        break;
                    case 'get_active_program':
                    case 'start_program':
                    case 'stop_program':
                    case 'get_active_program_options':
                    case 'set_active_program_options':
                    case 'get_active_program_option':
                    case 'set_active_program_option':
                    case 'get_selected_program':
                    case 'set_selected_program':
                    case 'get_selected_program_options':
                    case 'set_selected_program_options':
                    case 'get_selected_program_option':
                    case 'set_selected_program_option':
                    case 'get_available_programs':
                    case 'get_available_program':
                        tag = 'programs';
                        break;
                    case 'get_images':
                    case 'get_image':
                        tag = 'images';
                        break;
                    case 'get_settings':
                    case 'get_setting':
                    case 'set_setting':
                        tag = 'settings';
                        break;
                    case 'get_status':
                    case 'get_status_value':
                        tag = 'status_events';
                        break;
                    default:
                        return null;
                }
                return node.client.apis[tag][operationId]({ haid, body });
            }
        }

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

                const json = { ...JSON.parse(body), timestamp: Date.now() };
                flowContext.set("homeconnect_creds", json);
                node.tokens = json;
                node.getSwaggerClient();
                // TODO: store tokens permanently
            });
        };

        node.getRefreshToken = function() {
            request.post({
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                url: credentials.auth.tokenHost + credentials.auth.tokenPath,
                body: 'grant_type=refresh_token&client_secret=' + credentials.client.client_secret + '&refresh_token=' + node.tokens.refresh_token
            }, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    const json = { ...JSON.parse(body), timestamp: Date.now() };
                    flowContext.set("homeconnect_creds", json);
                    node.tokens = json;
                    node.getSwaggerClient();
                }
            });
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
                    node.status({ fill: 'green', shape:'dot', text: 'connected' });
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