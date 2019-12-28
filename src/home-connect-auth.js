module.exports = function (RED) {
    const request = require('request');

    function HomeConnectAuth(config) {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.simulation_mode = config.simulation_mode;
        this.scope = config.scope;
        this.client_id = this.credentials.client_id;
        this.client_secret = this.credentials.client_secret;
        this.access_token = null;
        this.refreshTokenTimer = null;
        this.nodes = {};

        const node = this;

        node.getHost = () => {
            return getHost(node.simulation_mode);
        };

        node.refreshTokens = () => {
            if(!node.credentials.refresh_token) return;

            node.log('refreshing token...');

            // The Simulator currently expects the client_id
            // TODO: remove when fixed
            let body = 'grant_type=refresh_token&client_secret=' + node.client_secret + '&refresh_token=' + node.credentials.refresh_token;
            if(node.simulation_mode) {
                body = body + '&client_id=' + node.client_id;
            }

            request.post({
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                url: node.getHost() + '/security/oauth/token',
                body: body
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    node.error('refreshTokens failed: ' + body);
                    return;
                }

                let tokens = { ...JSON.parse(body), timestamp: Date.now() };

                node.access_token = tokens.access_token;
                node.startRefreshTokenTimer(tokens.expires_in);
                node.AccessTokenRefreshed();
            });
        };

        node.startRefreshTokenTimer = (expires_in) => {
            if(node.refreshTokenTimer) {
                clearTimeout(node.refreshTokenTimer);
                node.refreshTokenTimer = null;
            }

            if(expires_in) {
                node.refreshTokenTimer = setTimeout(() => {
                    node.refreshTokens();
                }, expires_in * 1000);
            }
        };

        this.register = (node) => {
            this.nodes[node.id] = node;
        };

        this.unregister = (node) => {
            delete this.nodes[node.id];
        };

        this.AccessTokenRefreshed = () => {
            for(let nodeId in this.nodes) {
                this.nodes[nodeId].AccessTokenRefreshed();
            }
        };

        let nodeStarted = () => {
            node.refreshTokens();
        };

        RED.events.on('nodes-started', nodeStarted);

        node.on('close', () => {
            RED.events.off('nodes-started', nodeStarted);

            if(node.refreshTokenTimer) {
                clearTimeout(node.refreshTokenTimer);
                node.refreshTokenTimer = null;
            }
        });
    }
    RED.nodes.registerType('home-connect-auth', HomeConnectAuth, {
        credentials: {
            client_id: { type: 'text' },
            client_secret: { type: 'text' },
            refresh_token: { type: 'text' },
        }
    });

    let getHost = (simulation_mode) => {
        if(simulation_mode) {
            return 'https://simulator.home-connect.com';
        } else {
            return 'https://api.home-connect.com';
        }
    };

    let runningAuth = null;

    let pollToken = (authCode) => {
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: getHost(runningAuth.simulation_mode) + '/security/oauth/token',
            body: 'client_id=' + runningAuth.client_id +
                '&client_secret=' + runningAuth.client_secret +
                '&grant_type=authorization_code' +
                '&code=' + authCode +
                '&redirect_uri=' + runningAuth.callback_url
        }, (error, response, body) => {

            if (error || response.statusCode != 200) {
                runningAuth.error = body;
            }

            let tokens = JSON.parse(body);

            runningAuth.refresh_token = tokens.refresh_token;
        });
    };

    RED.httpAdmin.get('/homeconnect/auth/start', (req, res) => {
        runningAuth = {
            node_id: req.query.node_id,
            client_id: req.query.client_id,
            client_secret: req.query.client_secret,
            scope: req.query.scope,
            callback_url: req.protocol + '://' + req.get('host') + '/homeconnect/auth/callback',
            simulation_mode: (req.query.simulation_mode == 'true')
        };

        const url = getHost(runningAuth.simulation_mode) + '/security/oauth/authorize' +
        '?client_id=' + runningAuth.client_id +
        '&response_type=code' +
        '&redirect_uri=' + runningAuth.callback_url +
        '&scope=' + encodeURIComponent(runningAuth.scope);

        res.send({
            'url': url
        });
    });

    RED.httpAdmin.get('/homeconnect/auth/callback', (req, res) => {
        if (!runningAuth) {
            res.sendStatus(400);
            return;
        }

        pollToken(req.query.code);

        res.sendStatus(200);
    });

    RED.httpAdmin.get('/homeconnect/auth/polltoken', (req, res) => {
        if (!runningAuth) {
            res.sendStatus(400);
            return;
        }

        if(runningAuth.error) {
            res.send({'error': runningAuth.error});
            runningAuth = null;
            return;
        }

        if(runningAuth.refresh_token) {
            res.send({'refresh_token': runningAuth.refresh_token});
            runningAuth = null;
            return;
        }

        res.send({});
    });
};
