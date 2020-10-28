const apiService = require('../lib/ApiService');

module.exports = function (RED) {
    const tokenStorage = require('../lib/TokenStorage')(RED);

    function HomeConnectAuth(config) {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.simulation_mode = config.simulation_mode;
        this.callback_url = config.callback_url;
        this.scope = config.scope;
        this.client_id = this.credentials.client_id;
        this.client_secret = this.credentials.client_secret;
        this.tokens = tokenStorage.getTokens(this.id);
        this.refreshTokenTimer = null;
        this.nodes = {};

        this.getHost = () => {
            return apiService.getHost(this.simulation_mode);
        };

        this.getAccessToken = () => {
            return this.tokens.access_token;
        };

        this.refreshTokens = async () => {
            if(!this.tokens.refresh_token) return;

            this.log('refreshing token...');
            try {
                this.tokens = await apiService.refreshToken(this.simulation_mode, this.client_secret, this.tokens.refresh_token, this.client_id);
                tokenStorage.saveTokens(this.id, this.tokens);
                this.startRefreshTokenTimer();
                this.AccessTokenRefreshed();
            } catch(err) {
                this.error(err);
            }
        };

        this.startRefreshTokenTimer = () => {
            if(this.refreshTokenTimer) {
                clearTimeout(this.refreshTokenTimer);
                this.refreshTokenTimer = null;
            }
            let expires_in = this.tokens.expires_at * 1000 - Date.now();
            this.refreshTokenTimer = setTimeout(() => {
                this.refreshTokens();
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

        this.refreshTokens();

        this.on('close', () => {
            if(this.refreshTokenTimer) {
                clearTimeout(this.refreshTokenTimer);
                this.refreshTokenTimer = null;
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

    let requestToken = async (authCode) => {
        let auth = runningAuth;
        try {
            let tokens = await apiService.requestToken(auth.simulation_mode, authCode, auth.client_id, auth.client_secret, auth.callback_url);
            tokenStorage.saveTokens(auth.node_id, tokens);
            auth.tokens = tokens;
        } catch (err) {
            auth.error = err;
        }
    };

    RED.httpAdmin.get('/homeconnect/auth/start', (req, res) => {
        runningAuth = {
            node_id: req.query.node_id,
            client_id: req.query.client_id,
            client_secret: req.query.client_secret,
            scope: req.query.scope,
            callback_url: req.query.callback_url || req.protocol + '://' + req.get('host') + '/homeconnect/auth/callback',
            simulation_mode: (req.query.simulation_mode == 'true')
        };

        const url = apiService.buildAuthorizationUrl(runningAuth.simulation_mode, runningAuth.client_id, runningAuth.callback_url, runningAuth.scope);

        res.send({
            'url': url
        });
    });

    RED.httpAdmin.get('/homeconnect/auth/callback', (req, res) => {
        if (!runningAuth) {
            res.sendStatus(400);
            return;
        }

        if (req.query.code) {
            requestToken(req.query.code);
            res.sendStatus(200);
        } else {
            res.send({'error': req.query.error, 'error_description': req.query.error_description});
        }
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
