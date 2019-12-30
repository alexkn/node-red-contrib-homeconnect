const request = require('request');
const apiService = require('../lib/ApiService');

module.exports = function (RED) {
    const tokenStorage = require('../lib/TokenStorage')(RED);

    function HomeConnectAuth(config) {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.simulation_mode = config.simulation_mode;
        this.scope = config.scope;
        this.client_id = this.credentials.client_id;
        this.client_secret = this.credentials.client_secret;
        this.tokens = tokenStorage.getTokens(this.id);
        this.refreshTokenTimer = null;
        this.nodes = {};

        const node = this;

        node.getHost = () => {
            return apiService.getHost(node.simulation_mode);
        };

        node.getAccessToken = () => {
            return node.tokens.access_token; 
        };

        node.refreshTokens = async () => {
            if(!node.tokens.refresh_token) return;

            node.log('refreshing token...');
            try {
                let tokens = await apiService.refreshToken(node.simulation_mode, node.client_secret, node.tokens.refresh_token, node.client_id);
                node.tokens = tokens;
                tokenStorage.saveTokens(node.id, node.tokens);
                node.startRefreshTokenTimer();
                node.AccessTokenRefreshed();
            } catch(err) {
                node.error(err);
            }           
        };

        node.startRefreshTokenTimer = () => {
            if(node.refreshTokenTimer) {
                clearTimeout(node.refreshTokenTimer);
                node.refreshTokenTimer = null;
            }
            let expires_in = node.tokens.expires_at * 1000 - Date.now();
            node.refreshTokenTimer = setTimeout(() => {
                node.refreshTokens();
            }, expires_in);
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
        }
    });

    let runningAuth = null;

    let pollToken = (authCode) => {
        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: apiService.getHost(runningAuth.simulation_mode) + '/security/oauth/token',
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
            tokens.expires_at = Math.floor(Date.now() / 1000) + tokens.expires_in;
            delete tokens.expires_in;
            tokenStorage.saveTokens(runningAuth.node_id, tokens);

            runningAuth.tokens = tokens;
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

        const url = apiService.getHost(runningAuth.simulation_mode) + '/security/oauth/authorize' +
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

        if(runningAuth.tokens) {
            res.send({'tokens': 'received'});
            runningAuth = null;
            return;
        }

        res.send({});
    });
};
