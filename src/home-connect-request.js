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
        this.statuskey = config.statuskey;
        this.imagekey = config.imagekey;
        this.body = config.body;

        const urls = {
            simulation: 'https://apiclient.home-connect.com/hcsdk.yaml',
            production: 'https://apiclient.home-connect.com/hcsdk-production.yaml'
        };

        this.status({ fill: 'red', shape: 'ring', text: 'not connected' });
        this.auth.register(this);

        const node = this;

        node.AccessTokenRefreshed = () => {
            node.getSwaggerClient();
        };

        node.on('input', msg => {
            if(!node.client) {
                node.error('auth not ready');
                return;
            }

            let tag = node.tag || msg.tag;
            let operationId = node.operationId || msg.operationId;
            node.client.apis[tag][operationId]({
                haid: node.haid || msg.haid,
                body: node.body || msg.body,
                optionkey: node.optionkey || msg.optionkey,
                programkey: node.programkey || msg.programkey,
                statuskey: node.statuskey || msg.statuskey,
                imagekey: node.imagekey || msg.imagekey,
                settingkey: node.settingkey || msg.settingkey
            })
                .then(response => {
                    let res = response.data;

                    try {
                        if(res && res.length > 0) {
                            res = JSON.parse(res);
                        }
                    } catch (error) {
                        node.error(error.message);
                    }

                    msg.status = response.status;
                    msg.statusText = response.statusText;
                    msg.payload = res;

                    node.send(msg);
                })
                .catch(error => {
                    msg.error = error;
                    node.send(msg);
                });
        });

        node.on('close', () => {
            node.auth.unregister(this);
        });

        node.getSwaggerClient = () => {
            if (node.auth.access_token != undefined) {
                SwaggerClient({
                    url: node.auth.simulation_mode ? urls.simulation : urls.production,
                    requestInterceptor: req => {
                        req.headers['accept'] = 'application/vnd.bsh.sdk.v1+json, image/jpeg',
                        req.headers['authorization'] = 'Bearer ' + node.auth.access_token;
                    }
                })
                    .then(client => {
                        node.client = client;
                        node.status({ fill: 'green', shape: 'dot', text: 'ready' });
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }
        };
    }
    RED.nodes.registerType('home-connect-request', HomeConnectRequest);
};
