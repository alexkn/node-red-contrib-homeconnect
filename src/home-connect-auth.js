module.exports = function (RED) {
    const request = require('request');
    const fs = require('fs');

    function HomeConnectAuth(config) {
        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.simulation_mode = config.simulation_mode;
        this.client_id = this.credentials.client_id;
        this.client_secret = this.credentials.client_secret;
        this.access_token = null;
        this.refreshTokenTimer = null;

        const node = this;

        node.setMaxListeners(100);

        node.getHost = () => {
            return getHost(node.simulation_mode);
        };

        node.refreshTokens = () => {
            // The Simulator currently expects the client_id
            // TODO: remove when fixed
            let body = 'grant_type=refresh_token&client_secret=' + node.client_secret + '&refresh_token=' + node.tokens.refresh_token;
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

                node.tokens = { ...JSON.parse(body), timestamp: Date.now() };

                try {
                    writeTokenFile(node.id, node.tokens);
                } catch (err) {
                    node.error(err);
                }

                node.access_token = node.tokens.access_token;
                node.startRefreshTokenTimer();
                node.emit('home-connect-auth');
            });
        };

        node.startRefreshTokenTimer = () => {
            if(node.refreshTokenTimer) {
                clearTimeout(node.refreshTokenTimer);
                node.refreshTokenTimer = null;
            }

            if(node.tokens.expires_in) {
                node.refreshTokenTimer = setTimeout(() => {
                    node.log('refreshing token...');
                    node.refreshTokens();
                }, node.tokens.expires_in * 1000);
            }
        };

        node.loadTokenFile = () => {
            try {
                let tokens = loadTokenFile();

                if(tokens) {
                    if(tokens.refresh_token) {
                        node.tokens = tokens;
                    } else if (tokens[node.id]) {
                        node.tokens = tokens[node.id];
                    }

                    if (node.tokens != undefined) {
                        node.refreshTokens();
                    }
                }
            } catch (err) {
                node.error(err);
            }
        };

        let nodeStarted = () => {
            node.loadTokenFile();
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
            client_secret: { type: 'text' }
        }
    });

    let getHost = (simulation_mode) => {
        if(simulation_mode) {
            return 'https://simulator.home-connect.com';
        } else {
            return 'https://api.home-connect.com';
        }
    };

    let loadTokenFile = () => {
        let path = RED.settings.userDir + '/homeconnect_tokens.json';
        try {
            if (fs.existsSync(path)) {
                let content = fs.readFileSync(path, 'utf8');
                let tokens = JSON.parse(content);

                return tokens;
            }
        } catch (err) {
            console.error(err);
        }

        return {};
    };

    let writeTokenFile = (nodeId, tokens) => {
        let alltokens = loadTokenFile();
        alltokens[nodeId] = tokens;
        fs.writeFileSync(RED.settings.userDir + '/homeconnect_tokens.json', JSON.stringify(alltokens,null,1));
    };

    let runningAuth = null;

    RED.httpAdmin.get('/homeconnect/auth/start', (req, res) => {
        runningAuth = {
            node_id: req.query.node_id,
            client_id: req.query.client_id,
            client_secret: req.query.client_secret,
            callback_url: req.protocol + '://' + req.get('host') + '/homeconnect/auth/callback',
            simulation_mode: (req.query.simulation_mode == 'true')
        };

        const url = getHost(runningAuth.simulation_mode) + '/security/oauth/authorize' + '?client_id=' + runningAuth.client_id + '&response_type=code&redirect_uri=' + runningAuth.callback_url;

        res.send({
            'url': url
        });
    });

    RED.httpAdmin.get('/homeconnect/auth/callback', (req, res) => {
        if (!runningAuth) {
            res.sendStatus(400);
            return;
        }

        let nodeId = runningAuth.node_id;
        let node = RED.nodes.getNode(nodeId);

        let authCode = req.query.code;

        request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: getHost(runningAuth.simulation_mode) + '/security/oauth/token',
            body: 'client_id=' + runningAuth.client_id +
                '&client_secret=' + runningAuth.client_secret +
                '&grant_type=authorization_code&code=' + authCode +
                '&redirect_uri=' + runningAuth.callback_url
        }, (error, response, body) => {

            if (error || response.statusCode != 200) {
                node.error('getTokens failed: ' + body);
                return;
            }

            node.tokens = { ...JSON.parse(body), timestamp: Date.now() };

            try {
                writeTokenFile(nodeId, node.tokens);
            } catch (err) {
                node.error(err);
            }

            node.access_token = node.tokens.access_token;
            node.startRefreshTokenTimer();
            node.emit('home-connect-auth');
        });

        runningAuth = null;
        res.sendStatus(200);
    });
};
