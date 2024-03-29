const HomeConnectError = require('../lib/HomeConnectError');

module.exports = function (RED) {
    const SwaggerClient = require('swagger-client');

    function HomeConnectRequest(config) {
        RED.nodes.createNode(this, config);

        this.auth = RED.nodes.getNode(config.auth);
        this.name = config.name;
        this.tag = config.tag;
        this.operationId = config.operationId;
        this.haid = config.haid;
        this.optionkey = config.optionkey;
        this.programkey = config.programkey;
        this.settingkey = config.settingkey;
        this.commandkey = config.commandkey;
        this.statuskey = config.statuskey;
        this.imagekey = config.imagekey;
        this.body = config.body;

        const urls = {
            simulation: 'https://apiclient.home-connect.com/hcsdk.yaml',
            production: 'https://apiclient.home-connect.com/hcsdk-production.yaml'
        };

        this.status({ fill: 'red', shape: 'ring', text: 'not connected' });

        if(this.auth)
            this.auth.register(this);

        const node = this;

        node.AccessTokenRefreshed = () => {
            node.getSwaggerClient();
        };

        node.on('input', async (msg, send, done) => {
            if(!node.client) {
                node.error('auth not ready');
                return;
            }
            
            try {
                let tag = node.tag || msg.tag;
                let operationId = node.operationId || msg.operationId;

                let response = await node.client.apis[tag][operationId]({
                    haId: node.haid || msg.haid,
                    body: node.body || msg.body,
                    optionkey: node.optionkey || msg.optionkey,
                    programkey: node.programkey || msg.programkey,
                    statuskey: node.statuskey || msg.statuskey,
                    imagekey: node.imagekey || msg.imagekey,
                    commandkey: node.commandkey || msg.commandkey,
                    settingkey: node.settingkey || msg.settingkey
                });

                msg.status = response.status;
                msg.statusText = response.statusText;
                msg.payload = response.body;

                send(msg);
            } catch (error) {
                if(error.response) {
                    let bodyError = error.response.body.error;
                    done(new HomeConnectError(error.status, bodyError ? bodyError.key : null, bodyError ? bodyError.description : error.message));
                } else {
                    done(error);
                }
            }
        });

        node.on('close', () => {
            node.auth.unregister(this);
        });

        node.getSwaggerClient = () => {
            if (node.auth.getAccessToken() != undefined) {
                SwaggerClient({
                    url: node.auth.simulation_mode ? urls.simulation : urls.production,
                    requestInterceptor: req => {
                        req.headers['accept'] = 'application/vnd.bsh.sdk.v1+json, image/jpeg',
                        req.headers['authorization'] = 'Bearer ' + node.auth.getAccessToken();
                        return req;
                    }
                })
                    .then(client => {
                        node.client = client;
                        node.status({ fill: 'green', shape: 'dot', text: 'ready' });
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
        };
    }
    RED.nodes.registerType('home-connect-request', HomeConnectRequest);
};
